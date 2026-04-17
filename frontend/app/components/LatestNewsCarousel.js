'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function LatestNewsCarousel({ items }) {
  const slides = useMemo(() => (Array.isArray(items) ? items.filter(Boolean) : []), [items]);

  const [index, setIndex] = useState(0);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);

  const scrollToIndex = (nextIndex, behavior = 'smooth') => {
    const el = containerRef.current;
    if (!el) return;
    const slide = el.querySelector(`[data-slide-idx="${nextIndex}"]`);
    if (!slide) return;
    const left = slide.offsetLeft;
    el.scrollTo({ left, behavior });
  };

  useEffect(() => {
    setIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (!slides.length) return;
    if (intervalRef.current) window.clearInterval(intervalRef.current);

    intervalRef.current = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5500);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [slides.length]);

  useEffect(() => {
    // Important: avoid scrollIntoView() here, it can scroll the *page*.
    // We only want to scroll the carousel horizontally.
    scrollToIndex(index, 'smooth');
  }, [index]);

  if (!slides.length) return null;

  return (
    <section aria-label="Últimas noticias" style={{ marginBottom: 18 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 950, letterSpacing: 0.2 }}>Últimas noticias</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Se actualiza automáticamente</div>
      </div>

      <div
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid #e5e5e5',
          background: '#1a1a2e',
          color: '#fff',
        }}
      >
        <div
          ref={containerRef}
          style={{
            display: 'flex',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}
        >
          {slides.map((a, i) => (
            <Link
              key={a.id}
              href={`/noticias/${a.slug}`}
              data-slide-idx={i}
              style={{
                flex: '0 0 100%',
                scrollSnapAlign: 'start',
                textDecoration: 'none',
                color: 'inherit',
                position: 'relative',
                height: 'clamp(220px, 34vw, 360px)',
                display: 'flex',
                alignItems: 'flex-end',
                backgroundImage: a.coverUrl
                  ? `url(${a.coverUrl})`
                  : 'linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.78))',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              title={a.title}
            >
              <div style={{ padding: 'clamp(12px, 3vw, 16px)', width: '100%' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  {a.categoryName ? (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 950,
                        letterSpacing: 0.3,
                        background: 'rgba(255,255,255,0.18)',
                        border: '1px solid rgba(255,255,255,0.22)',
                        color: '#fff',
                        padding: '4px 10px',
                        borderRadius: 999,
                        backdropFilter: 'blur(6px)',
                      }}
                    >
                      {a.categoryName}
                    </span>
                  ) : null}
                </div>

                <div
                  style={{
                    marginTop: 10,
                    fontSize: 'clamp(18px, 3.3vw, 26px)',
                    fontWeight: 950,
                    lineHeight: 1.1,
                    textShadow: '0 1px 12px rgba(0,0,0,0.45)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {a.title}
                </div>

                {a.excerpt ? (
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 13,
                      opacity: 0.9,
                      maxWidth: 720,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textShadow: '0 1px 10px rgba(0,0,0,0.35)',
                    }}
                  >
                    {a.excerpt}
                  </div>
                ) : null}
              </div>
            </Link>
          ))}
        </div>

        <div
          aria-label="Indicador de carrusel"
          style={{
            display: 'flex',
            gap: 6,
            justifyContent: 'center',
            padding: '10px 12px',
            background: '#1a1a2e',
          }}
        >
          {slides.map((a, i) => (
            <button
              key={a.id}
              type="button"
              aria-label={`Noticia ${i + 1}`}
              onClick={() => setIndex(i)}
              style={{
                width: i === index ? 18 : 8,
                height: 8,
                borderRadius: 999,
                border: 0,
                background: i === index ? '#fff' : 'rgba(255,255,255,0.35)',
                padding: 0,
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
