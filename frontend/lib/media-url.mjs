export const MEDIA_WIDTHS = [64, 400, 800, 1200];
export const MEDIA_WIDTH_SET = new Set(MEDIA_WIDTHS);
export const DIRECTUS_FILE_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ASSETS_PATH_RE = /^\/assets\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

/**
 * Rounds an arbitrary requested width up to one of the fixed cacheable buckets.
 */
export function pickMediaWidth(width) {
  const numeric = Number(width);
  if (!Number.isFinite(numeric)) return 1200;
  if (numeric <= 0) return 400;
  for (const bucket of MEDIA_WIDTHS) {
    if (numeric <= bucket) return bucket;
  }
  return 1200;
}

function configuredDirectusOrigin() {
  try {
    return new URL(process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055').origin;
  } catch {
    return null;
  }
}

/**
 * Extracts a Directus file UUID from a raw ID, `/assets/<id>`, or configured Directus URL.
 * Rejects URLs with credentials or mismatched origins.
 */
export function extractDirectusAssetId(src) {
  if (typeof src !== 'string') return null;
  const trimmed = src.trim();
  if (!trimmed) return null;

  if (DIRECTUS_FILE_ID_RE.test(trimmed)) return trimmed;

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    try {
      const relative = new URL(trimmed, 'http://relative.local');
      if (relative.username || relative.password) return null;
      const match = relative.pathname.match(ASSETS_PATH_RE);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  try {
    const url = new URL(trimmed);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (url.username || url.password) return null;
    const expectedOrigin = configuredDirectusOrigin();
    if (!expectedOrigin || url.origin !== expectedOrigin) return null;
    const match = url.pathname.match(ASSETS_PATH_RE);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Builds the cached `/api/media/<id>?w=<bucket>` URL for a Directus file or URL.
 */
export function mediaAssetUrl(fileIdOrUrl, width = 800) {
  if (typeof fileIdOrUrl !== 'string') return '';
  const trimmed = fileIdOrUrl.trim();
  if (!trimmed) return '';
  const id = extractDirectusAssetId(trimmed);
  if (id) return `/api/media/${id}?w=${pickMediaWidth(width)}`;
  if (/^https?:\/\//i.test(trimmed) || (trimmed.startsWith('/') && !trimmed.startsWith('//'))) {
    return trimmed;
  }
  return '';
}

/**
 * Returns Directus transform query parameters for an allowed bucket width, or null.
 */
export function directusTransformParams(width) {
  const bucket = Number(width);
  if (!Number.isInteger(bucket) || !MEDIA_WIDTH_SET.has(bucket)) return null;
  const quality = bucket <= 64 ? 60 : 80;
  return `width=${bucket}&quality=${quality}&format=webp&withoutEnlargement=true`;
}
