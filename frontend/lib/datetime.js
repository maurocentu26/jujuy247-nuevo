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

// Valor para <input type="datetime-local">, en hora de Argentina ("2026-11-10T14:30").
export function toArgentinaInputValue(value) {
  const parsed = value instanceof Date ? value : parsePublishedAt(value);
  if (!parsed || !Number.isFinite(parsed.getTime())) return '';

  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: ARGENTINA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(parsed).map(p => [p.type, p.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

// Interpreta el valor de un datetime-local como hora de Argentina (UTC-3, sin horario de verano).
export function fromArgentinaInputValue(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}:00-03:00`);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

// Fecha de publicación que llega del panel. No se programan notas: se rechaza una fecha futura
// (con un margen por relojes desfasados), porque el diario la mostraría igual desde ya.
export function validatePublishedAtInput(value, nowMs = Date.now()) {
  if (value === undefined) return { value: undefined };
  if (value === null || value === '') return { value: null };
  const parsed = typeof value === 'string' ? new Date(value) : null;
  if (!parsed || !Number.isFinite(parsed.getTime())) {
    return { error: 'La fecha de publicación no es válida.' };
  }
  if (parsed.getTime() > nowMs + 5 * 60 * 1000) {
    return { error: 'La fecha de publicación no puede ser futura.' };
  }
  return { value: parsed.toISOString() };
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
