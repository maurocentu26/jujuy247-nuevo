import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getDirectusUrl, getValidToken } from '../../../../../lib/panel-auth';
import { validatePublishedAtInput } from '../../../../../lib/datetime';

export async function GET(request, { params }) {
  const cookieStore = await cookies();
  const { token } = await getValidToken(cookieStore);

  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const fields = [
      'id',
      'title',
      'slug',
      'excerpt',
      'content',
      'front_page',
      'published_at',
      'status',
      'seo_title',
      'seo_description',
      'cover_image',
      'youtube_url',
      'source_name',
      'source_url',
      'category.id',
      'category.name',
      'category.slug',
    ].join(',');

    const directusUrl = getDirectusUrl(`/items/articles/${id}?fields=${encodeURIComponent(fields)}`);
    const res = await fetch(directusUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Noticia no encontrada' }, { status: res.status });
    }

    const json = await res.json();
    return NextResponse.json({ data: json.data });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Error al obtener la noticia' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const cookieStore = await cookies();
  const { token } = await getValidToken(cookieStore);

  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const payload = await request.json();
    const updateData = {};

    if (payload.title !== undefined) updateData.title = String(payload.title).trim();
    if (payload.slug !== undefined) updateData.slug = String(payload.slug).trim();
    if (payload.excerpt !== undefined) updateData.excerpt = String(payload.excerpt).trim();
    if (payload.content !== undefined) updateData.content = String(payload.content);
    if (payload.category !== undefined) updateData.category = Number(payload.category);
    if (payload.front_page !== undefined) updateData.front_page = Boolean(payload.front_page);
    if (payload.cover_image !== undefined) updateData.cover_image = payload.cover_image || null;
    if (payload.youtube_url !== undefined) updateData.youtube_url = payload.youtube_url ? String(payload.youtube_url).trim() : null;
    if (payload.seo_title !== undefined) updateData.seo_title = payload.seo_title ? String(payload.seo_title).trim() : null;
    if (payload.seo_description !== undefined) updateData.seo_description = payload.seo_description ? String(payload.seo_description).trim() : null;

    const publishedAt = validatePublishedAtInput(payload.published_at);
    if (publishedAt.error) {
      return NextResponse.json({ error: publishedAt.error }, { status: 400 });
    }
    if (publishedAt.value) updateData.published_at = publishedAt.value;

    if (payload.status !== undefined) {
      updateData.status = payload.status;
      if (payload.status === 'published' && !publishedAt.value) {
        updateData.published_at = new Date().toISOString();
      }
    }

    const directusUrl = getDirectusUrl(`/items/articles/${id}`);
    const res = await fetch(directusUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.data) {
      const msg = json?.errors?.[0]?.message || 'Error al actualizar la noticia';
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    return NextResponse.json({ data: json.data });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Error al procesar la actualización' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const cookieStore = await cookies();
  const { token } = await getValidToken(cookieStore);

  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const directusUrl = getDirectusUrl(`/items/articles/${id}`);
    const res = await fetch(directusUrl, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok && res.status !== 204) {
      return NextResponse.json({ error: 'Error al eliminar la noticia' }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Error al procesar la eliminación' }, { status: 500 });
  }
}
