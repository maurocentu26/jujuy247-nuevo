import { NextResponse } from 'next/server';
import { IMAGE_TYPES } from '../../../../lib/image-proxy';
import { DIRECTUS_FILE_ID_RE, directusTransformParams } from '../../../../lib/media-url.mjs';

const MAX_BYTES = 4 * 1024 * 1024;
const PUBLIC_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400',
  'CDN-Cache-Control': 'public, max-age=2592000, stale-while-revalidate=86400',
  'X-Content-Type-Options': 'nosniff',
};

function errorResponse(message, status) {
  return NextResponse.json(
    { error: message },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

function directusAssetTransformUrl(id, transformParams) {
  const base = (process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055').replace(/\/$/, '');
  return `${base}/assets/${id}?${transformParams}`;
}

/**
 * Public, CDN-cacheable proxy for resized Directus images using a strict width bucket whitelist.
 */
export async function GET(request, { params }) {
  const { id } = await params;
  if (typeof id !== 'string' || !DIRECTUS_FILE_ID_RE.test(id)) {
    return errorResponse('Imagen no válida', 400);
  }

  const wParam = new URL(request.url).searchParams.get('w');
  const width = wParam === null ? 800 : /^\d+$/.test(wParam) ? Number(wParam) : NaN;
  const transformParams = directusTransformParams(width);
  if (!transformParams) {
    return errorResponse('Ancho no permitido', 400);
  }

  try {
    const res = await fetch(directusAssetTransformUrl(id, transformParams), {
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return errorResponse('Imagen no disponible', res.status === 404 ? 404 : 502);
    }

    const contentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!IMAGE_TYPES.has(contentType)) {
      return errorResponse('El archivo no es una imagen', 415);
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) {
      return errorResponse('La imagen supera el límite permitido', 413);
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        ...PUBLIC_CACHE_HEADERS,
      },
    });
  } catch {
    return errorResponse('Imagen no disponible', 502);
  }
}
