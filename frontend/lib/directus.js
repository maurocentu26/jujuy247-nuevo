function directusUrl(path) {
  const baseRaw = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
  const base = baseRaw.replace(/\/$/, '');
  return `${base}${path}`;
}

function siteUrl(path = '') {
  const baseRaw = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const base = baseRaw.replace(/\/$/, '');
  if (!path) return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function directusAssetUrl(fileId) {
  if (!fileId) return '';
  return directusUrl(`/assets/${fileId}`);
}

export function getDirectusFileId(fileField) {
  if (!fileField) return '';
  if (typeof fileField === 'string') return fileField;
  if (typeof fileField === 'object' && typeof fileField.id === 'string') return fileField.id;
  return '';
}

export async function getCategories({ limit = 10 } = {}) {
  const fields = ['id', 'name', 'slug'].join(',');
  const url = directusUrl(`/items/categories?fields=${encodeURIComponent(fields)}&sort=name&limit=${limit}`);
  const json = await fetchJson(url);
  return json.data ?? [];
}

export async function getCategoryBySlug(slug) {
  if (!slug) return null;
  const fields = ['id', 'name', 'slug'].join(',');
  const filter = encodeURIComponent(
    JSON.stringify({
      slug: { _eq: slug },
    })
  );
  const url = directusUrl(`/items/categories?fields=${encodeURIComponent(fields)}&limit=1&filter=${filter}`);
  const json = await fetchJson(url);
  const items = json.data ?? [];
  return items[0] ?? null;
}

export async function getTopCategoriesWithRecentArticles({
  days = 7,
  limitCategories = 5,
  limitArticles = 250,
} = {}) {
  const fields = ['category.id', 'category.name', 'category.slug', 'published_at'].join(',');

  async function fetchCategoryItems({ includeSinceFilter }) {
    const baseFilter = {
      status: { _eq: 'published' },
      category: { id: { _nnull: true } },
    };

    if (includeSinceFilter) {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      baseFilter.published_at = { _gte: since };
    }

    const filter = encodeURIComponent(JSON.stringify(baseFilter));
    const url = directusUrl(
      `/items/articles?fields=${encodeURIComponent(fields)}&sort=-published_at&limit=${limitArticles}&filter=${filter}`
    );

    const json = await fetchJson(url);
    return json.data ?? [];
  }

  let items = await fetchCategoryItems({ includeSinceFilter: true });

  // Fallback when there are no recent posts in the configured window.
  if (items.length === 0) {
    items = await fetchCategoryItems({ includeSinceFilter: false });
  }

  const byCategoryId = new Map();
  for (const item of items) {
    const category = item?.category;
    if (!category?.id) continue;
    const publishedAt = typeof item.published_at === 'string' ? item.published_at : null;

    const existing = byCategoryId.get(category.id);
    if (!existing) {
      byCategoryId.set(category.id, {
        category,
        latestPublishedAt: publishedAt,
        count: 1,
      });
    } else {
      existing.count += 1;
      if (publishedAt && (!existing.latestPublishedAt || publishedAt > existing.latestPublishedAt)) {
        existing.latestPublishedAt = publishedAt;
      }
    }
  }

  return Array.from(byCategoryId.values())
    .sort((a, b) => {
      const aDate = a.latestPublishedAt || '';
      const bDate = b.latestPublishedAt || '';
      if (aDate !== bDate) return aDate < bDate ? 1 : -1;
      if (a.count !== b.count) return b.count - a.count;
      return String(a.category.name || '').localeCompare(String(b.category.name || ''), 'es');
    })
    .slice(0, limitCategories)
    .map((x) => x.category);
}

function weatherCodeToSummary(code) {
  // Open-Meteo weather codes: https://open-meteo.com/en/docs
  if (code === 0) return 'Despejado';
  if (code === 1 || code === 2) return 'Parcialmente nublado';
  if (code === 3) return 'Nublado';
  if (code === 45 || code === 48) return 'Niebla';
  if (code === 51 || code === 53 || code === 55) return 'Llovizna';
  if (code === 56 || code === 57) return 'Llovizna helada';
  if (code === 61 || code === 63 || code === 65) return 'Lluvia';
  if (code === 66 || code === 67) return 'Lluvia helada';
  if (code === 71 || code === 73 || code === 75) return 'Nieve';
  if (code === 77) return 'Granizo';
  if (code === 80 || code === 81 || code === 82) return 'Chaparrones';
  if (code === 85 || code === 86) return 'Nieve (chaparrones)';
  if (code === 95) return 'Tormentas';
  if (code === 96 || code === 99) return 'Tormentas fuertes';
  return 'Clima';
}

export async function getCurrentWeatherForJujuy() {
  // San Salvador de Jujuy (aprox.)
  const latitude = -24.1858;
  const longitude = -65.2995;
  const timezone = 'America/Argentina/Jujuy';

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=${encodeURIComponent(
    timezone
  )}`;

  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Weather request failed: ${res.status}`);
  const json = await res.json();

  const temperatureRaw = json?.current?.temperature_2m;
  const weatherCode = json?.current?.weather_code;
  if (typeof temperatureRaw !== 'number') return null;

  const temperatureC = Math.round(temperatureRaw);
  const summary = typeof weatherCode === 'number' ? weatherCodeToSummary(weatherCode) : 'Clima';
  return { temperatureC, summary, weatherCode: typeof weatherCode === 'number' ? weatherCode : null };
}

export function getSiteUrl() {
  return siteUrl();
}

async function fetchJson(url) {
  const res = await fetch(url, { next: { revalidate: 10 } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Directus request failed: ${res.status} ${res.statusText} (${url}) ${body}`);
  }
  return res.json();
}

export async function getLatestArticles({ limit = 20, categorySlug } = {}) {
  const fields = [
    'id',
    'title',
    'slug',
    'excerpt',
    'content',
    'front_page',
    'published_at',
    'status',
    'seo_title',
    'seo_description',
    'seo_canonical_url',
    'seo_no_index',
    'seo_no_follow',
    'seo_image',
    'cover_image',
    'category.id',
    'category.name',
    'category.slug',
  ].join(',');

  const filterObject = {
    status: { _eq: 'published' },
  };
  if (categorySlug) {
    filterObject.category = { slug: { _eq: categorySlug } };
  }
  const filter = encodeURIComponent(JSON.stringify(filterObject));

  const url = directusUrl(
    `/items/articles?fields=${encodeURIComponent(fields)}&sort=-published_at&limit=${limit}&filter=${filter}`
  );

  const json = await fetchJson(url);
  return json.data ?? [];
}

export async function getFrontPageArticle() {
  const fields = [
    'id',
    'title',
    'slug',
    'excerpt',
    'content',
    'front_page',
    'published_at',
    'status',
    'seo_title',
    'seo_description',
    'seo_canonical_url',
    'seo_no_index',
    'seo_no_follow',
    'seo_image',
    'cover_image',
    'category.id',
    'category.name',
    'category.slug',
  ].join(',');

  const filter = encodeURIComponent(
    JSON.stringify({
      status: { _eq: 'published' },
      front_page: { _eq: true },
    })
  );

  const url = directusUrl(`/items/articles?fields=${encodeURIComponent(fields)}&sort=-published_at&limit=1&filter=${filter}`);
  const json = await fetchJson(url);
  const items = json.data ?? [];
  return items[0] ?? null;
}

export async function getFrontPageArticleInCategory({ categoryId } = {}) {
  if (!categoryId) return null;

  const fields = [
    'id',
    'title',
    'slug',
    'excerpt',
    'content',
    'front_page',
    'published_at',
    'status',
    'seo_title',
    'seo_description',
    'seo_canonical_url',
    'seo_no_index',
    'seo_no_follow',
    'seo_image',
    'cover_image',
    'category.id',
    'category.name',
    'category.slug',
  ].join(',');

  const filter = encodeURIComponent(
    JSON.stringify({
      status: { _eq: 'published' },
      front_page: { _eq: true },
      category: { id: { _eq: categoryId } },
    })
  );

  const url = directusUrl(`/items/articles?fields=${encodeURIComponent(fields)}&sort=-published_at&limit=1&filter=${filter}`);
  const json = await fetchJson(url);
  const items = json.data ?? [];
  return items[0] ?? null;
}

export async function getOtherArticlesInCategory({ categoryId, excludeId, limit = 3 } = {}) {
  const fields = [
    'id',
    'title',
    'slug',
    'excerpt',
    'front_page',
    'published_at',
    'status',
    'cover_image',
    'category.id',
    'category.name',
    'category.slug',
  ].join(',');

  const filterObject = {
    status: { _eq: 'published' },
  };
  if (excludeId) filterObject.id = { _neq: excludeId };
  if (categoryId) filterObject.category = { id: { _eq: categoryId } };

  const filter = encodeURIComponent(JSON.stringify(filterObject));
  const url = directusUrl(`/items/articles?fields=${encodeURIComponent(fields)}&sort=-published_at&limit=${limit}&filter=${filter}`);
  const json = await fetchJson(url);
  return json.data ?? [];
}

export async function getArticleBySlug(slug) {
  const fields = [
    'id',
    'title',
    'slug',
    'excerpt',
    'content',
    'front_page',
    'published_at',
    'status',
    'seo_title',
    'seo_description',
    'seo_canonical_url',
    'seo_no_index',
    'seo_no_follow',
    'seo_keywords',
    'seo_image',
    'cover_image',
    'category.id',
    'category.name',
    'tags.id',
    'tags.name',
  ].join(',');

  const filter = encodeURIComponent(JSON.stringify({
    slug: { _eq: slug },
    status: { _eq: 'published' },
  }));

  const url = directusUrl(`/items/articles?fields=${encodeURIComponent(fields)}&limit=1&filter=${filter}`);
  const json = await fetchJson(url);
  const items = json.data ?? [];
  return items[0] ?? null;
}

export function getCanonicalUrlForArticle(article) {
  if (!article) return siteUrl('/');
  if (article.seo_canonical_url) return article.seo_canonical_url;
  return siteUrl(`/noticias/${article.slug}`);
}
