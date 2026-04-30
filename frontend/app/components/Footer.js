import { getCategories } from '../../lib/directus';
import FooterClient from './FooterClient';

const FALLBACK_SECTIONS = [
  { id: 'politica', name: 'Política', slug: 'politica' },
  { id: 'economia', name: 'El País', slug: 'economia' },
  { id: 'deportes', name: 'Deportes', slug: 'deportes' },
  { id: 'mundo', name: 'Mundo', slug: 'mundo' },
];

export default async function Footer() {
  const categories = await getCategories({ limit: 50 }).catch(() => []);
  const navSections = Array.isArray(categories) && categories.length ? categories : FALLBACK_SECTIONS;

  return <FooterClient sections={navSections} />;
}
