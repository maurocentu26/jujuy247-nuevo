import Link from 'next/link';
import {
  directusAssetUrl,
  getDirectusFileId,
  getCategoryBySlug,
  getTopCategoriesWithRecentArticles,
  getFrontPageArticleInCategory,
  getOtherArticlesInCategory,
} from '../lib/directus';
import { getChannelIdForHandle, getLatestChannelVideos, getLiveVideoForChannel } from '../lib/youtube';
import YouTubeCarouselCard from './components/YouTubeCarouselCard';

export const dynamic = 'force-dynamic';

function formatRelativeTime(dateString) {
  if (!dateString) return 'Ahora';

  const ms = Date.now() - new Date(dateString).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'Ahora';

  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `Hace ${Math.max(mins, 1)} min`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;

  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}

export default async function HomePage({ searchParams }) {
  const youtubeChannelUrl = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL || '#';
  const youtubeApiKey = process.env.YOUTUBE_API_KEY || '';
  const youtubeChannelHandle = process.env.YOUTUBE_CHANNEL_HANDLE || '';

  let youtubeChannelId = process.env.YOUTUBE_CHANNEL_ID || '';
  if (!youtubeChannelId && youtubeApiKey && youtubeChannelHandle) {
    youtubeChannelId = await getChannelIdForHandle({ apiKey: youtubeApiKey, handle: youtubeChannelHandle }).catch(() => '');
  }

  const [liveVideo, latestVideos] = await Promise.all([
    getLiveVideoForChannel({ apiKey: youtubeApiKey, channelId: youtubeChannelId }).catch(() => null),
    getLatestChannelVideos({ apiKey: youtubeApiKey, channelId: youtubeChannelId, limit: 10 }).catch(() => []),
  ]);

  const sp = await Promise.resolve(searchParams);
  const categoryParam = sp?.category;

  const categorySlugRaw = Array.isArray(categoryParam) ? categoryParam[0] : categoryParam;
  let categorySlug = '';
  if (typeof categorySlugRaw === 'string' && categorySlugRaw.trim()) {
    try {
      categorySlug = decodeURIComponent(categorySlugRaw.trim());
    } catch {
      categorySlug = categorySlugRaw.trim();
    }
  }

  const selectedCategory = categorySlug ? await getCategoryBySlug(categorySlug).catch(() => null) : null;

  const categories = categorySlug
    ? selectedCategory
      ? [selectedCategory]
      : []
    : await getTopCategoriesWithRecentArticles({ limitCategories: 5, days: 7 }).catch(() => []);

  const sections = await Promise.all(
    categories.map(async (c) => {
      const frontPage = await getFrontPageArticleInCategory({ categoryId: c.id }).catch(() => null);
      const latest = await getOtherArticlesInCategory({
        categoryId: c.id,
        excludeId: frontPage?.id,
        limit: 6,
      }).catch(() => []);

      const featured = frontPage || latest[0] || null;
      const list = featured ? latest.filter((a) => a.id !== featured.id).slice(0, 4) : latest.slice(0, 5);

      return { category: c, featured, list, isFeaturedFrontPage: Boolean(frontPage) };
    })
  );

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: 'clamp(16px, 3vw, 24px)' }}>
      <h1 style={{ position: 'absolute', left: -9999, top: -9999 }}>Jujuy247</h1>

      <section className="youtubeVideoStrip">
        <YouTubeCarouselCard videos={latestVideos} channelUrl={youtubeChannelUrl} liveVideo={liveVideo} />
      </section>

      <section className="newsBlocksWrap">
        {sections.length === 0 ? (
          <div style={{ padding: 16, border: '1px solid #e5e5e5', borderRadius: 12 }}>
            {categorySlug
              ? 'Categoría no encontrada (o sin permisos). Probá seleccionar otra categoría.'
              : 'No hay categorías o noticias todavía. Cargá contenido desde el admin.'}
          </div>
        ) : (
          sections.map(({ category: c, featured, list, isFeaturedFrontPage }) => {
            const sideItems = Array.isArray(list) ? list.slice(0, 5) : [];
            const cards = Array.isArray(list) ? list.slice(0, 3) : [];

            const heroImage = featured?.cover_image ? directusAssetUrl(getDirectusFileId(featured.cover_image)) : '';

            return (
              <section key={c.id} className="newsBlock">
                <header className="newsBlockHeader">
                  <h2>{c.name}</h2>
                  <span>{(featured ? 1 : 0) + sideItems.length} noticias</span>
                </header>

                <div className="newsTopLayout">
                  <article className="newsHeroCard">
                    {featured ? (
                      <Link
                        href={`/noticias/${featured.slug}`}
                        className="newsHeroLink"
                        style={{
                          backgroundImage: heroImage
                            ? `linear-gradient(180deg, rgba(9,20,36,0.10) 0%, rgba(9,20,36,0.86) 70%), url(${heroImage})`
                            : 'linear-gradient(180deg, rgba(13,24,41,0.35), rgba(13,24,41,0.92))',
                        }}
                      >
                        <div className="newsHeroBadge">{isFeaturedFrontPage ? 'Ultima hora' : 'Destacado'}</div>
                        <h3>{featured.title}</h3>
                        {featured.excerpt ? <p>{featured.excerpt}</p> : null}
                        <div className="newsHeroMeta">{formatRelativeTime(featured.published_at)} · Leer mas</div>
                      </Link>
                    ) : (
                      <div className="newsHeroLink">No hay noticias en esta categoría.</div>
                    )}
                  </article>

                  <aside className="newsSideRail">
                    <div className="newsSideTitle">Lo ultimo</div>
                    <div className="newsSideList">
                      {sideItems.map((a) => {
                        const sideImage = a?.cover_image ? directusAssetUrl(getDirectusFileId(a.cover_image)) : '';

                        return (
                          <Link key={a.id} href={`/noticias/${a.slug}`} className="newsSideItem">
                            <div
                              className="newsSideThumb"
                              style={{
                                backgroundImage: sideImage
                                  ? `url(${sideImage})`
                                  : 'linear-gradient(180deg, rgba(10,20,36,0.18), rgba(10,20,36,0.65))',
                              }}
                            />
                            <div className="newsSideBody">
                              <div className="newsSideCategory">{c.name}</div>
                              <div className="newsSideHeadline">{a.title}</div>
                              <div className="newsSideTime">{formatRelativeTime(a.published_at)}</div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </aside>
                </div>

                {cards.length ? (
                  <div className="newsCardsRow">
                    {cards.map((a) => {
                      const cardImage = a?.cover_image ? directusAssetUrl(getDirectusFileId(a.cover_image)) : '';

                      return (
                        <Link key={a.id} href={`/noticias/${a.slug}`} className="newsMiniCard">
                          <div
                            className="newsMiniCardImage"
                            style={{
                              backgroundImage: cardImage
                                ? `url(${cardImage})`
                                : 'linear-gradient(180deg, rgba(12,25,44,0.22), rgba(12,25,44,0.68))',
                            }}
                          />
                          <div className="newsMiniCardBody">
                            <div className="newsMiniCardCategory">{c.name}</div>
                            <div className="newsMiniCardTitle">{a.title}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            );
          })
        )}
      </section>
    </main>
  );
}
