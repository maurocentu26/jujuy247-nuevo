'use client';

import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FiX, FiArrowLeft, FiAlertTriangle } from 'react-icons/fi';
import GalleryAwarePre from '../../components/GalleryAwarePre';
import { formatPublishedAt } from '../../../lib/datetime';

// Como en el diario: el epígrafe (título de la imagen) se ve debajo de la foto.
const PREVIEW_COMPONENTS = {
  pre: GalleryAwarePre,
  img: ({ node, title, alt, ...props }) => (
    <span style={{ display: 'block', margin: '14px 0' }}>
      <img {...props} alt={alt || title || ''} style={{ maxWidth: '100%', height: 'auto', borderRadius: 12, display: 'block' }} />
      {title ? <span style={{ display: 'block', marginTop: 6, fontSize: 12, color: '#6b7280' }}>{title}</span> : null}
    </span>
  ),
};

function parseYoutubeId(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const u = new URL(url);
    if (!['http:', 'https:'].includes(u.protocol)) return null;
    let id = null;
    if (u.hostname === 'youtu.be') {
      id = u.pathname.slice(1);
    } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(u.hostname)) {
      if (u.pathname.startsWith('/shorts/')) {
        id = u.pathname.split('/')[2];
      } else {
        id = u.searchParams.get('v');
      }
    }
    return /^[a-zA-Z0-9_-]{11}$/.test(id || '') ? id : null;
  } catch {
    return null;
  }
}

export default function ArticlePreviewModal({ article, categoryName, coverUrl, publishedAt, onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      // Con el visor de una galería abierto, Escape cierra solo el visor.
      if (e.key === 'Escape' && !document.querySelector('dialog[open]')) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const youtubeId = parseYoutubeId(article.youtube_url);

  return (
    <div className="preview-modal-shell" data-theme="light" role="dialog" aria-modal="true" aria-label="Vista previa de noticia">
      <div className="preview-notice-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiAlertTriangle color="#fbbf24" size={18} />
          <span>
            <strong>Vista previa editorial</strong> · Esta noticia se encuentra en borrador y no es visible al público.
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary"
          style={{ padding: '6px 14px', minHeight: '34px', fontSize: '13px' }}
        >
          <FiArrowLeft size={14} />
          <span>Volver al editor</span>
        </button>
      </div>

      <div style={{ maxWidth: '960px', margin: '40px auto', padding: '0 24px 60px' }}>
        <header style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '20px', marginBottom: '30px' }}>
          <img src="/logo3.png" alt="Jujuy247" width="180" height="63" style={{ height: 'auto', display: 'block' }} />
        </header>

        <article className="article-layout">
          {categoryName && (
            <div style={{ color: '#c23434', fontWeight: '700', fontSize: '14px', textTransform: 'uppercase', marginBottom: '12px' }}>
              {categoryName}
            </div>
          )}

          <h1 style={{
            fontFamily: 'var(--panel-font-title)',
            fontSize: '38px',
            lineHeight: '1.15',
            letterSpacing: '-0.03em',
            margin: '0 0 16px',
            color: '#1a1a1a',
          }}>
            {article.title || 'Título de la noticia'}
          </h1>

          {article.excerpt && (
            <p style={{
              fontSize: '20px',
              lineHeight: '1.45',
              color: '#4b5563',
              margin: '0 0 24px',
              fontWeight: '400',
            }}>
              {article.excerpt}
            </p>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderTop: '1px solid #e5e7eb',
            borderBottom: '1px solid #e5e7eb',
            padding: '12px 0',
            marginBottom: '28px',
            fontSize: '13px',
            color: '#6b7280',
          }}>
            <strong style={{ color: '#111827' }}>Redacción Jujuy247</strong>
            <span>•</span>
            <span>{publishedAt ? formatPublishedAt(publishedAt) : 'Fecha al publicar'}</span>
          </div>

          {coverUrl && (
            <figure style={{ margin: '0 0 32px' }}>
              <img
                src={coverUrl}
                alt={article.title || 'Foto de portada'}
                style={{ width: '100%', maxHeight: '520px', objectFit: 'cover', borderRadius: '4px', display: 'block' }}
              />
              {article.caption && (
                <figcaption style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px', fontStyle: 'italic' }}>
                  {article.caption}
                </figcaption>
              )}
            </figure>
          )}

          <div className="article-reading" style={{ fontSize: '18px', lineHeight: '1.7', color: '#1f2937' }}>
            {article.content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={PREVIEW_COMPONENTS}>
                {article.content}
              </ReactMarkdown>
            ) : (
              <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin desarrollo de contenido aún...</p>
            )}
          </div>

          {youtubeId && (
            <div style={{ marginTop: '40px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', fontSize: '14px' }}>
                Video de la noticia
              </div>
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                  title="Video de YouTube"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                />
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
