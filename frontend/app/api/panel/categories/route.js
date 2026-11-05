import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getDirectusUrl, getValidToken } from '../../../../lib/panel-auth';

export async function GET() {
  const cookieStore = await cookies();
  const { token } = await getValidToken(cookieStore);

  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const directusUrl = getDirectusUrl('/items/categories?fields=id,name,slug,position&sort=position,name&limit=100');
    const res = await fetch(directusUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Error al consultar categorías' }, { status: res.status });
    }

    const json = await res.json();
    return NextResponse.json({ data: json.data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Error al obtener categorías' }, { status: 500 });
  }
}
