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
const content = load('lib/content/what-we-do.ts');
const defaults = content.DEFAULT_WHAT_WE_DO;
function route(session = { sub: 'admin', role: 'admin' }, initial = null, fail = false) {
  const state = { document: initial, writes: 0, reads: 0 };
  state.api = load('app/api/site-content/what-we-do/route.ts', {
    'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200, headers: options.headers }) } },
    '@/lib/server/guards': { getRequestSession: async () => session },
    '@/lib/server/collections': {
      ensureCoreIndexes: async () => {},
      getCollection: async () => ({
        findOne: async () => { state.reads++; return state.document; },
        updateOne: async (filter, update, options) => { if (fail) throw Error('Mock database unavailable'); assert.equal(options.upsert, true); assert.equal(filter.id, 'what-we-do'); state.document = update.$set; state.writes++; },
      }),
    },
  });
  return state;
}
const request = slides => ({ json: async () => ({ slides }) });

test('public content starts with all four current slides without writing seed records', async () => {
  const state = route(null);
  const response = await state.api.GET();
  assert.equal(response.status, 200); assert.equal(response.headers['Cache-Control'], 'no-store');
  assert.deepEqual(response.body.data.slides, defaults); assert.equal(state.writes, 0);
});
test('anonymous and member sessions cannot change homepage content', async () => {
  for (const session of [null, { sub: 'member', role: 'member' }]) {
    const state = route(session);
    assert.equal((await state.api.PUT(request(defaults))).status, 403);
    assert.equal(state.writes, 0);
  }
});
test('an administrator saves all slide content atomically and the public endpoint reads it back', async () => {
  const state = route();
  const slides = defaults.map(slide => ({ ...slide, description: `Updated ${slide.title}`, imageUrl: `https://res.cloudinary.com/club/image/upload/${slide.id}.jpg`, imageAlt: `${slide.title} volunteers`, href: 'https://untrusted.example', title: 'Overridden' }));
  const saved = await state.api.PUT(request(slides));
  assert.equal(saved.status, 200); assert.equal(state.writes, 1);
  assert.equal(state.document.updatedBy, 'admin'); assert.ok(state.document.updatedAt);
  assert.equal(state.document.slides[0].href, undefined);
  const result = await state.api.GET();
  assert.equal(result.body.data.slides[0].description, 'Updated Programs');
  assert.equal(result.body.data.slides[0].imageUrl, slides[0].imageUrl);
  assert.equal(result.body.data.slides[0].href, '/programs');
  assert.equal(result.body.data.slides[0].title, 'Programs');
  assert.equal(result.body.data.updatedBy, undefined);
});
test('invalid image addresses and descriptions are rejected before any write', async () => {
  const badImages = ['', 'javascript:alert(1)', '//evil.example/pic.jpg', 'https://evil.example/pic.jpg', '/gallery/../private/image.jpg', '/gallery/%2e%2e/private/image.jpg', 'http://res.cloudinary.com/a.jpg', 'https://user@res.cloudinary.com/a.jpg'];
  for (const imageUrl of badImages) {
    const state = route(); const slides = structuredClone(defaults); slides[0].imageUrl = imageUrl;
    assert.equal((await state.api.PUT(request(slides))).status, 400); assert.equal(state.writes, 0);
  }
  for (const patch of [{ description: '' }, { description: 'x'.repeat(601) }, { imageAlt: '' }, { imageAlt: 'x'.repeat(201) }]) {
    const state = route(); const slides = structuredClone(defaults); Object.assign(slides[0], patch);
    assert.equal((await state.api.PUT(request(slides))).status, 400); assert.equal(state.writes, 0);
  }
});
test('partial lists and duplicated pillars cannot discard other slides', async () => {
  for (const slides of [[], defaults.slice(0, 3), [...defaults.slice(0, 3), defaults[0]]]) {
    const state = route(); assert.equal((await state.api.PUT(request(slides))).status, 400); assert.equal(state.writes, 0);
  }
});
test('failed persistence returns an error without replacing saved content', async () => {
  const original = { id: 'what-we-do', slides: defaults };
  const state = route({ sub: 'admin', role: 'super-admin' }, original, true);
  const response = await state.api.PUT(request(defaults));
  assert.equal(response.status, 500); assert.match(response.body.error, /changes have been kept/);
  assert.equal(state.document, original); assert.equal(state.writes, 0);
});
