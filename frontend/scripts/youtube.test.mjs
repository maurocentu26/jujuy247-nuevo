import test from 'node:test';
import assert from 'node:assert/strict';
import { getLatestChannelVideos, parseYoutubeFeed } from '../lib/youtube.js';

const feed = '<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015"><entry><yt:videoId>abcdefghijk</yt:videoId><title>Jujuy &amp; cultura</title><published>2026-10-14T10:00:00Z</published></entry><entry><yt:videoId>invalid</yt:videoId><title>Invalid</title></entry></feed>';

test('public feed decodes titles and ignores invalid video IDs', () => {
  const videos = parseYoutubeFeed(feed);
  assert.equal(videos.length, 1);
  assert.equal(videos[0].title, 'Jujuy & cultura');
  assert.equal(videos[0].url, 'https://www.youtube.com/watch?v=abcdefghijk');
});

test('public feed works without API credentials', async () => {
  const saved = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.equal(new URL(url).hostname, 'www.youtube.com');
    return { ok: true, text: async () => feed };
  };
  try { assert.equal((await getLatestChannelVideos({ channelId: 'channel' })).length, 1); }
  finally { globalThis.fetch = saved; }
});

test('an API quota failure falls back to the public feed', async () => {
  const saved = globalThis.fetch;
  const hosts = [];
  globalThis.fetch = async (url) => {
    hosts.push(new URL(url).hostname);
    if (hosts.length === 1) return { ok: false, status: 403, json: async () => ({ error: { errors: [{ reason: 'quotaExceeded' }] } }) };
    return { ok: true, text: async () => feed };
  };
  try {
    assert.equal((await getLatestChannelVideos({ apiKey: 'test-key', channelId: 'channel' })).length, 1);
    assert.deepEqual(hosts, ['www.googleapis.com', 'www.youtube.com']);
  } finally { globalThis.fetch = saved; }
});

test('public feed failures report safe status diagnostics and still reject', async () => {
  const savedFetch = globalThis.fetch;
  const savedWarn = console.warn;
  const warnings = [];
  globalThis.fetch = async () => ({ ok: false, status: 503 });
  console.warn = (...args) => warnings.push(args);
  try {
    await assert.rejects(getLatestChannelVideos({ channelId: 'channel' }), /503/);
    assert.deepEqual(warnings, [['YouTube feed unavailable', { status: 503, kind: 'Error' }]]);
  } finally { globalThis.fetch = savedFetch; console.warn = savedWarn; }
});
