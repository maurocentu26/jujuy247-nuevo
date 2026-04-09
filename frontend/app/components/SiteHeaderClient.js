'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Clock from './Clock';
import { FaFacebookF, FaInstagram, FaYoutube } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { WiCloud, WiDaySunny, WiFog, WiRain, WiSnow, WiThunderstorm } from 'react-icons/wi';

const ARTICLE_TITLE_EVENT = 'jujuy247:article-title';

function HamburgerIcon() {
  const line = {
    height: 2,
    width: 18,
    background: 'currentColor',
    borderRadius: 999,
    display: 'block',
  };

  return (
    <span aria-hidden="true" style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      <span style={line} />
      <span style={line} />
      <span style={line} />
    </span>
  );
}

function SocialLink({ href, label, icon }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      style={{
        color: 'inherit',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        opacity: 0.9,
      }}
    >
      <span style={{ position: 'absolute', left: -9999, top: -9999 }}>{label}</span>
      <span aria-hidden="true" style={{ display: 'inline-flex', fontSize: 25, lineHeight: 1 }}>{icon}</span>
    </a>
  );
}

function getWeatherIcon(weatherCode) {
  if (typeof weatherCode !== 'number') return null;
  if (weatherCode === 0) return <WiDaySunny />;
  if (weatherCode >= 1 && weatherCode <= 3) return <WiCloud />;
  if (weatherCode === 45 || weatherCode === 48) return <WiFog />;
  if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) return <WiRain />;
  if (weatherCode >= 71 && weatherCode <= 86) return <WiSnow />;
  if (weatherCode >= 95 && weatherCode <= 99) return <WiThunderstorm />;
  return null;
}

function WeatherInfo({ weather, compact }) {
  const weatherIcon = useMemo(() => getWeatherIcon(weather?.weatherCode), [weather?.weatherCode]);
  const temperature = weather ? `${weather.temperatureC}°` : '—°';
  const summary = weather ? weather.summary : 'Clima';

  if (compact) {
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end', minWidth: 0 }}>
        <span style={{ fontSize: 'clamp(12px, 2.8vw, 14px)', opacity: 0.85 }}>
          <Clock label={null} />
        </span>
        <div style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>
          {weatherIcon ? <span aria-hidden="true" style={{ fontSize: 28, lineHeight: 0 }}>{weatherIcon}</span> : null}
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
            <span style={{ fontWeight: 800, fontSize: 'clamp(12px, 2.8vw, 14px)' }}>{temperature}</span>
            <span style={{ fontSize: 'clamp(11px, 2.6vw, 12px)', opacity: 0.8 }}>{summary}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'inline-flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 18, opacity: 0.85 }}>San Salvador de Jujuy</span>
        <span style={{ fontSize: 18, opacity: 0.95 }}>
          <Clock label={null} />
        </span>
      </div>
      <div
        style={{
          marginTop: 10,
          display: 'grid',
          gridTemplateColumns: weatherIcon ? '22px auto' : 'auto',
          gridTemplateRows: 'auto auto',
          columnGap: 35,
          rowGap: 0,
          alignItems: 'center',
          fontSize: 18,
          opacity: 0.95,
        }}
      >
        {weatherIcon ? (
          <span aria-hidden="true" style={{ gridRow: '1 / span 2', fontSize: 50, lineHeight: 0 }}>
            {weatherIcon}
          </span>
        ) : null}
        <span style={{ fontWeight: 800, lineHeight: 1.1 }}>{temperature}</span>
        <span style={{ opacity: 0.9, lineHeight: 1.1 }}>{summary}</span>
      </div>
    </div>
  );
}

export default function SiteHeaderClient({ categories, weather }) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentArticleTitle, setCurrentArticleTitle] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isCompact, setIsCompact] = useState(false);
  const rafRef = useRef(null);
  const fullHeaderRef = useRef(null);
  const [compactTriggerY, setCompactTriggerY] = useState(240);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSelectedCategory(params.get('category') || '');

    const initialTitle = document.documentElement?.dataset?.currentArticleTitle || '';
    setCurrentArticleTitle(initialTitle);

    const onArticleTitle = (event) => {
      const nextTitle = event?.detail?.title;
      setCurrentArticleTitle(typeof nextTitle === 'string' ? nextTitle : '');
    };

    window.addEventListener(ARTICLE_TITLE_EVENT, onArticleTitle);

    const update = () => {
      rafRef.current = null;
      const y = window.scrollY || 0;
      setIsCompact((prev) => {
        if (y <= 0) return false;
        if (!prev && y >= compactTriggerY) return true;
        return prev;
      });
    };

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(update);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener(ARTICLE_TITLE_EVENT, onArticleTitle);
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [compactTriggerY]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [isCompact]);

  useEffect(() => {
    if (isCompact) return;
    const el = fullHeaderRef.current;
    if (!el) return;
    const h = Math.ceil(el.getBoundingClientRect().height || 0);
    if (h > 0 && h !== compactTriggerY) setCompactTriggerY(h);
  }, [isCompact, compactTriggerY]);

  const navCategories = Array.isArray(categories) ? categories : [];

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: '#fff' }}>
      {isCompact ? (
        <div style={{ borderBottom: '1px solid #e5e5e5', background: '#fff' }}>
          <div style={{ maxWidth: 980, margin: '0 auto', padding: '10px clamp(16px, 3vw, 24px)' }}>
            <div className="headerDesktop">
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0, flex: '0 0 auto' }}>
                  <label style={{ position: 'absolute', left: -9999, top: -9999 }} htmlFor="category-select">
                    Categorías
                  </label>
                  <select
                    id="category-select"
                    value={selectedCategory}
                    onChange={(e) => {
                      const slug = e.target.value;
                      setSelectedCategory(slug);
                      if (!slug) {
                        router.push('/');
                        return;
                      }
                      router.push(`/?category=${encodeURIComponent(slug)}`);
                    }}
                    style={{
                      width: 'clamp(180px, 40vw, 260px)',
                      maxWidth: '100%',
                      height: 36,
                      borderRadius: 10,
                      border: '1px solid #e5e5e5',
                      padding: '0 10px',
                      fontSize: 13,
                      fontWeight: 700,
                      background: '#fff',
                    }}
                  >
                    <option value="">Todas las categorías</option>
                    {navCategories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {currentArticleTitle ? (
                  <div
                    title={currentArticleTitle}
                    style={{
                      flex: '1 1 auto',
                      minWidth: 0,
                      textAlign: 'center',
                      fontSize: 13,
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      padding: '0 6px',
                    }}
                  >
                    {currentArticleTitle}
                  </div>
                ) : (
                  <div style={{ flex: '1 1 auto' }} />
                )}

                <WeatherInfo weather={weather} compact />
              </div>
            </div>

            <div className="headerMobile">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <button
                  type="button"
                  aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                  onClick={() => setIsMobileMenuOpen((v) => !v)}
                  style={{
                    border: '1px solid #e5e5e5',
                    background: '#fff',
                    color: '#111',
                    borderRadius: 10,
                    height: 36,
                    width: 44,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  <HamburgerIcon />
                </button>

                <Link
                  href="/"
                  style={{
                    flex: '1 1 auto',
                    textAlign: 'center',
                    fontWeight: 900,
                    letterSpacing: 0.4,
                    color: '#111',
                    textDecoration: 'none',
                  }}
                >
                  JUJUY247
                </Link>

                <div style={{ width: 44 }} />
              </div>

              {isMobileMenuOpen ? (
                <div style={{ marginTop: 10, borderTop: '1px solid #e5e5e5', paddingTop: 10 }}>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 800, opacity: 0.8 }} htmlFor="mobile-category-select">
                        Categorías
                      </label>
                      <select
                        id="mobile-category-select"
                        value={selectedCategory}
                        onChange={(e) => {
                          const slug = e.target.value;
                          setSelectedCategory(slug);
                          setIsMobileMenuOpen(false);
                          if (!slug) {
                            router.push('/');
                            return;
                          }
                          router.push(`/?category=${encodeURIComponent(slug)}`);
                        }}
                        style={{
                          marginTop: 6,
                          width: '100%',
                          height: 40,
                          borderRadius: 10,
                          border: '1px solid #e5e5e5',
                          padding: '0 10px',
                          fontSize: 14,
                          fontWeight: 700,
                          background: '#fff',
                        }}
                      >
                        <option value="">Todas las categorías</option>
                        {navCategories.map((c) => (
                          <option key={c.id} value={c.slug}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <WeatherInfo weather={weather} compact />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div ref={fullHeaderRef} style={{ borderBottom: '1px solid #e5e5e5', background: '#0b0b0b', color: '#fff' }}>
            <div style={{ maxWidth: 980, margin: '0 auto', padding: '14px clamp(16px, 3vw, 24px)' }}>
              <div className="headerDesktop">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
                  <WeatherInfo weather={weather} />

                  <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                    <Image
                      src="/logo.png"
                      alt="Jujuy247"
                      width={180}
                      height={180}
                      priority
                      style={{ height: 'clamp(90px, 18vw, 180px)', width: 'auto' }}
                    />
                  </Link>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }} aria-label="Redes">
                    <SocialLink href="https://facebook.com" label="Facebook" icon={<FaFacebookF />} />
                    <SocialLink href="https://twitter.com" label="X" icon={<FaXTwitter />} />
                    <SocialLink href="https://instagram.com" label="Instagram" icon={<FaInstagram />} />
                    <SocialLink href="https://youtube.com" label="YouTube" icon={<FaYoutube />} />
                  </div>
                </div>
              </div>

              <div className="headerMobile">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <button
                    type="button"
                    aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                    onClick={() => setIsMobileMenuOpen((v) => !v)}
                    style={{
                      border: '1px solid rgba(255,255,255,0.25)',
                      background: 'transparent',
                      color: '#fff',
                      borderRadius: 10,
                      height: 36,
                      width: 44,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                    }}
                  >
                    <HamburgerIcon />
                  </button>

                  <Link
                    href="/"
                    style={{
                      flex: '1 1 auto',
                      textAlign: 'center',
                      fontWeight: 900,
                      letterSpacing: 0.4,
                      color: '#fff',
                      textDecoration: 'none',
                    }}
                  >
                    JUJUY247
                  </Link>

                  <div style={{ width: 44 }} />
                </div>

                {isMobileMenuOpen ? (
                  <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.18)', paddingTop: 12 }}>
                    <div style={{ display: 'grid', gap: 10 }}>
                      <div style={{ color: '#fff' }}>
                        <label style={{ fontSize: 12, fontWeight: 800, opacity: 0.85 }} htmlFor="mobile-category-select-full">
                          Categorías
                        </label>
                        <select
                          id="mobile-category-select-full"
                          value={selectedCategory}
                          onChange={(e) => {
                            const slug = e.target.value;
                            setSelectedCategory(slug);
                            setIsMobileMenuOpen(false);
                            if (!slug) {
                              router.push('/');
                              return;
                            }
                            router.push(`/?category=${encodeURIComponent(slug)}`);
                          }}
                          style={{
                            marginTop: 6,
                            width: '100%',
                            height: 40,
                            borderRadius: 10,
                            border: '1px solid rgba(255,255,255,0.25)',
                            padding: '0 10px',
                            fontSize: 14,
                            fontWeight: 700,
                            background: '#fff',
                            color: '#111',
                          }}
                        >
                          <option value="">Todas las categorías</option>
                          {navCategories.map((c) => (
                            <option key={c.id} value={c.slug}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <WeatherInfo weather={weather} compact />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="headerDesktop" style={{ borderBottom: '1px solid #e5e5e5', background: '#fff' }}>
            <div style={{ maxWidth: 980, margin: '0 auto', padding: '10px clamp(16px, 3vw, 24px)' }}>
              <nav style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }} aria-label="Categorías">
                {navCategories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/?category=${encodeURIComponent(c.slug)}`}
                    style={{
                      color: 'inherit',
                      textDecoration: 'none',
                      fontSize: 13,
                      fontWeight: 800,
                      letterSpacing: 0.2,
                    }}
                  >
                    {c.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
