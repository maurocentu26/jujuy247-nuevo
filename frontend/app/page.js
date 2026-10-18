import Link from 'next/link';
import Image from 'next/image';
import { permanentRedirect } from 'next/navigation';
import { categoryUrl, getSiteUrl, SITE_DESCRIPTION } from '../lib/site';
import {
  directusAssetUrl,
  getDirectusFileId,
  getCategories,
  getFrontPageArticleInCategory,
  getOtherArticlesInCategory,
  getLatestArticles,
  getAds,
  sortAdsByOrder,
  sortCategoriesByPosition,
} from '../lib/directus';
import { formatRelativePublishedAt } from '../lib/datetime';
import { DEFAULT_YOUTUBE_CHANNEL_ID, getChannelIdForHandle, getLatestChannelVideos, getLiveVideoForChannel } from '../lib/youtube';
import ChannelVideos from './components/ChannelVideos';
import AdCarousel from './components/AdCarousel';
import GoogleAdSlot from './components/GoogleAdSlot';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: { absolute: 'Noticias de Jujuy: actualidad y últimas noticias | Jujuy247' },
  description: SITE_DESCRIPTION,
  alternates: { canonical: getSiteUrl() },
  openGraph: {
    title: 'Noticias de Jujuy: actualidad y últimas noticias | Jujuy247',
    description: SITE_DESCRIPTION, url: getSiteUrl(), type: 'website', locale: 'es_AR',
    siteName: 'Jujuy247', images: ['/seo-imgs/share-img.jpeg'],
  },
  twitter: {
    card: 'summary_large_image', title: 'Noticias de Jujuy | Jujuy247',
    description: SITE_DESCRIPTION, images: ['/seo-imgs/share-img.jpeg'],
  },
};

export async function NewsLanding() {
  const channelId = process.env.YOUTUBE_CHANNEL_ID || (process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_CHANNEL_HANDLE ? await getChannelIdForHandle({ apiKey: process.env.YOUTUBE_API_KEY, handle: process.env.YOUTUBE_CHANNEL_HANDLE }).catch(() => '') : '') || DEFAULT_YOUTUBE_CHANNEL_ID;
  const [categories, articles, allAds, videos, liveVideo] = await Promise.all([
    getCategories({ limit: 100 }).catch(() => []),
    getLatestArticles({ limit: 10 }).catch(() => []),
    getAds().catch(() => []),
    getLatestChannelVideos({ apiKey: process.env.YOUTUBE_API_KEY || '', channelId, limit: 4 }).catch(() => []),
    getLiveVideoForChannel({ apiKey: process.env.YOUTUBE_API_KEY || '', channelId }).catch(() => null),
  ]);
  const sections = await Promise.all(sortCategoriesByPosition(categories).map(async category => {
    const [featured, latest] = await Promise.all([
      getFrontPageArticleInCategory({ categoryId: category.id }).catch(() => null),
      getOtherArticlesInCategory({ categoryId: category.id, limit: 4 }).catch(() => []),
    ]);
    return { category, items: [featured, ...latest].filter((a, i, all) => a && all.findIndex(b => b?.id === a.id) === i).slice(0, 3) };
  }));
  const lead = sections.find(s => s.items.length)?.items[0] || articles[0];
  const others = sections.flatMap(s => s.items).filter((a, i, all) => a.id !== lead?.id && all.findIndex(b => b.id === a.id) === i);
  const picture = (a, hero = false) => {
    const src = directusAssetUrl(getDirectusFileId(a.cover_image));
    return src ? <Image src={src} alt={a.title} width={720} height={460} sizes={hero ? '(max-width: 700px) 100vw, 360px' : '(max-width: 700px) 100vw, 400px'} preload={hero} className="redesign-photo" /> : null;
  };
  const story = (a, withImage = true) => <article className="redesign-story" key={a.id}><Link href={`/noticias/${encodeURIComponent(a.slug)}`}>{withImage ? picture(a) : null}<span className="redesign-category">{a.category?.name}</span><h3>{a.title}</h3></Link><p>{a.excerpt}</p><small>{formatRelativePublishedAt(a.published_at)}</small></article>;
  const ad = priority => {
    const ads = sortAdsByOrder(allAds.filter(a => String(a?.priority || '').toLowerCase() === priority));
    const slot = process.env[{ high: 'NEXT_PUBLIC_ADSENSE_SLOT_HIGH', 'high-mid': 'NEXT_PUBLIC_ADSENSE_SLOT_HIGH_MID', mid: 'NEXT_PUBLIC_ADSENSE_SLOT_MID', 'low-mid': 'NEXT_PUBLIC_ADSENSE_SLOT_LOW_MID', low: 'NEXT_PUBLIC_ADSENSE_SLOT_LOW' }[priority]];
    const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
    return ads.length || (slot && client) ? <aside className="redesign-ad" aria-label="Publicidad"><small>Publicidad</small>{slot && client ? <GoogleAdSlot client={client} slot={slot} variant="wide" /> : null}{ads.length ? <AdCarousel ads={ads} variant="wide" /> : null}</aside> : null;
  };
  return <main className="redesign-home">
    {lead ? <><article className="redesign-lead"><div><span className="redesign-category">{lead.category?.name}</span><h1><Link href={`/noticias/${encodeURIComponent(lead.slug)}`}>{lead.title}</Link></h1><p>{lead.excerpt}</p><small>{formatRelativePublishedAt(lead.published_at)}</small></div><Link href={`/noticias/${encodeURIComponent(lead.slug)}`} aria-label={lead.title}>{picture(lead, true)}</Link></article><div className="redesign-secondary">{others.slice(0, 2).map(a => story(a, false))}</div></> : <section><h1>Actualidad</h1><p>No pudimos cargar las noticias. Volvé a intentarlo en unos minutos.</p></section>}
    <section className="redesign-latest" aria-labelledby="latest-title"><h2 id="latest-title">Lo último</h2><div>{articles.slice(0, 5).map(a => <article key={a.id}><small>{formatRelativePublishedAt(a.published_at)}</small><h3><Link href={`/noticias/${encodeURIComponent(a.slug)}`}>{a.title}</Link></h3></article>)}</div></section>
    {ad('high')}{ad('high-mid')}
    <ChannelVideos videos={videos} liveVideo={liveVideo} />
    {ad('mid')}
    {sections.map(({ category: c, items }) => {
      return items.length ? <section key={c.id} className="redesign-section"><div className="redesign-section-heading"><h2>{c.name}</h2><Link href={`/categoria/${encodeURIComponent(c.slug)}`}>Ver todas las noticias</Link></div><div className="redesign-story-grid">{items.map(a => story(a))}</div></section> : null;
    })}
    {ad('low-mid')}{ad('low')}
    <section className="redesign-follow"><h2>La actualidad de Jujuy, también en YouTube</h2><a href="https://www.youtube.com/@jujuy247" target="_blank" rel="noreferrer">Seguí a Jujuy247</a></section>
  </main>;
}

export default async function HomePage({ searchParams }) {
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

  if (categorySlug) permanentRedirect(categoryUrl(categorySlug));
  return <NewsLanding />;
}
