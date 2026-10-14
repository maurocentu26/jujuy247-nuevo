import test from 'node:test';
import assert from 'node:assert/strict';
import { articleDescription, articleUrl, categoryUrl, getSiteUrl, serializeJsonLd } from '../lib/site.js';
import { getCanonicalUrlForArticle, getSitemapArticles } from '../lib/directus.js';
import { parsePublishedAt } from '../lib/datetime.js';
import { allowedImageUrl } from '../lib/image-proxy.js';

test('image proxy accepts only configured Directus assets, with no credentials or arbitrary routes', () => {
  const origin = new URL(process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055').origin;
  const asset = '/assets/8044d2a1-9a8d-420d-98ab-42c953724916';
  assert.equal(allowedImageUrl(`${origin}${asset}`).href, `${origin}${asset}`);
  assert.equal(allowedImageUrl(`https://example.com${asset}`), null);
  assert.equal(allowedImageUrl('http://169.254.169.254/latest/meta-data/'), null);
  assert.equal(allowedImageUrl(`${origin}/server/info`), null);
  assert.equal(allowedImageUrl(`${origin}${asset}?redirect=https://example.com`), null);
  assert.equal(allowedImageUrl(`${origin.replace('://', '://user:pass@')}${asset}`), null);
});

test('URLs encode slugs and pagination has its own URL', () => {
  assert.equal(articleUrl('noticia con ñ'), `${getSiteUrl()}/noticias/noticia%20con%20%C3%B1`);
  assert.equal(categoryUrl('cultura', 2), `${getSiteUrl()}/categoria/cultura?page=2`);
  assert.equal(categoryUrl('cultura', 1), `${getSiteUrl()}/categoria/cultura`);
});

test('invalid canonical overrides fall back; valid editorial overrides survive', () => {
  assert.equal(getCanonicalUrlForArticle({ slug: 'nota', seo_canonical_url: 'javascript:alert(1)' }), articleUrl('nota'));
  assert.equal(getCanonicalUrlForArticle({ slug: 'nota', seo_canonical_url: 'https://example.com/original' }), 'https://example.com/original');
});

test('CMS text cannot terminate a JSON-LD script', () => {
  const value = { headline: '</script><script>alert(1)</script>' };
  const encoded = serializeJsonLd(value);
  assert.equal(encoded.includes('<'), false);
  assert.deepEqual(JSON.parse(encoded), value);
});

test('descriptions have a plain text fallback and dates use Argentina time', () => {
  assert.equal(articleDescription({ content: '## Una **noticia** con [fuente](https://example.com)' }), 'Una noticia con fuente');
  assert.ok(articleDescription({ content: 'Una noticia '.repeat(100) }).length <= 160);
  assert.equal(parsePublishedAt('2026-10-13T11:33:00').toISOString(), '2026-10-13T14:33:00.000Z');
  assert.equal(parsePublishedAt('2026-10-13T11:33:00Z').toISOString(), '2026-10-13T11:33:00.000Z');
  assert.equal(parsePublishedAt('invalid'), null);
});

test('archive discovery continues beyond 100 and handles a lower CMS page limit', async () => {
  const originalFetch = globalThis.fetch;
  const offsets = [];
  const records = Array.from({ length: 205 }, (_, id) => ({ id, slug: `nota-${id}` }));
  globalThis.fetch = async (url) => {
    const offset = Number(new URL(url).searchParams.get('offset'));
    offsets.push(offset);
    return { ok: true, json: async () => ({ data: records.slice(offset, offset + 80) }) };
  };
  try {
    assert.deepEqual(await getSitemapArticles(), records);
    assert.deepEqual(offsets, [0, 80, 160, 205]);
  } finally { globalThis.fetch = originalFetch; }
});

test('a CMS failure rejects sitemap generation instead of publishing an incomplete archive', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 503, statusText: 'Unavailable', text: async () => '' });
  try { await assert.rejects(getSitemapArticles(), /503/); }
  finally { globalThis.fetch = originalFetch; }
});
