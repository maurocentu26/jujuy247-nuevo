import Link from 'next/link';
import { notFound } from 'next/navigation';
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
import { formatPublishedAt, parsePublishedAt } from '../../../lib/datetime';
import { articleDescription, breadcrumbs, categoryUrl, serializeJsonLd } from '../../../lib/site';
import { createStoryPicker, readingMinutes, splitMarkdownAfterParagraph } from '../../../lib/article-layout.mjs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CurrentArticleTitle from '../../components/CurrentArticleTitle';
import GalleryAwarePre from '../../components/GalleryAwarePre';
import ArticleCover from '../../components/article/ArticleCover';
import ArticleReadingTools from '../../components/article/ArticleReadingTools';
import ArticleShare from '../../components/article/ArticleShare';
import StoryCard from '../../components/article/StoryCard';
import './article.css';

export const dynamic = 'force-dynamic';

const OPINION_SLUG = 'opinion';

function renderYoutubeEmbed(embedUrl, title) {
  return (
    <div className="article-video">
      <iframe
        src={embedUrl}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
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

// Category names are stored in capitals in the CMS ("POLICIALES Y JUDICIALES").
// Headings read better in sentence case; short names stay as they are.
function sectionName(name) {
  const clean = typeof name === 'string' ? name.trim() : '';
  if (!clean || clean !== clean.toUpperCase()) return clean;
  const lower = clean.toLocaleLowerCase('es-AR');
  return lower.charAt(0).toLocaleUpperCase('es-AR') + lower.slice(1);
}

const markdownComponents = {
  h1: ({ node, children, ...props }) => <h2 {...props}>{children}</h2>,
  a: ({ node, children, ...props }) => (
    <a {...props} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  pre: GalleryAwarePre,
  img: ({ node, ...props }) => {
    const credit = typeof props.title === 'string' ? props.title.trim() : '';
    return (
      <span className="article-figure">
        <img {...props} alt={props.alt || credit} loading="lazy" decoding="async" />
        {credit ? <span className="article-figure-credit">{credit}</span> : null}
      </span>
    );
  },
  p: ({ node, children, ...props }) => {
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
      if (onlyChild.type === 'img' || onlyChild.props?.node?.tagName === 'img') {
        return onlyChild;
      }
    }

    return <p {...props}>{children}</p>;
  },
};

function Markdown({ children }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {children}
    </ReactMarkdown>
  );
}

export async function generateMetadata({ params }) {
  const { slug } = await Promise.resolve(params);
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const title = article.seo_title || article.title;
  const description = articleDescription(article);
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
      'max-image-preview': 'large',
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      siteName: 'Jujuy247',
      locale: 'es_AR',
      publishedTime: parsePublishedAt(article.published_at)?.toISOString(),
      tags: Array.isArray(article.tags) ? article.tags.map((t) => t.name).filter(Boolean) : undefined,
      images: [{ url: imageUrl || '/seo-imgs/share-img.jpeg', alt: article.title }],
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
    notFound();
  }

  const canonical = getCanonicalUrlForArticle(article);
  const site = getSiteUrl();
  const shareImageId = getDirectusFileId(article.seo_image) || getDirectusFileId(article.cover_image);
  const shareImageUrl = shareImageId ? directusAssetUrl(shareImageId) : '';
  // The page shows the cover (it carries width, height and focal point); the
  // SEO image is only a fallback when an article has no cover.
  const coverId = getDirectusFileId(article.cover_image) || getDirectusFileId(article.seo_image);
  const coverUrl = coverId ? directusAssetUrl(coverId) : '';
  const coverFile = getDirectusFileId(article.cover_image) ? article.cover_image : null;
  const youtubeEmbedUrl = getYoutubeEmbedUrl(article.youtube_url);
  const sourceName = typeof article.source_name === 'string' ? article.source_name.trim() : '';
  const sourceUrl = typeof article.source_url === 'string' ? article.source_url.trim() : '';
  const category = article.category?.slug ? article.category : null;
  const categoryLabel = sectionName(category?.name);
  const isOpinion = category?.slug === OPINION_SLUG;
  const minutes = readingMinutes(article.content);
  const publishedIso = parsePublishedAt(article.published_at)?.toISOString();

  const [sameCategoryArticles, latestPool, opinionPool] = await Promise.all([
    category?.id
      ? getOtherArticlesInCategory({ categoryId: category.id, excludeId: article.id, limit: 6, imageMeta: true }).catch(() => [])
      : [],
    getLatestArticles({ limit: 30, imageMeta: true }).catch(() => []),
    isOpinion ? [] : getLatestArticles({ limit: 4, categorySlug: OPINION_SLUG }).catch(() => []),
  ]);

  // Every block draws from the same picker, so no story appears twice.
  // Same section: the next story and the sidebar list. Other sections: the
  // card inside the text and the "Más noticias" row, so the reader also sees
  // what is happening elsewhere.
  const pick = createStoryPicker([article.id]);
  const otherSections = latestPool.filter((item) => item?.category?.id !== category?.id);
  const [inlineStory] = pick(shuffleArticles(otherSections), 1);
  const nextStory = pick(sameCategoryArticles, 1)[0] || pick(latestPool, 1)[0];
  const sectionStories = pick(sameCategoryArticles, 5);
  const sideStories = sectionStories.length >= 2 ? sectionStories : [...sectionStories, ...pick(latestPool, 5 - sectionStories.length)];
  const sideHeading = sectionStories.length >= 2 && categoryLabel ? `Más de ${categoryLabel}` : 'Lo último';
  const opinionStories = pick(opinionPool, 3);
  const moreStories = pick(otherSections, 3);
  if (moreStories.length < 3) moreStories.push(...pick(latestPool, 3 - moreStories.length));

  const [bodyStart, bodyRest] = inlineStory ? splitMarkdownAfterParagraph(article.content || '', 3) : [article.content || '', ''];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title.trim(),
    description: articleDescription(article) || undefined,
    datePublished: publishedIso,
    inLanguage: 'es-AR',
    articleSection: category?.name || undefined,
    keywords: Array.isArray(article.tags) ? article.tags.map((t) => t.name).filter(Boolean).join(', ') : undefined,
    mainEntityOfPage: canonical,
    url: canonical,
    image: shareImageUrl || undefined,
    publisher: {
      '@type': 'NewsMediaOrganization',
      '@id': `${site}/#organization`,
      name: 'Jujuy247',
      url: site,
      logo: { '@type': 'ImageObject', url: `${site}/logo3.png` },
    },
  };

  return (
    <main className={isOpinion ? 'article-page is-opinion' : 'article-page'}>
      <CurrentArticleTitle title={article.title} />
      <ArticleReadingTools url={canonical} title={article.title.trim()} next={nextStory ? { slug: nextStory.slug, title: nextStory.title } : null} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd([
        jsonLd,
        breadcrumbs([
          { name: 'Inicio', url: site },
          ...(category ? [{ name: category.name.trim(), url: categoryUrl(category.slug) }] : []),
          { name: article.title.trim(), url: canonical },
        ]),
      ]) }} />

      <div className="article-layout">
        <article className="article-main">
          <header className="article-head">
            <nav aria-label="Ruta de navegación" className="article-crumbs">
              <Link href="/">Inicio</Link>
              {category ? (
                <>
                  <span aria-hidden="true">/</span>
                  <Link href={categoryUrl(category.slug)} className="article-section-link">{categoryLabel}</Link>
                </>
              ) : null}
            </nav>
            <h1>{article.title}</h1>
            {article.excerpt ? <p className="article-deck">{article.excerpt}</p> : null}
            <div className="article-byline">
              <p className="article-meta">
                {article.published_at ? <time dateTime={publishedIso}>{formatPublishedAt(article.published_at)}</time> : null}
                {minutes ? <span>{minutes} min de lectura</span> : null}
                {sourceName ? (
                  <span>
                    Fuente:{' '}
                    {sourceUrl ? (
                      <a className="sourceLink" href={sourceUrl} target="_blank" rel="noreferrer">{sourceName}</a>
                    ) : (
                      sourceName
                    )}
                  </span>
                ) : null}
              </p>
              <ArticleShare url={canonical} title={article.title.trim()} />
            </div>
          </header>

          {youtubeEmbedUrl ? renderYoutubeEmbed(youtubeEmbedUrl, `Video: ${article.title}`) : null}
          {youtubeEmbedUrl ? null : <ArticleCover src={coverUrl} file={coverFile} alt={article.title} />}

          <div className="article-body-wrap">
            <div className="article-rail">
              <div className="article-rail-sticky">
                <span className="article-rail-label">Compartir</span>
                <ArticleShare url={canonical} title={article.title.trim()} />
              </div>
            </div>
            <div className="article-body-column">
              <div className="article-text" data-article-body>
                {article.content ? (
                  <>
                    <Markdown>{bodyStart}</Markdown>
                    {bodyRest ? (
                      <>
                        <aside className="article-inline-related" aria-label="Otra nota">
                          <StoryCard article={inlineStory} variant="inline" />
                        </aside>
                        <Markdown>{bodyRest}</Markdown>
                      </>
                    ) : null}
                  </>
                ) : (
                  <p className="article-empty">Sin contenido.</p>
                )}
              </div>

              <footer className="article-foot">
                {Array.isArray(article.tags) && article.tags.length ? (
                  <ul className="article-tags" aria-label="Temas">
                    {article.tags.map((t) => <li key={t.id}>#{t.name}</li>)}
                  </ul>
                ) : null}
                <div className="article-foot-share">
                  <span>Compartí esta nota</span>
                  <ArticleShare url={canonical} title={article.title.trim()} />
                </div>
              </footer>
            </div>
          </div>

          {nextStory || moreStories.length ? (
            <section className="article-continue" aria-labelledby="seguir-leyendo" data-article-end>
              <h2 id="seguir-leyendo" className="article-block-title">Seguí leyendo</h2>
              {nextStory ? <StoryCard article={nextStory} variant="next" showExcerpt /> : null}
              {moreStories.length ? (
                <div className="article-more">
                  <div className="article-more-head">
                    <h3>Más noticias</h3>
                    <Link href="/">Ir a la portada</Link>
                  </div>
                  <div className="article-more-track">
                    {moreStories.map((item) => <StoryCard key={item.id} article={item} variant="card" />)}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}
        </article>

        {sideStories.length || opinionStories.length ? (
          <aside className="article-aside" aria-label="Más noticias">
            <div className="article-aside-inner">
              {sideStories.length ? (
                <section className="aside-block">
                  <div className="article-more-head">
                    <h2 className="article-block-title">{sideHeading}</h2>
                    {sideHeading !== 'Lo último' ? <Link href={categoryUrl(category.slug)}>Ver todas</Link> : null}
                  </div>
                  <ol className="aside-rank">
                    {sideStories.map((item, index) => (
                      <li key={item.id}><StoryCard article={item} variant="rank" index={index} showCategory={sideHeading === 'Lo último'} /></li>
                    ))}
                  </ol>
                </section>
              ) : null}
              {opinionStories.length ? (
                <section className="aside-block aside-opinion">
                  <div className="article-more-head">
                    <h2 className="article-block-title">Opinión</h2>
                    <Link href={categoryUrl(OPINION_SLUG)}>Ver todas</Link>
                  </div>
                  <div className="aside-opinion-track">
                    {opinionStories.map((item) => <StoryCard key={item.id} article={item} variant="opinion" showCategory={false} />)}
                  </div>
                </section>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>
    </main>
  );
}
