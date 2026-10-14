import { getCategories, getSitemapArticles, getSiteUrl, getCanonicalUrlForArticle } from '../lib/directus';
import { articleUrl, categoryUrl } from '../lib/site';
import { parsePublishedAt } from '../lib/datetime';

export const revalidate = 300;

export default async function sitemap() {
  const [categories, articles] = await Promise.all([getCategories({ limit: -1 }), getSitemapArticles()]);
  const entries = [
    { url: getSiteUrl() },
    ...categories.filter((category) => category.slug).map((category) => ({ url: categoryUrl(category.slug) })),
  ];
  for (const article of articles) {
    if (!article.slug || article.seo_no_index) continue;
    const url = articleUrl(article.slug);
    if (getCanonicalUrlForArticle(article) !== url) continue;
    const published = parsePublishedAt(article.published_at);
    if (published && published.getTime() > Date.now()) continue;
    entries.push({ url, ...(published ? { lastModified: published } : {}) });
  }
  return Array.from(new Map(entries.map((entry) => [entry.url, entry])).values());
}
