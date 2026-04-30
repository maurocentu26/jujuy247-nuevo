import Link from 'next/link';
import {
  directusAssetUrl,
  getDirectusFileId,
  getCategories,
  getCategoryBySlug,
  getFrontPageArticleInCategory,
  getOtherArticlesInCategory,
  getLatestArticles,
  getAds,
  sortAdsByOrder,
  sortCategoriesByPosition,
} from '../lib/directus';
import { formatRelativePublishedAt } from '../lib/datetime';
import { getChannelIdForHandle, getLatestChannelVideos, getLiveVideoForChannel } from '../lib/youtube';
import YouTubeCarouselCard from './components/YouTubeCarouselCard';
import AdCarousel from './components/AdCarousel';
import GoogleAdSlot from './components/GoogleAdSlot';

export const dynamic = 'force-dynamic';
const ONE_HOUR_MS = 60 * 60 * 1000;
const CATEGORY_COLOR = '#d61f29';

function buildCategoryDisplayMap(categories) {
  const map = new Map();

  (Array.isArray(categories) ? categories : []).forEach((category, index) => {
    const slug = String(category?.slug || '').toLowerCase();
    const name = String(category?.name || '').trim();
    if (!slug) return;

    map.set(slug, {
      label: name || slug,
      color: CATEGORY_COLOR,
    });
  });

  return map;
}

function getCategoryDisplay(category, categoryDisplayMap) {
  const slug = String(category?.slug || '').toLowerCase();
  const name = String(category?.name || '').trim();
  const display = categoryDisplayMap?.get(slug);

  if (display) return display;

  return {
    label: name || slug || 'General',
    color: CATEGORY_COLOR,
  };
}

function truncateTitle(value, maxLength) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (!Number.isFinite(maxLength) || maxLength <= 0 || text.length <= maxLength) return text;

  const sliceLength = Math.max(0, maxLength - 3);
  return `${text.slice(0, sliceLength).trimEnd()}...`;
}

function getFeaturedBadgeLabel(article) {
  if (!article?.front_page) return 'Destacado';

  const publishedAt = article?.published_at ? new Date(article.published_at) : null;
  if (!publishedAt || Number.isNaN(publishedAt.getTime())) return 'Ultima hora';

  const ageMs = Date.now() - publishedAt.getTime();
  return ageMs > ONE_HOUR_MS ? 'Más reciente' : 'Ultima hora';
}

export const metadata = {
  title: 'Jujuy247 | Estamos en el aire de Jujuy',
  description: 'Ultimas noticias de Jujuy, actualidad, deportes, política, cultura y más. Estamos en el aire de Jujuy las 24 horas.',
  keywords: [
    'Noticias de Jujuy',
    'Jujuy247',
    'Jujuy noticias',
    'actualidad Jujuy',
    'noticias del NOA',
    'radio Jujuy',
    'portal de noticias Jujuy',
    'Berta Geronimo',
    'periodismo Jujuy',
    'Jujuy24/7',
  ],
  robots: {
    index: true,
    follow: true,
  },
};

export default async function HomePage({ searchParams }) {
  const youtubeChannelUrl = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL || '#';
  const youtubeApiKey = process.env.YOUTUBE_API_KEY || '';
  const youtubeChannelHandle = process.env.YOUTUBE_CHANNEL_HANDLE || '';
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || '';
  const adsenseSlots = {
    high: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HIGH || '',
    highMid: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HIGH_MID || '',
    mid: process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID || '',
    lowMid: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LOW_MID || '',
    low: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LOW || '',
  };

  let youtubeChannelId = process.env.YOUTUBE_CHANNEL_ID || '';
  if (!youtubeChannelId && youtubeApiKey && youtubeChannelHandle) {
    youtubeChannelId = await getChannelIdForHandle({ apiKey: youtubeApiKey, handle: youtubeChannelHandle }).catch(() => '');
  }

  const [liveVideo, latestVideos, latestHeadlines, allAds] = await Promise.all([
    getLiveVideoForChannel({ apiKey: youtubeApiKey, channelId: youtubeChannelId }).catch(() => null),
    getLatestChannelVideos({ apiKey: youtubeApiKey, channelId: youtubeChannelId, limit: 10 }).catch(() => []),
    getLatestArticles({ limit: 10 }).catch(() => []),
    getAds().catch(() => []),
  ]);

  const adsByPriority = (priority) => sortAdsByOrder(allAds.filter((ad) => String(ad?.priority || '').toLowerCase() === priority));

  const adsTop = adsByPriority('high');
  const adsHighMid = adsByPriority('high-mid');
  const adsMid = adsByPriority('mid');
  const adsLowMid = adsByPriority('low-mid');
  const adsBottom = adsByPriority('low');

  const renderAdSlot = (ads, { marginTop = 0, marginBottom = 0, maxWidth = '100%', variant = 'wide', adsenseSlot = '' } = {}) => {
    if (!Array.isArray(ads) || ads.length === 0) return null;
    const hasAdsense = Boolean(adsenseClient && adsenseSlot);

    return (
      <div style={{ marginTop, marginBottom, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth, display: 'grid', gap: hasAdsense ? 12 : 0 }}>
          {hasAdsense ? <GoogleAdSlot client={adsenseClient} slot={adsenseSlot} variant={variant} /> : null}
          <AdCarousel ads={ads} variant={variant} />
        </div>
      </div>
    );
  };

  const allCategories = await getCategories({ limit: 100 }).catch(() => []);
  const categoryDisplayMap = buildCategoryDisplayMap(allCategories);

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
    : sortCategoriesByPosition(allCategories);

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

      return { category: c, featured, list, featuredBadgeLabel: getFeaturedBadgeLabel(featured) };
    })
  );

  const sectionsSorted = [...sections].sort((a, b) => {
    const aPos = Number(a?.category?.position);
    const bPos = Number(b?.category?.position);
    const aHasPos = Number.isFinite(aPos);
    const bHasPos = Number.isFinite(bPos);

    if (aHasPos && bHasPos && aPos !== bPos) return aPos - bPos;
    if (aHasPos && !bHasPos) return -1;
    if (!aHasPos && bHasPos) return 1;

    return String(a?.category?.name || '').localeCompare(String(b?.category?.name || ''), 'es');
  });

  const [firstSection, ...restSections] = sectionsSorted;
  const firstSectionCategory = firstSection?.category || null;
  const firstSectionDisplay = getCategoryDisplay(firstSectionCategory, categoryDisplayMap);
  const firstSectionFeatured = firstSection?.featured || null;
  const firstSectionFeaturedImage = firstSectionFeatured?.cover_image
    ? directusAssetUrl(getDirectusFileId(firstSectionFeatured.cover_image))
    : '';
  const firstSectionList = Array.isArray(firstSection?.list) ? firstSection.list.slice(0, 4) : [];

  const middleSections = restSections.slice(0, 5);
  const rightSections = restSections.slice(5, 8);
  const secondarySections = sectionsSorted.slice(1);
  const earlySecondarySections = secondarySections.slice(0, 2);
  const middleSecondarySections = secondarySections.slice(2, 5);
  const lateSecondarySections = secondarySections.slice(5);
  const promoSectionId = secondarySections.length ? secondarySections[Math.floor(Math.random() * secondarySections.length)]?.category?.id || null : null;

  const renderSectionBlock = ({ category, featured, list }) => {
    if (!category || !featured) return null;

    const display = getCategoryDisplay(category, categoryDisplayMap);
    const featuredImage = featured.cover_image ? directusAssetUrl(getDirectusFileId(featured.cover_image)) : '';
    const listItems = Array.isArray(list) ? list.slice(0, 3) : [];

    return (
      <section className="newsSectionBlock" key={category.id}>
        <header className="newsSectionHeader">
          <div>
            <div className="newsSectionEyebrow" style={{ color: display.color }}>
              SECCIÓN
            </div>
            <h2 className="newsSectionTitle">{display.label}</h2>
          </div>
          <Link href={`/?category=${encodeURIComponent(category.slug)}`} className="newsSectionViewAll">
            Ver todo ↗
          </Link>
        </header>

        <div className="newsSectionBody">
          <article className="newsSectionLead">
            <Link
              href={`/noticias/${featured.slug}`}
              className="newsSectionLeadImage"
              style={{
                backgroundImage: featuredImage
                  ? `url(${featuredImage})`
                  : 'linear-gradient(180deg, rgba(13,24,41,0.25), rgba(13,24,41,0.82))',
              }}
            />
            <div className="newsSectionLeadText">
              <div className="frontPageCategory" style={{ color: display.color }}>
                {display.label.toUpperCase()}
              </div>
              <h3 className="newsSectionLeadTitle">
                <Link href={`/noticias/${featured.slug}`}>{featured.title}</Link>
              </h3>
              {featured.excerpt ? <p className="newsSectionLeadExcerpt">{featured.excerpt}</p> : null}
              <div className="frontPageLeadTime">{formatRelativePublishedAt(featured.published_at)}</div>
            </div>
          </article>

          <div className="newsSectionList">
            {listItems.map((article) => {
              const articleDisplay = getCategoryDisplay(article.category || category);
              const articleImage = article.cover_image ? directusAssetUrl(getDirectusFileId(article.cover_image)) : '';

              return (
                <Link key={article.id} href={`/noticias/${article.slug}`} className="newsSectionListItem">
                  <div className="newsSectionListText">
                    <div className="frontPageCategory" style={{ color: articleDisplay.color }}>
                      {articleDisplay.label.toUpperCase()}
                    </div>
                    <div className="newsSectionListTitle">{article.title}</div>
                    <div className="frontPageLeadTime">{formatRelativePublishedAt(article.published_at)}</div>
                  </div>
                  <div
                    className="newsSectionListThumb"
                    style={{ backgroundImage: articleImage ? `url(${articleImage})` : 'none' }}
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </div>
        </div>

        {category.id === promoSectionId ? (
          <section className="newsPromoBox newsPromoBoxCompact" aria-label="Publicidad">
            <div className="newsPromoEyebrow">Publicidad</div>
            <h2>Tu publicidad se puede ver acá.</h2>
            <p>Contactanos y mostrá tu marca en una sección destacada del portal.</p>
          </section>
        ) : null}
      </section>
    );
  };

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(16px, 3vw, 24px)' }}>
      <h1 style={{ position: 'absolute', left: -9999, top: -9999 }}>Jujuy247</h1>

      {renderAdSlot(adsTop, { marginBottom: 28, maxWidth: 1200, adsenseSlot: adsenseSlots.high })}

      {sectionsSorted.length === 0 ? (
        <div style={{ padding: 16, border: '1px solid var(--color-border)', borderRadius: 12, background: 'var(--color-surface)' }}>
          {categorySlug
            ? 'Categoría no encontrada (o sin permisos). Probá seleccionar otra categoría.'
            : 'No hay categorías o noticias todavía. Cargá contenido desde el admin.'}
        </div>
      ) : (
        <div className="frontPageLayout">
          <section className="frontPageLeadCol">
            {firstSectionFeatured ? (
              <article className="frontPageLeadCard">
                <Link
                  href={`/noticias/${firstSectionFeatured.slug}`}
                  className="frontPageLeadImage"
                  style={{
                    backgroundImage: firstSectionFeaturedImage
                      ? `linear-gradient(180deg, rgba(9,20,36,0.10) 0%, rgba(9,20,36,0.84) 72%), url(${firstSectionFeaturedImage})`
                      : 'linear-gradient(180deg, rgba(13,24,41,0.35), rgba(13,24,41,0.92))',
                  }}
                />
                <div className="frontPageLeadMeta">
                  <div className="frontPageCategory" style={{ color: firstSectionDisplay.color }}>
                    {firstSectionDisplay.label.toUpperCase()}
                  </div>
                  <h2 className="frontPageLeadTitle">
                    <Link href={`/noticias/${firstSectionFeatured.slug}`}>{firstSectionFeatured.title}</Link>
                  </h2>
                  <div className="frontPageLeadTime">{formatRelativePublishedAt(firstSectionFeatured.published_at)}</div>
                </div>
              </article>
            ) : null}

            {firstSectionList.length ? (
              <div className="frontPageLeadList">
                {firstSectionList.map((article) => {
                  const thumbUrl = article?.cover_image ? directusAssetUrl(getDirectusFileId(article.cover_image)) : '';
                  const display = getCategoryDisplay(firstSectionCategory, categoryDisplayMap);

                  return (
                    <Link key={article.id} href={`/noticias/${article.slug}`} className="frontPageLeadListItem">
                      <div className="frontPageLeadListBody">
                        <div className="frontPageCategory" style={{ color: display.color }}>
                          {display.label.toUpperCase()}
                        </div>
                        <h3>{article.title}</h3>
                        <div className="frontPageLeadTime">{formatRelativePublishedAt(article.published_at)}</div>
                      </div>
                      <div className="frontPageLeadThumb" style={{ backgroundImage: thumbUrl ? `url(${thumbUrl})` : 'none' }} />
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </section>

          <section className="frontPageMiddleCol" aria-label="Notas destacadas">
            {middleSections.map(({ category, featured, featuredBadgeLabel }) => {
              if (!featured) return null;
              const display = getCategoryDisplay(category, categoryDisplayMap);
              const cardImage = featured.cover_image ? directusAssetUrl(getDirectusFileId(featured.cover_image)) : '';
              const featuredTitle = truncateTitle(featured.title, 52);

              return (
                <Link key={category.id} href={`/noticias/${featured.slug}`} className="frontPageStoryCard">
                  <div className="frontPageStoryText">
                    <div className="frontPageCategory" style={{ color: display.color }}>
                      {display.label.toUpperCase()}
                    </div>
                    <h3 title={featured.title}>{featuredTitle}</h3>
                    <div className="frontPageLeadTime">{featuredBadgeLabel} · {formatRelativePublishedAt(featured.published_at)}</div>
                  </div>
                  <div className="frontPageStoryThumb" style={{ backgroundImage: cardImage ? `url(${cardImage})` : 'none' }} />
                </Link>
              );
            })}
          </section>

          <aside className="frontPageRightCol" aria-label="Lo último">
            <div className="frontPageLatestHeader">
              <h2>Lo último</h2>
            </div>

            <div className="frontPageLatestList">
              {latestHeadlines.slice(0, 5).map((article) => {
                const display = getCategoryDisplay(article.category, categoryDisplayMap);
                return (
                  <Link key={article.id} href={`/noticias/${article.slug}`} className="frontPageLatestItem">
                    <div className="frontPageCategory" style={{ color: display.color }}>
                      {display.label.toUpperCase()}
                    </div>
                    <h3>{article.title}</h3>
                    <div className="frontPageLeadTime">{formatRelativePublishedAt(article.published_at)}</div>
                  </Link>
                );
              })}
            </div>

            {rightSections.map(({ category, featured, featuredBadgeLabel }) => {
              if (!featured) return null;
              const display = getCategoryDisplay(category, categoryDisplayMap);
              return (
                <Link key={category.id} href={`/noticias/${featured.slug}`} className="frontPageLatestItem frontPageLatestItemCompact">
                  <div className="frontPageCategory" style={{ color: display.color }}>
                    {display.label.toUpperCase()}
                  </div>
                  <h3>{featured.title}</h3>
                  <div className="frontPageLeadTime">{featuredBadgeLabel} · {formatRelativePublishedAt(featured.published_at)}</div>
                </Link>
              );
            })}
          </aside>
        </div>
      )}

      {renderAdSlot(adsHighMid, { marginTop: 24, marginBottom: 28, maxWidth: 860, adsenseSlot: adsenseSlots.highMid })}

      {renderAdSlot(adsMid, { marginTop: 24, marginBottom: 18, maxWidth: 1200, adsenseSlot: adsenseSlots.mid })}

      {earlySecondarySections.length > 0 ? <section className="newsSectionsWrap">{earlySecondarySections.map(renderSectionBlock)}</section> : null}

      {middleSecondarySections.length > 0 ? <section className="newsSectionsWrap">{middleSecondarySections.map(renderSectionBlock)}</section> : null}

      {renderAdSlot(adsLowMid, { marginTop: 24, marginBottom: 28, maxWidth: 980, adsenseSlot: adsenseSlots.lowMid })}

      {lateSecondarySections.length > 0 ? <section className="newsSectionsWrap">{lateSecondarySections.map(renderSectionBlock)}</section> : null}

      <section className="newsPromoBox" aria-label="Publicidad">
        <div className="newsPromoEyebrow">Publicidad</div>
        <h2>Tu publicidad se puede ver acá.</h2>
        <p>Contactanos para sumar tu marca al portal y llegar a toda la audiencia de Jujuy.</p>
      </section>

      <section className="youtubeVideoStrip">
        <YouTubeCarouselCard videos={latestVideos} channelUrl={youtubeChannelUrl} liveVideo={liveVideo} />
      </section>

      {renderAdSlot(adsBottom, { marginTop: 28, maxWidth: 1200, adsenseSlot: adsenseSlots.low })}
    </main>
  );
}
