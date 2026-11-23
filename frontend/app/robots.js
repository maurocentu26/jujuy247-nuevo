import { getSiteUrl } from '../lib/directus';
import { shouldAllowIndexing } from '../lib/env.mjs';

export default function robots() {
  if (!shouldAllowIndexing()) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
    };
  }

  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: [`${siteUrl}/sitemap.xml`, `${siteUrl}/news-sitemap.xml`],
  };
}
