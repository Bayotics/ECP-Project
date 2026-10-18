import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const nativeRequire = createRequire(import.meta.url);
function load(file, mocks = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  new Function('exports', 'require', output)(exports, name => Object.hasOwn(mocks, name) ? mocks[name] : name.startsWith('@/') ? load(name.slice(2) + '.ts', mocks) : nativeRequire(name));
  return exports;
}
const member = { id: 'member', email: 'member@example.test', displayName: 'Test Member', firstName: 'Test', lastName: 'Member', role: 'member', status: 'active', joinedAt: '2026-01-01', emailVerified: true };
const admin = { ...member, id: 'admin', role: 'admin' };
const next = { NextResponse: { json: (body, init = {}) => ({ body, status: init.status ?? 200, cookies: { set() {} } }) } };
const context = { params: Promise.resolve({ id: member.id }) };
function statusRoute(actor = admin, target = member, delivered = true) {
  let user = structuredClone(target), writes = 0, notifications = 0;
  const route = load('app/api/users/[id]/status/route.ts', {
    'next/server': next,
    '@/lib/server/session': { getSessionUser: async () => actor },
    '@/lib/server/collections': { getCollection: async () => ({
      findOne: async () => user,
      findOneAndUpdate: async (filter, update) => {
        assert.equal(filter.status, user.status);
        writes++;
        user = { ...user, ...update.$set, sessionVersion: (user.sessionVersion ?? 0) + update.$inc.sessionVersion, accountStatusHistory: [...(user.accountStatusHistory ?? []), update.$push.accountStatusHistory] };
        return user;
      },
    }) },
    '@/lib/server/account-status': { notifyAccountStatus: async () => { notifications++; return delivered; } },
  });
  return { route, get user() { return user; }, get writes() { return writes; }, get notifications() { return notifications; } };
}
const request = body => ({ json: async () => body });

test('only authenticated administrators can change membership access', async () => {
  for (const [actor, expected] of [[null, 401], [member, 403]]) {
    const state = statusRoute(actor);
    assert.equal((await state.route.PATCH(request({ status: 'suspended' }), context)).status, expected);
    assert.equal(state.writes, 0);
  }
});
test('administrators can suspend or revoke then reinstate, with audit and notification', async () => {
  for (const status of ['suspended', 'revoked']) {
    const state = statusRoute();
    const result = await state.route.PATCH(request({ status, reason: 'Committee review' }), context);
    assert.equal(result.status, 200); assert.equal(result.body.notified, true);
    assert.equal(state.user.status, status); assert.equal(state.user.sessionVersion, 1);
    assert.equal(state.user.accountStatusHistory[0].fromStatus, 'active');
    assert.equal(state.user.accountStatusHistory[0].changedBy, admin.id);
    assert.equal(state.user.accountStatusHistory[0].reason, 'Committee review');
    assert.equal(result.body.data.accountStatusHistory, undefined);
    assert.equal(result.body.data.sessionVersion, undefined);
    const restored = await state.route.PATCH(request({ status: 'active' }), context);
    assert.equal(restored.status, 200); assert.equal(state.user.status, 'active');
    assert.equal(state.user.sessionVersion, 2); assert.equal(state.notifications, 2);
  }
});
test('repeated status requests do not resend notices or invalidate sessions again', async () => {
  const state = statusRoute(admin, { ...member, status: 'suspended', sessionVersion: 1 });
  const result = await state.route.PATCH(request({ status: 'suspended' }), context);
  assert.equal(result.body.unchanged, true); assert.equal(state.writes, 0); assert.equal(state.notifications, 0);
});
test('email failure does not restore access and remains queued for retry', async () => {
  const state = statusRoute(admin, member, false);
  const result = await state.route.PATCH(request({ status: 'revoked' }), context);
  assert.equal(result.status, 200); assert.equal(state.user.status, 'revoked');
  assert.equal(state.user.accountStatusHistory[0].notificationStatus, 'pending');
  assert.match(result.body.warning, /queued for retry/);
});
test('membership controls protect administrator accounts and self access', async () => {
  for (const target of [admin, { ...member, role: 'super-admin' }, { ...member, role: 'admin' }]) {
    const state = statusRoute(admin, target);
    assert.equal((await state.route.PATCH(request({ status: 'revoked' }), context)).status, 403);
    assert.equal(state.writes, 0);
  }
});
test('invalid payloads and attempts to bypass reinstatement are rejected', async () => {
  for (const body of [{ status: 'anything' }, { status: 'active', sessionVersion: 0 }, { status: 'revoked', reason: 'x'.repeat(501) }, null]) {
    const state = statusRoute();
    assert.equal((await state.route.PATCH(request(body), context)).status, 400); assert.equal(state.writes, 0);
  }
  const state = statusRoute(admin, { ...member, status: 'suspended' });
  assert.equal((await state.route.PATCH(request({ status: 'pending' }), context)).status, 400);
});
test('suspension invalidates an existing cookie, and reinstatement does not revive it', async () => {
  let user = { ...member };
  const session = load('lib/server/session.ts', {
    '@/lib/server/collections': { getCollection: async () => ({ findOne: async () => user }), serializeDocument: value => value },
  });
  const oldToken = session.createSessionToken(user);
  const oldRequest = { cookies: { get: () => ({ value: oldToken }) } };
  assert.equal((await session.getSessionUser(oldRequest)).id, member.id);
  user = { ...user, status: 'suspended', sessionVersion: 1 };
  assert.equal(await session.getSessionUser(oldRequest), null);
  user = { ...user, status: 'active', sessionVersion: 2 };
  assert.equal(await session.getSessionUser(oldRequest), null);
  const newRequest = { cookies: { get: () => ({ value: session.createSessionToken(user) }) } };
  assert.equal((await session.getSessionUser(newRequest)).id, member.id);
});
test('revoked, suspended and deleted accounts cannot reuse any still-signed cookie', async () => {
  let user = { ...member };
  const session = load('lib/server/session.ts', { '@/lib/server/collections': { getCollection: async () => ({ findOne: async () => user }), serializeDocument: value => value } });
  const token = session.createSessionToken(user);
  for (const restricted of ['revoked', 'suspended', null]) {
    user = restricted ? { ...member, status: restricted } : null;
    assert.equal(await session.getSessionUser({ cookies: { get: () => ({ value: token }) } }), null);
  }
});
test('API guards use the current account and current role instead of a stale cookie role', async () => {
  let user = null;
  const guards = load('lib/server/guards.ts', { 'next/server': next, '@/lib/server/session': { getSessionUser: async () => user } });
  assert.equal((await guards.requireSession({})).deny.status, 401);
  user = { ...member };
  assert.equal((await guards.getRequestSession({})).role, 'member');
});
test('restricted credentials are refused without issuing a session or updating last-login', async () => {
  for (const status of ['suspended', 'revoked']) {
    let cookies = 0;
    const route = load('app/api/auth/login/route.ts', {
      'next/server': next, '@/lib/server/auth': { verifyCredentials: async () => member.id },
      '@/lib/server/collections': { ensureCoreIndexes: async () => {}, getCollection: async () => ({ findOne: async () => ({ ...member, status }), findOneAndUpdate: () => { throw Error('No login write allowed'); } }), serializeDocument: value => value },
      '@/lib/server/cart': { mergeAnonymousCartIntoUser: () => { throw Error('Must not merge cart'); } },
      '@/lib/server/session': { setAuthSessionCookie: () => cookies++ },
    });
    const result = await route.POST(request({ email: member.email, password: 'correct-password' }));
    assert.equal(result.status, 403); assert.equal(result.body.reason, `account-${status}`); assert.equal(cookies, 0);
    assert.match(result.body.error, /reinstatement/);
  }
});
test('generic profile updates cannot change membership status or session metadata', async () => {
  const route = load('app/api/users/[id]/route.ts', {
    'next/server': next, '@/lib/server/guards': { requireSession: async () => ({ session: { sub: admin.id, role: 'admin' }, deny: null }) },
    '@/lib/server/collections': {}, '@/lib/server/auth': {},
  });
  for (const body of [{ status: 'active' }, { sessionVersion: 0 }, { accountStatusHistory: [] }]) {
    assert.equal((await route.PATCH(request(body), context)).status, 400);
  }
});
test('suspended or revoked members cannot be reinstated by re-approving an application', async () => {
  for (const status of ['suspended', 'revoked']) {
    const activation = load('lib/server/membership-activation.ts', {
      '@/lib/server/collections': { getCollection: async () => ({ findOne: async () => ({ ...member, status }) }), serializeDocument: value => value },
      '@/lib/server/auth': { upsertCredential: () => { throw Error('Must not reset credentials'); } },
    });
    await assert.rejects(() => activation.activateMember({ id: 'application', email: member.email }, 'ECP-TEST'), /Reinstate/);
  }
});
test('notification templates explain restrictions and reinstatement and escape member input', () => {
  const { accountStatusEmail } = load('lib/server/email-templates.ts');
  for (const status of ['suspended', 'revoked', 'active']) {
    const message = accountStatusEmail({ name: '<Test>', reason: '<script>no</script>', status, loginUrl: 'https://example.test/auth/login' });
    assert.match(message.html, /&lt;Test&gt;/); assert.doesNotMatch(message.html, /<script>/);
    assert.match(message.html, status === 'active' ? /access has been restored/ : /until an administrator reinstates/);
  }
});
test('email verification cannot overwrite a restriction applied after the member was read', async () => {
  let actualStatus = 'pending';
  const route = load('app/api/auth/verify-email/route.ts', {
    'next/server': next,
    '@/lib/server/collections': { ensureCoreIndexes: async () => {}, getCollection: async () => ({
      findOne: async () => ({ ...member, status: 'pending', emailVerified: false }),
      updateOne: async (filter, update) => {
        if (update.$set.emailVerified) actualStatus = 'revoked'; // Administrator acted after the read.
        if (update.$set.status) { assert.equal(filter.status, 'pending'); if (actualStatus === filter.status) actualStatus = update.$set.status; }
      },
    }) },
    '@/lib/server/email-verification': { consumeVerificationToken: async () => ({ status: 'ok', userId: member.id, email: member.email }) },
    '@/lib/server/email': { siteUrl: () => 'https://example.test', sendEmail: async () => ({ ok: true }) },
  });
  assert.equal((await route.POST(request({ token: 'valid-token' }))).status, 200);
  assert.equal(actualStatus, 'revoked');
});
test('application approval cannot overwrite a concurrent suspension', async () => {
  const activation = load('lib/server/membership-activation.ts', {
    '@/lib/server/collections': { getCollection: async () => ({
      findOne: async () => member,
      findOneAndUpdate: async filter => { assert.equal(filter.status, 'active'); assert.deepEqual(filter.sessionVersion, { $exists: false }); return null; },
    }), serializeDocument: value => value },
    '@/lib/server/auth': { upsertCredential: () => { throw Error('Must not reset credentials'); } },
  });
  await assert.rejects(() => activation.activateMember({ id: 'application', email: member.email }, 'ECP-TEST'), /could not be updated/);
});
test('status notifications retry failures and do not send completed messages twice', async () => {
  const change = { id: 'change', toStatus: 'suspended', notificationStatus: 'pending' };
  const user = { ...member, status: 'suspended', accountStatusHistory: [change] };
  let sends = 0;
  const queue = load('lib/server/account-status.ts', {
    '@/lib/server/collections': { getCollection: async () => ({
      findOneAndUpdate: async (_filter, update) => { if (!['pending','failed'].includes(change.notificationStatus)) return null; change.notificationStatus = 'sending'; change.notificationLeaseUntil = update.$set['accountStatusHistory.$.notificationLeaseUntil']; return user; },
      updateOne: async (_filter, update) => { change.notificationStatus = update.$set['accountStatusHistory.$.notificationStatus']; },
    }) },
    '@/lib/server/email': { siteUrl: () => 'https://example.test', sendEmail: async () => (++sends === 1 ? { ok: false, error: 'Provider unavailable' } : { ok: true, id: 'mail' }) },
  });
  assert.equal(await queue.notifyAccountStatus(member.id, change.id), false); assert.equal(change.notificationStatus, 'failed');
  assert.equal(await queue.notifyAccountStatus(member.id, change.id), true); assert.equal(change.notificationStatus, 'sent');
  assert.equal(await queue.notifyAccountStatus(member.id, change.id), false); assert.equal(sends, 2);
});
test('outdated suspension notifications are suppressed after reinstatement', async () => {
  let marked;
  const queue = load('lib/server/account-status.ts', {
    '@/lib/server/collections': { getCollection: async () => ({ findOneAndUpdate: async () => ({ ...member, accountStatusHistory: [{ id: 'old', toStatus: 'suspended' }, { id: 'latest', toStatus: 'active' }] }), updateOne: async (_filter, update) => { marked = update.$set['accountStatusHistory.$.notificationStatus']; } }) },
    '@/lib/server/email': { sendEmail: () => { throw Error('Must not send obsolete suspension'); } },
  });
  assert.equal(await queue.notifyAccountStatus(member.id, 'old'), false); assert.equal(marked, 'superseded');
});
test('private status history and session version are removed from directory responses', () => {
  const { publicUser } = load('lib/models/user.ts');
  const user = publicUser({ ...member, sessionVersion: 3, accountStatusHistory: [{ reason: 'Private' }] });
  assert.equal(user.sessionVersion, undefined); assert.equal(user.accountStatusHistory, undefined); assert.equal(user.status, 'active');
});
test('member editor exposes suspend/revoke actions and reinstatement for restricted members', () => {
  const component = load('components/admin/MemberAccessControls.tsx', {
    '@/context/AuthContext': { useAuth: () => ({ currentUser: admin }) }, '@/context/UsersContext': { useUsers: () => ({ refresh: async () => {} }) },
    '@/lib/client/api': {}, '@/components/admin/AdminUI': { Badge: ({ value }) => React.createElement('span', null, value), Btn: ({ children, onClick, disabled }) => React.createElement('button', { onClick, disabled }, children), SectionDivider: ({ label }) => React.createElement('h3', null, label) },
  }).default;
  const active = renderToStaticMarkup(React.createElement(component, { member, onUpdated() {} }));
  assert.match(active, /Suspend member/); assert.match(active, /Revoke membership/);
  const suspended = renderToStaticMarkup(React.createElement(component, { member: { ...member, status: 'suspended' }, onUpdated() {} }));
  assert.match(suspended, /Reinstate member/);
});
