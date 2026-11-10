import test from 'node:test';
import assert from 'node:assert/strict';
import { galleryBlock, parseGallery } from '../lib/article-gallery.mjs';
import { fromArgentinaInputValue, toArgentinaInputValue, validatePublishedAtInput } from '../lib/datetime.js';
import { articleDescription } from '../lib/site.js';

const A = 'https://cms.example.com/assets/8044d2a1-9a8d-420d-98ab-42c953724916';
const B = 'https://cms.example.com/assets/1111d2a1-9a8d-420d-98ab-42c953724916';

test('a gallery block round-trips and keeps captions', () => {
  const block = galleryBlock([{ src: A, caption: 'Desfile [central]' }, { src: B, caption: '' }]);
  assert.ok(block.startsWith('```galeria\n') && block.endsWith('\n```'));
  const inner = block.split('\n').slice(1, -1).join('\n');
  assert.deepEqual(parseGallery(inner), [
    { src: A, caption: 'Desfile central' },
    { src: B, caption: '' },
  ]);
});

test('gallery lines accept a title as caption and skip unsafe or malformed lines', () => {
  const images = parseGallery([
    `![](${A} "Epígrafe por título")`,
    '![x](javascript:alert(1))',
    'texto suelto',
    `  ![Con espacios](${B})  `,
  ].join('\r\n'));
  assert.deepEqual(images, [
    { src: A, caption: 'Epígrafe por título' },
    { src: B, caption: 'Con espacios' },
  ]);
});

test('publication dates are edited in Argentina time and stored in UTC', () => {
  assert.equal(fromArgentinaInputValue('2026-11-10T14:30'), '2026-11-10T17:30:00.000Z');
  assert.equal(toArgentinaInputValue('2026-11-10T17:30:00.000Z'), '2026-11-10T14:30');
  assert.equal(toArgentinaInputValue('2026-11-10T00:05:00Z'), '2026-11-09T21:05');
  assert.equal(toArgentinaInputValue(null), '');
  assert.equal(fromArgentinaInputValue(''), null);
  assert.equal(fromArgentinaInputValue('10/11/2026'), null);
});

test('the API rejects future or invalid publication dates and leaves the field alone when absent', () => {
  const now = Date.parse('2026-11-10T17:30:00Z');
  assert.deepEqual(validatePublishedAtInput(undefined, now), { value: undefined });
  assert.deepEqual(validatePublishedAtInput(null, now), { value: null });
  assert.deepEqual(validatePublishedAtInput('2026-11-01T12:00:00Z', now), { value: '2026-11-01T12:00:00.000Z' });
  assert.ok(validatePublishedAtInput('2026-11-11T12:00:00Z', now).error);
  assert.ok(validatePublishedAtInput('mañana', now).error);
  assert.ok(validatePublishedAtInput(12345, now).error);
});

test('descriptions skip gallery blocks', () => {
  const content = `Primer párrafo de la nota.\n\n\`\`\`galeria\n![Foto](${A})\n\`\`\`\n\nCierre.`;
  assert.equal(articleDescription({ content }), 'Primer párrafo de la nota. Cierre.');
});
