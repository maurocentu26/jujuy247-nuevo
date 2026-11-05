// Geometría del flyer. Sin dependencias del navegador: se prueba con node --test.

export const FLYER = Object.freeze({ width: 1080, height: 1350 });
export const TITLE_SUGGESTED = 90;
export const EXCERPT_SUGGESTED = 120;
export const LABEL_MAX = 40;

const TITLE_MAX_WIDTH = 880;
const TITLE_SIZES = [
  { size: 60, line: 72, maxLines: 3 },
  { size: 52, line: 62, maxLines: 4 },
  { size: 44, line: 53, maxLines: 4 },
];
const EXCERPT = { size: 30, line: 40, maxLines: 2 };
export const EXCERPT_GAP = 18;

export function titleFont(size, family) {
  return `600 ${size}px ${family}`;
}

export function excerptFont(family) {
  return `400 ${EXCERPT.size}px ${family}`;
}

export function wrapText(text, maxWidth, measure) {
  const lines = [];
  let current = '';
  for (const word of String(text).trim().split(/\s+/).filter(Boolean)) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && measure(candidate) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// Busca el ancho más angosto que mantiene las líneas: evita una palabra sola al final.
function balanceLines(text, lineCount, maxWidth, measure) {
  let best = wrapText(text, maxWidth, measure);
  if (lineCount < 2 || best.length !== lineCount) return best;
  for (let width = maxWidth - 16; width > 0; width -= 16) {
    const candidate = wrapText(text, width, measure);
    if (candidate.length !== lineCount || candidate.some(line => measure(line) > width)) break;
    best = candidate;
  }
  return best;
}

// `measure(texto, fuente)` devuelve el ancho en px: el navegador pasa measureText del lienzo.
export function layoutText({ title, excerpt }, measure, family = 'sans-serif') {
  let chosen = null;
  let lines = [];
  for (const option of TITLE_SIZES) {
    const font = titleFont(option.size, family);
    lines = wrapText(title, TITLE_MAX_WIDTH, text => measure(text, font));
    chosen = option;
    if (lines.length <= option.maxLines) break;
  }

  const widestLine = Math.max(0, ...lines.map(line => measure(line, titleFont(chosen.size, family))));
  lines = balanceLines(title, lines.length, widestLine, text => measure(text, titleFont(chosen.size, family)));
  const excerptLines = excerpt?.trim()
    ? wrapText(excerpt, TITLE_MAX_WIDTH, text => measure(text, excerptFont(family)))
    : [];

  return {
    titleSize: chosen.size,
    titleLine: chosen.line,
    titleLines: lines,
    excerptSize: EXCERPT.size,
    excerptLine: EXCERPT.line,
    excerptLines,
    titleOverflow: lines.length > chosen.maxLines || widestLine > TITLE_MAX_WIDTH,
    excerptOverflow: excerptLines.length > EXCERPT.maxLines,
  };
}

export function textBlockTop(layout, bottom) {
  const excerptHeight = layout.excerptLines.length ? layout.excerptLines.length * layout.excerptLine + EXCERPT_GAP : 0;
  return bottom - excerptHeight - layout.titleLines.length * layout.titleLine;
}

// Con zoom 1 la foto cubre todo el lienzo. x e y son el desplazamiento en px del flyer.
export function coverRect(imageWidth, imageHeight, { zoom = 1, x = 0, y = 0 } = {}) {
  const scale = Math.max(FLYER.width / imageWidth, FLYER.height / imageHeight) * Math.max(zoom, 1);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  const { x: cx, y: cy } = clampOffset(width, height, x, y);
  return {
    x: (FLYER.width - width) / 2 + cx,
    y: (FLYER.height - height) / 2 + cy,
    width,
    height,
    offsetX: cx,
    offsetY: cy,
    sourcePixelsPerOutput: imageWidth / width,
  };
}

function clampOffset(width, height, x, y) {
  const maxX = Math.max(0, (width - FLYER.width) / 2);
  const maxY = Math.max(0, (height - FLYER.height) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, x)),
    y: Math.min(maxY, Math.max(-maxY, y)),
  };
}

export function isLowResolution(rect) {
  // Hasta 1,8× de ampliación se ve bien en redes; más abajo el desenfoque se nota.
  return rect.sourcePixelsPerOutput < 0.55;
}

export function exportBlockReason({ hasArticle, hasPhoto, title, layout }) {
  if (!hasArticle) return 'Elegí una noticia para empezar';
  if (!title?.trim()) return 'Falta el título para exportar';
  if (!hasPhoto) return 'Falta una foto para exportar';
  if (layout?.titleOverflow) return 'Acortá el título para exportar';
  if (layout?.excerptOverflow) return 'Acortá la bajada para exportar';
  return '';
}

export function flyerFileName(slug, extension) {
  const safe = String(slug || 'noticia')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'noticia';
  return `jujuy247-${safe}-4x5.${extension}`;
}
