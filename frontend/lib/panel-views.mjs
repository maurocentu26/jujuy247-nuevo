const TIME_ZONE = 'America/Argentina/Jujuy';
const ARGENTINA_OFFSET = '-03:00';

export const EDITORIAL_VIEWS = [
  { id: 'all', label: 'Todas' },
  { id: 'drafts', label: 'Borradores' },
  { id: 'today', label: 'Publicadas hoy' },
  { id: 'missing-cover', label: 'Sin foto' },
];
// «En portada» no es un contador: en producción casi todas las notas tienen front_page activo.

function dayKey(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function startOfTodayIso(now = new Date()) {
  return new Date(`${dayKey(now)}T00:00:00${ARGENTINA_OFFSET}`).toISOString();
}

// Los filtros viven en el servidor: un contador no puede depender de la página cargada.
export function editorialViewFilter(view, now = new Date()) {
  switch (view) {
    case 'drafts':
      return { status: { _eq: 'draft' } };
    case 'today':
      return { _and: [{ status: { _eq: 'published' } }, { published_at: { _gte: startOfTodayIso(now) } }] };
    case 'missing-cover':
      return { cover_image: { _null: true } };
    case 'frontpage':
      return { _and: [{ status: { _eq: 'published' } }, { front_page: { _eq: true } }] };
    default:
      return null;
  }
}

export function formatArticleWhen(iso, now = new Date()) {
  if (!iso) return 'Sin publicar';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Sin publicar';

  const time = new Intl.DateTimeFormat('es-AR', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  const key = dayKey(date);
  if (key === dayKey(now)) return `Hoy, ${time}`;
  if (key === dayKey(new Date(now.getTime() - 86400000))) return `Ayer, ${time}`;

  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function coverFileId(cover) {
  if (!cover) return null;
  if (typeof cover === 'string') return cover;
  return typeof cover === 'object' && cover.id ? cover.id : null;
}
