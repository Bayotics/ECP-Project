import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { PDFDocument } from 'pdf-lib';

const nativeRequire = createRequire(import.meta.url);
function load(file, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  const require = name => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith('@/')) return load(`${name.slice(2)}.ts`, mocks);
    return nativeRequire(name);
  };
  // Keep native library values in the same realm (pdf-lib validates Arrays).
  new Function('exports', 'require', code)(exports, require);
  return exports;
}
const billing = load('lib/dues.ts');
const user = { id: 'u1', joinedAt: '2026-10-17T12:00:00Z', displayName: 'Test Member', email: 'member@example.test', role: 'member', status: 'active' };
const payment = (patch = {}) => ({ id: 'p1', userId: user.id, year: 2026, amount: 240, status: 'paid', frequency: 'yearly', coverageStart: '2026-11-01', coverageEnd: '2027-10-31', paidDate: '2026-10-17T12:00:00Z', dueDate: '2026-11-01', schemaVersion: 2, autoRenew: false, createdAt: '2026-10-17T12:00:00Z', updatedAt: '2026-10-17T12:00:00Z', ...patch });
const calculate = (records = [], date = '2026-10-17T12:00:00Z', member = user) => billing.calculateDues(member, records, new Date(date));
const jsonResponse = { json: (body, init = {}) => ({ body, status: init.status ?? 200, headers: init.headers }) };
const nextMock = { NextResponse: jsonResponse };

test('annual example: November 2026 through October 2027; warning begins January 31 2028', () => {
  const summary = calculate();
  assert.equal(summary.plans[0].coverageStart, '2026-11-01');
  assert.equal(summary.plans[0].coverageEnd, '2027-10-31');
  assert.equal(summary.plans[0].amountCents, 24000);
  assert.equal(calculate([payment()], '2027-10-31T17:00:00Z').outstandingCents, 0);
  assert.equal(calculate([payment()], '2028-01-30T17:00:00Z').suspensionWarning, false);
  const risk = calculate([payment()], '2028-01-31T17:00:00Z');
  assert.equal(risk.suspensionWarning, true);
  assert.deepEqual(Array.from(risk.overdueMonths), ['2027-11', '2027-12', '2028-01']);
  assert.equal(risk.nextPaymentDue, '2027-11-01');
});
test('two six-month payments cover one year for exactly $240 from any starting month', () => {
  for (let month = 1; month <= 12; month++) {
    const baseline = `2026-${String(month).padStart(2, '0')}-01`;
    const member = { ...user, duesStartDate: baseline, duesFrequency: 'twice-yearly' };
    const first = calculate([], undefined, member).plans.find(plan => plan.frequency === 'twice-yearly');
    assert.equal(first.amountCents, 12000);
    const paid = payment({ amount: 120, frequency: 'twice-yearly', coverageStart: first.coverageStart, coverageEnd: first.coverageEnd });
    const second = calculate([paid], undefined, member).plans.find(plan => plan.frequency === 'twice-yearly');
    assert.equal(second.amountCents, 12000);
    assert.equal(first.amountCents + second.amountCents, 24000);
    const fullyPaid = calculate([paid, payment({ id: 'p2', amount: 120, frequency: 'twice-yearly', coverageStart: second.coverageStart, coverageEnd: second.coverageEnd })], undefined, member);
    assert.equal(fullyPaid.paidThrough, calculate([], undefined, member).plans[0].coverageEnd);
  }
});
test('the confirmed rates are $240 yearly, $20 monthly and $120 twice yearly', () => {
  const plans = calculate().plans;
  assert.deepEqual(plans.map(plan => plan.amountCents), [24000, 2000, 12000]);
});
test('October 31 warning is triggered by unpaid August, September and October, regardless of last payment date', () => {
  const member = { ...user, duesStartDate: '2026-08-01' };
  assert.equal(calculate([], '2026-10-30T17:00:00Z', member).suspensionWarning, false);
  const risk = calculate([], '2026-10-31T17:00:00Z', member);
  assert.equal(risk.suspensionWarning, true);
  assert.deepEqual(Array.from(risk.overdueMonths), ['2026-08', '2026-09', '2026-10']);
  assert.equal(risk.plans[1].coverageStart, '2026-08-01');
  const pending = payment({ status: 'pending', paidDate: undefined, createdAt: '2026-10-31T16:00:00Z', coverageStart: '2026-08-01', coverageEnd: '2026-08-31' });
  assert.equal(calculate([pending], '2026-10-31T17:00:00Z', member).suspensionWarning, true);
});
test('a monthly payment covering October with no previous debt first warns at January month-end', () => {
  const member = { ...user, duesStartDate: '2026-10-01' };
  const october = payment({ frequency: 'monthly', coverageStart: '2026-10-01', coverageEnd: '2026-10-31' });
  assert.equal(calculate([october], '2027-01-30T17:00:00Z', member).suspensionWarning, false);
  assert.equal(calculate([october], '2027-01-31T17:00:00Z', member).suspensionWarning, true);
});
test('no fake payment records are required to show a new member balance', () => {
  const summary = calculate();
  assert.equal(summary.status, 'current'); assert.equal(summary.totalPaidCents, 0);
  assert.equal(summary.paidThrough, null); assert.equal(summary.nextPaymentDue, '2026-11-01');
});
test('monthly and six-month quotes cover the correct period', () => {
  const plans = calculate().plans;
  assert.equal(plans[1].coverageEnd, '2026-11-30');
  assert.equal(plans[2].coverageEnd, '2027-04-30');
});
test('pending transfers never create paid coverage', () => {
  const summary = calculate([payment({ status: 'pending', submittedAt: '2026-10-17T12:00:00Z' })], '2027-01-31T17:00:00Z');
  assert.equal(summary.totalPaidCents, 0); assert.equal(summary.paidThrough, null); assert.equal(summary.suspensionWarning, true);
});
test('half payment does not clear the unpaid remainder of a month', () => {
  const summary = calculate([payment({ amount: 10, frequency: 'twice-monthly', coverageEnd: '2026-11-15' })], '2026-11-30T17:00:00Z', { ...user, duesFrequency: 'twice-monthly' });
  assert.equal(summary.nextPaymentDue, '2026-11-16'); assert.equal(summary.outstandingCents, billing.slotCents(2026*24+21));
  assert.deepEqual(Array.from(summary.overdueMonths), ['2026-11']);
});
test('six-month coverage advances the next due date and warnings still require three unpaid months', () => {
  const member = { ...user, duesFrequency: 'twice-yearly' };
  const paid = payment({ amount: 120, frequency: 'twice-yearly', coverageEnd: '2027-04-30' });
  assert.equal(calculate([paid], '2027-04-30T17:00:00Z', member).outstandingCents, 0);
  assert.equal(calculate([paid], '2027-04-30T17:00:00Z', member).nextPaymentDue, '2027-05-01');
  assert.equal(calculate([paid], '2027-07-30T17:00:00Z', member).suspensionWarning, false);
  const risk = calculate([paid], '2027-07-31T17:00:00Z', member);
  assert.equal(risk.suspensionWarning, true);
  assert.deepEqual(risk.overdueMonths, ['2027-05', '2027-06', '2027-07']);
  assert.equal(risk.outstandingCents, 6000);
});
test('the retired frequency cannot create new invoices and saved preferences become twice yearly', () => {
  assert.equal(billing.isDuesFrequency('twice-monthly'), false);
  assert.equal(billing.isDuesFrequency('twice-yearly'), true);
  assert.equal(calculate([], undefined, { ...user, duesFrequency: 'twice-monthly' }).frequency, 'twice-yearly');
});
test('catch-up starts with oldest unpaid dues, and full catch-up removes warning', () => {
  const risk = calculate([], '2027-01-31T17:00:00Z');
  assert.equal(risk.catchUp.coverageStart, '2026-11-01'); assert.equal(risk.catchUp.coverageEnd, '2027-01-31');
  assert.equal(risk.catchUp.amountCents, risk.outstandingCents);
  const paid = payment({ ...risk.catchUp, amount: risk.catchUp.amountCents/100 });
  assert.equal(calculate([paid], '2027-01-31T17:00:00Z').suspensionWarning, false);
});
test('waived periods cover dues without being counted as cash received', () => {
  const summary = calculate([payment({ status: 'waived' })], '2027-10-31T17:00:00Z');
  assert.equal(summary.outstandingCents, 0); assert.equal(summary.totalPaidCents, 0);
});
test('legacy real annual payments cover the calendar year', () => {
  const summary = calculate([payment({ schemaVersion: undefined, coverageStart: undefined, coverageEnd: undefined, year: 2027 })], '2027-12-31T17:00:00Z', { ...user, duesStartDate: '2027-01-01' });
  assert.equal(summary.outstandingCents, 0); assert.equal(summary.paidThrough, '2027-12-31');
});
test('no double charge across a gap that is already covered by a legacy payment', () => {
  const paid = payment({ coverageStart: '2027-01-01', coverageEnd: '2027-12-31' });
  const summary = calculate([paid]);
  assert.equal(summary.plans[0].coverageEnd, '2026-12-31');
});
test('billing begins after approval even if account was created months earlier', () => {
  assert.equal(calculate([], undefined, { ...user, joinedAt: '2025-01-01T12:00:00Z', membershipIdIssuedAt: user.joinedAt }).billingStartsOn, '2026-11-01');
});
test('Philadelphia timezone and leap-year month ends are consistent', () => {
  assert.equal(billing.clubDate(new Date('2028-03-01T02:00:00Z')), '2028-02-29');
  assert.equal(calculate([], '2028-02-29T17:00:00Z', { ...user, duesStartDate: '2028-02-01' }).plans[1].coverageEnd, '2028-02-29');
});
function placeholders() {
  return [2023,2024,2025,2026].map(year => ({ id: `fake${year}`, userId: user.id, year, amount: 20, status: year < 2026 ? 'paid' : 'pending', dueDate: `${year}-03-31`, ...(year < 2026 ? { paidDate: `${year}-02-15`, paymentMethod: 'bank-transfer', reference: 'ECP-PAY-ABCDEFGH' } : {}), createdAt: '2026-06-01T12:00:00Z', updatedAt: '2026-06-01T12:00:00Z' }));
}
test('exact seeded batches are excluded; a replaced real payment is preserved', () => {
  assert.equal(billing.splitDuesPlaceholders(placeholders()).placeholders.length, 4);
  const rows = placeholders(); rows[3] = { ...rows[3], status: 'paid', paymentMethod: 'paypal', reference: 'REAL-CAPTURE' };
  const split = billing.splitDuesPlaceholders(rows);
  assert.equal(split.placeholders.length, 3); assert.equal(split.records[0].reference, 'REAL-CAPTURE');
});
test('isolated real bank transfers are never classified as fabricated history', () => {
  assert.equal(billing.splitDuesPlaceholders([placeholders()[0]]).placeholders.length, 0);
});
test('member dues GET returns only existing records and summary without any writes', async () => {
  const route = load('app/api/dues/route.ts', {
    'next/server': nextMock,
    '@/lib/server/session': { getSessionUser: async () => user },
    '@/lib/server/collections': { ensureCoreIndexes: () => { throw Error('GET must not create indexes or records'); } },
    '@/lib/server/dues': { isDuesMember: () => true, getMemberDues: async () => ({ records: [], summary: calculate() }) },
  });
  const response = await route.GET({ nextUrl: new URL('http://localhost/api/dues') });
  assert.equal(response.status, 200); assert.equal(response.body.data.length, 0);
});
test('anonymous and nonmember dues requests are denied', async () => {
  for (const member of [null, { ...user, role: 'applicant' }]) {
    const route = load('app/api/dues/route.ts', { 'next/server': nextMock, '@/lib/server/session': { getSessionUser: async () => member }, '@/lib/server/dues': { isDuesMember: value => value.role === 'member' }, '@/lib/server/collections': {} });
    const expected = member ? 403 : 401;
    assert.equal((await route.GET({})).status, expected); assert.equal((await route.POST({})).status, expected);
  }
});
test('members cannot read another member dues', async () => {
  const route = load('app/api/dues/route.ts', { 'next/server': nextMock, '@/lib/server/session': { getSessionUser: async () => user }, '@/lib/server/dues': { isDuesMember: () => true }, '@/lib/server/collections': {} });
  assert.equal((await route.GET({ nextUrl: new URL('http://localhost/api/dues?userId=other') })).status, 403);
});
test('POST ignores forged amount and coverage and creates a server-priced invoice', async () => {
  let inserted;
  const route = load('app/api/dues/route.ts', { 'next/server': nextMock, '@/lib/server/session': { getSessionUser: async () => user }, '@/lib/server/dues': { isDuesMember: () => true, getMemberDues: async () => ({ summary: calculate() }) }, '@/lib/server/collections': { ensureCoreIndexes: async () => {}, getCollection: async name => name === 'users' ? { updateOne: async () => {} } : { insertOne: async doc => { inserted = doc; } } } });
  const response = await route.POST({ json: async () => ({ frequency: 'yearly', amount: 0.01, status: 'paid', userId: 'other', coverageEnd: '2099-12-31' }) });
  assert.equal(response.status, 201); assert.equal(inserted.amount, 240); assert.equal(inserted.status, 'pending'); assert.equal(inserted.userId, user.id); assert.equal(inserted.coverageEnd, '2027-10-31');
});
test('members cannot mark their own payments paid or waive dues', async () => {
  const route = load('app/api/dues/[id]/route.ts', { 'next/server': nextMock, '@/lib/server/session': { getSessionUser: async () => user }, '@/lib/server/collections': { getCollection: async () => ({ findOne: async () => payment({ status: 'pending' }) }) }, '@/lib/server/dues': {}, '@/lib/server/email': {}, '@/lib/server/email-templates': {} });
  for (const body of [{ status: 'paid' }, { action: 'confirm' }, { status: 'waived' }, { action: 'submit', paymentMethod: 'zelle', amount: .01 }]) assert.equal((await route.PATCH({ json: async () => body }, { params: Promise.resolve({ id: 'p1' }) })).status, 403);
});
test('PayPal capture rejects ownership and amount mismatches before settlement', async () => {
  let captures = 0, settlements = 0;
  const build = owner => load('app/api/payments/paypal/capture/route.ts', { 'next/server': nextMock, '@/lib/server/paypal': { isPayPalConfigured: () => true, paypalCaptureOrder: async () => { captures++; return { id: 'ORDER', status: 'COMPLETED', purchase_units: [{ payments: { captures: [{ id: 'CAP', status: 'COMPLETED', amount: { value: '.01', currency_code: 'USD' } }] } }] }; } }, '@/lib/server/session': { getSessionUser: async () => owner }, '@/lib/server/collections': { getCollection: async () => ({ findOne: async () => payment({ status: 'pending', paypalOrderId: 'ORDER' }) }) }, '@/lib/server/dues': { settleDuesPayment: async () => { settlements++; } }, '@/lib/server/notifications': {} });
  const request = { json: async () => ({ paypalOrderId: 'ORDER', context: 'dues', recordId: 'p1' }) };
  assert.equal((await build({ ...user, id: 'other' }).POST(request)).status, 403); assert.equal(captures, 0);
  assert.equal((await build(user).POST(request)).status, 402); assert.equal(settlements, 0);
});
test('replayed settled PayPal capture returns success without capturing again', async () => {
  const route = load('app/api/payments/paypal/capture/route.ts', { 'next/server': nextMock, '@/lib/server/paypal': { isPayPalConfigured: () => true, paypalCaptureOrder: () => { throw Error('Must not capture twice'); } }, '@/lib/server/session': { getSessionUser: async () => user }, '@/lib/server/collections': { getCollection: async () => ({ findOne: async () => payment({ paypalOrderId: 'ORDER', paypalCaptureId: 'CAP' }) }) }, '@/lib/server/dues': {}, '@/lib/server/notifications': {} });
  const response = await route.POST({ json: async () => ({ paypalOrderId: 'ORDER', context: 'dues', recordId: 'p1' }) });
  assert.equal(response.status, 200); assert.equal(response.body.data.captureId, 'CAP');
});
test('reminder cutoff honors Philadelphia month-end across DST and leap years', () => {
  const reminders = load('lib/server/dues-reminders.ts', { '@/lib/server/collections': {}, '@/lib/server/dues': {}, '@/lib/server/email': {}, '@/lib/server/email-templates': {} });
  assert.equal(reminders.reminderCutoff(new Date('2028-03-01T02:00:00Z')), '2028-02-29');
  assert.equal(reminders.reminderCutoff(new Date('2028-03-01T05:30:00Z')), '2028-02-29');
  assert.equal(reminders.reminderCutoff(new Date('2028-04-15T12:00:00Z')), '2028-03-31');
  process.env.CRON_SECRET = 'test-secret';
  assert.equal(reminders.validCronSecret(null), false); assert.equal(reminders.validCronSecret('Bearer wrong'), false); assert.equal(reminders.validCronSecret('Bearer test-secret'), true);
  delete process.env.CRON_SECRET;
});
test('reminder delivery is deduplicated, failed email retries, and prepaid members are skipped', async () => {
  let attempts = 0, emails = 0, sent = false;
  const remindersCollection = {
    findOneAndUpdate: async () => { if (sent) throw Object.assign(new Error('duplicate reminder'), { code: 11000 }); attempts++; return {}; },
    updateOne: async (_filter, update) => { if (update.$set.status === 'sent') sent = true; },
  };
  const risk = calculate([], '2027-01-31T17:00:00Z');
  const configured = {
    '@/lib/server/collections': { ensureCoreIndexes: async () => {}, getCollection: async name => name === 'users' ? { find: () => [user, { ...user, id: 'prepaid' }] } : remindersCollection },
    '@/lib/server/dues': { getMemberDues: async member => ({ summary: member.id === 'prepaid' ? { ...risk, suspensionWarning: false } : risk }) },
    '@/lib/server/email': { sendEmail: async () => { emails++; return emails === 1 ? { ok: false, error: 'Provider unavailable' } : { ok: true, id: 'mail-id' }; }, siteUrl: () => 'https://example.test' },
    '@/lib/server/email-templates': { escapeHtml: value => value },
  };
  const { runDuesReminders } = load('lib/server/dues-reminders.ts', configured);
  const now = new Date('2027-02-01T05:30:00Z');
  assert.equal((await runDuesReminders(now)).failed, 1);
  assert.equal((await runDuesReminders(now)).sent, 1);
  assert.equal((await runDuesReminders(now)).sent, 0);
  assert.equal(emails, 2); assert.equal(attempts, 2);
});
test('reminder retry does not warn a member who has since cleared their deficit', async () => {
  let reads = 0;
  const risk = calculate([], '2027-01-31T17:00:00Z');
  const { runDuesReminders } = load('lib/server/dues-reminders.ts', {
    '@/lib/server/collections': { ensureCoreIndexes: async () => {}, getCollection: async name => name === 'users' ? { find: () => [user] } : { findOneAndUpdate: () => { throw Error('Must not claim reminder'); } } },
    '@/lib/server/dues': { getMemberDues: async () => ({ summary: ++reads === 1 ? risk : { ...risk, suspensionWarning: false } }) },
    '@/lib/server/email': { sendEmail: () => { throw Error('Must not email'); } }, '@/lib/server/email-templates': {},
  });
  assert.equal((await runDuesReminders(new Date('2027-02-01T05:30:00Z'))).skipped, 1);
});
test('admin confirmation credits only submitted transfers and records the verifying administrator', async () => {
  let settled;
  const route = load('app/api/dues/[id]/route.ts', {
    'next/server': nextMock, '@/lib/server/session': { getSessionUser: async () => ({ ...user, id: 'admin', role: 'admin' }) },
    '@/lib/server/collections': { getCollection: async () => ({ findOne: async () => payment({ status: 'pending', paymentMethod: 'zelle', submittedAt: user.joinedAt }) }), serializeDocument: value => value },
    '@/lib/server/dues': { settleDuesPayment: async (id, patch) => { settled = { id, ...patch }; return payment(); } }, '@/lib/server/email': {}, '@/lib/server/email-templates': {},
  });
  const result = await route.PATCH({ json: async () => ({ action: 'confirm', reference: 'BANK-123' }) }, { params: Promise.resolve({ id: 'p1' }) });
  assert.equal(result.status, 200); assert.equal(settled.confirmedBy, 'admin'); assert.equal(settled.reference, 'BANK-123');
});
test('Zelle submission notifies administrators without crediting the member', async () => {
  let notified = 0;
  const submitted = payment({ status: 'pending', paymentMethod: 'zelle', submittedAt: user.joinedAt, reference: 'ECP-DUES-QA' });
  const route = load('app/api/dues/[id]/route.ts', {
    'next/server': nextMock, '@/lib/server/session': { getSessionUser: async () => user },
    '@/lib/server/collections': { getCollection: async () => ({ findOne: async () => payment({ status: 'pending' }), findOneAndUpdate: async (_filter, update) => { assert.equal(update.$set.transferReference, 'ZELLE-QA'); assert.notEqual(update.$set.status, 'paid'); return submitted; } }), serializeDocument: value => value },
    '@/lib/server/dues': { notifyAdminsOfDuesTransfer: async (invoice, member) => { notified++; assert.equal(member.id, user.id); assert.equal(invoice.status, 'pending'); } },
  });
  const result = await route.PATCH({ json: async () => ({ action: 'submit', paymentMethod: 'zelle', transferReference: 'ZELLE-QA' }) }, { params: Promise.resolve({ id: 'p1' }) });
  assert.equal(result.status, 200); assert.equal(notified, 1); assert.equal(result.body.data.status, 'pending');
});
test('member confirmation email includes the updated record, balance and next due date', async () => {
  let message;
  const paid = payment({ paymentMethod: 'zelle', reference: 'ZELLE-QA' });
  const { sendMemberDuesReceipt } = load('lib/server/dues.ts', {
    '@/lib/server/collections': { getCollection: async name => name === 'users' ? { findOne: async () => user } : { find: () => ({ sort: () => ({ toArray: async () => [paid] }) }), updateOne: async () => {} }, serializeDocuments: value => value },
    '@/lib/server/email': { sendEmail: async options => { message = options; return { ok: true, id: 'email-id' }; }, siteUrl: () => 'https://example.test' },
    '@/lib/server/email-templates': { escapeHtml: value => value }, '@/lib/server/admin-notifications': {},
  });
  assert.equal((await sendMemberDuesReceipt(paid)).ok, true);
  assert.match(message.html, /November 1, 2027/); assert.match(message.html, /\$240\.00/);
  assert.match(message.html, /record has been updated/); assert.match(message.html, /outstanding balance/);
});
test('all club administrators are notified of Zelle dues, matching membership behavior', async () => {
  const recipients = [];
  const { notifyAdminsOfDuesTransfer } = load('lib/server/dues.ts', {
    '@/lib/server/collections': { getCollection: async () => ({ updateOne: async () => {} }) },
    '@/lib/server/email': { sendEmail: async message => { recipients.push(message.to); assert.match(message.html, /ZELLE-BANK-REF/); return { ok: true, id: 'email-id' }; }, siteUrl: () => 'https://example.test' },
    '@/lib/server/email-templates': { escapeHtml: value => value },
    '@/lib/server/admin-notifications': { adminRecipients: async () => [{ email: 'admin1@example.test' }, { email: 'admin2@example.test' }] },
  });
  const result = await notifyAdminsOfDuesTransfer(payment({ transferReference: 'ZELLE-BANK-REF' }), user);
  assert.equal(result.sent, 2); assert.deepEqual(recipients, ['admin1@example.test', 'admin2@example.test']);
});
test('PDF download and admin listing reject anonymous sessions before reading dues', async () => {
  for (const file of ['app/api/dues/history/route.ts', 'app/api/admin/dues/route.ts']) {
    const route = load(file, { 'next/server': nextMock, '@/lib/server/session': { getSessionUser: async () => null }, '@/lib/server/dues': {}, '@/lib/server/dues-pdf': {}, '@/lib/server/collections': {} });
    assert.equal((await route.GET({})).status, 401);
  }
});
test('PDF export produces a valid paginated document, including an empty history', async () => {
  const { buildDuesHistoryPdf } = load('lib/server/dues-pdf.ts');
  const bytes = await buildDuesHistoryPdf(user, [], calculate());
  assert.equal((await PDFDocument.load(bytes)).getPageCount(), 1);
  const records = Array.from({ length: 65 }, (_, i) => payment({ id: `payment-${i}`, reference: `ECP-${i}-${'LONG'.repeat(8)}` }));
  const many = await buildDuesHistoryPdf({ ...user, displayName: 'Ọlá Adé (QA)', membershipId: 'ECP-2026-0001' }, records, calculate(records));
  assert.ok((await PDFDocument.load(many)).getPageCount() >= 3);
  fs.mkdirSync('tmp/pdfs', { recursive: true });
  fs.writeFileSync('tmp/pdfs/dues-history-qa.pdf', many);
  fs.writeFileSync('tmp/pdfs/dues-empty-qa.pdf', bytes);
});
