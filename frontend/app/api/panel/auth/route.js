import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  getCookieOptions,
  getDirectusMe,
  loginDirectus,
  logoutDirectus,
  refreshDirectus,
} from '../../../../lib/panel-auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Ingresá tu correo electrónico y contraseña' },
        { status: 400 }
      );
    }

    const authData = await loginDirectus(email, password);
    const user = await getDirectusMe(authData.accessToken);

    const cookieStore = await cookies();
    cookieStore.set(ACCESS_COOKIE, authData.accessToken, getCookieOptions('access'));
    cookieStore.set(REFRESH_COOKIE, authData.refreshToken, getCookieOptions('refresh'));

    return NextResponse.json({ success: true, user });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Error al iniciar sesión' },
      { status: 401 }
    );
  }
}

export async function GET() {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  let user = null;
  if (accessToken) {
    user = await getDirectusMe(accessToken);
  }

  if (!user && refreshToken) {
    const refreshed = await refreshDirectus(refreshToken);
    if (refreshed) {
      accessToken = refreshed.accessToken;
      cookieStore.set(ACCESS_COOKIE, refreshed.accessToken, getCookieOptions('access'));
      cookieStore.set(REFRESH_COOKIE, refreshed.refreshToken, getCookieOptions('refresh'));
      user = await getDirectusMe(refreshed.accessToken);
    }
  }

  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, user });
}

export async function DELETE() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    await logoutDirectus(refreshToken);
  }

  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);

  return NextResponse.json({ success: true });
}
