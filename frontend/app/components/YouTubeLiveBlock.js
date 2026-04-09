'use client';

import { useMemo } from 'react';

function LiveBadge() {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 950,
        letterSpacing: 0.4,
        background: '#b42318',
        color: '#fff',
        padding: '5px 10px',
        borderRadius: 999,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      EN VIVO
    </span>
  );
}

export default function YouTubeLiveBlock({ liveVideo, videos, channelUrl }) {
  const liveId = liveVideo?.id;
  const liveTitle = liveVideo?.title || 'Transmisión en vivo';

  const sideVideos = useMemo(() => {
    const list = Array.isArray(videos) ? videos.filter(Boolean) : [];
    return list.filter((v) => v?.id && v.id !== liveId).slice(0, 6);
  }, [videos, liveId]);

  if (!liveId) return null;

  const embedUrl = `https://www.youtube.com/embed/${encodeURIComponent(liveId)}?autoplay=0&mute=1&playsinline=1&rel=0`;

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        background: '#0b0b0b',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      <div
        style={{
          padding: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0))',
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <LiveBadge />
          <span style={{ fontSize: 12, fontWeight: 900, opacity: 0.92, letterSpacing: 0.2 }}>YouTube</span>
        </div>

        <a
          href={liveVideo?.url || channelUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            color: 'inherit',
            textDecoration: 'none',
            fontSize: 12,
            fontWeight: 900,
            borderBottom: '1px solid rgba(255,255,255,0.55)',
            opacity: 0.92,
          }}
        >
          Abrir en YouTube
        </a>
      </div>

      <div style={{ padding: '0 14px 14px' }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'stretch' }}>
          <div style={{ flex: '1 1 560px', minWidth: 260 }}>
            <div
              style={{
                borderRadius: 14,
                overflow: 'hidden',
                background: '#000',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              <div style={{ padding: 12 }}>
                <div
                  style={{
                    fontSize: 'clamp(16px, 2.2vw, 20px)',
                    fontWeight: 950,
                    lineHeight: 1.15,
                    letterSpacing: 0.1,
                  }}
                >
                  {liveTitle}
                </div>
              </div>

              <div style={{ width: '100%', aspectRatio: '16 / 9', height: 'auto', maxHeight: 520 }}>
                <iframe
                  title={liveTitle}
                  src={embedUrl}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
                />
              </div>
            </div>
          </div>

          <aside style={{ flex: '1 1 260px', minWidth: 220, maxWidth: 360 }}>
            <div
              style={{
                borderRadius: 14,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.10)',
                background: 'rgba(255,255,255,0.04)',
              }}
            >
              <div style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                <div style={{ fontWeight: 950, fontSize: 12, letterSpacing: 0.2, opacity: 0.95 }}>Últimos videos</div>
                <a
                  href={channelUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: 'inherit',
                    textDecoration: 'none',
                    fontSize: 12,
                    fontWeight: 900,
                    borderBottom: '1px solid rgba(255,255,255,0.55)',
                    opacity: 0.9,
                  }}
                >
                  Ver canal
                </a>
              </div>

              <div style={{ display: 'grid', gap: 10, padding: 12, paddingTop: 0 }}>
                {sideVideos.map((v) => (
                  <a
                    key={v.id}
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '96px minmax(0, 1fr)',
                      gap: 10,
                      alignItems: 'center',
                      color: 'inherit',
                      textDecoration: 'none',
                    }}
                    title={v.title}
                  >
                    <div
                      style={{
                        width: 96,
                        aspectRatio: '16 / 9',
                        borderRadius: 10,
                        overflow: 'hidden',
                        background: 'rgba(255,255,255,0.08)',
                      }}
                    >
                      {v.thumbnailUrl ? (
                        <img
                          src={v.thumbnailUrl}
                          alt={v.title}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      ) : null}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 900,
                          lineHeight: 1.2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          opacity: 0.95,
                        }}
                      >
                        {v.title}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
