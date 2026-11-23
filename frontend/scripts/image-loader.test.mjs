import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  directusTransformParams,
  extractDirectusAssetId,
  MEDIA_WIDTHS,
  mediaAssetUrl,
  pickMediaWidth,
} from '../lib/media-url.mjs';
import imageLoader from '../lib/image-loader.js';

const SAMPLE_UUID = '8044d2a1-9a8d-420d-98ab-42c953724916';

test('pickMediaWidth rounds up to fixed cacheable buckets', () => {
  assert.deepEqual(MEDIA_WIDTHS, [64, 400, 800, 1200]);
  assert.equal(pickMediaWidth(1), 64);
  assert.equal(pickMediaWidth(64), 64);
  assert.equal(pickMediaWidth(65), 400);
  assert.equal(pickMediaWidth(360), 400);
  assert.equal(pickMediaWidth(400), 400);
  assert.equal(pickMediaWidth(401), 800);
  assert.equal(pickMediaWidth(780), 800);
  assert.equal(pickMediaWidth(800), 800);
  assert.equal(pickMediaWidth(801), 1200);
  assert.equal(pickMediaWidth(1200), 1200);
  assert.equal(pickMediaWidth(3840), 1200);
  assert.equal(pickMediaWidth(0), 400);
  assert.equal(pickMediaWidth(-10), 400);
  assert.equal(pickMediaWidth(Number.NaN), 1200);
});

test('extractDirectusAssetId accepts valid Directus assets and rejects unsafe or foreign URLs', () => {
  const origin = new URL(process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055').origin;

  assert.equal(extractDirectusAssetId(SAMPLE_UUID), SAMPLE_UUID);
  assert.equal(extractDirectusAssetId(`/assets/${SAMPLE_UUID}`), SAMPLE_UUID);
  assert.equal(extractDirectusAssetId(`${origin}/assets/${SAMPLE_UUID}`), SAMPLE_UUID);
  assert.equal(extractDirectusAssetId(`${origin}/assets/${SAMPLE_UUID}?width=800`), SAMPLE_UUID);

  assert.equal(extractDirectusAssetId(`https://example.com/assets/${SAMPLE_UUID}`), null);
  assert.equal(extractDirectusAssetId(`http://169.254.169.254/assets/${SAMPLE_UUID}`), null);
  assert.equal(extractDirectusAssetId(`${origin.replace('://', '://user:pass@')}/assets/${SAMPLE_UUID}`), null);
  assert.equal(extractDirectusAssetId(`${origin}/server/info`), null);
  assert.equal(extractDirectusAssetId(`//evil.com/assets/${SAMPLE_UUID}`), null);
  assert.equal(extractDirectusAssetId('not-a-uuid'), null);
  assert.equal(extractDirectusAssetId(''), null);
});

test('imageLoader routes Directus assets to /api/media buckets and leaves local static assets intact', () => {
  const origin = new URL(process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055').origin;

  assert.equal(imageLoader({ src: '/logo3.png', width: 828 }), '/logo3.png');
  assert.equal(imageLoader({ src: '/seo-imgs/share-img.jpeg', width: 1200 }), '/seo-imgs/share-img.jpeg');

  const cases = [
    [64, `/api/media/${SAMPLE_UUID}?w=64`],
    [360, `/api/media/${SAMPLE_UUID}?w=400`],
    [780, `/api/media/${SAMPLE_UUID}?w=800`],
    [1920, `/api/media/${SAMPLE_UUID}?w=1200`],
  ];

  for (const [width, expected] of cases) {
    const out = imageLoader({ src: `${origin}/assets/${SAMPLE_UUID}`, width });
    assert.equal(out, expected);
    assert.equal(out.includes('/_next/image'), false);
  }

  assert.equal(
    imageLoader({ src: 'https://cdn.example.com/external.jpg', width: 800 }),
    'https://cdn.example.com/external.jpg',
  );
  assert.equal(imageLoader({ src: '', width: 400 }), '');
});

test('directusTransformParams enforces the strict width bucket whitelist', () => {
  assert.equal(
    directusTransformParams(64),
    'width=64&quality=60&format=webp&withoutEnlargement=true',
  );
  assert.equal(
    directusTransformParams(400),
    'width=400&quality=80&format=webp&withoutEnlargement=true',
  );
  assert.equal(
    directusTransformParams(800),
    'width=800&quality=80&format=webp&withoutEnlargement=true',
  );
  assert.equal(
    directusTransformParams(1200),
    'width=1200&quality=80&format=webp&withoutEnlargement=true',
  );

  for (const invalid of [32, 384, 720, 999, 0, -1, Number.NaN, 800.5]) {
    assert.equal(directusTransformParams(invalid), null);
  }
});

test('mediaAssetUrl generates /api/media URLs for Directus IDs and preserves safe fallbacks', () => {
  const origin = new URL(process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055').origin;
  assert.equal(mediaAssetUrl(SAMPLE_UUID, 360), `/api/media/${SAMPLE_UUID}?w=400`);
  assert.equal(mediaAssetUrl(`${origin}/assets/${SAMPLE_UUID}`, 1800), `/api/media/${SAMPLE_UUID}?w=1200`);
  assert.equal(mediaAssetUrl('', 800), '');
  assert.equal(mediaAssetUrl(null, 800), '');
});

test('ArticleCover only renders the blurred backdrop when the photo does not fill both frames', () => {
  const source = readFileSync(new URL('../app/components/article/ArticleCover.js', import.meta.url), 'utf8');
  assert.match(source, /const\s+needsBackdrop\s*=\s*!\(frame\.fillsDesktop\s*&&\s*frame\.fillsMobile\)/);
  assert.match(source, /\{needsBackdrop\s*\?\s*\(/);
});
