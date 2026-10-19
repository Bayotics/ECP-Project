import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const nativeRequire = createRequire(import.meta.url);
function load(file, mocks = {}) {
  const exports = {};
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('exports', 'require', output)(exports, name => Object.hasOwn(mocks, name) ? mocks[name] : name.startsWith('@/') ? load(name.slice(2) + '.ts', mocks) : nativeRequire(name));
  return exports;
}
const next = { NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200 }) } };
const event = { id: 'event', slug: 'test-event', title: 'Club gathering', location: 'Philadelphia', date: '2099-11-20', status: 'published', registrationRequired: true, registrationMode: 'form' };
const payload = { eventId: 'event', name: 'Test Guest', email: ' GUEST@Example.test ', guestCount: 0, recaptchaToken: 'solved' };
const request = body => ({ json: async () => body });
const context = { params: Promise.resolve({ id: 'event' }) };

test('on-site forms require explicit selection; existing external links remain links', () => {
  const { registrationMode, validateRegistration } = load('lib/event-registration.ts');
  assert.equal(registrationMode(event), 'form');
  assert.equal(registrationMode({ ...event, registrationMode: undefined }), null);
  assert.equal(registrationMode({ ...event, registrationMode: undefined, registrationUrl: 'https://example.test' }), 'link');
  assert.equal(registrationMode({ ...event, registrationRequired: false }), null);
  assert.match(validateRegistration({ ...event, registrationMode: undefined }), /Select/);
  assert.match(validateRegistration({ ...event, registrationMode: 'link' }), /link is required/);
  assert.equal(validateRegistration(event), null);
});

function rsvpRoute(options = {}) {
  const state = { inserted: [], emailed: [], filters: [] };
  const collection = {
    findOne: async filter => { state.filters.push(filter); return options.duplicate ?? null; },
    insertOne: async row => { if (options.race) throw { code: 11000 }; state.inserted.push(row); },
    find: filter => { state.filters.push(filter); return { sort: () => ({ toArray: async () => [] }), project: () => ({ toArray: async () => options.attending ?? [] }) }; },
  };
  state.route = load('app/api/rsvps/route.ts', {
    'next/server': next, nanoid: { nanoid: () => 'registration-id' },
    '@/lib/server/collections': { ensureCoreIndexes: async () => {}, getCollection: async name => name === 'events' ? { findOne: async () => ({ ...event, ...options.event }) } : collection, serializeDocument: row => row, serializeDocuments: rows => rows },
    '@/lib/server/recaptcha': { verifyRecaptcha: async token => options.captcha ?? (token === 'solved' ? { ok: true } : { ok: false, status: 400, error: 'Please complete reCAPTCHA.' }) },
    '@/lib/server/session': { getSessionUser: async () => options.user ?? null },
    '@/lib/server/guards': { requireSession: async () => ({ session: options.session, deny: null }) },
    '@/lib/server/notifications': { sendRSVPConfirmation: async row => { state.emailed.push(row); return { confirmationEmailSent: options.emailSent ?? true, adminEmailsFailed: 0 }; } },
  });
  return state;
}
test('CAPTCHA is required server-side before registration is recorded or emailed', async () => {
  for (const captcha of [{ ok: false, status: 400, error: 'CAPTCHA failed' }, { ok: false, status: 503, error: 'Verification unavailable' }]) {
    const state = rsvpRoute({ captcha });
    const response = await state.route.POST(request(payload));
    assert.equal(response.status, captcha.status); assert.equal(response.body.error, captcha.error);
    assert.equal(state.inserted.length, 0); assert.equal(state.emailed.length, 0);
  }
});
test('registration rejects absent form choice, external link, closed and past events', async () => {
  for (const change of [{ registrationMode: undefined }, { registrationMode: 'link', registrationUrl: 'https://example.test' }, { registrationRequired: false }, { status: 'draft' }, { status: 'cancelled' }, { date: '2000-01-01' }, { registrationDeadline: '2000-01-01' }]) {
    const state = rsvpRoute({ event: change });
    assert.equal((await state.route.POST(request(payload))).status, 400);
    assert.equal(state.inserted.length, 0);
  }
});
test('members-only registration cannot be bypassed by providing a userId', async () => {
  const state = rsvpRoute({ event: { membersOnly: true } });
  assert.equal((await state.route.POST(request({ ...payload, userId: 'forged' }))).status, 403);
});
test('duplicate and concurrent registrations report the same specific conflict without email', async () => {
  for (const options of [{ duplicate: { id: 'existing' } }, { race: true }]) {
    const state = rsvpRoute(options);
    const response = await state.route.POST(request(payload));
    assert.equal(response.status, 409); assert.match(response.body.error, /email address is already registered for this event/);
    assert.equal(state.emailed.length, 0);
    assert.equal(state.filters[0].email.$options, 'i');
    assert.equal(state.filters[0].email.$regex, '^guest@example\\.test$');
  }
});
test('successful RSVP normalizes email, uses live identity and awaits email result', async () => {
  const state = rsvpRoute({ user: { id: 'real-member', role: 'member' } });
  const response = await state.route.POST(request({ ...payload, userId: 'forged' }));
  assert.equal(response.status, 201); assert.equal(state.emailed.length, 1);
  assert.equal(response.body.data.email, 'guest@example.test');
  assert.equal(response.body.data.userId, 'real-member');
  assert.equal(response.body.data.confirmationEmailSent, true);
  assert.equal(state.inserted[0].registrationKey, 'event:guest@example.test');
});
test('full events and guest parties that exceed remaining capacity return a clear reason', async () => {
  for (const [attending, guests, message] of [[[{ guestCount: 1 }], 0, /fully booked/], [[{ guestCount: 0 }], 1, /not enough spaces/]]) {
    const state = rsvpRoute({ event: { maxAttendees: 2 }, attending });
    const response = await state.route.POST(request({ ...payload, guestCount: guests }));
    assert.equal(response.status, 400); assert.match(response.body.error, message); assert.equal(state.inserted.length, 0);
  }
});
test('email failure preserves the saved RSVP and returns honest delivery status', async () => {
  const state = rsvpRoute({ emailSent: false });
  const response = await state.route.POST(request(payload));
  assert.equal(response.status, 201); assert.equal(state.inserted.length, 1);
  assert.equal(response.body.data.confirmationEmailSent, false);
});
test('member list requests are scoped to their own identity; admin requests retain full access', async () => {
  for (const role of ['member', 'admin']) {
    const state = rsvpRoute({ session: { sub: 'member', email: 'member@example.test', role } });
    await state.route.GET({ nextUrl: new URL('https://example.test/api/rsvps') });
    assert.equal(Boolean(state.filters[0].$or), role === 'member');
  }
});
test('confirmation emails reach the attendee and every active administrator through the central provider', async () => {
  const messages = [];
  const functions = load('lib/server/event-notifications.ts', {
    '@/lib/server/email': { siteUrl: () => 'https://example.test', sendEmail: async message => { messages.push(message); return { ok: true }; } },
    '@/lib/server/admin-notifications': { adminRecipients: async () => [{ email: 'admin1@example.test' }, { email: 'admin2@example.test' }] },
  });
  const result = await functions.sendRSVPConfirmation({ ...payload, id: 'confirmation' }, event);
  assert.equal(result.confirmationEmailSent, true); assert.equal(result.adminEmailsSent, 2);
  assert.deepEqual(messages.map(message => message.to), [payload.email, 'admin1@example.test', 'admin2@example.test']);
  assert.match(messages[0].html, /confirmation/); assert.match(messages[1].html, /admin\/events/);
});
test('event email escapes user content and preserves a date-only event in Philadelphia', () => {
  const { eventEmail } = load('lib/server/email-templates.ts');
  const message = eventEmail({ ...event, title: '<script>bad</script>', date: '2027-06-01' }, 'admin', 'https://example.test', { ...payload, name: '<b>Name</b>', id: 'abc', notes: '<img onerror=bad>' });
  assert.match(message.html, /June 1, 2027/); assert.match(message.html, /&lt;b&gt;Name/);
  assert.doesNotMatch(message.html, /<script>|<img onerror/);
});
test('event reminder sending counts actual provider successes and failures', async () => {
  const sent = [];
  const { sendEventNotifications } = load('lib/server/event-notifications.ts', {
    '@/lib/server/email': { siteUrl: () => 'https://example.test', sendEmail: async message => { sent.push(message); return { ok: message.to !== 'fail@example.test' }; } },
    '@/lib/server/admin-notifications': {},
  });
  const result = await sendEventNotifications(event, [{ email: 'yes@example.test' }, { email: 'fail@example.test' }], 'reminder', 'email');
  assert.equal(result.emailSent, 1); assert.equal(result.emailFailed, 1);
  assert.match(sent[0].subject, /Reminder/); assert.match(sent[0].html, /events\/test-event/);
});
test('admin notification endpoint deduplicates audiences and logs actual send results', async () => {
  let delivered, logged;
  const route = load('app/api/events/[id]/notify/route.ts', {
    'next/server': next, nanoid: { nanoid: () => 'log' },
    '@/lib/server/session': { getSessionUser: async () => ({ id: 'admin', role: 'admin' }) },
    '@/lib/server/email': { emailConfigured: true },
    '@/lib/server/notifications': { sendEventNotifications: async (event, recipients) => { delivered = recipients; return { emailSent: recipients.length, emailFailed: 0, smsSent: 0, smsFailed: 0 }; } },
    '@/lib/server/collections': { ensureCoreIndexes: async () => {}, serializeDocument: row => row, serializeDocuments: rows => rows, getCollection: async name => ({
      findOne: async () => event,
      find: () => ({ toArray: async () => name === 'users' ? [{ email: 'SHARED@example.test' }] : name === 'newsletterSubscribers' ? [{ email: ' shared@example.test ' }] : [{ email: 'guest@example.test' }] }),
      insertOne: async log => { logged = log; },
    }) },
  });
  const response = await route.POST(request({ type: 'reminder', channel: 'email', targetAudience: 'all' }), context);
  assert.equal(response.status, 200); assert.equal(delivered.length, 2);
  assert.equal(logged.successCount, 2); assert.equal(logged.sentBy, 'admin');
  assert.equal((await route.POST(request({ type: 'invalid', channel: 'email', targetAudience: 'all' }), context)).status, 400);
});
test('changing a link event to form explicitly clears its old URL in the database', async () => {
  let saved;
  const route = load('app/api/events/[id]/route.ts', {
    'next/server': next,
    '@/app/api/events/route': { validateHttpUrl: () => null },
    '@/lib/server/guards': { getRequestSession: async () => ({ role: 'admin' }) },
    '@/lib/server/collections': { ensureCoreIndexes: async () => {}, serializeDocument: row => row, getCollection: async () => ({ findOne: async () => ({ ...event, registrationMode: 'link', registrationUrl: 'https://old.example.test' }), findOneAndUpdate: async (filter, update) => { saved = update.$set; return { ...event, ...saved }; } }) },
  });
  assert.equal((await route.PATCH(request({ registrationMode: 'form' }), context)).status, 200);
  assert.equal(saved.registrationUrl, '');
});
test('anonymous callers and members cannot create events or send event emails', async () => {
  for (const user of [null, { role: 'member' }]) {
    const mocks = { 'next/server': next, '@/lib/server/guards': { getRequestSession: async () => user }, '@/lib/server/session': { getSessionUser: async () => user }, '@/lib/server/collections': {}, '@/lib/server/notifications': {}, '@/lib/server/email': { emailConfigured: true }, nanoid: {} };
    const events = load('app/api/events/route.ts', mocks);
    assert.equal((await events.POST(request({}))).status, 403);
    const notify = load('app/api/events/[id]/notify/route.ts', mocks);
    assert.equal((await notify.POST(request({}), context)).status, 401);
  }
});

const listingFields = {
  eventbriteUrl: ' https://www.eventbrite.com/e/club-gathering-123 ',
  partifulUrl: 'https://partiful.com/e/club-gathering',
  otherPlatformLinks: [{ name: ' Meetup ', url: ' https://www.meetup.com/club/events/123/ ' }],
};
function listingRoutes(session = { sub: 'admin', role: 'admin' }) {
  const state = { document: { ...event, ...listingFields }, writes: 0 };
  const mocks = {
    '@/lib/server/volunteers': { reconcileVolunteerEvent: async () => [] },
    '@/lib/server/volunteer-notifications': { deliverVolunteerMessages: async () => ({ sent: 0, failed: 0 }) },
    'next/server': next, nanoid: { nanoid: () => 'event' },
    '@/lib/server/guards': { getRequestSession: async () => session },
    '@/lib/server/collections': { ensureCoreIndexes: async () => {}, serializeDocument: row => row, serializeDocuments: rows => rows, getCollection: async () => ({
      insertOne: async row => { state.document = row; state.writes++; },
      findOne: async () => state.document,
      findOneAndUpdate: async (_, update) => { state.document = { ...state.document, ...update.$set }; state.writes++; return state.document; },
    }) },
  };
  state.create = load('app/api/events/route.ts', mocks);
  state.detail = load('app/api/events/[id]/route.ts', mocks);
  return state;
}
const createEventPayload = { ...event, description: 'A community gathering', type: 'meetup', tags: [], organizerId: 'admin', organizerName: 'Club team', isFeatured: false, isPublic: true, isOnline: false, membersOnly: false };

test('admins create an event with optional listings and public detail reads normalized saved links', async () => {
  const state = listingRoutes();
  const response = await state.create.POST(request({ ...createEventPayload, ...listingFields }));
  assert.equal(response.status, 201); assert.equal(state.writes, 1);
  const detail = await state.detail.GET({}, context);
  assert.equal(detail.body.data.eventbriteUrl, listingFields.eventbriteUrl.trim());
  assert.equal(detail.body.data.partifulUrl, listingFields.partifulUrl);
  assert.deepEqual(detail.body.data.otherPlatformLinks, [{ name: 'Meetup', url: listingFields.otherPlatformLinks[0].url.trim() }]);
});
test('optional listings can be edited, individually cleared and removed without changing registration', async () => {
  const state = listingRoutes();
  await state.detail.PATCH(request({ eventbriteUrl: 'https://www.eventbrite.com/e/new-456' }), context);
  assert.equal(state.document.eventbriteUrl, 'https://www.eventbrite.com/e/new-456');
  assert.equal(state.document.partifulUrl, listingFields.partifulUrl);
  assert.deepEqual(state.document.otherPlatformLinks, listingFields.otherPlatformLinks);
  assert.equal(state.document.registrationMode, 'form');
  await state.detail.PATCH(request({ eventbriteUrl: '', partifulUrl: '', otherPlatformLinks: [] }), context);
  const { getEventPlatformLinks } = load('lib/event-platform-links.ts');
  assert.deepEqual(getEventPlatformLinks(state.document), []);
  assert.equal(state.document.registrationMode, 'form');
});
test('unrelated event edits preserve listings and old events need no additional fields', async () => {
  const state = listingRoutes();
  await state.detail.PATCH(request({ title: 'Updated event title' }), context);
  assert.equal(state.document.eventbriteUrl, listingFields.eventbriteUrl);
  const created = await state.create.POST(request(createEventPayload));
  assert.equal(created.status, 201); assert.equal(state.document.eventbriteUrl, undefined);
  const { getEventPlatformLinks, eventListingForm } = load('lib/event-platform-links.ts');
  assert.deepEqual(getEventPlatformLinks(state.document), []);
  assert.deepEqual(eventListingForm(state.document), { eventbriteUrl: '', partifulUrl: '', otherPlatformLinks: [] });
});
test('unsafe or malformed platform links fail both create and update before writes', async () => {
  const invalid = [
    { eventbriteUrl: 'javascript:alert(1)' }, { partifulUrl: 'partiful.com/e/123' },
    { eventbriteUrl: 123 }, { partifulUrl: 'https://user:secret@partiful.com/e/123' },
    { otherPlatformLinks: [{ name: 'Meetup', url: 'data:text/html,bad' }] },
    { otherPlatformLinks: [{ name: '', url: 'https://example.test/' }] },
    { otherPlatformLinks: [{ name: 'x'.repeat(61), url: 'https://example.test/' }] },
    { otherPlatformLinks: Array(9).fill({ name: 'Meetup', url: 'https://example.test/' }) },
    { otherPlatformLinks: [null] }, { otherPlatformLinks: 'invalid' },
  ];
  for (const patch of invalid) {
    const state = listingRoutes();
    assert.equal((await state.create.POST(request({ ...createEventPayload, ...patch }))).status, 400);
    assert.equal((await state.detail.PATCH(request(patch), context)).status, 400);
    assert.equal(state.writes, 0);
  }
});
test('public listings omit empty or unsafe stored values and ignore registration URLs', () => {
  const { getEventPlatformLinks, validateEventListings } = load('lib/event-platform-links.ts');
  assert.deepEqual(getEventPlatformLinks({ eventbriteUrl: 'javascript:alert(1)', partifulUrl: '', registrationUrl: 'https://example.test/', otherPlatformLinks: [{ name: 'Meetup', url: 'https://www.meetup.com/club/' }, { name: 'Unsafe', url: 'javascript:alert(1)' }, null] }), [{ name: 'Meetup', url: 'https://www.meetup.com/club/' }]);
  assert.deepEqual(validateEventListings({ otherPlatformLinks: [{ name: ' ', url: '' }] }), { fields: { otherPlatformLinks: [] } });
});
test('members and anonymous callers cannot create or alter platform links', async () => {
  for (const session of [null, { sub: 'member', role: 'member' }]) {
    const state = listingRoutes(session);
    assert.equal((await state.create.POST(request({ ...createEventPayload, ...listingFields }))).status, 403);
    assert.equal((await state.detail.PATCH(request(listingFields), context)).status, 403);
    assert.equal(state.writes, 0);
  }
});

test('event volunteer caps persist independently, can be cleared and reject invalid values', async () => {
  const state = listingRoutes();
  const created = await state.create.POST(request({ ...createEventPayload, maxAttendees: 100, volunteerCap: 5 }));
  assert.equal(created.status, 201); assert.equal(state.document.volunteerCap, 5); assert.equal(state.document.maxAttendees, 100);
  await state.detail.PATCH(request({ volunteerCap: 0 }), context); assert.equal(state.document.volunteerCap, 0);
  await state.detail.PATCH(request({ volunteerCap: null }), context); assert.equal(state.document.volunteerCap, null);
  const writes = state.writes;
  for (const volunteerCap of [-1, 2.5, '10', 100001]) {
    assert.equal((await state.create.POST(request({ ...createEventPayload, volunteerCap }))).status, 400);
    assert.equal((await state.detail.PATCH(request({ volunteerCap }), context)).status, 400);
  }
  assert.equal(state.writes, writes);
});
