import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getDirectusUrl, getValidToken } from '../../../../lib/panel-auth';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request) {
  const cookieStore = await cookies();
  const { token } = await getValidToken(cookieStore);

  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Formato no admitido. Usá imágenes JPG, PNG o WebP.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'El archivo supera el tamaño máximo permitido (10 MB).' },
        { status: 400 }
      );
    }

    // Prepare direct upload to Directus /files
    const directusFormData = new FormData();
    directusFormData.append('file', file, file.name);

    const directusUrl = getDirectusUrl('/files');
    const res = await fetch(directusUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: directusFormData,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.data?.id) {
      const msg = json?.errors?.[0]?.message || 'Error al subir la imagen a Directus';
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    const fileId = json.data.id;
    const directusBase = getDirectusUrl();
    const assetUrl = `${directusBase}/assets/${fileId}`;

    return NextResponse.json({
      success: true,
      fileId,
      url: assetUrl,
      filename: json.data.filename_download || file.name,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Error al procesar la subida del archivo' },
      { status: 500 }
    );
  }
}
