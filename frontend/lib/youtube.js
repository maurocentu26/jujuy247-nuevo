function youtubeApiUrl(path, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null || v === '') continue;
    url.searchParams.set(k, String(v));
  }
  return url.toString();
}

async function fetchYoutubeJson(url) {
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`YouTube API request failed: ${res.status} ${res.statusText} (${url}) ${body}`);
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
  if (!apiKey || !channelId) return [];

  const url = youtubeApiUrl('search', {
    key: apiKey,
    part: 'snippet',
    channelId,
    order: 'date',
    type: 'video',
    maxResults: Math.min(Math.max(limit, 1), 25),
    safeSearch: 'none',
  });

  const json = await fetchYoutubeJson(url);
  const items = Array.isArray(json.items) ? json.items : [];

  return items.map(mapSearchItemToVideo).filter(Boolean);
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
