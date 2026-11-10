// Galerías dentro del cuerpo de la noticia.
//
// Se guardan en el mismo Markdown del campo `content`, como un bloque cercado:
//
//   ```galeria
//   ![Epígrafe de la primera foto](https://cms.../assets/ID)
//   ![](https://cms.../assets/ID2)
//   ```
//
// Así no hace falta un campo nuevo en Directus y la galería queda donde la ubica el redactor.

export const GALLERY_LANGUAGE = 'galeria';

const IMAGE_LINE = /^!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"([^"]*)")?\s*\)$/;

function safeImageUrl(raw) {
  try {
    const url = new URL(raw);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

// Devuelve [{ src, caption }] con las líneas válidas; ignora el resto.
export function parseGallery(source) {
  return String(source || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .map(line => {
      const match = IMAGE_LINE.exec(line);
      if (!match) return null;
      const src = safeImageUrl(match[2]);
      if (!src) return null;
      const caption = (match[3] || match[1] || '').trim();
      return { src, caption };
    })
    .filter(Boolean);
}

function escapeCaption(text) {
  return String(text || '').replace(/[\[\]\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function galleryBlock(images) {
  const lines = images.map(({ src, caption }) => `![${escapeCaption(caption)}](${src})`);
  return `\`\`\`${GALLERY_LANGUAGE}\n${lines.join('\n')}\n\`\`\``;
}
