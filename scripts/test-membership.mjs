import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function load(file, globals = {}) {
  const output = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, URLSearchParams, AbortSignal, ...globals }, { filename: file });
  return exports;
}

function captcha(env = {}, fetch = async () => { throw Error('Unexpected fetch'); }) {
  return load('lib/server/recaptcha.ts', { process: { env }, fetch }).verifyRecaptcha;
}
const keys = { RECAPTCHA_SECRET_KEY: 'test-secret', NEXT_PUBLIC_RECAPTCHA_SITE_KEY: 'test-site' };

test('CAPTCHA fails closed without either configured key', async () => {
  for (const env of [{}, { RECAPTCHA_SECRET_KEY: 'secret' }, { NEXT_PUBLIC_RECAPTCHA_SITE_KEY: 'site' }]) {
    assert.equal((await captcha(env)('token')).status, 503);
  }
});
test('CAPTCHA rejects absent, malformed and oversized tokens before calling Google', async () => {
  for (const token of [undefined, '', ' ', 123, {}, 'x'.repeat(4097)]) {
    assert.equal((await captcha(keys)(token)).status, 400);
  }
});
test('CAPTCHA posts the token and secret and accepts only explicit success', async () => {
  let calls = 0;
  const verify = captcha(keys, async (url, init) => {
    calls++;
    assert.equal(url, 'https://www.google.com/recaptcha/api/siteverify');
    assert.equal(init.method, 'POST');
    assert.equal(init.body.get('secret'), keys.RECAPTCHA_SECRET_KEY);
    assert.equal(init.body.get('response'), 'solved-token');
    return { ok: true, json: async () => ({ success: true }) };
  });
  assert.equal((await verify('solved-token')).ok, true);
  assert.equal(calls, 1);
  for (const data of [{ success: false }, {}, { success: 'true' }]) {
    assert.equal((await captcha(keys, async () => ({ ok: true, json: async () => data }))('token')).status, 400);
  }
});
test('CAPTCHA network and provider errors fail closed', async () => {
  assert.equal((await captcha(keys)('token')).status, 503);
  assert.equal((await captcha(keys, async () => ({ ok: false }))('token')).status, 503);
});
test('US and Nigerian cell numbers normalize to international form', () => {
  assert.equal(parsePhoneNumberFromString('(215) 555-0123', 'US').number, '+12155550123');
  assert.equal(parsePhoneNumberFromString('08031234567', 'NG').number, '+2348031234567');
  assert.equal(parsePhoneNumberFromString('123', 'NG').isValid(), false);
});
test('Rescheduling preserves Philadelphia wall time across standard and daylight time', () => {
  const { instantToClubWallTime, clubWallTimeToInstant } = load('lib/club-time.ts');
  for (const [date, iso] of [['2027-01-15', '2027-01-15T23:30:00.000Z'], ['2027-07-15', '2027-07-15T22:30:00.000Z']]) {
    assert.equal(clubWallTimeToInstant(date, '18:30').toISOString(), iso);
    const values = instantToClubWallTime(iso);
    assert.equal(values.date, date);
    assert.equal(values.time, '18:30');
  }
});
test('Rescheduled interview email clearly replaces the previous appointment and escapes location', () => {
  const { applicationStatusEmail } = load('lib/server/email-templates.ts');
  const mail = applicationStatusEmail({ name: 'Test Member', status: 'interview', statusUrl: 'https://example.com/status', portalUrl: 'https://example.com/login', contactEmail: 'test@example.com', interview: { when: 'January 15 at 6:30 PM EST', location: '<Room 1>', rescheduled: true } });
  assert.match(mail.subject, /Interview rescheduled/);
  assert.match(mail.html, /replaces your previous appointment/);
  assert.match(mail.html, /&lt;Room 1&gt;/);
});
test('Bundled constitution exactly matches the supplied PDF', () => {
  const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const source = process.env.ECP_CONSTITUTION_SOURCE;
  assert.ok(fs.readFileSync(path.join(__dirname, '../public/documents/ecp-constitution.pdf')).subarray(0, 5).equals(Buffer.from('%PDF-')));
  if (source) assert.equal(hash(source), hash(path.join(__dirname, '../public/documents/ecp-constitution.pdf')));
});

test('User creation rejects anonymous and non-admin sessions before database access', async () => {
  for (const role of [null, 'applicant', 'member']) {
    const route = load('app/api/users/route.ts', {
      require: (name) => {
        if (name === 'next/server') return { NextResponse: { json: (body, init) => ({ body, status: init.status }) } };
        if (name === '@/lib/server/guards') return { requireSession: () => role ? { session: { role }, deny: null } : { session: null, deny: { status: 401 } } };
        if (name === '@/lib/server/collections') return { ensureCoreIndexes: () => { throw Error('Database must not be accessed'); } };
        if (name === 'nanoid' || name === '@/lib/server/auth') return {};
        throw Error(`Unexpected import: ${name}`);
      },
    });
    assert.equal((await route.POST({})).status, role ? 403 : 401);
  }
});
