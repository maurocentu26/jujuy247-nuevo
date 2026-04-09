'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const DESKTOP_BREAKPOINT = 960;

function chunkItems(items, chunkSize) {
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

function formatPublishedDate(publishedAt) {
  if (!publishedAt) return '';

  try {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short',
    }).format(new Date(publishedAt));
  } catch {
    return '';
  }
}

export default function YouTubeCarouselCard({ videos, channelUrl, liveVideo, subtitle }) {
  const items = useMemo(() => {
    const list = Array.isArray(videos) ? videos.filter(Boolean) : [];
    if (liveVideo?.id) {
      const withoutDup = list.filter((v) => v?.id !== liveVideo.id);
      return [liveVideo, ...withoutDup].slice(0, 10);
    }
    return list.slice(0, 10);
  }, [videos, liveVideo]);

  const [isDesktop, setIsDesktop] = useState(false);
  const [index, setIndex] = useState(0);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);

    const updateLayout = () => {
      setIsDesktop(mediaQuery.matches);
    };

    updateLayout();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateLayout);
      return () => mediaQuery.removeEventListener('change', updateLayout);
    }

    mediaQuery.addListener(updateLayout);
    return () => mediaQuery.removeListener(updateLayout);
  }, []);

  const pages = useMemo(() => chunkItems(items, isDesktop ? 3 : 1), [items, isDesktop]);

  useEffect(() => {
    setIndex(0);
  }, [pages.length, isDesktop]);

  useEffect(() => {
    if (!pages.length) return;

    if (intervalRef.current) window.clearInterval(intervalRef.current);

    intervalRef.current = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % pages.length);
    }, isDesktop ? 5200 : 4300);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [pages.length, isDesktop]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const slide = el.querySelector(`[data-slide-idx="${index}"]`);
    if (slide && typeof slide.scrollIntoView === 'function') {
      slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
  }, [index]);

  if (!pages.length) return null;

  const isLive = Boolean(liveVideo?.id);

  const renderDesktopCard = (video) => {
    const isCurrentLive = isLive && video.id === liveVideo?.id;
    const publishedLabel = formatPublishedDate(video.publishedAt);

    return (
      <a
        key={video.id}
        href={video.url || channelUrl}
        target="_blank"
        rel="noreferrer"
        title={video.title}
        style={{
          display: 'grid',
          gridTemplateColumns: '92px minmax(0, 1fr)',
          gap: 10,
          alignItems: 'stretch',
          textDecoration: 'none',
          color: 'inherit',
          padding: 8,
          borderRadius: 14,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
        }}
      >
        <div
          style={{
            width: '100%',
            aspectRatio: '16 / 9',
            borderRadius: 10,
            overflow: 'hidden',
            position: 'relative',
            backgroundImage: video.thumbnailUrl
              ? `linear-gradient(180deg, rgba(5,10,18,0.12), rgba(5,10,18,0.86)), url(${video.thumbnailUrl})`
              : 'linear-gradient(180deg, rgba(7,12,20,0.42), rgba(7,12,20,0.92))',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {isCurrentLive ? (
            <span
              style={{
                position: 'absolute',
                left: 8,
                top: 8,
                fontSize: 10,
                fontWeight: 950,
                letterSpacing: 0.4,
                background: '#b42318',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: 999,
              }}
            >
              EN VIVO
            </span>
          ) : null}
        </div>

        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 950,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                  color: '#f97316',
                  padding: '4px 8px',
                  borderRadius: 999,
                  background: 'rgba(249,115,22,0.14)',
                  border: '1px solid rgba(249,115,22,0.22)',
                }}
              >
                YouTube
              </span>
              {publishedLabel ? <span style={{ fontSize: 11, opacity: 0.72 }}>{publishedLabel}</span> : null}
            </div>

            <div
              style={{
                  fontSize: 13,
                fontWeight: 950,
                lineHeight: 1.2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                letterSpacing: 0.15,
              }}
            >
              {video.title || 'Video de YouTube'}
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.25, color: '#cbd5e1' }}>Abrir video</div>
        </div>
      </a>
    );
  };

  const renderMobileCard = (video) => {
    const isCurrentLive = isLive && video.id === liveVideo?.id;
    const publishedLabel = formatPublishedDate(video.publishedAt);

    return (
      <a
        key={video.id}
        href={video.url || channelUrl}
        target="_blank"
        rel="noreferrer"
        title={video.title}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          textDecoration: 'none',
          color: 'inherit',
          minHeight: 'clamp(220px, 72vw, 320px)',
          aspectRatio: '1 / 1',
          padding: 10,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: video.thumbnailUrl
            ? `linear-gradient(180deg, rgba(5,10,18,0.14), rgba(5,10,18,0.88)), url(${video.thumbnailUrl})`
            : 'linear-gradient(180deg, rgba(7,12,20,0.46), rgba(7,12,20,0.92))',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {isCurrentLive ? (
          <span
            style={{
              position: 'absolute',
              left: 14,
              top: 14,
              zIndex: 2,
              fontSize: 10,
              fontWeight: 950,
              letterSpacing: 0.4,
              background: '#b42318',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: 999,
            }}
          >
            EN VIVO
          </span>
        ) : null}

        <div
          style={{
            display: 'grid',
            gap: 8,
            alignSelf: 'stretch',
            marginTop: 'auto',
            padding: 10,
            borderRadius: 14,
            background: 'linear-gradient(180deg, rgba(3,7,18,0.04), rgba(3,7,18,0.84))',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(8px)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 950,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                color: '#f97316',
                padding: '4px 8px',
                borderRadius: 999,
                background: 'rgba(249,115,22,0.14)',
                border: '1px solid rgba(249,115,22,0.22)',
              }}
            >
              YouTube
            </span>
            <span style={{ fontSize: 11, opacity: 0.72, letterSpacing: 0.1 }}>
              {isCurrentLive ? 'Transmisión activa' : 'Último video'}
            </span>
          </div>

          <div
            style={{
              fontSize: 'clamp(14px, 3.5vw, 18px)',
              fontWeight: 950,
              lineHeight: 1.12,
              letterSpacing: 0.15,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {video.title || 'Video de YouTube'}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {publishedLabel ? <span style={{ fontSize: 11, opacity: 0.74, letterSpacing: 0.1 }}>{publishedLabel}</span> : null}
            {subtitle ? <span style={{ fontSize: 11, opacity: 0.72 }}>{subtitle}</span> : null}
          </div>

          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.25, color: '#cbd5e1' }}>Abrir video</div>
        </div>
      </a>
    );
  };

  return (
    <div
      style={{
        borderRadius: 18,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #08111f 0%, #04070d 100%)',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 18px 44px rgba(3,7,18,0.22)',
      }}
    >
      <div
        style={{
          padding: '14px 16px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
          flexWrap: 'wrap',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0))',
        }}
      >
        <div style={{ display: 'grid', gap: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 950, letterSpacing: 1, textTransform: 'uppercase', color: '#f97316' }}>
            Ultimos videos
          </div>
          <div style={{ fontSize: 16, fontWeight: 950, letterSpacing: 0.2 }}>YouTube</div>
        </div>

        {subtitle ? <div style={{ fontSize: 12, opacity: 0.78 }}>{subtitle}</div> : null}
      </div>

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
        {pages.map((pageItems, pageIndex) => (
          <div
            key={`${pageIndex}-${pageItems.map((video) => video.id).join('-')}`}
            data-slide-idx={pageIndex}
            style={{
              flex: '0 0 100%',
              scrollSnapAlign: 'start',
              padding: 14,
            }}
          >
            <div style={{ display: 'grid', gap: 12 }}>
              {pageItems.map((video) => (isDesktop ? renderDesktopCard(video) : renderMobileCard(video)))}
            </div>
          </div>
        ))}
      </div>

      <div
        aria-label="Indicador de carrusel"
        style={{
          display: 'flex',
          gap: 6,
          justifyContent: 'center',
          padding: '10px 12px 14px',
          background: 'transparent',
        }}
      >
        {pages.map((page, i) => (
          <button
            key={page.map((video) => video.id).join('-') || i}
            type="button"
            aria-label={`Grupo ${i + 1}`}
            onClick={() => setIndex(i)}
            style={{
              width: i === index ? 20 : 8,
              height: 8,
              borderRadius: 999,
              border: 0,
              background: i === index ? '#f97316' : 'rgba(255,255,255,0.28)',
              padding: 0,
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

      <div style={{ padding: '0 16px 16px' }}>
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
            padding: '8px 12px',
            borderRadius: 999,
            background: 'rgba(249,115,22,0.14)',
            border: '1px solid rgba(249,115,22,0.24)',
            letterSpacing: 0.2,
          }}
        >
          Ir al canal
        </a>
      </div>
    </div>
  );
}
