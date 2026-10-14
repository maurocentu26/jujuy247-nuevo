export const SITE_NAME = 'Jujuy247';
export const SITE_DESCRIPTION = 'Últimas noticias de Jujuy: actualidad local, política, economía, policiales, deportes y cultura en Jujuy247.';

export function getSiteUrl() {
  const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jujuy247.com.ar');
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('NEXT_PUBLIC_SITE_URL debe usar HTTP o HTTPS');
  return url.origin;
}

export function articleUrl(slug) {
  return `${getSiteUrl()}/noticias/${encodeURIComponent(slug)}`;
}

export function categoryUrl(slug, page = 1) {
  return `${getSiteUrl()}/categoria/${encodeURIComponent(slug)}${page > 1 ? `?page=${page}` : ''}`;
}

export function serializeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function articleDescription(article) {
  const text = String(article.seo_description || article.excerpt || article.content || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/[#*_`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 160 ? `${text.slice(0, 157).replace(/\s+\S*$/, '')}…` : text;
}

export function breadcrumbs(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(({ name, url }, index) => ({
      '@type': 'ListItem', position: index + 1, name, item: url,
    })),
  };
}
