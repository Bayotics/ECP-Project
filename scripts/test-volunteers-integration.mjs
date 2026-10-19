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
let failOnce = true, rejectQueue = false;
const mocks = {
  '@/lib/server/email': { siteUrl: () => 'https://example.test', sendEmail: async message => {
    delivered.push(message);
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
    db.collection('volunteerSignups').createIndex({ eventId: 1, volunteerId: 1 }, { unique: true }),
    db.collection('volunteerMessages').createIndex({ id: 1 }, { unique: true }),
  ]);
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
  assert.equal((await people.findOne({ id: alice.volunteerId })).name, 'Updated Alice');
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
} finally {
  assert.equal(db.databaseName, databaseName);
  assert.ok(databaseName.startsWith('ecp_volunteer_test_'));
  try { await db.dropDatabase(); } finally { await client.close(); }
  console.log('Isolated volunteer test database removed.');
}
