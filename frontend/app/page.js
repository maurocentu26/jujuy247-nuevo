import Link from 'next/link';
import {
  directusAssetUrl,
  getDirectusFileId,
  getCategoryBySlug,
  getLatestArticles,
  getTopCategoriesWithRecentArticles,
  getFrontPageArticleInCategory,
  getOtherArticlesInCategory,
} from '../lib/directus';
import AudioPlayer from './components/AudioPlayer';
import { getChannelIdForHandle, getLatestChannelVideos, getLiveVideoForChannel } from '../lib/youtube';
import YouTubeCarouselCard from './components/YouTubeCarouselCard';
import YouTubeLiveBlock from './components/YouTubeLiveBlock';
import LatestNewsCarousel from './components/LatestNewsCarousel';

export const dynamic = 'force-dynamic';

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

  const latestArticlesRaw = await getLatestArticles({ limit: 10 }).catch(() => []);
  const latestArticles = Array.isArray(latestArticlesRaw)
    ? latestArticlesRaw
        .map((a) => {
          const coverFileId = getDirectusFileId(a?.cover_image);
          return {
            id: a?.id,
            slug: a?.slug,
            title: a?.title,
            excerpt: a?.excerpt,
            categoryName: a?.category?.name || '',
            coverUrl: coverFileId ? directusAssetUrl(coverFileId) : '',
          };
        })
        .filter((a) => a.id && a.slug && a.title)
    : [];

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

      <LatestNewsCarousel items={latestArticles} />

      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 980px', minWidth: 260 }}>
          {liveVideo?.id ? (
            <YouTubeLiveBlock liveVideo={liveVideo} videos={latestVideos} channelUrl={youtubeChannelUrl} />
          ) : (
            <YouTubeCarouselCard videos={latestVideos} channelUrl={youtubeChannelUrl} liveVideo={liveVideo} />
          )}
        </div>

        <div style={{ flex: '1 1 980px', minWidth: 260, maxWidth: 980 }}>
          <AudioPlayer />
        </div>
      </header>

      <section style={{ marginTop: 24, display: 'grid', gap: 34 }}>
        {sections.length === 0 ? (
          <div style={{ padding: 16, border: '1px solid #e5e5e5', borderRadius: 12 }}>
            {categorySlug
              ? 'Categoría no encontrada (o sin permisos). Probá seleccionar otra categoría.'
              : 'No hay categorías o noticias todavía. Cargá contenido desde el admin.'}
          </div>
        ) : (
          sections.map(({ category: c, featured, list, isFeaturedFrontPage }) => {
            const count = (featured ? 1 : 0) + (Array.isArray(list) ? list.length : 0);
            const hasList = Array.isArray(list) && list.length > 0;

            return (
              <div key={c.id}>
                <div style={{ paddingBottom: 10, borderBottom: '2px solid #e5e5e5' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                    <h2 style={{ margin: 0, fontSize: 'clamp(18px, 3.5vw, 22px)', letterSpacing: 0.2 }}>{c.name}</h2>
                    <span style={{ fontSize: 12, opacity: 0.65 }}>{count} noticias</span>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 12,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 18,
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ minWidth: 0, flex: '1 1 560px' }}>
                    {featured ? (
                      <article style={{ borderRadius: 12 }}>
                        {getDirectusFileId(featured.cover_image) ? (
                          <Link href={`/noticias/${featured.slug}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                            <img
                              src={directusAssetUrl(getDirectusFileId(featured.cover_image))}
                              alt={featured.title}
                              loading="lazy"
                              style={{
                                width: '100%',
                                height: 'auto',
                                aspectRatio: '16 / 9',
                                maxHeight: 360,
                                objectFit: 'cover',
                                borderRadius: 12,
                                display: 'block',
                              }}
                            />
                          </Link>
                        ) : null}

                        <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.2, opacity: 0.8 }}>
                            {isFeaturedFrontPage ? 'DESTACADO' : 'ÚLTIMA'}
                          </span>
                          <h3 style={{ margin: 0, fontSize: 'clamp(20px, 4.5vw, 26px)', lineHeight: 1.15 }}>
                            <Link href={`/noticias/${featured.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                              {featured.title}
                            </Link>
                          </h3>
                        </div>

                        {featured.excerpt ? (
                          <p style={{ margin: '10px 0 0', opacity: 0.85, fontSize: 'clamp(14px, 3.2vw, 16px)' }}>{featured.excerpt}</p>
                        ) : null}
                      </article>
                    ) : (
                      <div style={{ padding: 12, opacity: 0.8, fontSize: 13 }}>No hay noticias en esta categoría.</div>
                    )}
                  </div>

                  {hasList ? (
                    <aside style={{ minWidth: 0, flex: '1 1 260px', maxWidth: 360 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 0.2, marginBottom: 10 }}>
                        Últimas
                      </div>

                      <div style={{ display: 'grid', gap: 10 }}>
                        {list.map((a) => (
                          <div key={a.id} style={{ minWidth: 0 }}>
                            <Link href={`/noticias/${a.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                              <div style={{ fontSize: 14, lineHeight: 1.25, fontWeight: 650 }}>
                                {a.title}
                                {a.front_page ? <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}>(portada)</span> : null}
                              </div>
                            </Link>
                            {a.excerpt ? (
                              <div
                                style={{
                                  marginTop: 4,
                                  fontSize: 12,
                                  opacity: 0.75,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {a.excerpt}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </aside>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </section>
    </main>
  );
}
