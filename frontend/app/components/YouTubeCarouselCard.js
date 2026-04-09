'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export default function YouTubeCarouselCard({
  videos,
  channelUrl,
  liveVideo,
  subtitle,
}) {
  const items = useMemo(() => {
    const list = Array.isArray(videos) ? videos.filter(Boolean) : [];
    if (liveVideo?.id) {
      const withoutDup = list.filter((v) => v?.id !== liveVideo.id);
      return [liveVideo, ...withoutDup].slice(0, 10);
    }
    return list.slice(0, 10);
  }, [videos, liveVideo]);

  const [index, setIndex] = useState(0);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    setIndex(0);
  }, [items.length]);

  useEffect(() => {
    if (!items.length) return;

    const el = containerRef.current;
    if (!el) return;

    if (intervalRef.current) window.clearInterval(intervalRef.current);

    intervalRef.current = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 4500);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [items.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const slide = el.querySelector(`[data-slide-idx="${index}"]`);
    if (slide && typeof slide.scrollIntoView === 'function') {
      slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
  }, [index]);

  if (!items.length) return null;

  const isLive = Boolean(liveVideo?.id);

  return (
    <div
      style={{
        borderRadius: 14,
        overflow: 'hidden',
        background: '#0b0b0b',
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
        {items.map((v, i) => {
          const bg = v.thumbnailUrl ? `url(${v.thumbnailUrl})` : 'none';
          const isSlideLive = isLive && v.id === liveVideo.id;

          return (
            <a
              key={v.id}
              href={v.url || channelUrl}
              target="_blank"
              rel="noreferrer"
              data-slide-idx={i}
              style={{
                flex: '0 0 100%',
                scrollSnapAlign: 'start',
                textDecoration: 'none',
                color: 'inherit',
                position: 'relative',
                minHeight: 150,
                height: 'clamp(240px, 34vw, 320px)',
                backgroundImage: `${bg}`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'flex-end',
              }}
              title={v.title}
            >
              <div style={{ padding: 14, width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {isSlideLive ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 900,
                          letterSpacing: 0.3,
                          background: '#b42318',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: 999,
                        }}
                      >
                        EN VIVO
                      </span>
                    ) : null}
                    <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.2, opacity: 0.95 }}>
                      {isSlideLive ? 'Estamos en vivo' : 'Seguinos en YouTube'}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      borderBottom: '1px solid rgba(255,255,255,0.65)',
                      opacity: 0.95,
                    }}
                  >
                    {isSlideLive ? 'Ver en vivo' : 'Ver video'}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: 10,
                    fontSize: 14,
                    fontWeight: 900,
                    lineHeight: 1.2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textShadow: '0 1px 10px rgba(0,0,0,0.5)',
                  }}
                >
                  {v.title}
                </div>

                {subtitle ? (
                  <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>{subtitle}</div>
                ) : null}
              </div>
            </a>
          );
        })}
      </div>

      <div
        aria-label="Indicador de carrusel"
        style={{
          display: 'flex',
          gap: 6,
          justifyContent: 'center',
          padding: '10px 12px',
          background: '#0b0b0b',
        }}
      >
        {items.map((v, i) => (
          <button
            key={v.id}
            type="button"
            aria-label={`Video ${i + 1}`}
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

      <div style={{ padding: '0 14px 14px', background: '#0b0b0b' }}>
        <a
          href={channelUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-block',
            color: '#fff',
            textDecoration: 'none',
            fontSize: 12,
            fontWeight: 900,
            borderBottom: '1px solid rgba(255,255,255,0.65)',
            opacity: 0.95,
          }}
        >
          Ir al canal
        </a>
      </div>
    </div>
  );
}
