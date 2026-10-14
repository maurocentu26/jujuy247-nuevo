export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

export function allowedImageUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const directus = new URL(process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055');
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== directus.origin) return null;
    if (url.username || url.password || url.search || url.hash) return null;
    if (!/^\/assets\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(url.pathname)) return null;
    return url;
  } catch { return null; }
}
