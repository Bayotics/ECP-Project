// Uses a fresh, uniquely named database. Never sends real email and always
// drops only that test database. Opt in explicitly with RUN_VOLUNTEER_DB_TEST=1.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import ts from 'typescript';
if (process.env.RUN_VOLUNTEER_DB_TEST !== '1') throw Error('Set RUN_VOLUNTEER_DB_TEST=1 to run the isolated database test.');
process.loadEnvFile('.env.local');
const databaseName = `ecp_volunteer_test_${Date.now().toString(36)}_${randomUUID().replaceAll('-', '').slice(0, 8)}`;
process.env.MONGODB_DB = databaseName;
const nativeRequire = createRequire(import.meta.url), cache = new Map();
const delivered = [];
let failOnce = true, rejectQueue = false, failCancellationFor = "";
const mocks = {
  '@/lib/server/email': { siteUrl: () => 'https://example.test', sendEmail: async message => {
    delivered.push(message);
    if (message.to === failCancellationFor && /cancelled/.test(message.subject)) return { ok: false, error: "Mock cancellation delivery failure", retryable: true };
    if (message.to === 'lead-b@example.test' && failOnce) { failOnce = false; return { ok: false, error: 'Mock provider unavailable', retryable: true }; }
    return { ok: true, id: randomUUID() };
  } },
};
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('exports', 'require', output)(exports, name => Object.hasOwn(mocks, name) ? mocks[name] : name.startsWith('@/') ? load(name.slice(2) + '.ts') : nativeRequire(name));
  return exports;
}
const { getMongoClient } = load('lib/server/mongodb.ts');
const client = await getMongoClient();
const db = client.db(databaseName);
assert.match(databaseName, /^ecp_volunteer_test_[a-z0-9]+_[a-f0-9]{8}$/);
try {
  await Promise.all([
    db.collection('volunteers').createIndex({ email: 1 }, { unique: true }),
    db.collection('volunteers').createIndex({ id: 1 }, { unique: true }),
    db.collection('volunteers').createIndex({userId:1},{unique:true,partialFilterExpression:{userId:{$type:'string'}}}),
    db.collection('volunteerChanges').createIndex({id:1},{unique:true}),
    db.collection('volunteerSignups').createIndex({ eventId: 1, volunteerId: 1 }, { unique: true }),
    db.collection('volunteerAccessTokens').createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection('volunteerExternalRegistrations').createIndex({ id: 1 }, { unique: true }),
    db.collection('proposals').createIndex({ submissionId: 1 }, { unique: true }),
    db.collection('proposalMessages').createIndex({ id: 1 }, { unique: true }),
    db.collection('clubSettings').createIndex({ id: 1 }, { unique: true }),
    db.collection('volunteerMessages').createIndex({ id: 1 }, { unique: true }),
  ]);
  await db.collection('committees').insertMany([{id:'committee-a',name:'Community Service',status:'active'},{id:'committee-old',name:'Old committee',status:'inactive'}]);
  const notifications = load('lib/server/volunteer-notifications.ts');
  mocks['@/lib/server/volunteer-notifications'] = { ...notifications, queueVolunteerMessages: async (...args) => { if (rejectQueue) throw Error('Mock transaction failure'); return notifications.queueVolunteerMessages(...args); } };
  const { registerVolunteer, cancelVolunteerSignup, reconcileVolunteerEvent } = load('lib/server/volunteers.ts');
  const people = db.collection('volunteers'), signups = db.collection('volunteerSignups'), messages = db.collection('volunteerMessages'), events = db.collection('events');
  await db.collection('users').insertMany([
    { id: 'admin', displayName: 'Admin', role: 'admin', status: 'active', email: 'admin@example.test' },
    { id: 'lead-a', displayName: 'Lead A', role: 'member', status: 'active', email: 'lead-a@example.test' },
    { id: 'lead-b', displayName: 'Lead B', role: 'member', status: 'active', email: 'lead-b@example.test' },
    { id: 'inactive', displayName: 'Inactive', role: 'member', status: 'suspended', email: 'inactive@example.test' },
  ]);
  const event = id => ({ id, slug: id, title: `Test ${id}`, date: '2099-11-21', time: '09:00', location: 'Philadelphia', status: 'published', type: 'meetup', isPublic: true, membersOnly: false, volunteerCap: 1, volunteerLeadIds: ['admin', 'lead-a', 'lead-b', 'inactive'], registrationRequired: false, tags: [] });
  await events.insertMany([event('one'), { ...event('race'), volunteerCap: 3 }, event('other'), { ...event('private'), membersOnly: true, isPublic: false }, { ...event('past'), date: '2000-01-01' }]);
  const input = (email, eventId = 'one') => ({ name: 'Test Volunteer', email, phone: '', interests: 'Community service', notes: '', ...(eventId ? { eventId } : {}) });
  const alice = await registerVolunteer(input('alice@example.test'), false);
  assert.equal(alice.status, 'confirmed');
  const initialMessages = await messages.find({ signupId: alice.reference }).toArray();
  assert.deepEqual(initialMessages.map(message => message.to).sort(), ['admin@example.test', 'alice@example.test', 'lead-a@example.test', 'lead-b@example.test']);
  const bob = await registerVolunteer(input('bob@example.test'), false);
  const charlie = await registerVolunteer(input('charlie@example.test'), false);
  assert.equal(bob.status, 'waitlisted'); assert.equal(charlie.status, 'waitlisted');
  const repeat = await registerVolunteer({ ...input('alice@example.test'), name: 'Updated Alice' }, false);
  assert.equal(repeat.alreadyRegistered, true); assert.equal(await signups.countDocuments({ volunteerId: alice.volunteerId, eventId: 'one' }), 1);
  assert.equal((await people.findOne({ id: alice.volunteerId })).name, 'Test Volunteer');
  const general = await registerVolunteer(input('alice@example.test', ''), false);
  assert.equal(general.volunteerId, alice.volunteerId); assert.equal(general.status, 'general');
  assert.ok((await people.findOne({ id: alice.volunteerId })).generalRegisteredAt);
  const generalRepeat = await registerVolunteer(input('alice@example.test', ''), false);
  assert.equal(generalRepeat.alreadyRegistered, true); assert.equal(generalRepeat.messageIds.length, 0);
  assert.equal(await signups.countDocuments({ eventId: 'one' }), 3);
  await cancelVolunteerSignup(alice.reference);
  assert.equal((await signups.findOne({ id: bob.reference })).status, 'confirmed');
  assert.equal((await signups.findOne({ id: charlie.reference })).status, 'waitlisted');
  assert.equal(await messages.countDocuments({ signupId: bob.reference, signupStatus: 'waitlisted', status: 'superseded' }), 4);
  await events.updateOne({ id: 'one' }, { $set: { volunteerCap: 2 } });
  await reconcileVolunteerEvent('one'); assert.equal((await signups.findOne({ id: charlie.reference })).status, 'confirmed');
  console.log('PASS: general list, upserts, duplicate prevention, recipient deduplication, cancellation and FIFO promotion after cap increase.');
  await Promise.all(Array.from({ length: 12 }, (_, index) => registerVolunteer(input(`race-${index}@example.test`, 'race'), false)));
  assert.equal(await signups.countDocuments({ eventId: 'race', status: 'confirmed' }), 3);
  assert.equal(await signups.countDocuments({ eventId: 'race', status: 'waitlisted' }), 9);
  const earliest = await signups.find({ eventId: 'race', status: 'waitlisted' }).sort({ registeredAt: 1, queueOrder: 1, id: 1 }).limit(2).toArray();
  const confirmed = await signups.find({ eventId: 'race', status: 'confirmed' }).limit(2).toArray();
  await Promise.all(confirmed.map(record => cancelVolunteerSignup(record.id)));
  for (const record of earliest) assert.equal((await signups.findOne({ id: record.id })).status, 'confirmed');
  assert.equal(await signups.countDocuments({ eventId: 'race', status: 'confirmed' }), 3);
  await Promise.all([registerVolunteer(input('same@example.test', 'one'), false), registerVolunteer(input('same@example.test', 'other'), false)]);
  assert.equal(await people.countDocuments({ email: 'same@example.test' }), 1);
  console.log('PASS: twelve simultaneous requests cannot exceed cap; concurrent cancellations preserve queue order; concurrent events share one person.');
  rejectQueue = true;
  await assert.rejects(registerVolunteer(input('rollback@example.test', 'other'), false), /Mock transaction failure/);
  rejectQueue = false;
  assert.equal(await people.countDocuments({ email: 'rollback@example.test' }), 0);
  for (const id of ['private', 'past']) await assert.rejects(registerVolunteer(input(`blocked-${id}@example.test`, id), false));
  assert.equal(await people.countDocuments({ email: /^blocked-/ }), 0);
  const firstDelivery = await notifications.deliverVolunteerMessages(); assert.equal(firstDelivery.failed, 1);
  const previouslySent = await messages.countDocuments({ status: 'sent' });
  const deliveredBeforeRetry = delivered.length;
  const secondDelivery = await notifications.deliverVolunteerMessages(); assert.equal(secondDelivery.failed, 0);
  // Only failed or not-yet-attempted messages are sent; successful messages stay sent.
  assert.equal(delivered.length - deliveredBeforeRetry, secondDelivery.sent);
  assert.equal(await messages.countDocuments({ status: 'sent' }), previouslySent + secondDelivery.sent);
  const beforeNoop = delivered.length; await notifications.deliverVolunteerMessages(); assert.equal(delivered.length, beforeNoop);
  assert.ok(delivered.some(message => message.to === 'bob@example.test' && /place confirmed/.test(message.subject)));
  assert.ok(!delivered.some(message => message.to === 'inactive@example.test'));
  console.log('PASS: transaction rollback, restricted/closed events, durable email retries, no resending delivered jobs. Real MongoDB; email provider mocked.');
  // Cancellation confirmations are transactional, including for people who
  // stopped opportunity emails or made their volunteer profile inactive.
  for (const state of ['active', 'paused', 'inactive']) {
    const eventId = `cancel-${state}`, email = `cancel-${state}@example.test`;
    await events.insertOne(event(eventId));
    const registration = await registerVolunteer(input(email,eventId), false);
    await people.updateOne({id:registration.volunteerId}, {$set:{status:state,opportunityEmails:false}});
    const ids = await cancelVolunteerSignup(registration.reference);
    const queued = await messages.find({id:{$in:ids},signupStatus:'cancelled'}).toArray();
    assert.equal(queued.filter(row=>row.audience==='volunteer').length,1);
    assert.deepEqual(queued.map(row=>row.to).sort(),['admin@example.test',email,'lead-a@example.test','lead-b@example.test'].sort());
    assert.ok(queued.every(row=>row.kind==='cancellation'));
    const confirmation = queued.find(row=>row.audience==='volunteer');
    assert.match(confirmation.subject,/cancelled/);assert.ok(confirmation.html.includes(`Test ${eventId}`));assert.match(confirmation.html,/Philadelphia/);assert.match(confirmation.html,/Manage my volunteering/);
    if (state==='inactive') failCancellationFor=email;
    const result = await notifications.deliverVolunteerMessages(ids);
    assert.equal(result.failed,state==='inactive'?1:0);
    assert.equal((await messages.findOne({id:confirmation.id})).status,state==='inactive'?'failed':'sent');
    if (state==='inactive') {
      // Compatibility: old cancellation jobs were tagged as signup emails.
      await messages.updateOne({id:confirmation.id},{$set:{kind:'signup'}});
      failCancellationFor='';await notifications.deliverVolunteerMessages(ids);
      assert.equal((await messages.findOne({id:confirmation.id})).status,'sent');
    }
    assert.equal((await people.findOne({id:registration.volunteerId})).status,state);
    assert.equal((await people.findOne({id:registration.volunteerId})).opportunityEmails,false);
    const beforeRepeat=delivered.length,mailCount=await messages.countDocuments({signupId:registration.reference,signupStatus:'cancelled'});
    assert.deepEqual(await cancelVolunteerSignup(registration.reference),[]);await notifications.deliverVolunteerMessages(ids);
    assert.equal(delivered.length,beforeRepeat);assert.equal(await messages.countDocuments({signupId:registration.reference,signupStatus:'cancelled'}),mailCount);
  }
  // A later opt-out must preserve an already queued cancellation confirmation.
  await events.insertOne(event('cancel-optout'));
  const optingOut=await registerVolunteer(input('cancel-optout@example.test','cancel-optout'),false);
  const cancellationIds=await cancelVolunteerSignup(optingOut.reference);
  const manageToken=(await messages.findOne({id:{$in:cancellationIds},audience:'volunteer'})).html.match(/#token=([a-f0-9]{64})/)[1];
  await load('lib/server/volunteer-management.ts').manageVolunteering(`Bearer ${manageToken}`,{action:'unsubscribe'});
  await notifications.deliverVolunteerMessages(cancellationIds);
  assert.equal(await messages.countDocuments({id:{$in:cancellationIds},audience:'volunteer',signupStatus:'cancelled',status:'sent'}),1);
  console.log('PASS: active/paused/inactive volunteers receive cancellation confirmations alongside admins and leads; opportunity opt-outs remain unchanged; failures retry including legacy jobs; repeated cancellations never resend; later opt-outs preserve confirmations.');

  // Imports reuse the same allocator, preserve preferences and deduplicate both
  // email identities and external delivery retries.
  await people.updateOne({ id: bob.volunteerId }, { $set: { phone: '215-555-0199', opportunityEmails: false } });
  const importedBob = await registerVolunteer({...input('bob@example.test'), name: 'Do not overwrite', interests: ''}, true, {source: 'eventbrite', imported: true, externalId: 'attendee-bob'});
  assert.equal(importedBob.alreadyRegistered, true);
  const preservedBob = await people.findOne({id: bob.volunteerId});
  assert.equal(preservedBob.phone, '215-555-0199'); assert.equal(preservedBob.opportunityEmails, false);
  assert.equal(preservedBob.name, 'Test Volunteer'); assert.equal(preservedBob.source, 'website');
  assert.deepEqual(preservedBob.sources.sort(), ['eventbrite', 'website']);
  const welcomeCount = await messages.countDocuments({volunteerId: bob.volunteerId, subject: 'Welcome to Eko Club Philadelphia volunteers'});
  await registerVolunteer(input('bob@example.test'), true, {source: 'eventbrite', imported: true, externalId: 'attendee-bob'});
  assert.equal(await messages.countDocuments({volunteerId: bob.volunteerId, subject: 'Welcome to Eko Club Philadelphia volunteers'}), welcomeCount);
  await assert.rejects(registerVolunteer(input('wrong@example.test'), true, {source: 'eventbrite', imported: true, externalId: 'attendee-bob'}), /different email/);
  assert.equal(await people.countDocuments({email: 'wrong@example.test'}), 0);
  const ext = await registerVolunteer(input('external@example.test', 'one'), true, {source: 'partiful', imported: true});
  assert.equal(ext.status, 'waitlisted');
  await cancelVolunteerSignup(ext.reference);
  const replay = await registerVolunteer(input('external@example.test', 'one'), true, {source: 'partiful', imported: true});
  assert.equal(replay.status, 'cancelled');
  await registerVolunteer(input('external@example.test', 'one'), false);
  const rejoined = await signups.findOne({id: ext.reference});
  assert.equal(rejoined.source, 'partiful'); assert.deepEqual(rejoined.sources.sort(), ['partiful', 'website']);
  const rawWelcome = await messages.findOne({volunteerId: bob.volunteerId, subject: 'Welcome to Eko Club Philadelphia volunteers'});
  const token = rawWelcome.html.match(/#token=([a-f0-9]{64})/)[1];
  const {findVolunteerAccess} = load('lib/server/volunteer-access.ts');
  assert.equal((await findVolunteerAccess(`Bearer ${token}`)).id, bob.volunteerId);
  assert.equal(await findVolunteerAccess('Bearer ' + 'a'.repeat(64)), null);
  const access = await db.collection('volunteerAccessTokens').findOne({volunteerId: bob.volunteerId});
  assert.ok(access.tokenHash); assert.equal(access.token, undefined);
  await db.collection('volunteerAccessTokens').updateMany({volunteerId: bob.volunteerId}, {$set: {expiresAt: new Date(0)}});
  assert.equal(await findVolunteerAccess(`Bearer ${token}`), null);
  console.log('PASS: external import deduplication, provenance, consent/contact preservation, cancelled replay, capacity and hashed expiring links.');

  await db.collection('users').insertMany([
    {id: 'president', displayName: 'President', role: 'member', status: 'active', title: 'President', email: 'president@example.test'},
    {id: 'vp', displayName: 'VP', role: 'member', status: 'active', title: 'Vice President', email: 'vp@example.test'},
    {id: 'former', displayName: 'Former President', role: 'member', status: 'active', title: 'Former President', email: 'former@example.test'}
  ]);
  const proposals = load('lib/server/proposals.ts');
  assert.deepEqual((await proposals.proposalRecipients()).map(person => person.email).sort(), ['admin@example.test', 'president@example.test', 'vp@example.test']);
  const proposalInput = {submissionId: randomUUID(), name: 'Proposer', email: 'proposer@example.test', title: 'Community day', description: 'An event to bring everyone together.', proposedDate: '2099-12-10', location: 'Club Hall', estimatedBudgetCents: 12500, notes: ''};
  const [p1, p2] = await Promise.all([proposals.submitProposal(proposalInput), proposals.submitProposal(proposalInput)]);
  assert.equal(p1.proposal.id, p2.proposal.id);
  assert.equal(await db.collection('proposals').countDocuments({submissionId: proposalInput.submissionId}), 1);
  assert.equal(await db.collection('proposalMessages').countDocuments({proposalId: p1.proposal.id}), 4);
  await assert.rejects(proposals.submitProposal({...proposalInput, title: 'Changed payload'}), /already used/);
  const admin = {sub: 'admin', email: 'admin@example.test'};
  await assert.rejects(proposals.convertProposal(p1.proposal.id, admin), /Approve the proposal/);
  await db.collection('proposals').updateOne({id: p1.proposal.id}, {$set: {status: 'approved'}});
  const [draftA, draftB] = await Promise.all([proposals.convertProposal(p1.proposal.id, admin), proposals.convertProposal(p1.proposal.id, admin)]);
  assert.equal(draftA.id, draftB.id);
  assert.equal(await events.countDocuments({proposalId: p1.proposal.id}), 1);
  const draft = await events.findOne({id: draftA.id});
  assert.equal(draft.status, 'draft'); assert.equal(draft.registrationRequired, false); assert.equal(draft.location, 'Club Hall');
  await proposals.deliverProposalMessages(p1.proposal.id);
  const sentBefore = delivered.length; await proposals.deliverProposalMessages(p1.proposal.id); assert.equal(delivered.length, sentBefore);
  await db.collection('clubSettings').insertOne({id: 'proposal-recipients', recipients: [{name: 'Reviewer', email: 'reviewer@example.test'}]});
  assert.deepEqual((await proposals.proposalRecipients()).map(person => person.email), ['reviewer@example.test']);
  const noBudget = {...proposalInput, submissionId: randomUUID()}; delete noBudget.estimatedBudgetCents;
  const optional = await proposals.submitProposal(noBudget);
  assert.equal(Object.hasOwn(await db.collection('proposals').findOne({id: optional.proposal.id}), 'estimatedBudgetCents'), false);
  console.log('PASS: default/editable recipients, idempotent proposals and acknowledgements, optional budget storage, approval guard and concurrent single draft conversion.');

  await db.collection('users').insertOne({id:'linked-member',displayName:'Member Volunteer',firstName:'Member',lastName:'Volunteer',role:'member',status:'active',email:'MEMBER-VOL@Example.test'});
  const structured={...input('member-vol@example.test',''),name:'Member Volunteer',firstName:'Member',lastName:'Volunteer',city:'Philadelphia',zip:'19104',committeeIds:['committee-a'],interestAreas:['Mentoring','Food drives'],availability:'Sunday afternoons',heardAbout:'A friend',opportunityEmails:true};
  const linked=await registerVolunteer(structured,false);
  let linkedPerson=await people.findOne({id:linked.volunteerId});
  assert.equal(linkedPerson.userId,'linked-member'); assert.equal(linkedPerson.firstName,'Member'); assert.equal(linkedPerson.city,'Philadelphia');assert.equal(linkedPerson.opportunityEmails,true);
  assert.deepEqual(linkedPerson.committeeIds,['committee-a']);
  await assert.rejects(registerVolunteer({...structured,email:'bad-committee@example.test',committeeIds:['committee-old']},false),/no longer open/);
  assert.equal(await people.countDocuments({email:'bad-committee@example.test'}),0);
  await db.collection('users').updateOne({id:'linked-member'},{$set:{email:'changed-member@example.test'}});
  const linkedAgain=await registerVolunteer({...structured,email:'changed-member@example.test'},false);
  assert.equal(linkedAgain.volunteerId,linked.volunteerId);assert.equal(await people.countDocuments({userId:'linked-member'}),1);
  await people.updateOne({id:alice.volunteerId},{$set:{generalRegisteredAt:'2025-01-01T12:00:00Z'}});
  const moreInterest=await registerVolunteer({...input('alice@example.test',''),committeeIds:['committee-a']},false);
  assert.equal(moreInterest.alreadyRegistered,true);assert.equal((await people.findOne({id:alice.volunteerId})).generalRegisteredAt,'2025-01-01T12:00:00Z');assert.deepEqual((await people.findOne({id:alice.volunteerId})).committeeIds,['committee-a']);
  console.log('PASS: structured fields, consent, committee validation and member linking survive email changes; new committee interest preserves original signup dates.');

  const management=load('lib/server/volunteer-management.ts');
  const tx=load('lib/server/volunteer-transaction.ts').volunteerTransaction;
  const url=await tx(session=>load('lib/server/volunteer-access.ts').volunteerPreferencesUrl(linked.volunteerId,session));
  let authorization='Bearer '+url.match(/#token=([a-f0-9]{64})/)[1];
  const change=await management.manageVolunteering(authorization,{...structured,city:'New city',action:'profile'});
  assert.equal(change.person.city,'New city');assert.ok(change.messageIds.length);
  const unsubscribeResults=await Promise.all([management.manageVolunteering(authorization,{action:'unsubscribe'}),management.manageVolunteering(authorization,{action:'unsubscribe'})]);
  assert.equal(await db.collection('volunteerChanges').countDocuments({volunteerId:linked.volunteerId,action:'unsubscribed'}),1);
  assert.equal((await people.findOne({id:linked.volunteerId})).status,'inactive');
  const unsubscribed=unsubscribeResults.find(result=>!result.unchanged);
  const unsubMail=await messages.findOne({id:unsubscribed.messageIds[0]});assert.match(unsubMail.html,/Manage my volunteering/);assert.match(unsubMail.html,/Philadelphia time/);
  await messages.insertOne({id:'blocked-opportunity',volunteerId:linked.volunteerId,audience:'volunteer',kind:'opportunity',to:structured.email,subject:'Must not send',html:'Test only',status:'pending',createdAt:new Date().toISOString(),attempts:0});
  const beforeSuppression=delivered.length;await notifications.deliverVolunteerMessages(['blocked-opportunity']);assert.equal(delivered.length,beforeSuppression);assert.equal((await messages.findOne({id:'blocked-opportunity'})).status,'superseded');
  await notifications.deliverVolunteerMessages(unsubscribed.messageIds);assert.ok(delivered.some(message=>/unsubscribed/.test(message.subject)));
  await management.manageVolunteering(authorization,{action:'resubscribe'});
  assert.equal((await people.findOne({id:linked.volunteerId})).opportunityEmails,true);
  await management.manageVolunteering(authorization,{action:'pause',resumeDate:'2099-12-31'});
  assert.equal((await people.findOne({id:linked.volunteerId})).status,'paused');assert.deepEqual(await management.resumeVolunteerIfDue(linked.volunteerId),[]);
  const today=load('lib/dues.ts').clubDate();await people.updateOne({id:linked.volunteerId},{$set:{resumeDate:today}});
  await Promise.all([management.resumeVolunteerIfDue(linked.volunteerId),management.resumeVolunteerIfDue(linked.volunteerId)]);
  assert.equal((await people.findOne({id:linked.volunteerId})).status,'active');assert.equal(await db.collection('volunteerChanges').countDocuments({volunteerId:linked.volunteerId,action:'resumed'}),1);
  await management.manageVolunteering(authorization,{action:'request-deletion'});
  linkedPerson=await people.findOne({id:linked.volunteerId});assert.equal(linkedPerson.status,'inactive');assert.ok(linkedPerson.deletionRequestedAt);
  assert.ok(await db.collection('users').findOne({id:'linked-member'}));assert.ok(await people.findOne({id:linked.volunteerId}));
  assert.equal(await db.collection('volunteerChanges').countDocuments({volunteerId:linked.volunteerId,action:'deletion-requested'}),1);
  assert.ok(await messages.countDocuments({volunteerId:linked.volunteerId,audience:'staff',subject:/deletion request/}));
  const beforeRepeat=await messages.countDocuments({volunteerId:linked.volunteerId});await management.manageVolunteering(authorization,{action:'request-deletion'});assert.equal(await messages.countDocuments({volunteerId:linked.volunteerId}),beforeRepeat);
  console.log('PASS: dated profile changes, concurrent unsubscribe idempotency, send-time suppression, management confirmations, resubscription, scheduled resume, and deletion review preserve the linked membership.');

  mocks['@/lib/server/guards']={getRequestSession:async()=>({sub:'admin',role:'admin'})};
  const exportRoute=load('app/api/admin/volunteers/export/route.ts');
  const exported=await exportRoute.GET({method:'GET',headers:new Headers(),nextUrl:new URL('https://example.test/api/admin/volunteers/export?committeeId=committee-a&state=inactive')});
  assert.equal(exported.status,200);assert.match(exported.headers.get('content-type'),/text\/csv/);
  const csv=await exported.text();assert.match(csv,/Member ID/);assert.match(csv,/linked-member/);assert.match(csv,/Community Service/);assert.match(csv,/19104/);assert.match(csv,/New city/);assert.doesNotMatch(csv,/alice@example.test/);
  console.log('PASS: real MongoDB CSV lookup and streaming export includes linked member, committee and profile fields and respects filters.');

} finally {
  assert.equal(db.databaseName, databaseName);
  assert.ok(databaseName.startsWith('ecp_volunteer_test_'));
  try { await db.dropDatabase(); } finally { await client.close(); }
  console.log('Isolated volunteer test database removed.');
}
