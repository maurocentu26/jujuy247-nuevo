// Pure helpers for the article page: image framing, body splitting and story selection.

// Cover frames never crop: the photo is drawn with object-fit: contain and any
// leftover space is filled with a blurred copy of itself. These limits only
// decide how tall the frame may get on each screen size.
const DESKTOP_MIN_RATIO = 3 / 2; // taller photos (portrait flyers, squares) get side bands
const DESKTOP_MAX_RATIO = 21 / 9; // wider panoramas get top and bottom bands
const MOBILE_MIN_RATIO = 4 / 5; // phones can show a 4:5 portrait whole
const MOBILE_MAX_RATIO = 2;
const FALLBACK_RATIO = 16 / 9;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

export function imageRatio(file) {
  const width = Number(file?.width);
  const height = Number(file?.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return width / height;
}

// Directus stores focal points in pixels from the top-left corner.
export function focalPosition(file, fallback = '50% 30%') {
  const width = Number(file?.width);
  const height = Number(file?.height);
  const x = file?.focal_point_x;
  const y = file?.focal_point_y;
  if (x == null || y == null || !(width > 0) || !(height > 0)) return fallback;
  const px = clamp((Number(x) / width) * 100, 0, 100);
  const py = clamp((Number(y) / height) * 100, 0, 100);
  if (!Number.isFinite(px) || !Number.isFinite(py)) return fallback;
  return `${Math.round(px)}% ${Math.round(py)}%`;
}

export function coverFrame(file) {
  const ratio = imageRatio(file);
  const natural = ratio ?? FALLBACK_RATIO;
  const desktop = clamp(natural, DESKTOP_MIN_RATIO, DESKTOP_MAX_RATIO);
  const mobile = clamp(natural, MOBILE_MIN_RATIO, MOBILE_MAX_RATIO);
  return {
    ratio: ratio ? round(ratio) : null,
    desktopRatio: round(desktop),
    mobileRatio: round(mobile),
    // Bands are only needed when the frame and the photo disagree.
    fillsDesktop: ratio != null && Math.abs(desktop - ratio) < 0.01,
    fillsMobile: ratio != null && Math.abs(mobile - ratio) < 0.01,
    orientation: ratio == null ? 'unknown' : ratio > 1.15 ? 'landscape' : ratio < 0.87 ? 'portrait' : 'square',
  };
}

// Splits markdown after the Nth top-level paragraph so a "Leé también" card can
// sit inside the text. Fenced blocks (galleries) are never split, and short
// notes are left whole.
export function splitMarkdownAfterParagraph(markdown, paragraph = 3, minBlocks = 6) {
  if (typeof markdown !== 'string' || !markdown.trim()) return [markdown || '', ''];

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let current = [];
  let fence = null;

  for (const line of lines) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      current.push(line);
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
      continue;
    }
    if (marker) {
      fence = marker[1];
      current.push(line);
      continue;
    }
    if (line.trim() === '') {
      if (current.length) blocks.push(current.join('\n'));
      current = [];
      continue;
    }
    current.push(line);
  }
  if (current.length) blocks.push(current.join('\n'));

  if (blocks.length < minBlocks) return [markdown, ''];

  // Indented blocks belong to a list item or are code, so they count as neither.
  const isParagraph = (block) => !/^\s/.test(block) && !/^(#{1,6}\s|[-*+]\s|\d+[.)]\s|>|`{3}|~{3}|\||!\[|<)/.test(block);
  let seen = 0;
  for (let index = 0; index < blocks.length - 2; index += 1) {
    if (!isParagraph(blocks[index])) continue;
    seen += 1;
    // Only split between two paragraphs, so the card never separates a
    // heading or list from the text around it.
    if (seen >= paragraph && isParagraph(blocks[index + 1])) {
      return [blocks.slice(0, index + 1).join('\n\n'), blocks.slice(index + 1).join('\n\n')];
    }
  }
  return [markdown, ''];
}

// Hands out articles to page blocks without repeating any story.
export function createStoryPicker(excludeIds = []) {
  const used = new Set(excludeIds.filter((id) => id != null));
  return function pick(list, count) {
    const picked = [];
    for (const item of Array.isArray(list) ? list : []) {
      if (picked.length >= count) break;
      if (!item?.id || !item?.slug || used.has(item.id)) continue;
      used.add(item.id);
      picked.push(item);
    }
    return picked;
  };
}

export function readingMinutes(markdown, wordsPerMinute = 220) {
  if (typeof markdown !== 'string') return 0;
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`|~-]/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return words ? Math.max(1, Math.round(words / wordsPerMinute)) : 0;
}
