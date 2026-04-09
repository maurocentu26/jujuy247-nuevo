import Link from 'next/link';
import { directusAssetUrl, getArticleBySlug, getCanonicalUrlForArticle, getDirectusFileId, getSiteUrl } from '../../../lib/directus';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CurrentArticleTitle from '../../components/CurrentArticleTitle';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await Promise.resolve(params);
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Noticia no encontrada - Jujuy247',
      description: 'La noticia no existe o todavía no está publicada.',
      robots: { index: false, follow: false },
    };
  }

  const title = article.seo_title || article.title;
  const description = article.seo_description || article.excerpt || '';
  const canonical = getCanonicalUrlForArticle(article);
  const imageFileId = getDirectusFileId(article.seo_image) || getDirectusFileId(article.cover_image);
  const imageUrl = imageFileId ? directusAssetUrl(imageFileId) : '';

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      index: !article.seo_no_index,
      follow: !article.seo_no_follow,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      siteName: 'Jujuy247',
      publishedTime: article.published_at || undefined,
      tags: Array.isArray(article.tags) ? article.tags.map((t) => t.name).filter(Boolean) : undefined,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
    keywords:
      article.seo_keywords || (Array.isArray(article.tags) ? article.tags.map((t) => t.name).filter(Boolean).join(', ') : undefined),
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await Promise.resolve(params);
  const article = await getArticleBySlug(slug);

  if (!article) {
    return (
      <main style={{ maxWidth: 980, margin: '0 auto', padding: 'clamp(16px, 3vw, 24px)' }}>
        <p style={{ marginTop: 0 }}>
          <Link href="/">← Volver</Link>
        </p>
        <h1>No encontrada</h1>
        <p>La noticia no existe o todavía no está publicada.</p>
      </main>
    );
  }

  const canonical = getCanonicalUrlForArticle(article);
  const site = getSiteUrl();
  const imageFileId = getDirectusFileId(article.seo_image) || getDirectusFileId(article.cover_image);
  const imageUrl = imageFileId ? directusAssetUrl(imageFileId) : '';
  const sourceName = typeof article.source_name === 'string' ? article.source_name.trim() : '';
  const sourceUrl = typeof article.source_url === 'string' ? article.source_url.trim() : '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.seo_title || article.title,
    description: article.seo_description || article.excerpt || undefined,
    datePublished: article.published_at || undefined,
    dateModified: article.published_at || undefined,
    articleSection: article.category?.name || undefined,
    keywords: Array.isArray(article.tags) ? article.tags.map((t) => t.name).filter(Boolean).join(', ') : undefined,
    mainEntityOfPage: canonical,
    url: canonical,
    image: imageUrl || undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Jujuy247',
      url: site,
    },
  };

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: 'clamp(16px, 3vw, 24px)' }}>
      <CurrentArticleTitle title={article.title} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p style={{ marginTop: 0 }}>
        <Link href="/">← Volver</Link>
      </p>
      <h1 style={{ margin: '12px 0 0' }}>{article.title}</h1>
      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
        {article.category?.name ? <span>{article.category.name}</span> : <span>Sin categoría</span>}
        {article.published_at ? <span> · {new Date(article.published_at).toLocaleString('es-AR')}</span> : null}
        {sourceName ? (
          <span>
            {' '}
            · Fuente:{' '}
            {sourceUrl ? (
              <a href={sourceUrl} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
                {sourceName}
              </a>
            ) : (
              sourceName
            )}
          </span>
        ) : null}
      </div>

      {imageUrl ? (
        <img
          src={imageUrl}
          alt={article.title}
          loading="eager"
          style={{
            width: '100%',
            height: 'auto',
            aspectRatio: '16 / 9',
            maxHeight: 420,
            objectFit: 'cover',
            borderRadius: 12,
            display: 'block',
            marginTop: 14,
          }}
        />
      ) : null}

      {article.content ? (
        <article style={{ marginTop: 16, lineHeight: 1.7 }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ children, ...props }) => (
                <a {...props} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
                  {children}
                </a>
              ),
              img: ({ ...props }) => {
                const credit = typeof props.title === 'string' ? props.title.trim() : '';
                return (
                  <figure style={{ margin: '14px 0' }}>
                    <img
                      {...props}
                      alt={props.alt || ''}
                      style={{ maxWidth: '100%', height: 'auto', borderRadius: 12, display: 'block' }}
                    />
                    {credit ? (
                      <figcaption
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          lineHeight: 1.4,
                          color: '#6b7280',
                        }}
                      >
                        {credit}
                      </figcaption>
                    ) : null}
                  </figure>
                );
              },
              p: ({ children, ...props }) => (
                <p {...props} style={{ margin: '12px 0' }}>
                  {children}
                </p>
              ),
              h2: ({ children, ...props }) => (
                <h2 {...props} style={{ margin: '18px 0 10px' }}>
                  {children}
                </h2>
              ),
              h3: ({ children, ...props }) => (
                <h3 {...props} style={{ margin: '16px 0 8px' }}>
                  {children}
                </h3>
              ),
              ul: ({ children, ...props }) => (
                <ul {...props} style={{ margin: '10px 0 10px 18px' }}>
                  {children}
                </ul>
              ),
              ol: ({ children, ...props }) => (
                <ol {...props} style={{ margin: '10px 0 10px 18px' }}>
                  {children}
                </ol>
              ),
            }}
          >
            {article.content}
          </ReactMarkdown>
        </article>
      ) : (
        <p style={{ marginTop: 16, opacity: 0.85 }}>Sin contenido.</p>
      )}

      {Array.isArray(article.tags) && article.tags.length ? (
        <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {article.tags.map((t) => (
            <span key={t.id} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #e5e5e5', borderRadius: 999 }}>
              #{t.name}
            </span>
          ))}
        </div>
      ) : null}
    </main>
  );
}
