import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getDirectusUrl, getValidToken } from '../../../../../lib/panel-auth';
import { EDITORIAL_VIEWS, editorialViewFilter } from '../../../../../lib/panel-views.mjs';

async function countView(view, token, now) {
  const params = new URLSearchParams({ 'aggregate[count]': 'id' });
  const filter = editorialViewFilter(view, now);
  if (filter) params.set('filter', JSON.stringify(filter));

  const res = await fetch(getDirectusUrl(`/items/articles?${params.toString()}`), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Directus ${res.status}`);

  const json = await res.json();
  return Number(json?.data?.[0]?.count?.id ?? json?.data?.[0]?.count ?? 0);
}

export async function GET() {
  const cookieStore = await cookies();
  const { token } = await getValidToken(cookieStore);

  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const now = new Date();
    const counts = await Promise.all(EDITORIAL_VIEWS.map(({ id }) => countView(id, token, now)));
    return NextResponse.json({
      data: Object.fromEntries(EDITORIAL_VIEWS.map(({ id }, index) => [id, counts[index]])),
    });
  } catch {
    return NextResponse.json({ error: 'No se pudieron calcular los contadores' }, { status: 502 });
  }
}
