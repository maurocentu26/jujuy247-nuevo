import test from 'node:test';
import assert from 'node:assert/strict';
import { coverRect, exportBlockReason, FLYER, flyerFileName, isLowResolution, layoutText, textBlockTop, wrapText } from '../lib/flyer/layout.mjs';

// Ancho simulado de 0,53 em por carácter: en la referencia, 27 caracteres a 60 px ocupan unos 868 px.
const measure = (text, font) => text.length * Number(/(\d+)px/.exec(font)[1]) * 0.53;

test('text wraps by words and never drops content', () => {
  const lines = wrapText('La Renga y el emotivo homenaje', 200, text => text.length * 20);
  assert.deepEqual(lines, ['La Renga y', 'el emotivo', 'homenaje']);
  assert.deepEqual(wrapText('   ', 200, () => 0), []);
});

test('a short title keeps the size of the reference', () => {
  const layout = layoutText({ title: 'La Renga y el emotivo homenaje al "Indio" Solari.' }, measure);
  assert.equal(layout.titleSize, 60);
  assert.equal(layout.titleLines.length, 2);
  assert.equal(layout.titleOverflow, false);
});

test('titles do not end with a single orphan word', () => {
  const { titleLines } = layoutText({ title: 'Gimnasia de Jujuy sumó tres puntos clave como local' }, measure);
  assert.ok(titleLines.length >= 2);
  assert.ok(titleLines.at(-1).includes(' '));
  assert.equal(titleLines.join(' '), 'Gimnasia de Jujuy sumó tres puntos clave como local');
});

test('longer titles shrink before overflowing', () => {
  const layout = layoutText({ title: 'palabra '.repeat(15) }, measure);
  assert.ok(layout.titleSize < 60);
  assert.ok(layout.titleLines.length <= 4);
  assert.equal(layout.titleOverflow, false);
});

test('titles that do not fit at the minimum size are reported', () => {
  const layout = layoutText({ title: 'palabra '.repeat(40) }, measure);
  assert.equal(layout.titleSize, 44);
  assert.equal(layout.titleOverflow, true);
});

test('a single word wider than the flyer is reported', () => {
  assert.equal(layoutText({ title: 'x'.repeat(60) }, measure).titleOverflow, true);
});

test('the excerpt is optional and limited to two lines', () => {
  assert.deepEqual(layoutText({ title: 'Título', excerpt: '  ' }, measure).excerptLines, []);
  assert.equal(layoutText({ title: 'Título', excerpt: 'palabra '.repeat(40) }, measure).excerptOverflow, true);
});

test('the photo always covers the flyer and offsets are clamped', () => {
  const landscape = coverRect(2000, 1000);
  assert.equal(landscape.height, FLYER.height);
  assert.equal(landscape.y, 0);

  const moved = coverRect(2000, 1000, { x: 99999, y: 99999 });
  assert.equal(moved.x, 0);
  assert.equal(moved.y, 0);

  const zoomed = coverRect(1080, 1350, { zoom: 2, x: -99999, y: -99999 });
  assert.equal(zoomed.x + zoomed.width, FLYER.width);
  assert.equal(zoomed.y + zoomed.height, FLYER.height);
});

test('low resolution is flagged only when enlargement becomes visible', () => {
  assert.equal(isLowResolution(coverRect(2160, 2700)), false);
  assert.equal(isLowResolution(coverRect(1200, 800)), false);
  assert.equal(isLowResolution(coverRect(800, 600)), true);
  assert.equal(isLowResolution(coverRect(1080, 1350, { zoom: 2 })), true);
});

test('the text block grows upward from its base', () => {
  const short = layoutText({ title: 'Título breve' }, measure);
  const long = layoutText({ title: 'palabra '.repeat(15), excerpt: 'Una bajada corta' }, measure);
  assert.equal(textBlockTop(short, 1110), 1110 - 72);
  assert.ok(textBlockTop(long, 1110) < textBlockTop(short, 1110));
});

test('export reasons appear in the order the editor can fix them', () => {
  const ok = { titleOverflow: false, excerptOverflow: false };
  assert.match(exportBlockReason({ hasArticle: false }), /Elegí/);
  assert.match(exportBlockReason({ hasArticle: true, hasPhoto: true, title: ' ', layout: ok }), /título/);
  assert.match(exportBlockReason({ hasArticle: true, hasPhoto: false, title: 'T', layout: ok }), /foto/);
  assert.match(exportBlockReason({ hasArticle: true, hasPhoto: true, title: 'T', layout: { ...ok, titleOverflow: true } }), /Acortá el título/);
  assert.match(exportBlockReason({ hasArticle: true, hasPhoto: true, title: 'T', layout: { ...ok, excerptOverflow: true } }), /bajada/);
  assert.equal(exportBlockReason({ hasArticle: true, hasPhoto: true, title: 'T', layout: ok }), '');
});

test('file names are safe and identify the format', () => {
  assert.equal(flyerFileName('La Renga: homenaje ñandú', 'png'), 'jujuy247-la-renga-homenaje-nandu-4x5.png');
  assert.equal(flyerFileName('', 'webp'), 'jujuy247-noticia-4x5.webp');
});
