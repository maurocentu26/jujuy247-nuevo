import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  getCookieOptions,
  getDirectusUrl,
  loginDirectus,
  getValidToken,
} from '../lib/panel-auth.js';

test('read-only session checks never rotate refresh tokens or write cookies during rendering', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(url);
    return { ok: url.includes('/auth/refresh'), json: async () => ({ data: { access_token: 'renewed', refresh_token: 'rotated' } }) };
  };
  try {
    const result = await getValidToken({
      get: name => ({ value: name === ACCESS_COOKIE ? 'expired' : 'refresh' }),
      set: () => { throw new Error('Cookies can only be modified in a Server Action or Route Handler.'); },
    }, { refresh: false });
    assert.deepEqual(result, { token: null, user: null });
    assert.equal(calls.length, 1);
    assert.ok(calls[0].includes('/users/me'));
  } finally { globalThis.fetch = originalFetch; }
});

test('writable session checks preserve rotated cookies and return the authenticated user', async () => {
  const originalFetch = globalThis.fetch;
  const writes = [];
  globalThis.fetch = async url => url.includes('/auth/refresh')
    ? { ok: true, json: async () => ({ data: { access_token: 'renewed', refresh_token: 'rotated' } }) }
    : { ok: true, json: async () => ({ data: { id: 'editor' } }) };
  try {
    const result = await getValidToken({
      get: name => name === REFRESH_COOKIE ? { value: 'refresh' } : undefined,
      set: (...args) => writes.push(args),
    });
    assert.equal(result.token, 'renewed');
    assert.equal(result.user.id, 'editor');
    assert.deepEqual(writes.map(([name, value]) => [name, value]), [[ACCESS_COOKIE, 'renewed'], [REFRESH_COOKIE, 'rotated']]);
  } finally { globalThis.fetch = originalFetch; }
});

test('Directus URL helper normalizes slashes and respects environment overrides', () => {
  const url1 = getDirectusUrl('/items/articles');
  assert.ok(url1.endsWith('/items/articles'));
  assert.ok(!url1.includes('//items'));

  const url2 = getDirectusUrl('items/categories');
  assert.ok(url2.endsWith('/items/categories'));
});

test('Cookie options provide secure and HttpOnly defaults', () => {
  const accessOpts = getCookieOptions('access');
  assert.equal(accessOpts.httpOnly, true);
  assert.equal(accessOpts.sameSite, 'lax');
  assert.equal(accessOpts.path, '/');
  assert.equal(accessOpts.maxAge, 900); // 15 mins

  const refreshOpts = getCookieOptions('refresh');
  assert.equal(refreshOpts.httpOnly, true);
  assert.equal(refreshOpts.maxAge, 604800); // 7 days
});

test('loginDirectus throws clear error when credentials are empty', async () => {
  await assert.rejects(
    () => loginDirectus('', ''),
    /Email y contrase/
  );
});

test('getValidToken returns null when cookies are absent', async () => {
  const fakeCookies = {
    get: () => undefined,
    set: () => {},
  };
  const result = await getValidToken(fakeCookies);
  assert.deepEqual(result, { token: null, user: null });
});

test('getValidToken authenticates when Directus returns valid user profile', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (url.includes('/users/me')) {
      return {
        ok: true,
        json: async () => ({
          data: { id: 'user-1', email: 'editor@jujuy247.com', first_name: 'Redactor', role: { name: 'Editor' } }
        }),
      };
    }
    return { ok: false };
  };

  try {
    const fakeCookies = {
      get: (name) => name === ACCESS_COOKIE ? { value: 'fake-token' } : undefined,
      set: () => {},
    };
    const result = await getValidToken(fakeCookies);
    assert.equal(result.token, 'fake-token');
    assert.equal(result.user.email, 'editor@jujuy247.com');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
