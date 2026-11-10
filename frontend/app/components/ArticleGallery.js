'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import './article-gallery.css';

const MAX_THUMBS = 6;

// Las fotos de Directus se piden ya achicadas; cualquier otra URL se usa tal cual.
function sized(src, width) {
  try {
    const url = new URL(src);
    if (!/\/assets\/[^/]+$/.test(url.pathname)) return src;
    url.searchParams.set('width', String(width));
    url.searchParams.set('quality', '80');
    url.searchParams.set('withoutEnlargement', 'true');
    return url.href;
  } catch {
    return src;
  }
}

export default function ArticleGallery({ images }) {
  const dialogRef = useRef(null);
  const touchStartRef = useRef(null);
  const [index, setIndex] = useState(null);
  const total = images.length;

  const open = useCallback((i) => {
    setIndex(i);
    dialogRef.current?.showModal();
  }, []);

  const close = useCallback(() => dialogRef.current?.close(), []);
  const go = useCallback((delta) => {
    setIndex(i => (i === null ? i : (i + delta + total) % total));
  }, [total]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const onClose = () => setIndex(null);
    dialog.addEventListener('close', onClose);
    return () => dialog.removeEventListener('close', onClose);
  }, []);

  if (!total) return null;

  const visible = images.slice(0, MAX_THUMBS);
  const hidden = total - visible.length;
  const current = index === null ? null : images[index];

  function handleKeyDown(e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  }

  function handleTouchEnd(e) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  }

  return (
    <figure className="article-gallery">
      <figcaption className="article-gallery-head">
        Galería <span>· {total} {total === 1 ? 'foto' : 'fotos'}</span>
      </figcaption>
      <div className={`article-gallery-grid count-${Math.min(visible.length, MAX_THUMBS)}`}>
        {visible.map((img, i) => {
          const isLast = i === visible.length - 1 && hidden > 0;
          return (
            <button
              key={`${img.src}-${i}`}
              type="button"
              className="article-gallery-thumb"
              onClick={() => open(i)}
              aria-label={`Ver foto ${i + 1} de ${total}${img.caption ? `: ${img.caption}` : ''}`}
            >
              <img src={sized(img.src, 720)} alt="" loading="lazy" decoding="async" />
              {isLast ? <span className="article-gallery-more" aria-hidden="true">+{hidden}</span> : null}
            </button>
          );
        })}
      </div>

      <dialog
        ref={dialogRef}
        className="article-lightbox"
        aria-label="Galería de fotos"
        onKeyDown={handleKeyDown}
        onClick={e => { if (e.target === e.currentTarget) close(); }}
        onTouchStart={e => { touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchEnd={handleTouchEnd}
      >
        {current ? (
          <div className="article-lightbox-inner">
            <div className="article-lightbox-bar">
              <span className="article-lightbox-count" aria-live="polite">{index + 1} / {total}</span>
              <button type="button" className="article-lightbox-btn" onClick={close} aria-label="Cerrar galería" autoFocus>
                <FiX size={22} aria-hidden="true" />
              </button>
            </div>
            <div className="article-lightbox-stage" onClick={e => { if (e.target === e.currentTarget) close(); }}>
              {total > 1 ? (
                <button type="button" className="article-lightbox-btn article-lightbox-prev" onClick={() => go(-1)} aria-label="Foto anterior">
                  <FiChevronLeft size={28} aria-hidden="true" />
                </button>
              ) : null}
              <img key={current.src} src={sized(current.src, 1800)} alt={current.caption || `Foto ${index + 1} de ${total}`} />
              {total > 1 ? (
                <button type="button" className="article-lightbox-btn article-lightbox-next" onClick={() => go(1)} aria-label="Foto siguiente">
                  <FiChevronRight size={28} aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <p className="article-lightbox-caption">{current.caption}</p>
          </div>
        ) : null}
      </dialog>
    </figure>
  );
}
