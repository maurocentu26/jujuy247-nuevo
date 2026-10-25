import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { channelPlaylist, headerScrollState } from '../lib/editorial.js';

test('latest news uses two tablet columns while retaining desktop and mobile layouts', () => {
  const css = readFileSync(new URL('../app/redesign.css', import.meta.url), 'utf8');
  const tablet = css.split('@media(max-width:1000px)')[1].split('@media(max-width:700px)')[0];
  const mobile = css.split('@media(max-width:700px)')[1];
  assert.match(tablet, /\.redesign-latest>div\s*\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(tablet, /\.redesign-latest article\+article\s*\{[^}]*border-left:0;[^}]*padding-left:0;/);
  assert.match(css, /grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(mobile, /\.redesign-latest>div\s*\{[^}]*grid-template-columns:1fr;/);
});

test('header hides down, reveals up, and returns full at the top', () => {
  assert.deepEqual(headerScrollState(180, 0, false), { compact: true, hidden: true, previousY: 180 });
  assert.deepEqual(headerScrollState(160, 180, true), { compact: true, hidden: false, previousY: 160 });
  assert.deepEqual(headerScrollState(0, 160, true), { compact: false, hidden: false, previousY: 0 });
});

test('small scroll increments accumulate instead of preventing reveal', () => {
  let state = { previousY: 200, hidden: true };
  for (const y of [198, 196, 194]) state = headerScrollState(y, state.previousY, state.hidden);
  assert.equal(state.hidden, false);
  assert.equal(state.previousY, 194);
});

test('video playlist promotes live, deduplicates, rejects invalid IDs and caps the list', () => {
  const live = { id: '0eVtaxsGHGI', title: 'En vivo' };
  const videos = [null, live, { id: 'bad' }, ...['KhXQb4AbmoA', 'EpZJjkjeHrY', 'abcdefghijk', '12345678901'].map(id => ({ id }))];
  assert.deepEqual(channelPlaylist(videos, live).map(v => v.id), ['0eVtaxsGHGI', 'KhXQb4AbmoA', 'EpZJjkjeHrY', 'abcdefghijk']);
  assert.deepEqual(channelPlaylist(), []);
});
