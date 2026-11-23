#!/usr/bin/env node

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const baseArg = args.find((arg) => !arg.startsWith('-'));
const baseUrl = (baseArg || process.env.SITE_URL || 'https://www.jujuy247.com.ar').replace(/\/$/, '');

const DIRECT_ASSET_RE = /(?:https?:\/\/[^"'\s)>]+)?\/assets\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:\?[^"'\s)>]*)?/gi;
const NEXT_IMAGE_RE = /\/_next\/image\?[^"'\s>]+/g;
const MEDIA_API_RE = /\/api\/media\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\?[^"'\s)>]*)?/gi;

function decodeEntities(value) {
  return value.replace(/&amp;/g, '&');
}

function stripScriptsAndMeta(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<meta\b[^>]*>/gi, ' ')
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, ' ');
}

function extractFirstInternalPath(html, prefix) {
  const regex = new RegExp(`href=["'](${prefix}[^"'#?]+)["']`, 'i');
  const match = html.match(regex);
  return match ? match[1] : null;
}

function analyzeHtml(html) {
  const nextRefs = [...html.matchAll(NEXT_IMAGE_RE)].map((m) => decodeEntities(m[0]));
  const uniqueNext = [...new Set(nextRefs)];

  const mediaRefs = [...html.matchAll(MEDIA_API_RE)].map((m) => decodeEntities(m[0]));
  const uniqueMedia = [...new Set(mediaRefs)];
  const mediaBuckets = new Set();
  for (const ref of uniqueMedia) {
    try {
      const parsed = new URL(ref, baseUrl);
      mediaBuckets.add(parsed.searchParams.get('w') || '(default)');
    } catch {
      // Ignore malformed relative samples.
    }
  }

  const visibleHtml = stripScriptsAndMeta(html);
  const directAssets = [...visibleHtml.matchAll(DIRECT_ASSET_RE)]
    .map((m) => decodeEntities(m[0]))
    .filter((u) => !/[?&]width=\d+/i.test(u));

  return {
    nextRefsCount: nextRefs.length,
    uniqueNext,
    mediaRefsCount: mediaRefs.length,
    uniqueMedia,
    mediaBuckets: [...mediaBuckets].sort((a, b) => Number(a) - Number(b)),
    unsizedDirectAssets: [...new Set(directAssets)],
  };
}

async function probeImage(sampleUrl) {
  const fullUrl = new URL(sampleUrl, baseUrl).href;
  const started = Date.now();
  try {
    const res = await fetch(fullUrl, {
      headers: { Accept: 'image/webp,image/*,*/*' },
      signal: AbortSignal.timeout(15000),
    });
    const buf = await res.arrayBuffer();
    return {
      url: sampleUrl,
      status: res.status,
      contentType: res.headers.get('content-type') || '',
      bytes: buf.byteLength,
      vercelCache: res.headers.get('x-vercel-cache') || '-',
      cacheControl: res.headers.get('cache-control') || '-',
      ms: Date.now() - started,
    };
  } catch (error) {
    return {
      url: sampleUrl,
      status: 0,
      contentType: error?.name || 'FetchError',
      bytes: 0,
      vercelCache: '-',
      cacheControl: '-',
      ms: Date.now() - started,
    };
  }
}

async function auditPage(label, path) {
  const target = `${baseUrl}${path}`;
  const started = Date.now();
  const res = await fetch(target, { signal: AbortSignal.timeout(20000) });
  const html = await res.text();
  const elapsed = Date.now() - started;
  const stats = analyzeHtml(html);

  console.log(`\n[${label}] ${target} -> HTTP ${res.status} (${elapsed} ms)`);
  console.log(`  /_next/image refs: ${stats.nextRefsCount} (unique: ${stats.uniqueNext.length})`);
  console.log(`  /api/media refs:   ${stats.mediaRefsCount} (unique: ${stats.uniqueMedia.length}) buckets: ${stats.mediaBuckets.join(', ') || 'none'}`);
  console.log(`  Direct /assets without width=: ${stats.unsizedDirectAssets.length}`);
  if (stats.unsizedDirectAssets.length) {
    console.log(`    Sample direct /assets: ${stats.unsizedDirectAssets.slice(0, 3).join(', ')}`);
  }

  return { status: res.status, html, stats };
}

async function main() {
  console.log(`Auditing media requests on ${baseUrl}${strict ? ' (strict mode)' : ''}`);
  let failed = false;

  const home = await auditPage('HOME', '/');
  if (home.status >= 400) failed = true;

  const categoryPath = extractFirstInternalPath(home.html, '/categoria/');
  const articlePath = extractFirstInternalPath(home.html, '/noticias/');

  const pages = [home];
  if (categoryPath) {
    const cat = await auditPage('CATEGORY', categoryPath);
    if (cat.status >= 400) failed = true;
    pages.push(cat);
  } else {
    console.log('\n[CATEGORY] No /categoria/ link found in Home HTML');
  }

  if (articlePath) {
    const art = await auditPage('ARTICLE', articlePath);
    if (art.status >= 400) failed = true;
    pages.push(art);
  } else {
    console.log('\n[ARTICLE] No /noticias/ link found in Home HTML');
  }

  const allNext = [...new Set(pages.flatMap((p) => p.stats.uniqueNext))];
  const allMedia = [...new Set(pages.flatMap((p) => p.stats.uniqueMedia))];
  const totalNextRefs = pages.reduce((sum, p) => sum + p.stats.nextRefsCount, 0);

  if (totalNextRefs > 0) {
    console.log(`\nWARNING: Detected ${totalNextRefs} /_next/image references.`);
    if (strict) failed = true;
  }

  const samples = [
    ...allMedia.slice(0, 2),
    ...allNext.slice(0, 2),
  ];

  if (samples.length) {
    console.log('\n[IMAGE PROBES]');
    for (const sample of samples) {
      const result = await probeImage(sample);
      console.log(`  ${result.status} | ${result.ms} ms | ${result.bytes} B | ${result.contentType} | vercel=${result.vercelCache} | cc="${result.cacheControl}" | ${result.url}`);
      if (result.status === 0 || result.status >= 400) {
        if (strict) failed = true;
      }
    }
  } else {
    console.log('\n[IMAGE PROBES] No /api/media or /_next/image URLs found to probe.');
  }

  if (failed) {
    console.error('\nAudit FAILED strict checks.');
    process.exit(1);
  }
  console.log('\nAudit completed cleanly.');
}

main().catch((error) => {
  console.error('Audit error:', error);
  process.exit(1);
});
