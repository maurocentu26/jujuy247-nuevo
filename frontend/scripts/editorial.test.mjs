import test from 'node:test';
import assert from 'node:assert/strict';
import { channelPlaylist, headerScrollState } from '../lib/editorial.js';

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
