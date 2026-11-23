import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAppEnv,
  getStagingBannerInfo,
  isProductionEnv,
  isSocialDryRun,
  isStagingEnv,
  shouldAllowIndexing,
} from '../lib/env.mjs';

test('getAppEnv prioritizes NEXT_PUBLIC_APP_ENV, then VERCEL_ENV, then NODE_ENV', () => {
  assert.equal(getAppEnv({ NEXT_PUBLIC_APP_ENV: '  STAGING ', VERCEL_ENV: 'production', NODE_ENV: 'production' }), 'staging');
  assert.equal(getAppEnv({ NEXT_PUBLIC_APP_ENV: 'Production', VERCEL_ENV: 'preview' }), 'production');
  assert.equal(getAppEnv({ NEXT_PUBLIC_APP_ENV: 'unknown', VERCEL_ENV: 'preview', NODE_ENV: 'production' }), 'staging');
  assert.equal(getAppEnv({ VERCEL_ENV: 'production', NODE_ENV: 'development' }), 'production');
  assert.equal(getAppEnv({ VERCEL_ENV: 'preview', NODE_ENV: 'production' }), 'staging');
  assert.equal(getAppEnv({ VERCEL_ENV: 'development', NODE_ENV: 'production' }), 'development');
  assert.equal(getAppEnv({ NODE_ENV: 'production' }), 'production');
  assert.equal(getAppEnv({ NODE_ENV: 'test' }), 'development');
  assert.equal(getAppEnv({}), 'development');
});

test('isProductionEnv and isStagingEnv reflect resolved app environment', () => {
  assert.equal(isProductionEnv({ VERCEL_ENV: 'production' }), true);
  assert.equal(isStagingEnv({ VERCEL_ENV: 'production' }), false);

  assert.equal(isStagingEnv({ VERCEL_ENV: 'preview' }), true);
  assert.equal(isProductionEnv({ VERCEL_ENV: 'preview' }), false);

  assert.equal(isProductionEnv({ NODE_ENV: 'development' }), false);
  assert.equal(isStagingEnv({ NODE_ENV: 'development' }), false);
});

test('shouldAllowIndexing allows indexing only in production unless explicitly disabled', () => {
  assert.equal(shouldAllowIndexing({ VERCEL_ENV: 'production' }), true);
  assert.equal(shouldAllowIndexing({ VERCEL_ENV: 'production', ALLOW_SEARCH_INDEXING: '' }), true);
  assert.equal(shouldAllowIndexing({ VERCEL_ENV: 'production', ALLOW_SEARCH_INDEXING: ' FALSE ' }), false);
  assert.equal(shouldAllowIndexing({ VERCEL_ENV: 'preview' }), false);
  assert.equal(shouldAllowIndexing({ NEXT_PUBLIC_APP_ENV: 'staging', NODE_ENV: 'production' }), false);
  assert.equal(shouldAllowIndexing({ NODE_ENV: 'development' }), false);
});

test('isSocialDryRun defaults to true outside production and honors explicit overrides', () => {
  assert.equal(isSocialDryRun({ VERCEL_ENV: 'preview' }), true);
  assert.equal(isSocialDryRun({ NODE_ENV: 'development' }), true);
  assert.equal(isSocialDryRun({ VERCEL_ENV: 'production' }), false);

  assert.equal(isSocialDryRun({ VERCEL_ENV: 'production', SOCIAL_PUBLISH_MODE: ' dry-run ' }), true);
  assert.equal(isSocialDryRun({ VERCEL_ENV: 'preview', SOCIAL_PUBLISH_MODE: 'LIVE' }), false);
  assert.equal(isSocialDryRun({ VERCEL_ENV: 'preview', SOCIAL_PUBLISH_MODE: 'invalid' }), true);
});

test('getStagingBannerInfo returns banner metadata only in staging', () => {
  assert.equal(getStagingBannerInfo({ VERCEL_ENV: 'production' }), null);
  assert.equal(getStagingBannerInfo({ VERCEL_ENV: 'development' }), null);

  assert.deepEqual(
    getStagingBannerInfo({ VERCEL_ENV: 'preview' }),
    { env: 'staging', dryRun: true, branch: 'staging' }
  );
  assert.deepEqual(
    getStagingBannerInfo({
      NEXT_PUBLIC_APP_ENV: 'staging',
      VERCEL_GIT_COMMIT_REF: 'feat/social-core',
      SOCIAL_PUBLISH_MODE: 'live',
    }),
    { env: 'staging', dryRun: false, branch: 'feat/social-core' }
  );
});
