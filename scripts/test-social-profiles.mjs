import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nodeRequire = createRequire(import.meta.url);
function load(file, deps = {}) {
  const output = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  const require = (name) => {
    if (name in deps) return deps[name];
    if (name === '@/lib/social-profiles') return load('lib/social-profiles.ts');
    if (name === '@/lib/models/user') return load('lib/models/user.ts');
    if (name === 'react/jsx-runtime') return nodeRequire(name);
    throw Error(`Unmocked dependency: ${name}`);
  };
  vm.runInNewContext(output, { exports, require, URL }, { filename: file });
  return exports;
}
const { normalizeSocialProfile, parseSocialProfiles } = load('lib/social-profiles.ts');

test('Social profiles remain optional and empty values explicitly remove a link', () => {
  assert.equal(parseSocialProfiles({}).ok, true);
  assert.equal(Object.keys(parseSocialProfiles({}).values).length, 0);
  assert.equal(parseSocialProfiles({ linkedinUrl: ' ' }).values.linkedinUrl, '');
});
test('Valid profiles normalize missing schemes and http to HTTPS', () => {
  assert.equal(normalizeSocialProfile('linkedinUrl', ' www.linkedin.com/in/test-person '), 'https://www.linkedin.com/in/test-person');
  assert.equal(normalizeSocialProfile('instagramUrl', 'http://instagram.com/test.person/'), 'https://instagram.com/test.person/');
  assert.equal(normalizeSocialProfile('facebookUrl', 'https://m.facebook.com/profile.php?id=123'), 'https://m.facebook.com/profile.php?id=123');
});
test('Invalid schemes, lookalike hosts, credentials, and unrelated networks are rejected', () => {
  for (const value of ['javascript:alert(1)', 'https://linkedin.com.evil.test/in/person', 'https://evil-linkedin.com/in/person', 'https://www.instagram.com/person', 'https://user:pass@linkedin.com/in/person', 'https://linkedin.com:8080/in/person', 'https://linkedin.com', '<script>', 'test person', 123, null]) {
    assert.equal(normalizeSocialProfile('linkedinUrl', value), null, String(value));
  }
});
test('All three icons stay visible and only supplied valid profiles can navigate', () => {
  const Links = load('components/people/SocialProfileLinks.tsx').default;
  const empty = renderToStaticMarkup(React.createElement(Links, { profiles: {}, name: 'Test Person' }));
  assert.equal((empty.match(/<svg /g) ?? []).length, 3);
  assert.equal((empty.match(/aria-disabled="true"/g) ?? []).length, 3);
  assert.doesNotMatch(empty, /href=|<a /);
  const html = renderToStaticMarkup(React.createElement(Links, { profiles: { linkedinUrl: 'linkedin.com/in/test', instagramUrl: 'https://instagram.com/test', facebookUrl: 'https://evil.test/test' }, name: 'Test Person' }));
  assert.equal((html.match(/<a /g) ?? []).length, 2);
  assert.equal((html.match(/<svg /g) ?? []).length, 3);
  assert.equal((html.match(/aria-disabled="true"/g) ?? []).length, 1);
  assert.match(html, /Facebook \(profile not added\)/);
  assert.match(html, /href="https:\/\/linkedin.com\/in\/test"/);
  assert.match(html, /Test Person on Instagram \(opens in a new tab\)/);
  assert.match(html, /target="_blank" rel="noopener noreferrer"/);
  assert.doesNotMatch(html, /evil.test/);
});
test('All three form fields are optional and retain supplied values', () => {
  const Fields = load('components/people/SocialProfileFields.tsx').default;
  const html = renderToStaticMarkup(React.createElement(Fields, { values: { facebookUrl: 'https://facebook.com/person' }, onChange: () => {} }));
  assert.equal((html.match(/<input /g) ?? []).length, 3);
  assert.doesNotMatch(html, /required=/);
  assert.match(html, /value="https:\/\/facebook.com\/person"/);
});

function profileRoute(session, onUpdate) {
  return load('app/api/users/[id]/route.ts', {
    'next/server': { NextResponse: { json: (body, init = {}) => ({ body, status: init.status ?? 200 }) } },
    '@/lib/server/guards': { requireSession: () => ({ session, deny: session ? null : { status: 401 } }) },
    '@/lib/server/collections': {
      ensureCoreIndexes: async () => {}, serializeDocument: (value) => value,
      getCollection: async () => ({ findOneAndUpdate: onUpdate }),
    },
    '@/lib/server/auth': {},
  });
}
const context = { params: Promise.resolve({ id: 'member-1' }) };
test('Profile edits reject anonymous callers, another member, and privilege changes', async () => {
  const unexpected = () => { throw Error('Should not write to database'); };
  assert.equal((await profileRoute(null, unexpected).PATCH({}, context)).status, 401);
  assert.equal((await profileRoute({ sub: 'member-2', role: 'member' }, unexpected).PATCH({}, context)).status, 403);
  assert.equal((await profileRoute({ sub: 'member-1', role: 'member' }, unexpected).PATCH({ json: async () => ({ role: 'admin' }) }, context)).status, 403);
});
test('A member can save normalized links, clear an existing link, and receives invalid-link errors', async () => {
  let saved;
  const route = profileRoute({ sub: 'member-1', role: 'member' }, async (filter, update) => {
    assert.equal(filter.id, 'member-1'); saved = update.$set;
    return { id: 'member-1', ...saved };
  });
  const result = await route.PATCH({ json: async () => ({ linkedinUrl: 'linkedin.com/in/test', instagramUrl: '' }) }, context);
  assert.equal(result.status, 200);
  assert.equal(saved.linkedinUrl, 'https://linkedin.com/in/test');
  assert.equal(saved.instagramUrl, '');
  assert.equal((await route.PATCH({ json: async () => ({ facebookUrl: 'https://evil.test/test' }) }, context)).status, 400);
});
test('Approval copies applicant social links into a new account and preserves edits on repeat approval', async () => {
  const profiles = { linkedinUrl: 'https://linkedin.com/in/test', instagramUrl: 'https://instagram.com/test', facebookUrl: 'https://facebook.com/test' };
  for (const existing of [null, { id: 'member-1', role: 'member', linkedinUrl: 'https://linkedin.com/in/newer', instagramUrl: '' }]) {
    let saved;
    const users = {
      findOne: async () => existing,
      insertOne: async (user) => { saved = user; },
      findOneAndUpdate: async (_filter, update) => { saved = { ...existing, ...update.$set }; return saved; },
    };
    const { activateMember } = load('lib/server/membership-activation.ts', {
      nanoid: { nanoid: () => 'member-1' },
      '@/lib/server/collections': { getCollection: async (name) => name === 'users' ? users : { updateOne: async () => {} }, serializeDocument: (value) => value },
      '@/lib/server/auth': { upsertCredential: async () => {} },
    });
    await activateMember({ id: 'app-1', fullName: 'Test Person', email: 'test@example.com', ...profiles }, 'ECP-TEST-1');
    assert.equal(saved.facebookUrl, profiles.facebookUrl);
    assert.equal(saved.linkedinUrl, existing?.linkedinUrl ?? profiles.linkedinUrl);
    assert.equal(saved.instagramUrl, existing ? '' : profiles.instagramUrl);
  }
});
test('Public officer endpoint projects social links only, without contact details', async () => {
  let projection;
  const { GET } = load('app/api/members/social-links/route.ts', {
    'next/server': { NextResponse: { json: (body, init = {}) => ({ body, status: init.status ?? 200 }) } },
    '@/lib/server/collections': { getCollection: async () => ({ find: (filter) => {
      assert.equal(filter.status, 'active');
      assert.ok(filter.office.$in.includes('exco'));
      return { project: (fields) => { projection = fields; return { toArray: async () => [{ id: 'ecp-test', linkedinUrl: 'linkedin.com/in/test' }] }; } };
    } }) },
  });
  const result = await GET();
  assert.equal(result.body.data['ecp-test'].linkedinUrl, 'https://linkedin.com/in/test');
  assert.deepEqual(Object.keys(projection).sort(), ['_id', 'facebookUrl', 'id', 'instagramUrl', 'linkedinUrl']);
});
