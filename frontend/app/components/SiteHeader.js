import { getCategories, getCurrentWeatherForJujuy } from '../../lib/directus';
import SiteHeaderClient from './SiteHeaderClient';

const FALLBACK_CATEGORIES = [
  { id: 'politica', name: 'Política', slug: 'politica' },
  { id: 'economia', name: 'Economía', slug: 'economia' },
  { id: 'deportes', name: 'Deportes', slug: 'deportes' },
  { id: 'policiales', name: 'Policiales', slug: 'policiales' },
  { id: 'mundo', name: 'Mundo', slug: 'mundo' },
  { id: 'salud', name: 'Salud', slug: 'salud' },
];

export default async function SiteHeader() {
  const [categories, weather] = await Promise.all([
    getCategories({ limit: 8 }).catch(() => []),
    getCurrentWeatherForJujuy().catch(() => null),
  ]);

  const navCategories = Array.isArray(categories) && categories.length ? categories : FALLBACK_CATEGORIES;

  return <SiteHeaderClient categories={navCategories} weather={weather} />;
}
