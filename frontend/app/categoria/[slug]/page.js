import Link from 'next/link';
import CategoryFeedClient from '../../components/CategoryFeedClient';
import { getCategoryBySlug, getLatestArticles, getSiteUrl } from '../../../lib/directus';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await Promise.resolve(params);
  const category = await getCategoryBySlug(slug).catch(() => null);

  if (!category) {
    return {
      title: 'Categoría no encontrada - Jujuy247',
      description: 'La categoría no existe o todavía no tiene contenido publicado.',
      robots: { index: false, follow: false },
    };
  }

  const title = `${category.name} - Jujuy247`;
  const description = `Todo sobre ${category.name} en Jujuy247.`;
  const canonical = `${getSiteUrl()}/categoria/${encodeURIComponent(category.slug)}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Jujuy247',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await Promise.resolve(params);
  const categorySlug = typeof slug === 'string' ? slug.trim() : '';
  const category = categorySlug ? await getCategoryBySlug(categorySlug).catch(() => null) : null;

  if (!category) {
    return (
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(16px, 3vw, 24px)' }}>
        <div className="categoryFeedEmpty">
          <p className="categoryFeedEyebrow">Categoría</p>
          <h1 className="categoryFeedTitle">Categoría no encontrada</h1>
          <p>La categoría no existe o todavía no tiene contenido publicado.</p>
          <Link href="/" className="categoryFeedHomeLink">
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  const initialArticlesRaw = await getLatestArticles({ categorySlug: category.slug, limit: 11 }).catch(() => []);
  const initialArticles = initialArticlesRaw.slice(0, 10);
  const initialHasMore = initialArticlesRaw.length > 10;

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(16px, 3vw, 24px)' }}>
      <CategoryFeedClient category={category} initialArticles={initialArticles} initialHasMore={initialHasMore} />
    </main>
  );
}
