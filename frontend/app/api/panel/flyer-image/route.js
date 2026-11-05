import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getDirectusUrl, getValidToken } from '../../../../lib/panel-auth';

const FILE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Por debajo del límite de respuesta de las funciones en Vercel (unos 4,5 MB).
const MAX_BYTES = 4 * 1024 * 1024;
// El tamaño lo fija el servidor: alcanza para encuadrar con zoom sobre un lienzo de 1080 px.
const TRANSFORM = 'width=2160&format=jpg&quality=85&withoutEnlargement=true';

export async function GET(request) {
  const cookieStore = await cookies();
  const { token } = await getValidToken(cookieStore);

  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get('id') || '';
  if (!FILE_ID.test(id)) {
    return NextResponse.json({ error: 'Foto no válida' }, { status: 400 });
  }

  try {
    const res = await fetch(getDirectusUrl(`/assets/${id}?${TRANSFORM}`), {
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Foto no disponible' }, { status: res.status === 404 ? 404 : 502 });
    }

    const contentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'El archivo no es una imagen' }, { status: 415 });
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'La foto es demasiado pesada' }, { status: 413 });
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Foto no disponible' }, { status: 502 });
  }
}
