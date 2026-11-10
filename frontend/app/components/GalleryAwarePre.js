import ArticleGallery from './ArticleGallery';
import { GALLERY_LANGUAGE, parseGallery } from '../../lib/article-gallery.mjs';

// Reemplazo de <pre> para ReactMarkdown: un bloque ```galeria se muestra como galería de fotos.
// Lee el nodo HAST (no los hijos de React) para funcionar igual en el servidor y en el panel.
export default function GalleryAwarePre({ node, children, ...props }) {
  const code = node?.children?.find(child => child.type === 'element');
  const classes = code?.tagName === 'code' ? code.properties?.className || [] : [];
  if (classes.includes(`language-${GALLERY_LANGUAGE}`)) {
    const text = (code.children || []).map(child => child.value || '').join('');
    const images = parseGallery(text);
    return images.length ? <ArticleGallery images={images} /> : null;
  }
  return <pre {...props}>{children}</pre>;
}
