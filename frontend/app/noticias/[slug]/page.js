import Link from 'next/link';
import React from 'react';
import {
  directusAssetUrl,
  getArticleBySlug,
  getCanonicalUrlForArticle,
  getDirectusFileId,
  getLatestArticles,
  getOtherArticlesInCategory,
  getSiteUrl,
} from '../../../lib/directus';
import { formatPublishedAt } from '../../../lib/datetime';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CurrentArticleTitle from '../../components/CurrentArticleTitle';

export const dynamic = 'force-dynamic';

function renderYoutubeEmbed(embedUrl, title) {
  return (
    <div
      style={{
        marginTop: 14,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        background: '#000',
      }}
    >
      <iframe
        src={embedUrl}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
      />
    </div>
  );
}

function getYoutubeEmbedUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return '';
  }

  const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
  let videoId = '';

  if (host === 'youtu.be') {
    videoId = parsed.pathname.split('/').filter(Boolean)[0] || '';
  }

  if (!videoId && (host === 'youtube.com' || host === 'm.youtube.com')) {
    if (parsed.pathname === '/watch') {
      videoId = parsed.searchParams.get('v') || '';
    } else if (parsed.pathname.startsWith('/shorts/')) {
      videoId = parsed.pathname.split('/')[2] || '';
    } else if (parsed.pathname.startsWith('/embed/')) {
      videoId = parsed.pathname.split('/')[2] || '';
    }
  }

  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return '';
  }

  return `https://www.youtube.com/embed/${videoId}`;
}

function shuffleArticles(items) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

function getRandomCrossCategoryArticles(articles, currentCategoryId, count = 2) {
  const byCategory = new Map();

  for (const article of Array.isArray(articles) ? articles : []) {
    const categoryId = article?.category?.id;
    if (!categoryId || categoryId === currentCategoryId) continue;

    if (!byCategory.has(categoryId)) {
      byCategory.set(categoryId, []);
    }

    byCategory.get(categoryId).push(article);
  }

  return shuffleArticles(Array.from(byCategory.values()))
    .slice(0, count)
    .map((group) => {
      const shuffledGroup = shuffleArticles(group);
      return shuffledGroup[0] || null;
    })
    .filter(Boolean);
}

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
        <h1>No encontrada</h1>
        <p>La noticia no existe o todavía no está publicada.</p>
      </main>
    );
  }

  const canonical = getCanonicalUrlForArticle(article);
  const site = getSiteUrl();
  const imageFileId = getDirectusFileId(article.seo_image) || getDirectusFileId(article.cover_image);
  const imageUrl = imageFileId ? directusAssetUrl(imageFileId) : '';
  const youtubeEmbedUrl = getYoutubeEmbedUrl(article.youtube_url);
  const sourceName = typeof article.source_name === 'string' ? article.source_name.trim() : '';
  const sourceUrl = typeof article.source_url === 'string' ? article.source_url.trim() : '';

  const [sameCategoryArticles, crossCategoryPool] = await Promise.all([
    article.category?.id ? getOtherArticlesInCategory({ categoryId: article.category.id, excludeId: article.id, limit: 3 }).catch(() => []) : [],
    getLatestArticles({ limit: 40 }).catch(() => []),
  ]);

  const crossCategoryArticles = getRandomCrossCategoryArticles(crossCategoryPool, article.category?.id, 2);

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
      <h1 style={{ margin: '12px 0 0', color: '#c23434'}}> {article.title}</h1>
      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
        {article.category?.name ? <span>{article.category.name}</span> : <span>Sin categoría</span>}
        {article.published_at ? <span> · {formatPublishedAt(article.published_at)}</span> : null}
        {sourceName ? (
          <span>
            {' '}
            · Fuente:{' '}
            {sourceUrl ? (
              <a className="sourceLink" href={sourceUrl} target="_blank" rel="noreferrer">
                {sourceName}
              </a>
            ) : (
              sourceName
            )}
          </span>
        ) : null}
      </div>

      {youtubeEmbedUrl ? (
        renderYoutubeEmbed(youtubeEmbedUrl, `Video: ${article.title}`)
      ) : null}

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
                  <span style={{ display: 'block', margin: '14px 0' }}>
                    <img
                      {...props}
                      alt={props.alt || ''}
                      style={{ maxWidth: '100%', height: 'auto', borderRadius: 12, display: 'block' }}
                    />
                    {credit ? (
                      <span
                        style={{
                          display: 'block',
                          marginTop: 6,
                          fontSize: 12,
                          lineHeight: 1.4,
                          color: '#6b7280',
                        }}
                      >
                        {credit}
                      </span>
                    ) : null}
                  </span>
                );
              },
              p: ({ children, ...props }) => (
                (() => {
                  const normalizedChildren = React.Children.toArray(children).filter(
                    (child) => !(typeof child === 'string' && child.trim() === '')
                  );

                  if (normalizedChildren.length === 1 && React.isValidElement(normalizedChildren[0])) {
                    const onlyChild = normalizedChildren[0];
                    const href = typeof onlyChild.props?.href === 'string' ? onlyChild.props.href : '';
                    const embedUrl = getYoutubeEmbedUrl(href);
                    if (embedUrl) {
                      return renderYoutubeEmbed(embedUrl, 'Video de YouTube en el contenido');
                    }

                    // Avoid invalid HTML when markdown contains only an image inside a paragraph.
                    if (onlyChild.type === 'img') {
                      return onlyChild;
                    }
                  }

                  return (
                    <p {...props} style={{ margin: '12px 0' }}>
                      {children}
                    </p>
                  );
                })()
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

      {sameCategoryArticles.length ? (
        <section className="articleRelatedSection">
          <p className="articleRelatedEyebrow articleRelatedEyebrowRight">Más sobre: {article.category?.name || 'esta categoría'}</p>
          <div className="articleRelatedList">
            {sameCategoryArticles.map((relatedArticle) => {
              const relatedImageUrl = relatedArticle.cover_image ? directusAssetUrl(getDirectusFileId(relatedArticle.cover_image)) : '';

              return (
                <Link
                  key={relatedArticle.id}
                  href={`/noticias/${relatedArticle.slug}`}
                  className="articleRelatedRow"
                >
                  <div
                    className="articleRelatedThumb"
                    style={{ backgroundImage: relatedImageUrl ? `url(${relatedImageUrl})` : 'none' }}
                  />
                  <div className="articleRelatedMeta">
                    <div className="articleRelatedCategory">
                      {relatedArticle.category?.name || 'Categoría'}
                    </div>
                    <div className="articleRelatedHeadline">
                      {relatedArticle.title}
                    </div>
                    <div className="articleRelatedTime">
                      {relatedArticle.published_at ? formatPublishedAt(relatedArticle.published_at) : 'Reciente'}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {crossCategoryArticles.length ? (
        <section className="articleRelatedSection">
          <p className="articleRelatedEyebrow articleRelatedEyebrowLeft">También podría interesarte:</p>
          <div className="articleRelatedCrossGrid">
            {crossCategoryArticles.map((relatedArticle) => {
              const relatedImageUrl = relatedArticle.cover_image ? directusAssetUrl(getDirectusFileId(relatedArticle.cover_image)) : '';

              return (
                <Link
                  key={relatedArticle.id}
                  href={`/noticias/${relatedArticle.slug}`}
                  className="articleRelatedCrossCard"
                >
                  <div
                    className="articleRelatedCrossImage"
                    style={{ backgroundImage: relatedImageUrl ? `url(${relatedImageUrl})` : 'none' }}
                  />
                  <div className="articleRelatedCrossBody">
                    <div className="articleRelatedCategory">
                      {relatedArticle.category?.name || 'Categoría'}
                    </div>
                    <div className="articleRelatedCrossHeadline">
                      {relatedArticle.title}
                    </div>
                    <div className="articleRelatedTime">
                      {relatedArticle.published_at ? formatPublishedAt(relatedArticle.published_at) : 'Reciente'}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </main>
  );
}
