const KNOWN_ENVS = new Set(['production', 'staging', 'development']);

/**
 * Resuelve el entorno efectivo de ejecución (`production`, `staging` o `development`).
 * Prioriza `NEXT_PUBLIC_APP_ENV`, luego `VERCEL_ENV` y finalmente `NODE_ENV`.
 */
export function getAppEnv(env = process.env) {
  const explicit = String(env.NEXT_PUBLIC_APP_ENV || '').trim().toLowerCase();
  if (KNOWN_ENVS.has(explicit)) return explicit;

  const vercelEnv = String(env.VERCEL_ENV || '').trim().toLowerCase();
  if (vercelEnv === 'production') return 'production';
  if (vercelEnv === 'preview') return 'staging';
  if (vercelEnv === 'development') return 'development';

  return env.NODE_ENV === 'production' ? 'production' : 'development';
}

export function isProductionEnv(env = process.env) {
  return getAppEnv(env) === 'production';
}

export function isStagingEnv(env = process.env) {
  return getAppEnv(env) === 'staging';
}

/**
 * Solo permite indexación en buscadores cuando el entorno es `production`
 * y `ALLOW_SEARCH_INDEXING` no fue deshabilitado explícitamente con `false`.
 */
export function shouldAllowIndexing(env = process.env) {
  return isProductionEnv(env)
    && String(env.ALLOW_SEARCH_INDEXING ?? 'true').trim().toLowerCase() !== 'false';
}

/**
 * Evita publicaciones reales en redes sociales fuera de producción salvo que
 * `SOCIAL_PUBLISH_MODE` indique explícitamente `live`.
 */
export function isSocialDryRun(env = process.env) {
  const mode = String(env.SOCIAL_PUBLISH_MODE || '').trim().toLowerCase();
  if (mode === 'dry-run') return true;
  if (mode === 'live') return false;
  return !isProductionEnv(env);
}

/**
 * Devuelve los metadatos para el banner visible del panel en staging, o `null` fuera de staging.
 */
export function getStagingBannerInfo(env = process.env) {
  if (!isStagingEnv(env)) return null;
  const branch = String(env.VERCEL_GIT_COMMIT_REF || 'staging').trim() || 'staging';
  return {
    env: 'staging',
    dryRun: isSocialDryRun(env),
    branch,
  };
}
