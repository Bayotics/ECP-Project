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
const { validateVolunteerInput } = load('lib/volunteer-input.ts');
const { validateVolunteerCap } = load('lib/volunteer-cap.ts');
const visitor = { name: ' Test Volunteer ', email: ' VOLUNTEER@Example.test ' };

test('volunteer form only requires name and email and normalizes the email identity', () => {
  assert.deepEqual(validateVolunteerInput(visitor), { value: { name: 'Test Volunteer', email: 'volunteer@example.test', phone: '', interests: '', notes: '' } });
  const result = validateVolunteerInput({ ...visitor, eventId: ' event-id ', phone: ' +1 215 555 0100 ', interests: ' Food drives ', notes: ' Happy to help ' });
  assert.equal(result.value.eventId, 'event-id'); assert.equal(result.value.phone, '+1 215 555 0100');
  assert.equal(result.value.interests, 'Food drives'); assert.equal(result.value.notes, 'Happy to help');
});
test('malformed volunteer inputs return specific field errors', () => {
  for (const input of [null, [], {}, { ...visitor, name: '' }, { ...visitor, email: 'invalid' }, { ...visitor, phone: {} }, { ...visitor, interests: 'x'.repeat(501) }, { ...visitor, notes: 'x'.repeat(1001) }, { ...visitor, eventId: {} }]) assert.ok('error' in validateVolunteerInput(input));
});
test('volunteer capacity is optional and separate from attendee capacity', () => {
  for (const value of [undefined, null, 0, 1, 100000]) assert.equal(validateVolunteerCap(value), null);
  for (const value of [-1, 1.5, NaN, Infinity, '5', {}, 100001]) assert.match(validateVolunteerCap(value), /whole number/);
});
test('confirmation and waitlist emails accurately distinguish a reserved place and escape supplied content', () => {
  const { volunteerEmail } = load('lib/server/email-templates.ts');
  const volunteer = { name: '<b>Name</b>', email: 'guest@example.test', phone: '', interests: 'Cooking <script>bad</script>', notes: '<img onerror=bad>' };
  const event = { id: 'event', slug: 'event', title: 'Turkey <Drive>', date: '2026-11-21T00:00:00.000Z', time: '09:00', location: 'Philadelphia', venue: 'Club Hall' };
  const confirmed = volunteerEmail({ volunteer, status: 'confirmed', reference: 'vol-123', event, audience: 'volunteer', url: 'https://example.test/events/event' });
  assert.match(confirmed.subject, /place confirmed/); assert.match(confirmed.html, /Nov 21, 2026/);
  assert.match(confirmed.html, /Philadelphia time/); assert.match(confirmed.html, /vol-123/);
  assert.match(confirmed.html, /&lt;b&gt;Name/); assert.doesNotMatch(confirmed.html, /<b>Name/);
  const waiting = volunteerEmail({ volunteer, status: 'waitlisted', reference: 'vol-124', event, audience: 'volunteer', url: 'https://example.test/events/event' });
  assert.match(waiting.subject, /waitlist/); assert.match(waiting.html, /do not have a confirmed place yet/);
  const staff = volunteerEmail({ volunteer, status: 'confirmed', reference: 'vol-123', event, audience: 'staff', url: 'https://example.test/admin/volunteers' });
  assert.match(staff.html, /guest@example.test/); assert.match(staff.html, /&lt;script&gt;/);
  assert.doesNotMatch(staff.html, /<script>|<img onerror/);
});

function adminList(session = { sub: 'admin', role: 'admin' }, empty = false) {
  const person = { id: 'person', name: 'Example Volunteer', email: 'volunteer@example.test', phone: '', interests: '', notes: '', createdAt: '2026-10-19T12:00:00Z', updatedAt: '2026-10-19T12:00:00Z' };
  const signup = { id: 'signup', volunteerId: person.id, eventId: 'event', status: 'waitlisted', registeredAt: person.createdAt, updatedAt: person.updatedAt };
  const state = { reads: 0 };
  const cursor = rows => ({ sort: () => cursor(rows), skip: value => { state.skip = value; return cursor(rows); }, limit: value => { state.limit = value; return cursor(rows); }, project: () => cursor(rows), toArray: async () => rows });
  state.api = load('app/api/admin/volunteers/route.ts', {
    'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200, headers: options.headers }) } },
    '@/lib/server/guards': { getRequestSession: async () => session },
    '@/lib/server/collections': {
      ensureCoreIndexes: async () => {}, serializeDocuments: rows => rows,
      getCollection: async name => {
        state.reads++;
        return name === 'volunteers' ? { find: filter => { state.filter = filter; return cursor(empty ? [] : [person]); }, countDocuments: async () => empty ? 0 : 1 }
          : name === 'volunteerSignups' ? { find: () => cursor([signup]), distinct: async (_, filter) => { state.signupFilter = filter; return [person.id]; } }
          : { find: () => cursor([{ id: 'event', slug: 'community-drive', title: 'Community Drive', date: '2026-11-21' }]) };
      },
    },
  });
  return state;
}
const listRequest = (query = '') => ({ nextUrl: new URL(`https://example.test/api/admin/volunteers${query}`) });
test('volunteer names, emails and notes are accessible only to current administrators', async () => {
  for (const session of [null, { sub: 'member', role: 'member' }]) {
    const state = adminList(session); const result = await state.api.GET(listRequest());
    assert.equal(result.status, 403); assert.equal(result.body.data, undefined); assert.equal(state.reads, 0);
  }
});
test('admin volunteer table joins the person with their event and preserves waitlist status', async () => {
  const state = adminList(); const response = await state.api.GET(listRequest());
  assert.equal(response.status, 200); assert.equal(response.headers['Cache-Control'], 'private, no-store');
  assert.equal(response.body.data.total, 1); assert.equal(response.body.data.volunteers[0].email, 'volunteer@example.test');
  assert.equal(response.body.data.volunteers[0].signups[0].eventTitle, 'Community Drive');
  assert.equal(response.body.data.volunteers[0].signups[0].status, 'waitlisted'); assert.equal(state.limit, 25);
});
test('admin search escapes patterns, paginates and filters people by event and status', async () => {
  const state = adminList(); await state.api.GET(listRequest('?q=A%2BB&page=2&eventId=event&status=waitlisted'));
  assert.equal(state.filter.$or[0].name.$regex, 'A\\+B'); assert.equal(state.skip, 50);
  assert.deepEqual(state.filter.id, { $in: ['person'] });
  assert.deepEqual(state.signupFilter, { eventId: 'event', status: 'waitlisted' });
  assert.equal((await state.api.GET(listRequest('?page=-1'))).status, 400);
  assert.equal((await state.api.GET(listRequest('?status=invalid'))).status, 400);
});
test('an empty volunteer table returns genuine zeroes without fabricated records', async () => {
  const state = adminList(undefined, true); const response = await state.api.GET(listRequest());
  assert.deepEqual(response.body.data.volunteers, []); assert.equal(response.body.data.total, 0);
});

test('live volunteer counts use general and event records, independent of attendee registration', () => {
  const { withVolunteerSummary } = load('lib/volunteer-summary.ts');
  const now = new Date('2026-10-19T16:00:00Z');
  const event = (id, patch = {}) => ({ id, slug: id, title: id, date: '2026-11-21', status: 'published', isPublic: true, membersOnly: false, type: 'meetup', registrationRequired: false, ...patch });
  const events = [event('open'), event('full', { volunteerCap: 1 }), event('zero', { volunteerCap: 0 }), event('past', { date: '2000-01-01' }), event('private', { membersOnly: true }), event('cancelled', { status: 'cancelled' })];
  const people = [{ id: 'alice', generalRegisteredAt: '2026-06-01T12:00:00Z' }, { id: 'bob' }, { id: 'old', generalRegisteredAt: '2025-01-01T00:00:00Z' }];
  const signups = [{ volunteerId: 'alice', eventId: 'full', status: 'confirmed', registeredAt: '2026-06-01T12:00:00Z' }, { volunteerId: 'bob', eventId: 'full', status: 'waitlisted', registeredAt: '2026-06-02T12:00:00Z' }, { volunteerId: 'cancelled', eventId: 'open', status: 'cancelled', registeredAt: '2026-06-01T12:00:00Z' }];
  const result = withVolunteerSummary({ calendarYear: 2026, volunteersSignedUpThisYear: 999, openVolunteerOpportunities: 999 }, events, people, signups, now);
  assert.equal(result.openVolunteerOpportunities, 1); assert.equal(result.volunteersSignedUpThisYear, 2);
  assert.ok(!JSON.stringify(result).includes('alice'));
});

test('lead validation rejects non-members and public event data omits lead identities', async () => {
  let queried;
  const { validateVolunteerLeads, publicVolunteerEvent } = load('lib/server/event-volunteer-leads.ts', { '@/lib/server/collections': { getCollection: async () => ({ countDocuments: async filter => { queried = filter; return 2; } }) } });
  assert.equal(await validateVolunteerLeads(['a', 'b']), null);
  assert.deepEqual(queried.role.$in, ['member', 'admin', 'super-admin']); assert.equal(queried.status, 'active');
  assert.match(await validateVolunteerLeads(['a']), /active member/);
  assert.match(await validateVolunteerLeads(['a', 'a']), /different members/);
  const record = { id: 'event', volunteerLeadIds: ['a', 'b'], volunteerRevision: 10, volunteerCap: 2 };
  assert.deepEqual(publicVolunteerEvent(record, false), { id: 'event', volunteerCap: 2 });
  assert.deepEqual(publicVolunteerEvent(record, true), record);
});

test('public volunteer submissions require server-side CAPTCHA before writing records', async () => {
  for (const status of [400, 503]) {
    let writes = 0;
    const api = load('app/api/volunteers/route.ts', {
      'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200 }) } },
      '@/lib/server/recaptcha': { verifyRecaptcha: async () => ({ ok: false, status, error: 'Verification failed' }) },
      '@/lib/server/guards': { getRequestSession: async () => null },
      '@/lib/server/collections': { ensureCoreIndexes: async () => { writes++; } },
      '@/lib/server/volunteers': { registerVolunteer: async () => { writes++; }, VolunteerError: Error },
      '@/lib/server/volunteer-notifications': {},
    });
    const response = await api.POST({ json: async () => visitor });
    assert.equal(response.status, status); assert.equal(writes, 0); assert.equal(response.body.error, 'Verification failed');
  }
});

test('volunteer record is preserved and delivery is reported honestly if email sending fails', async () => {
  let writes = 0;
  const api = load('app/api/volunteers/route.ts', {
    'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200 }) } },
    '@/lib/server/recaptcha': { verifyRecaptcha: async () => ({ ok: true }) },
    '@/lib/server/guards': { getRequestSession: async () => null },
    '@/lib/server/collections': { ensureCoreIndexes: async () => {}, getCollection: async () => ({ find: () => ({ project: () => ({ toArray: async () => [{ id: 'message' }] }) }), countDocuments: async () => 1 }) },
    '@/lib/server/volunteers': { registerVolunteer: async () => { writes++; return { volunteerId: 'person', reference: 'signup', status: 'waitlisted', alreadyRegistered: false, messageIds: ['message'] }; }, VolunteerError: class extends Error {} },
    '@/lib/server/volunteer-notifications': { deliverVolunteerMessages: async () => ({ sent: 0, failed: 1 }) },
  });
  const response = await api.POST({ json: async () => visitor });
  assert.equal(response.status, 201); assert.equal(writes, 1);
  assert.equal(response.body.data.status, 'waitlisted'); assert.equal(response.body.data.confirmationEmailSent, false);
  assert.equal(response.body.data.email, undefined);
});

test('volunteer cancellation and email retries are admin-only', async () => {
  for (const role of [undefined, 'member']) {
    const mocks = {
      'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200 }) } },
      '@/lib/server/guards': { getRequestSession: async () => role ? { role } : null },
      '@/lib/server/volunteers': {}, '@/lib/server/volunteer-notifications': {}, '@/lib/server/collections': {},
    };
    assert.equal((await load('app/api/admin/volunteers/signups/[id]/route.ts', mocks).PATCH({}, {})).status, 403);
    assert.equal((await load('app/api/admin/volunteers/[id]/notify/route.ts', mocks).POST({}, {})).status, 403);
  }
});
