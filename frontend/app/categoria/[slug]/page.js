import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import CategoryFeedClient from '../../components/CategoryFeedClient';
import { getCategoryBySlug, getLatestArticles, getSiteUrl } from '../../../lib/directus';
import { breadcrumbs, categoryUrl, serializeJsonLd } from '../../../lib/site';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 10;

async function getCategoryPage(params, searchParams) {
  const { slug } = await params;
  const query = await searchParams;
  const rawPage = query?.page;
  if (rawPage !== undefined && (typeof rawPage !== 'string' || !/^[1-9]\d*$/.test(rawPage))) notFound();
  const page = Number(rawPage || 1);
  if (!Number.isSafeInteger(page) || page > 100000) notFound();
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  if (rawPage === '1') permanentRedirect(categoryUrl(category.slug));
  const articles = await getLatestArticles({ categorySlug: category.slug, limit: PAGE_SIZE + 1, offset: (page - 1) * PAGE_SIZE });
  if (page > 1 && articles.length === 0) notFound();
  return { category, page, articles };
}

export async function generateMetadata({ params, searchParams }) {
  const { category, page } = await getCategoryPage(params, searchParams);
  const name = category.name.trim();
  const title = `${name}${page > 1 ? ` · Página ${page}` : ''}`;
  const description = `Noticias de ${name}: actualidad, novedades y cobertura en Jujuy247.${page > 1 ? ` Archivo, página ${page}.` : ''}`;
  const canonical = categoryUrl(category.slug, page);
  return {
    title, description, alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website', locale: 'es_AR', siteName: 'Jujuy247', images: ['/seo-imgs/share-img.jpeg'] },
    twitter: { card: 'summary_large_image', title, description, images: ['/seo-imgs/share-img.jpeg'] },
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const { category, page, articles } = await getCategoryPage(params, searchParams);
  const trail = breadcrumbs([
    { name: 'Inicio', url: getSiteUrl() },
    { name: category.name.trim(), url: categoryUrl(category.slug) },
  ]);
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(16px, 3vw, 24px)' }}>
      <nav aria-label="Ruta de navegación" className="breadcrumbs"><Link href="/">Inicio</Link> / {category.name.trim()}</nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(trail) }} />
      <CategoryFeedClient category={category} initialArticles={articles.slice(0, PAGE_SIZE)} initialHasMore={articles.length > PAGE_SIZE} page={page} />
    </main>
  );
}
