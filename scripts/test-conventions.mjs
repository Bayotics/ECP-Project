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
const { DEFAULT_CONVENTIONS, getYouTubeVideoId, validateConventions } = load('lib/content/conventions.ts');
const id = 'pOmHDbl-2eU';
function route(session = { sub: 'admin', role: 'admin' }, initial = null, fail = false) {
  const state = { document: initial, writes: 0 };
  state.api = load('app/api/site-content/conventions/route.ts', {
    'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200, headers: options.headers }) } },
    '@/lib/server/guards': { getRequestSession: async () => session },
    '@/lib/server/collections': {
      ensureCoreIndexes: async () => {},
      getCollection: async () => ({
        findOne: async filter => { assert.equal(filter.id, 'conventions'); return state.document; },
        updateOne: async (filter, update, options) => { if (fail) throw Error('Mock database unavailable'); assert.equal(filter.id, 'conventions'); assert.equal(options.upsert, true); state.document = update.$set; state.writes++; },
      }),
    },
  });
  return state;
}
const request = conventions => ({ json: async () => ({ conventions }) });

test('YouTube IDs and standard link formats normalize to one safe video ID', () => {
  for (const value of [id, ` https://youtu.be/${id}?si=tracking `, `https://www.youtube.com/watch?feature=shared&v=${id}&t=10`, `https://m.youtube.com/watch?v=${id}`, `https://www.youtube.com/embed/${id}`, `https://youtube.com/shorts/${id}`, `https://youtube.com/live/${id}`, `https://www.youtube-nocookie.com/embed/${id}`]) assert.equal(getYouTubeVideoId(value), id);
  for (const value of ['', 'abc', `${id}extra`, 'javascript:alert(1)', `https://youtube.com.evil.example/watch?v=${id}`, `https://evil.example/?v=${id}`, `https://user@youtube.com/watch?v=${id}`, `https://youtube.com:8080/watch?v=${id}`, `https://youtu.be/${id}/extra`, 'https://youtube.com/playlist?list=PL123', `https://youtube.com/redirect?v=${id}`]) assert.equal(getYouTubeVideoId(value), null, value);
});
test('initial archive contains the eleven distinct source videos without writing seeds', async () => {
  const state = route(null);
  const response = await state.api.GET();
  assert.equal(response.status, 200); assert.equal(response.headers['Cache-Control'], 'no-store');
  assert.deepEqual(response.body.data.conventions, DEFAULT_CONVENTIONS);
  assert.equal(DEFAULT_CONVENTIONS.flatMap(item => item.videos).length, 11);
  assert.ok('conventions' in validateConventions(DEFAULT_CONVENTIONS)); assert.equal(state.writes, 0);
});
test('anonymous, member and applicant sessions cannot save convention content', async () => {
  for (const session of [null, { sub: 'member', role: 'member' }, { sub: 'applicant', role: 'applicant' }]) {
    const state = route(session); assert.equal((await state.api.PUT(request(DEFAULT_CONVENTIONS))).status, 403); assert.equal(state.writes, 0);
  }
});
test('administrators can reorder, edit and remove videos, with canonical links and public readback', async () => {
  for (const role of ['admin', 'super-admin']) {
    const state = route({ sub: 'qa-admin', role });
    const conventions = structuredClone(DEFAULT_CONVENTIONS).reverse();
    conventions[0].videos = [{ videoId: `https://youtu.be/${id}?si=tracking`, title: ' Updated keynote ' }];
    conventions.pop();
    const response = await state.api.PUT(request(conventions));
    assert.equal(response.status, 200); assert.equal(state.writes, 1);
    assert.equal(state.document.updatedBy, 'qa-admin'); assert.ok(state.document.updatedAt);
    const result = (await state.api.GET()).body.data;
    assert.equal(result.conventions.length, 1); assert.equal(result.conventions[0].id, 'dallas-2007');
    assert.deepEqual(result.conventions[0].videos, [{ videoId: id, title: 'Updated keynote' }]);
    assert.equal(result.updatedBy, undefined); assert.equal(result.id, undefined);
  }
});
test('saving an empty list suppresses defaults rather than resurrecting deleted conventions', async () => {
  const state = route(); assert.equal((await state.api.PUT(request([]))).status, 200);
  assert.deepEqual((await state.api.GET()).body.data.conventions, []);
});
test('invalid fields, duplicate IDs and duplicate videos are rejected without writes', async () => {
  const invalid = [null, {}, [null], Array(31).fill(DEFAULT_CONVENTIONS[0])];
  for (const patch of [{ title: '' }, { title: 'x'.repeat(201) }, { year: 2026.5 }, { year: 2101 }, { location: '' }, { id: '../unsafe' }, { videos: [] }, { videos: [null] }, { videos: [{ videoId: 'javascript:alert(1)', title: 'Malicious' }] }, { videos: [{ videoId: id, title: '' }] }]) invalid.push([{ ...DEFAULT_CONVENTIONS[0], ...patch }]);
  invalid.push([DEFAULT_CONVENTIONS[0], DEFAULT_CONVENTIONS[0]]);
  invalid.push([DEFAULT_CONVENTIONS[0], { ...DEFAULT_CONVENTIONS[0], id: 'different-convention' }]);
  for (const value of invalid) {
    const state = route(); assert.equal((await state.api.PUT(request(value))).status, 400); assert.equal(state.writes, 0);
  }
});
test('malformed JSON and database failures return actionable errors without replacing saved data', async () => {
  const state = route(); assert.equal((await state.api.PUT({ json: async () => { throw Error('Invalid JSON'); } })).status, 400);
  const original = { id: 'conventions', conventions: DEFAULT_CONVENTIONS };
  const failing = route({ sub: 'admin', role: 'admin' }, original, true);
  const response = await failing.api.PUT(request([]));
  assert.equal(response.status, 500); assert.match(response.body.error, /changes have been kept/);
  assert.equal(failing.document, original); assert.equal(failing.writes, 0);
});
