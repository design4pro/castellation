import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generatePortrait } from '../src/portrait.js';

test('generates an illustration from the given description and stores its bytes', async () => {
  let request, stored;
  const ai = { async run(model, input) { request = { model, input }; return { image: btoa('portrait') }; } };
  const media = { async put(key, bytes, options) { stored = { key, bytes: new TextDecoder().decode(bytes), options }; } };
  const result = await generatePortrait(ai, media, { key:'portraits/test.jpg', description:'A young girl with dark hair' });
  assert.match(request.input.prompt, /A young girl with dark hair/);
  assert.equal(stored.bytes, 'portrait');
  assert.equal(stored.options.httpMetadata.contentType, 'image/jpeg');
  assert.equal(result.key, 'portraits/test.jpg');
});

test('requires a source description', async () => {
  await assert.rejects(() => generatePortrait({}, {}, {key:'x',description:' '}), /description/);
});
