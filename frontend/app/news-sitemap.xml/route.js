import { getCanonicalUrlForArticle, getSitemapArticles } from '../../lib/directus';
import { articleUrl } from '../../lib/site';
import { parsePublishedAt } from '../../lib/datetime';

export const revalidate = 300;

function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[char]));
}

export async function GET() {
  const now = Date.now();
  const cutoff = now - 48 * 60 * 60 * 1000;
  const articles = await getSitemapArticles();
  const entries = articles
    .map((article) => ({ article, published: parsePublishedAt(article.published_at) }))
    .filter(({ article, published }) => article.slug && !article.seo_no_index && published && published.getTime() >= cutoff && published.getTime() <= now && getCanonicalUrlForArticle(article) === articleUrl(article.slug))
    .sort((a, b) => b.published - a.published)
    .slice(0, 1000)
    .map(({ article, published }) => `<url><loc>${escapeXml(articleUrl(article.slug))}</loc><news:news><news:publication><news:name>Jujuy247</news:name><news:language>es</news:language></news:publication><news:publication_date>${published.toISOString()}</news:publication_date><news:title>${escapeXml(article.title)}</news:title></news:news></url>`);
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${entries.join('')}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
