export const ACCESS_COOKIE = 'directus_access_token';
export const REFRESH_COOKIE = 'directus_refresh_token';

export function getDirectusUrl(path = '') {
  const base = (
    process.env.DIRECTUS_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_DIRECTUS_URL ||
    'http://localhost:8055'
  ).replace(/\/$/, '');
  if (!path) return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function loginDirectus(email, password) {
  if (!email || !password) {
    throw new Error('Email y contraseña requeridos');
  }

  const url = getDirectusUrl('/auth/login');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.data?.access_token) {
    const errorMsg = json?.errors?.[0]?.message || 'Credenciales inválidas';
    throw new Error(errorMsg);
  }

  return {
    accessToken: json.data.access_token,
    refreshToken: json.data.refresh_token,
    expires: json.data.expires, // milliseconds
  };
}

export async function refreshDirectus(refreshToken) {
  if (!refreshToken) return null;

  try {
    const url = getDirectusUrl('/auth/refresh');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.data?.access_token) return null;

    return {
      accessToken: json.data.access_token,
      refreshToken: json.data.refresh_token,
      expires: json.data.expires,
    };
  } catch {
    return null;
  }
}

export async function logoutDirectus(refreshToken) {
  if (!refreshToken) return;
  try {
    const url = getDirectusUrl('/auth/logout');
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    // Best-effort logout
  }
}

export async function getDirectusMe(accessToken) {
  if (!accessToken) return null;

  try {
    const url = getDirectusUrl('/users/me?fields=id,first_name,last_name,email,role.name');
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

export async function getValidToken(cookieStore, { refresh = true } = {}) {
  let accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (accessToken) {
    const user = await getDirectusMe(accessToken);
    if (user) return { token: accessToken, user };
  }

  if (refresh && refreshToken) {
    const refreshed = await refreshDirectus(refreshToken);
    if (refreshed) {
      cookieStore.set(ACCESS_COOKIE, refreshed.accessToken, getCookieOptions('access'));
      cookieStore.set(REFRESH_COOKIE, refreshed.refreshToken, getCookieOptions('refresh'));
      const user = await getDirectusMe(refreshed.accessToken);
      return { token: refreshed.accessToken, user };
    }
  }

  return { token: null, user: null };
}

export function getCookieOptions(type = 'access') {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: type === 'access' ? 15 * 60 : 7 * 24 * 60 * 60, // 15 mins or 7 days
  };
}
