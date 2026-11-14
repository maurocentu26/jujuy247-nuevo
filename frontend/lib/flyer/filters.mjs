// Filtros de la foto del flyer. «Color» es la foto tal cual y es el valor por defecto.
export const PHOTO_FILTERS = [
  { id: 'color', label: 'Color' },
  { id: 'vivid', label: 'Vívido' },
  { id: 'warm', label: 'Cálido' },
  { id: 'cool', label: 'Frío' },
  { id: 'bw', label: 'Blanco y negro' },
  { id: 'sepia', label: 'Sepia' },
];

export const DEFAULT_FILTER = 'color';

// Los borradores anteriores guardaban `gray: true` porque era el valor por defecto, no una elección:
// se ignora y la foto vuelve a color.
export function normalizeFilter(value) {
  return PHOTO_FILTERS.some(f => f.id === value) ? value : DEFAULT_FILTER;
}
