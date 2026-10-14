import Link from 'next/link';
import { directusAssetUrl, getDirectusFileId } from '../../lib/directus';
import { formatRelativePublishedAt } from '../../lib/datetime';
import { categoryUrl } from '../../lib/site';

function getCardImage(article) {
  return article?.cover_image ? directusAssetUrl(getDirectusFileId(article.cover_image)) : '';
}

export default function CategoryFeedClient({ category, initialArticles, initialHasMore = false, page = 1 }) {
  const articles = Array.isArray(initialArticles) ? initialArticles : [];
  const slug = String(category?.slug || '').trim();
  const title = String(category?.name || '').trim() || slug || 'Categoría';
  const leadArticle = articles[0] || null;
  const secondaryArticles = articles.slice(1, 4);
  const listArticles = articles.slice(4);

  return (
    <section className="categoryFeedShell">
      <header className="categoryFeedHeader">
        <div>
          <p className="categoryFeedEyebrow">Categoría</p>
          <h1 className="categoryFeedTitle">{title}{page > 1 ? ` · Página ${page}` : ''}</h1>
        </div>
        <div className="categoryFeedCounter">{articles.length} noticias</div>
      </header>

      {leadArticle ? (
        <article className="categoryFeedHero">
          <Link
            href={`/noticias/${leadArticle.slug}`}
            aria-label={leadArticle.title}
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

      <nav className="categoryFeedActions" aria-label="Paginación de noticias">
        {page > 1 ? <Link className="categoryFeedLoadMore" href={categoryUrl(slug, page - 1)} rel="prev">← Más recientes</Link> : null}
        <span aria-current="page">Página {page}</span>
        {initialHasMore ? <Link className="categoryFeedLoadMore" href={categoryUrl(slug, page + 1)} rel="next">Noticias anteriores →</Link> : null}
      </nav>
    </section>
  );
}
