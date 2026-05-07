'use client';

import Link from 'next/link';
import { useState } from 'react';
import { directusAssetUrl, getDirectusFileId } from '../../lib/directus';
import { formatRelativePublishedAt } from '../../lib/datetime';

function getCardImage(article) {
  return article?.cover_image ? directusAssetUrl(getDirectusFileId(article.cover_image)) : '';
}

export default function CategoryFeedClient({ category, initialArticles, initialHasMore = false }) {
  const [articles, setArticles] = useState(Array.isArray(initialArticles) ? initialArticles : []);
  const [hasMore, setHasMore] = useState(Boolean(initialHasMore));
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');

  const slug = String(category?.slug || '').trim();
  const title = String(category?.name || '').trim() || slug || 'Categoría';
  const leadArticle = articles[0] || null;
  const secondaryArticles = articles.slice(1, 4);
  const listArticles = articles.slice(4);

  const loadMore = async () => {
    if (!slug || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setLoadError('');

    try {
      const response = await fetch(`/api/categoria/${encodeURIComponent(slug)}/articles?offset=${articles.length}&limit=10`);
      if (!response.ok) {
        throw new Error('No se pudieron cargar más noticias.');
      }

      const payload = await response.json();
      const nextArticles = Array.isArray(payload?.articles) ? payload.articles : [];
      setArticles((current) => [...current, ...nextArticles]);
      setHasMore(Boolean(payload?.hasMore));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar más noticias.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <section className="categoryFeedShell">
      <header className="categoryFeedHeader">
        <div>
          <p className="categoryFeedEyebrow">Categoría</p>
          <h1 className="categoryFeedTitle">{title}</h1>
        </div>
        <div className="categoryFeedCounter">{articles.length} noticias</div>
      </header>

      {leadArticle ? (
        <article className="categoryFeedHero">
          <Link
            href={`/noticias/${leadArticle.slug}`}
            className="categoryFeedHeroImage"
            style={{ backgroundImage: getCardImage(leadArticle) ? `url(${getCardImage(leadArticle)})` : 'none' }}
          />
          <div className="categoryFeedHeroBody">
            <div className="frontPageCategory">DESTACADA</div>
            <h2 className="categoryFeedHeroTitle">
              <Link href={`/noticias/${leadArticle.slug}`}>{leadArticle.title}</Link>
            </h2>
            {leadArticle.excerpt ? <p className="categoryFeedHeroExcerpt">{leadArticle.excerpt}</p> : null}
            <div className="categoryFeedHeroMeta">{formatRelativePublishedAt(leadArticle.published_at)}</div>
          </div>
        </article>
      ) : (
        <div className="categoryFeedEmpty">No hay noticias publicadas en esta categoría.</div>
      )}

      {secondaryArticles.length ? (
        <div className="categoryFeedTopGrid">
          {secondaryArticles.map((article, index) => {
            const image = getCardImage(article);
            return (
              <Link key={article.id} href={`/noticias/${article.slug}`} className={index === 0 ? 'categoryFeedTopCard categoryFeedTopCardWide' : 'categoryFeedTopCard'}>
                <div className="categoryFeedTopImage" style={{ backgroundImage: image ? `url(${image})` : 'none' }} />
                <div className="categoryFeedTopBody">
                  <div className="frontPageCategory">{index === 0 ? 'AMPLIADA' : 'NOTA'}</div>
                  <h3>{article.title}</h3>
                  <div className="categoryFeedHeroMeta">{formatRelativePublishedAt(article.published_at)}</div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}

      {listArticles.length ? (
        <div className="categoryFeedList">
          {listArticles.map((article) => {
            const image = getCardImage(article);
            return (
              <Link key={article.id} href={`/noticias/${article.slug}`} className="categoryFeedListItem">
                <div className="categoryFeedListBody">
                  <div className="frontPageCategory">NOTICIA</div>
                  <h3>{article.title}</h3>
                  {article.excerpt ? <p>{article.excerpt}</p> : null}
                  <div className="categoryFeedHeroMeta">{formatRelativePublishedAt(article.published_at)}</div>
                </div>
                <div className="categoryFeedListThumb" style={{ backgroundImage: image ? `url(${image})` : 'none' }} />
              </Link>
            );
          })}
        </div>
      ) : null}

      {loadError ? <p className="categoryFeedError">{loadError}</p> : null}

      {hasMore ? (
        <div className="categoryFeedActions">
          <button type="button" className="categoryFeedLoadMore" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? 'Cargando...' : 'Cargar más'}
          </button>
        </div>
      ) : null}
    </section>
  );
}
