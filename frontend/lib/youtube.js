import { XMLParser } from 'fast-xml-parser';

export const DEFAULT_YOUTUBE_CHANNEL_ID = 'UCmmtqIGC_TfbfMTUuZ4EYaQ';

export function parseYoutubeFeed(xml, limit = 10) {
  const parsed = new XMLParser({ ignoreAttributes: false, parseTagValue: false }).parse(xml);
  const entries = parsed?.feed?.entry;
  return (Array.isArray(entries) ? entries : entries ? [entries] : [])
    .filter((entry) => /^[A-Za-z0-9_-]{11}$/.test(entry['yt:videoId'] || ''))
    .slice(0, limit)
    .map((entry) => ({
      id: entry['yt:videoId'], title: String(entry.title || ''), publishedAt: entry.published || null,
      thumbnailUrl: `https://i.ytimg.com/vi/${entry['yt:videoId']}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${entry['yt:videoId']}`,
    }));
}

async function getPublicChannelVideos(channelId, limit) {
  const url = new URL('https://www.youtube.com/feeds/videos.xml');
  url.searchParams.set('channel_id', channelId);
  const response = await fetch(url, { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`YouTube feed unavailable: ${response.status}`);
  return parseYoutubeFeed(await response.text(), limit);
}

function youtubeApiUrl(path, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null || v === '') continue;
    url.searchParams.set(k, String(v));
  }
  return url.toString();
}

async function fetchYoutubeJson(url) {
  const res = await fetch(url, { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const reason = body?.error?.errors?.[0]?.reason || 'unknown';
    // Report failures without exposing the API key in the request URL.
    console.warn('YouTube API request failed', { status: res.status, reason });
    throw new Error(`YouTube API request failed: ${res.status} (${reason})`);
  }
  return res.json();
}

export async function getChannelIdForHandle({ apiKey, handle } = {}) {
  if (!apiKey || !handle) return '';
  const cleaned = String(handle).trim().replace(/^@/, '');
  if (!cleaned) return '';

  const url = youtubeApiUrl('channels', {
    key: apiKey,
    part: 'id',
    forHandle: cleaned,
    maxResults: 1,
  });

  const json = await fetchYoutubeJson(url);
  const item = Array.isArray(json.items) ? json.items[0] : null;
  const id = item?.id;
  return typeof id === 'string' ? id : '';
}

function mapSearchItemToVideo(item) {
  const videoId = item?.id?.videoId;
  if (!videoId) return null;
  const snippet = item?.snippet || {};

  const thumbnails = snippet.thumbnails || {};
  const thumb = thumbnails.medium || thumbnails.high || thumbnails.default || null;

  return {
    id: videoId,
    title: snippet.title || '',
    publishedAt: snippet.publishedAt || null,
    thumbnailUrl: thumb?.url || '',
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

export async function getLatestChannelVideos({ apiKey, channelId, limit = 10 } = {}) {
  if (!channelId) return [];
  const count = Math.min(Math.max(limit, 1), 25);

  if (!apiKey) return getPublicChannelVideos(channelId, count);

  const url = youtubeApiUrl('search', {
    key: apiKey,
    part: 'snippet',
    channelId,
    order: 'date',
    type: 'video',
    maxResults: count,
    safeSearch: 'none',
  });

  try {
    const json = await fetchYoutubeJson(url);
    const items = Array.isArray(json.items) ? json.items : [];
    const videos = items.map(mapSearchItemToVideo).filter(Boolean);
    if (videos.length) return videos;
  } catch {
    // The public feed keeps the strip available when API access/quota fails.
  }
  return getPublicChannelVideos(channelId, count);
}

export async function getLiveVideoForChannel({ apiKey, channelId } = {}) {
  if (!apiKey || !channelId) return null;

  const url = youtubeApiUrl('search', {
    key: apiKey,
    part: 'snippet',
    channelId,
    eventType: 'live',
    type: 'video',
    maxResults: 1,
    safeSearch: 'none',
  });

  const json = await fetchYoutubeJson(url);
  const item = Array.isArray(json.items) ? json.items[0] : null;
  return mapSearchItemToVideo(item);
}
