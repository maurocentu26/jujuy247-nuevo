'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const DESKTOP_BREAKPOINT = 980;

function chunkItems(items, chunkSize) {
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

function formatPublishedDate(dateString) {
  if (!dateString) return '';
  try {
    return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(new Date(dateString));
  } catch {
    return '';
  }
}

function PlayGlyph() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 52,
        height: 52,
        borderRadius: 999,
        background: '#ef2a2a',
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 14px 30px rgba(239,42,42,0.35)',
        fontSize: 24,
        lineHeight: 1,
      }}
    >
      ▷
    </span>
  );
}

export default function YouTubeCarouselCard({ videos, channelUrl, liveVideo }) {
  const items = useMemo(() => {
    const list = Array.isArray(videos) ? videos.filter(Boolean) : [];
    if (liveVideo?.id) {
      const withoutDup = list.filter((v) => v?.id !== liveVideo.id);
      return [liveVideo, ...withoutDup].slice(0, 12);
    }
    return list.slice(0, 12);
  }, [videos, liveVideo]);

  const [isDesktop, setIsDesktop] = useState(false);
  const [index, setIndex] = useState(0);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);

    const updateLayout = () => setIsDesktop(mediaQuery.matches);
    updateLayout();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateLayout);
      return () => mediaQuery.removeEventListener('change', updateLayout);
    }

    mediaQuery.addListener(updateLayout);
    return () => mediaQuery.removeListener(updateLayout);
  }, []);

  const pages = useMemo(() => chunkItems(items, isDesktop ? 4 : 1), [items, isDesktop]);

  useEffect(() => {
    setIndex(0);
  }, [pages.length, isDesktop]);

  useEffect(() => {
    if (!pages.length) return;

    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % pages.length);
    }, isDesktop ? 5600 : 4300);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [pages.length, isDesktop]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const slide = el.querySelector(`[data-page-idx="${index}"]`);
    if (slide && typeof slide.scrollIntoView === 'function') {
      slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
  }, [index]);

  if (!pages.length) return null;

  return (
    <section
      style={{
        border: '1px solid #e9ebef',
        borderRadius: 14,
        overflow: 'hidden',
        background: '#f7f8fa',
      }}
    >
      <div
        style={{
          padding: '12px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 4, height: 24, borderRadius: 999, background: '#e11d2f' }} />
          <h2 style={{ margin: 0, fontSize: 34, fontWeight: 900, letterSpacing: 0.2 }}>Videos</h2>
        </div>

        <a
          href={channelUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            color: '#dc2626',
            textDecoration: 'none',
            fontSize: 23,
            fontWeight: 700,
          }}
        >
          Ver canal →
        </a>
      </div>

      <div
        ref={containerRef}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          padding: '0 10px 12px',
        }}
      >
        {pages.map((page, pageIndex) => (
          <div
            key={`page-${pageIndex}-${page.map((v) => v.id).join('-')}`}
            data-page-idx={pageIndex}
            style={{
              flex: '0 0 100%',
              scrollSnapAlign: 'start',
              display: 'grid',
              gridTemplateColumns: isDesktop ? 'repeat(4, minmax(0, 1fr))' : '1fr',
              gap: 12,
            }}
          >
            {page.map((video) => {
              const isLive = liveVideo?.id && video.id === liveVideo.id;
              const published = formatPublishedDate(video.publishedAt);

              return (
                <a
                  key={video.id}
                  href={video.url || channelUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    borderRadius: 14,
                    overflow: 'hidden',
                    border: '1px solid #eceff3',
                    background: '#fff',
                    boxShadow: '0 10px 22px rgba(9,20,36,0.06)',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '16 / 9',
                      background: video.thumbnailUrl
                        ? `linear-gradient(180deg, rgba(8,15,25,0.08), rgba(8,15,25,0.42)), url(${video.thumbnailUrl})`
                        : 'linear-gradient(180deg, #c7cbd1, #b8bdc5)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PlayGlyph />
                    {isLive ? (
                      <span
                        style={{
                          position: 'absolute',
                          left: 10,
                          top: 10,
                          background: '#b42318',
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 900,
                          letterSpacing: 0.4,
                          borderRadius: 999,
                          padding: '4px 8px',
                          textTransform: 'uppercase',
                        }}
                      >
                        En vivo
                      </span>
                    ) : null}
                  </div>

                  <div style={{ padding: '10px 12px 12px' }}>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 800,
                        lineHeight: 1.22,
                        color: isLive ? '#dc2626' : '#0f172a',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {video.title || 'Video de YouTube'}
                    </div>

                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{published || 'YouTube'}</span>
                      <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 700 }}>Ver video</span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingBottom: 12 }}>
        {pages.map((page, i) => (
          <button
            key={`dot-${i}-${page.length}`}
            type="button"
            aria-label={`Pagina ${i + 1}`}
            onClick={() => setIndex(i)}
            style={{
              width: i === index ? 20 : 8,
              height: 8,
              borderRadius: 999,
              border: 0,
              background: i === index ? '#ef2a2a' : '#cbd5e1',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>
    </section>
  );
}
