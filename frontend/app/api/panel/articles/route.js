import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getDirectusUrl, getValidToken } from '../../../../lib/panel-auth';
import { editorialViewFilter } from '../../../../lib/panel-views.mjs';
import { validatePublishedAtInput } from '../../../../lib/datetime';

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

export async function GET(request) {
  const cookieStore = await cookies();
  const { token } = await getValidToken(cookieStore);

  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'all';
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 50, 1), 100);
  const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

  const filter = {};
  const andFilters = [];

  if (status && status !== 'all') {
    andFilters.push({ status: { _eq: status } });
  }

  const viewFilter = editorialViewFilter(searchParams.get('view'));
  if (viewFilter) andFilters.push(viewFilter);

  if (category && category !== 'all') {
    const catId = Number(category);
    if (!Number.isNaN(catId)) {
      andFilters.push({ category: { _eq: catId } });
    }
  }

  if (search && search.trim()) {
    const term = search.trim();
    andFilters.push({
      _or: [
        { title: { _icontains: term } },
        { excerpt: { _icontains: term } },
      ],
    });
  }

  if (andFilters.length === 1) {
    Object.assign(filter, andFilters[0]);
  } else if (andFilters.length > 1) {
    filter._and = andFilters;
  }

  const fields = [
    'id',
    'title',
    'slug',
    'excerpt',
    'front_page',
    'published_at',
    'status',
    'cover_image',
    'category.id',
    'category.name',
    'category.slug',
  ].join(',');

  const queryParams = new URLSearchParams({
    fields,
    sort: '-published_at,-id',
    limit: String(limit),
    offset: String(offset),
  });

  if (Object.keys(filter).length > 0) {
    queryParams.set('filter', JSON.stringify(filter));
  }

  try {
    const directusUrl = getDirectusUrl(`/items/articles?${queryParams.toString()}`);
    const res = await fetch(directusUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return NextResponse.json(
        { error: `Error Directus: ${res.status} ${errText}` },
        { status: res.status }
      );
    }

    const json = await res.json();
    return NextResponse.json({
      data: json.data || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Error al obtener artículos' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const cookieStore = await cookies();
  const { token } = await getValidToken(cookieStore);

  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const {
      title,
      slug: customSlug,
      excerpt,
      content,
      category,
      cover_image,
      youtube_url,
      front_page,
      status = 'draft',
      seo_title,
      seo_description,
    } = payload || {};

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'El título de la noticia es obligatorio' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(Number(category)) || Number(category) <= 0) {
      return NextResponse.json(
        { error: 'Elegí la sección de la noticia' },
        { status: 400 }
      );
    }

    const publishedAt = validatePublishedAtInput(payload?.published_at);
    if (publishedAt.error) {
      return NextResponse.json({ error: publishedAt.error }, { status: 400 });
    }

    const baseSlug =customSlug && customSlug.trim() ? slugify(customSlug) : slugify(title);
    const finalSlug = baseSlug ? `${baseSlug}-${Date.now().toString().slice(-4)}` : `nota-${Date.now()}`;

    const articleData = {
      title: title.trim(),
      slug: finalSlug,
      excerpt: typeof excerpt === 'string' ? excerpt.trim() : '',
      content: typeof content === 'string' ? content : '',
      category: Number(category),
      status: ['published', 'draft', 'archived'].includes(status) ? status : 'draft',
      front_page: Boolean(front_page),
      cover_image: cover_image || null,
      youtube_url: typeof youtube_url === 'string' ? youtube_url.trim() : null,
      seo_title: typeof seo_title === 'string' ? seo_title.trim() : null,
      seo_description: typeof seo_description === 'string' ? seo_description.trim() : null,
      // Un borrador puede guardar la fecha elegida; al publicar sin fecha se usa la actual.
      published_at: publishedAt.value || (status === 'published' ? new Date().toISOString() : null),
    };

    const directusUrl = getDirectusUrl('/items/articles');
    const res = await fetch(directusUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(articleData),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.data) {
      const msg = json?.errors?.[0]?.message || 'Error al guardar la noticia en Directus';
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    return NextResponse.json({ data: json.data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
