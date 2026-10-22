import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const { NextRequest } = require('next/server');
function contact(verification = { ok: true }, providerOK = true) {
  let verifies = 0, forwards = [];
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('app/api/contact/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('exports', 'require', 'fetch', code)(module.exports, name => name === '@/lib/server/recaptcha' ? { verifyRecaptcha: async token => { verifies++; assert.equal(token, 'proof'); return verification; } } : require(name), async (url, init) => { forwards.push({ url, body: JSON.parse(init.body) }); return { ok: providerOK }; });
  return { route: module.exports, get verifies() { return verifies; }, forwards };
}
const body = { name: ' Sender ', email: 'sender@example.test', phone: '', subject: 'Membership', message: 'Please tell me more about membership.', recaptchaToken: 'proof' };
const request = (data = body, headers = {}) => new NextRequest('https://club.example/api/contact', { method: 'POST', headers: { origin: 'https://club.example', 'content-type': 'application/json', ...headers }, body: JSON.stringify(data) });
test('contact CAPTCHA rejection or outage never forwards a message', async () => {
  for (const status of [400, 503]) { const service = contact({ ok: false, status, error: 'Verification failed' }); assert.equal((await service.route.POST(request())).status, status); assert.equal(service.forwards.length, 0); }
});
test('contact validates input, origin and honeypot before calling providers', async () => {
  const service = contact();
  for (const data of [null, [], { ...body, name: '' }, { ...body, email: 'invalid' }, { ...body, subject: 'forged' }, { ...body, message: 'a'.repeat(10001) }, { ...body, website: 'bot' }]) assert.equal((await service.route.POST(request(data))).status, 400);
  assert.equal((await service.route.POST(request(body, { origin: 'https://evil.test' }))).status, 403);
  assert.equal(service.verifies, 0); assert.equal(service.forwards.length, 0);
});
test('verified contact forwards sanitized details to the existing recipient service', async () => {
  const service = contact(); assert.equal((await service.route.POST(request())).status, 200); assert.equal(service.verifies, 1); assert.equal(service.forwards.length, 1);
  assert.equal(service.forwards[0].url, 'https://formspree.io/f/xpwroval'); assert.equal(service.forwards[0].body.name, 'Sender'); assert.equal(service.forwards[0].body._replyto, body.email); assert.equal(service.forwards[0].body.recaptchaToken, undefined);
});
test('contact provider failure is reported instead of displaying false success', async () => { const service = contact({ ok: true }, false); assert.equal((await service.route.POST(request())).status, 503); });
