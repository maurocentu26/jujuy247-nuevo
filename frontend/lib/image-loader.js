import { extractDirectusAssetId, pickMediaWidth } from './media-url.mjs';

/**
 * Custom Next.js image loader that routes Directus assets to `/api/media/<id>`
 * and serves local public assets directly without `/_next/image`.
 */
export default function imageLoader({ src, width }) {
  if (typeof src !== 'string' || !src) return '';
  if (src.startsWith('/') && !src.startsWith('//') && !src.startsWith('/assets/')) {
    return src;
  }
  const id = extractDirectusAssetId(src);
  if (id) {
    return `/api/media/${id}?w=${pickMediaWidth(width)}`;
  }
  return src;
}
