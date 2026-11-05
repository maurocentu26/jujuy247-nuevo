import test from 'node:test';
import assert from 'node:assert/strict';
import { coverFileId, editorialViewFilter, formatArticleWhen, startOfTodayIso } from '../lib/panel-views.mjs';

const now = new Date('2026-11-05T02:30:00Z'); // 4 de noviembre, 23:30 en Jujuy

test('today starts at midnight in Jujuy, not in UTC', () => {
  assert.equal(startOfTodayIso(now), '2026-11-04T03:00:00.000Z');
});

test('editorial views translate to server filters', () => {
  assert.equal(editorialViewFilter('all', now), null);
  assert.deepEqual(editorialViewFilter('drafts', now), { status: { _eq: 'draft' } });
  assert.deepEqual(editorialViewFilter('missing-cover', now), { cover_image: { _null: true } });
  assert.deepEqual(editorialViewFilter('frontpage', now), {
    _and: [{ status: { _eq: 'published' } }, { front_page: { _eq: true } }],
  });
  assert.deepEqual(editorialViewFilter('today', now), {
    _and: [{ status: { _eq: 'published' } }, { published_at: { _gte: '2026-11-04T03:00:00.000Z' } }],
  });
});

test('article dates read as today, yesterday or a full date in Jujuy time', () => {
  assert.equal(formatArticleWhen('2026-11-04T14:40:00Z', now), 'Hoy, 11:40');
  assert.equal(formatArticleWhen('2026-11-03T22:05:00Z', now), 'Ayer, 19:05');
  assert.match(formatArticleWhen('2026-10-01T15:00:00Z', now), /2026/);
  assert.equal(formatArticleWhen(null, now), 'Sin publicar');
  assert.equal(formatArticleWhen('no-es-fecha', now), 'Sin publicar');
});

test('cover ids are read from strings and expanded files', () => {
  assert.equal(coverFileId('abc'), 'abc');
  assert.equal(coverFileId({ id: 'abc' }), 'abc');
  assert.equal(coverFileId(null), null);
});
