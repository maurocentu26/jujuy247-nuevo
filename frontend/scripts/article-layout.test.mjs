import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  coverFrame,
  createStoryPicker,
  focalPosition,
  readingMinutes,
  splitMarkdownAfterParagraph,
} from '../lib/article-layout.mjs';

test('cover frames keep portrait and square photos whole instead of cropping them', () => {
  const portrait = coverFrame({ width: 720, height: 900 });
  assert.equal(portrait.orientation, 'portrait');
  assert.equal(portrait.desktopRatio, 1.5);
  assert.equal(portrait.fillsDesktop, false);
  assert.equal(portrait.mobileRatio, 0.8);
  assert.equal(portrait.fillsMobile, true);

  const square = coverFrame({ width: 1254, height: 1254 });
  assert.equal(square.orientation, 'square');
  assert.equal(square.desktopRatio, 1.5);
  assert.equal(square.mobileRatio, 1);

  const landscape = coverFrame({ width: 1600, height: 1069 });
  assert.equal(landscape.fillsDesktop, true);
  assert.equal(landscape.fillsMobile, true);

  const unknown = coverFrame(null);
  assert.equal(unknown.ratio, null);
  assert.equal(unknown.desktopRatio, 1.778);
});

test('the cover is never cropped by CSS on any screen', () => {
  const css = readFileSync(new URL('../app/noticias/[slug]/article.css', import.meta.url), 'utf8');
  assert.match(css, /\.article-cover-photo\s*\{[^}]*object-fit:contain/);
  assert.doesNotMatch(css, /\.article-cover-photo\s*\{[^}]*object-fit:cover/);
});

test('focal points from Directus become object-position percentages', () => {
  assert.equal(focalPosition({ width: 1000, height: 500, focal_point_x: 250, focal_point_y: 100 }), '25% 20%');
  assert.equal(focalPosition({ width: 1000, height: 500, focal_point_x: null, focal_point_y: null }), '50% 30%');
  assert.equal(focalPosition({ width: 1000, height: 500, focal_point_x: 5000, focal_point_y: -3 }), '100% 0%');
  assert.equal(focalPosition('some-id', 'center'), 'center');
});

test('markdown splits after the third paragraph but never inside a gallery fence', () => {
  const body = ['Uno.', 'Dos.', '```galeria\n![](a)\n\n![](b)\n```', 'Tres.', 'Cuatro.', 'Cinco.', 'Seis.'].join('\n\n');
  const [before, after] = splitMarkdownAfterParagraph(body, 3);
  assert.equal(before, ['Uno.', 'Dos.', '```galeria\n![](a)\n\n![](b)\n```', 'Tres.'].join('\n\n'));
  assert.equal(after, ['Cuatro.', 'Cinco.', 'Seis.'].join('\n\n'));
});

test('short notes and splits before headings or lists stay whole', () => {
  assert.deepEqual(splitMarkdownAfterParagraph('Uno.\n\nDos.', 3), ['Uno.\n\nDos.', '']);
  const body = ['Uno.', 'Dos.', 'Tres.', '## Título', 'Cuatro.', 'Cinco.', 'Seis.'].join('\n\n');
  const [before, after] = splitMarkdownAfterParagraph(body, 3);
  assert.ok(after.startsWith('Cinco.'), 'skips the heading boundary');
  assert.ok(before.endsWith('Cuatro.'));
});

test('the story picker never repeats an article across page blocks', () => {
  const pick = createStoryPicker([1]);
  const pool = [{ id: 1, slug: 'a' }, { id: 2, slug: 'b' }, { id: 3, slug: 'c' }, { id: 4 }];
  assert.deepEqual(pick(pool, 1).map((a) => a.id), [2]);
  assert.deepEqual(pick(pool, 5).map((a) => a.id), [3]);
});

test('reading time ignores galleries and links', () => {
  const words = Array.from({ length: 440 }, () => 'palabra').join(' ');
  assert.equal(readingMinutes(`${words}\n\n\`\`\`galeria\n![](x)\n\`\`\``), 2);
  assert.equal(readingMinutes(''), 0);
});
