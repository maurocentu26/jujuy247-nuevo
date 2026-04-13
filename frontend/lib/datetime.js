const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires';

function hasExplicitTimezone(value) {
  return /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
}

export function parsePublishedAt(value) {
  if (!value || typeof value !== 'string') return null;

  const raw = value.trim();
  if (!raw) return null;

  // Some CMS fields may return datetimes without offset. Assume Argentina local offset.
  const normalized = hasExplicitTimezone(raw) ? raw : `${raw}-03:00`;
  const parsed = new Date(normalized);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed;
}

export function formatPublishedAt(value, locale = 'es-AR') {
  const parsed = parsePublishedAt(value);
  if (!parsed) return '';

  return new Intl.DateTimeFormat(locale, {
    timeZone: ARGENTINA_TIMEZONE,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsed);
}

export function formatRelativePublishedAt(value, nowMs = Date.now()) {
  const parsed = parsePublishedAt(value);
  if (!parsed) return 'Ahora';

  const ms = nowMs - parsed.getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'Ahora';

  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `Hace ${Math.max(mins, 1)} min`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;

  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}
