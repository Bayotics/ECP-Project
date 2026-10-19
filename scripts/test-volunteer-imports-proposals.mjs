import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import ts from 'typescript';
const nativeRequire = createRequire(import.meta.url);
function load(file, mocks = {}, cache = new Map()) {
  if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
  new Function('exports', 'require', output)(exports, name => Object.hasOwn(mocks, name) ? mocks[name] : name.startsWith('@/') ? load(name.slice(2) + '.ts', mocks, cache) : nativeRequire(name));
  return exports;
}
const csv = load('lib/volunteer-csv.ts');
test('CSV parser preserves quoted commas, escaped quotes, BOM, CRLF and multiline notes', () => {
  const input = '\uFEFFName,Email,Notes\r\n"Doe, Jane",jane@example.test,"Line one\nSaid ""hello"""\r\n';
  const parsed = csv.parseVolunteerCsv(input);
  assert.deepEqual(parsed.headers, ['Name', 'Email', 'Notes']);
  assert.equal(parsed.rows[0][0], 'Doe, Jane'); assert.equal(parsed.rows[0][2], 'Line one\nSaid "hello"');
});
test('CSV validation rejects malformed quoting, duplicate headers, unequal widths and oversized files', () => {
  for (const input of ['Name,Name\na,b', 'Name,Email\na', 'Name,Email\n"Jane,a@example.test', 'Name,Email\nJa"ne,a@example.test', 'Name,Email\n"Jane"bad,a@example.test', 'Name,Email\n', 'a'.repeat(2000001)]) assert.throws(() => csv.parseVolunteerCsv(input));
});
test('CSV mapping normalizes email, flags missing real emails and skips repeated emails', () => {
  const input = 'First Name,Last Name,Email Address,Skills\nJane,Doe, JANE@Example.test ,Food drives\nJane,Doe,jane@example.test,Other\nNo,Email,,Help';
  const mapping = csv.suggestCsvMapping(csv.parseVolunteerCsv(input).headers);
  const rows = csv.previewVolunteerCsv(input, mapping, 'event-id');
  assert.equal(rows[0].value.name, 'Jane Doe'); assert.equal(rows[0].value.email, 'jane@example.test'); assert.equal(rows[0].value.eventId, 'event-id');
  assert.equal(rows[1].duplicate, true); assert.match(rows[2].error, /email/i);
  assert.throws(() => csv.previewVolunteerCsv(input, {email: 'missing', name: 'First Name'}), /Map an email/);
});
const {validateProposalInput} = load('lib/proposal-input.ts');
const proposal = {submissionId: '12345678-1234-1234-1234-123456789abc', name: 'Jane Doe', email: ' JANE@EXAMPLE.TEST ', title: 'Community event', description: 'Details', proposedDate: '2028-02-29', location: 'Club Hall', budget: '120.35', notes: ''};
test('proposals require all agreed fields and convert optional dollar budgets to integer cents', () => {
  const result = validateProposalInput(proposal); assert.equal(result.value.estimatedBudgetCents, 12035); assert.equal(result.value.email, 'jane@example.test');
  assert.equal(validateProposalInput({...proposal, budget: ''}).value.estimatedBudgetCents, undefined);
  assert.equal(Object.hasOwn(validateProposalInput({...proposal, budget: ''}).value, 'estimatedBudgetCents'), false);
  for (const key of ['name', 'email', 'title', 'description', 'proposedDate', 'location']) assert.ok(validateProposalInput({...proposal, [key]: ''}).error, key);
  for (const budget of ['-1', '1.001', 'Infinity', '1e5', {}]) assert.ok(validateProposalInput({...proposal, budget}).error);
  for (const proposedDate of ['2027-02-29', '2026-13-01', 'invalid']) assert.ok(validateProposalInput({...proposal, proposedDate}).error);
});
test('proposal and imported welcome emails escape content and include the correct private or review links', () => {
  const templates = load('lib/server/email-templates.ts');
  const mail = templates.volunteerWelcomeEmail('<b>Jane</b>', 'https://example.test/volunteer/preferences#token=abc');
  assert.match(mail.html, /&lt;b&gt;Jane/); assert.match(mail.html, /#token=abc/); assert.doesNotMatch(mail.html, /<b>Jane/);
  const acknowledgement = templates.proposalEmail({...proposal, name: '<script>Jane</script>', reference: 'proposal-ref', admin: false, url: 'https://example.test/events'});
  assert.match(acknowledgement.html, /does not confirm an event/); assert.match(acknowledgement.html, /proposal-ref/); assert.doesNotMatch(acknowledgement.html, /<script>/);
});
class VolunteerError extends Error { constructor(message, status) {super(message); this.status = status;} }
function harness(session = {sub: 'admin', role: 'admin'}) {
  const key = 'a'.repeat(64), state = {imports: [], reads: 0, writes: 0};
  const mocks = {
    'next/server': {NextResponse: {json: (body, options = {}) => ({body, status: options.status || 200, headers: options.headers})}},
    '@/lib/server/guards': {getRequestSession: async () => session},
    '@/lib/server/volunteers': {VolunteerError},
    '@/lib/server/collections': {ensureCoreIndexes: async () => {state.writes++;}, getCollection: async () => {state.reads++; return {findOne: async () => ({connectorKeyHash: createHash('sha256').update(key).digest('hex'), mappings: [{source: 'eventbrite', externalEventId: '123', eventId: 'club-event', volunteerTicketClassIds: ['456']}]})};}},
    '@/lib/server/volunteer-imports': {importVolunteer: async (...args) => {state.imports.push(args); return {reference: 'saved', status: 'waitlisted', messageIds: ['queued-email']};}, scheduleImportedVolunteerEmails: ids => {state.scheduled = ids;}},
    '@/lib/server/recaptcha': {verifyRecaptcha: async () => ({ok: false, status: 400, error: 'Complete verification'})},
    '@/lib/server/proposals': {submitProposal: async () => {state.writes++; throw Error('Must not write');}},
  };
  return {state, key, route: file => load(file, mocks)};
}
const request = (body, key) => ({headers: new Headers(key ? {Authorization: `Bearer ${key}`} : {}), json: async () => body});
test('connector rejects unauthenticated requests, unmapped events and ordinary Eventbrite tickets before import', async () => {
  const h = harness(), route = h.route('app/api/integrations/volunteers/route.ts');
  const body = {source: 'eventbrite', externalEventId: '123', ticketClassId: '456', registrationId: 'attendee', name: 'Jane Doe', email: 'JANE@example.test'};
  assert.equal((await route.POST(request(body))).status, 401); assert.equal(h.state.reads, 0);
  assert.equal((await route.POST(request(body, 'b'.repeat(64)))).status, 401);
  assert.equal((await route.POST(request({...body, externalEventId: '999'}, h.key))).status, 400);
  assert.equal((await route.POST(request({...body, ticketClassId: 'guest-ticket'}, h.key))).status, 422);
  assert.equal(h.state.imports.length, 0);
  const result = await route.POST(request(body, h.key)); assert.equal(result.status, 200); assert.equal(result.body.data.status, 'waitlisted');
  assert.equal(result.body.data.messageIds, undefined); assert.equal(result.body.data.emailsQueued, true); assert.deepEqual(h.state.scheduled, ['queued-email']);
  assert.equal(h.state.imports[0][0].email, 'jane@example.test'); assert.equal(h.state.imports[0][0].eventId, 'club-event'); assert.equal(h.state.imports[0][1], 'eventbrite');
});
test('admin CSV import and proposal routes reject visitors before reading private data', async () => {
  for (const session of [null, {sub: 'member', role: 'member'}]) {
    const h = harness(session);
    assert.equal((await h.route('app/api/admin/volunteers/import/route.ts').POST(request({}))).status, 403);
    assert.equal((await h.route('app/api/admin/proposals/route.ts').GET({})).status, 403);
    assert.equal(h.state.reads, 0); assert.equal(h.state.writes, 0);
  }
});
test('public proposals require server-side CAPTCHA before writes or notification creation', async () => {
  const h = harness(); const result = await h.route('app/api/proposals/route.ts').POST(request(proposal));
  assert.equal(result.status, 400); assert.equal(h.state.writes, 0); assert.equal(h.state.reads, 0);
});

test('conversion escapes public proposal text before it becomes an HTML event description', () => {
  const {proposalEventDescription} = load('lib/proposal-input.ts');
  const result = proposalEventDescription('Community day\n<img src=x onerror="alert(1)"><script>bad()</script>');
  assert.match(result, /^<p>Community day<br>/); assert.doesNotMatch(result, /<img|<script/); assert.match(result, /&lt;img/); assert.match(result, /&quot;/);
});

test('imports persist before background email delivery and retain retryable jobs after provider failure', async () => {
  const callbacks = [], sent = [];
  const helpers = load('lib/server/volunteer-imports.ts', {
    'next/server': {after: callback => callbacks.push(callback)},
    '@/lib/server/volunteers': {registerVolunteer: async () => ({reference: 'registration', status: 'confirmed', alreadyRegistered: false, messageIds: ['queued-job']})},
    '@/lib/server/volunteer-notifications': {deliverVolunteerMessages: async ids => {sent.push(...ids); return {sent: 0, failed: ids.length};}},
  });
  const result = await helpers.importVolunteer({name: 'Jane', email: 'jane@example.test'}, 'eventbrite', 'attendee');
  assert.equal(result.reference, 'registration'); assert.equal(sent.length, 0);
  helpers.scheduleImportedVolunteerEmails(result.messageIds); assert.equal(callbacks.length, 1); assert.equal(sent.length, 0);
  await callbacks[0](); assert.deepEqual(sent, ['queued-job']);
});
