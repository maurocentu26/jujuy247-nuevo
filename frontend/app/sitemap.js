import { getCategories, getLatestArticles, getSiteUrl, sortCategoriesByPosition } from '../lib/directus';

export default async function sitemap() {
  const siteUrl = getSiteUrl();
  const [categories, latestArticles] = await Promise.all([
    getCategories({ limit: 50 }).catch(() => []),
    getLatestArticles({ limit: 100 }).catch(() => []),
  ]);
  const sortedCategories = sortCategoriesByPosition(categories);

  const entries = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
  ];

  for (const category of sortedCategories) {
    if (!category?.slug) continue;
    entries.push({
      url: `${siteUrl}/?category=${encodeURIComponent(category.slug)}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    });
  }

  for (const article of latestArticles) {
    if (!article?.slug) continue;
    entries.push({
      url: `${siteUrl}/noticias/${article.slug}`,
      lastModified: article.published_at ? new Date(article.published_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  return entries;
}