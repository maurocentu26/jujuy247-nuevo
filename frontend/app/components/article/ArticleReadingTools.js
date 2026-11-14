'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa6';
import { FiArrowRight, FiCheck, FiLink } from 'react-icons/fi';
import { shareLinks, useCopyLink } from './ArticleShare';

// Reading progress bar (all screens) and, on phones, a bottom bar with
// sharing and the next story. The bar appears once the reader is in the text
// and leaves when the "Seguí leyendo" block is on screen, so it never covers it.
export default function ArticleReadingTools({ url, title, next }) {
  const bar = useRef(null);
  const [visible, setVisible] = useState(false);
  const [copied, copy] = useCopyLink(url);
  const links = shareLinks(url, title);

  useEffect(() => {
    const body = document.querySelector('[data-article-body]');
    const end = document.querySelector('[data-article-end]');
    let frame = 0;
    let endOnScreen = false;

    function update() {
      frame = 0;
      if (!body) return;
      const rect = body.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      const read = Math.min(1, Math.max(0, -rect.top / Math.max(1, total)));
      if (bar.current) bar.current.style.transform = `scaleX(${read})`;
      setVisible(rect.top < window.innerHeight * 0.25 && !endOnScreen);
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    const observer = end
      ? new IntersectionObserver(([entry]) => {
          endOnScreen = entry.isIntersecting || entry.boundingClientRect.top < 0;
          schedule();
        })
      : null;
    if (end) observer.observe(end);

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer?.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <div className="reading-progress" aria-hidden="true">
        <span ref={bar} />
      </div>
      <div className={visible ? 'article-dock is-visible' : 'article-dock'} aria-hidden={!visible} inert={!visible}>
        <a className="dock-btn dock-whatsapp" href={links.whatsapp} target="_blank" rel="noreferrer" aria-label="Compartir por WhatsApp">
          <FaWhatsapp aria-hidden="true" />
        </a>
        <button type="button" className="dock-btn" onClick={copy} aria-label={copied ? 'Enlace copiado' : 'Copiar enlace'}>
          {copied ? <FiCheck aria-hidden="true" /> : <FiLink aria-hidden="true" />}
        </button>
        {next ? (
          <Link className="dock-next" href={`/noticias/${encodeURIComponent(next.slug)}`}>
            <span className="dock-next-label">Siguiente</span>
            <span className="dock-next-title">{next.title}</span>
            <FiArrowRight aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </>
  );
}
