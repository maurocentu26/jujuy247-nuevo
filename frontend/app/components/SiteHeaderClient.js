'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Clock from './Clock';
import { WiCloud, WiDaySunny, WiFog, WiRain, WiSnow, WiThunderstorm } from 'react-icons/wi';

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

function WeatherInfo({ weather, compact, panel = false }) {
  const weatherIcon = useMemo(() => getWeatherIcon(weather?.weatherCode), [weather?.weatherCode]);
  const temperature = weather ? `${weather.temperatureC}°C` : '—°C';
  const summary = weather ? weather.summary : 'Clima';

  if (panel) {
    return (
      <div className={compact ? 'siteHeaderWeatherPanel siteHeaderWeatherPanelCompact' : 'siteHeaderWeatherPanel'}>
        <div className="siteHeaderWeatherPanelTop">
          <span className="siteHeaderWeatherPlace">S.S. DE JUJUY</span>
          <span className="siteHeaderWeatherTime">
            <Clock label={null} />
          </span>
        </div>

        <div className="siteHeaderWeatherPanelBottom">
          <span aria-hidden="true" className="siteHeaderWeatherIcon">
            {weatherIcon || <WiDaySunny />}
          </span>
          <span className="siteHeaderWeatherTemp">{temperature}</span>
          <span className="siteHeaderWeatherSummary">{summary}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? 'siteHeaderWeatherInline siteHeaderWeatherInlineCompact' : 'siteHeaderWeatherInline'}>
      <span className="siteHeaderWeatherPlace">S.S. DE JUJUY</span>
      <span className="siteHeaderWeatherSeparator" aria-hidden="true">
        ·
      </span>
      <span className="siteHeaderWeatherTime">
        <Clock label={null} />
      </span>
      <span aria-hidden="true" className="siteHeaderWeatherIcon">
        {weatherIcon || <WiDaySunny />}
      </span>
      <span className="siteHeaderWeatherTemp">{temperature}</span>
      <span className="siteHeaderWeatherSummary">{summary}</span>
    </div>
  );
}

export default function SiteHeaderClient({ categories, weather }) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isCompact, setIsCompact] = useState(false);
  const rafRef = useRef(null);
  const fullHeaderRef = useRef(null);
  const [compactTriggerY, setCompactTriggerY] = useState(240);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSelectedCategory(params.get('category') || '');

    const update = () => {
      rafRef.current = null;
      const width = window.innerWidth || 0;
      if (width <= 980) {
        setIsCompact(false);
        return;
      }
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
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', onScroll);
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
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const renderCategorySelect = (id, compactSelect = false) => (
    <>
      <label className="siteHeaderVisuallyHidden" htmlFor={id}>
        Categorías
      </label>
      <select
        id={id}
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
        className={compactSelect ? 'siteHeaderSelect siteHeaderSelectCompact' : 'siteHeaderSelect'}
      >
        <option value="">Todas las categorías</option>
        {navCategories.map((c) => (
          <option key={c.id} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
    </>
  );

  return (
    <header className="siteHeaderRoot">
      <div ref={fullHeaderRef} className={isCompact ? 'siteHeaderShell siteHeaderShellCompact' : 'siteHeaderShell'}>
        {isCompact ? (
          <div className="siteHeaderTopRow siteHeaderTopRowCompact">
            <button
              type="button"
              className="siteHeaderMenuButton"
              aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setIsMobileMenuOpen((v) => !v)}
            >
              <HamburgerIcon />
            </button>

            <Link href="/" className="siteHeaderBrand" aria-label="Ir a inicio">
              <Image src="/logo3.png" alt="Jujuy247" width={360} height={120} priority className="siteHeaderLogo" />
            </Link>

            <div className="siteHeaderDesktopWeather siteHeaderDesktopWeatherCompact">
              <WeatherInfo weather={weather} compact />
            </div>
          </div>
        ) : (
          <div className="siteHeaderTopRow">
            <Link href="/" className="siteHeaderBrand" aria-label="Ir a inicio">
              <Image src="/logo3.png" alt="Jujuy247" width={360} height={120} priority className="siteHeaderLogo" />
            </Link>

            <div className="siteHeaderCurrentArticle siteHeaderCurrentArticleEmpty" aria-hidden="true" />

            <div className="siteHeaderDesktopWeather">
              <WeatherInfo weather={weather} compact={isCompact} />
            </div>

            <button
              type="button"
              className="siteHeaderMenuButton"
              aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setIsMobileMenuOpen((v) => !v)}
            >
              <HamburgerIcon />
            </button>
          </div>
        )}

        {!isCompact ? (
          <div className="siteHeaderNavBar">
            <nav className="siteHeaderNav" aria-label="Categorías">
              {navCategories.map((c) => (
                <Link key={c.id} href={`/?category=${encodeURIComponent(c.slug)}`} className="siteHeaderNavLink">
                  {c.name}
                </Link>
              ))}
            </nav>
          </div>
        ) : null}

        {isMobileMenuOpen ? (
          <div className="siteHeaderMobileMenuOverlay" role="presentation" onClick={closeMobileMenu}>
            <aside
              className="siteHeaderMobileMenu"
              role="dialog"
              aria-modal="true"
              aria-label="Menú de categorías"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="siteHeaderMobileMenuBrandWrap">
                <Link href="/" className="siteHeaderMobileMenuBrand" aria-label="Ir a inicio" onClick={closeMobileMenu}>
                  <Image src="/logo3.png" alt="Jujuy247" width={280} height={94} priority className="siteHeaderMobileMenuLogo" />
                </Link>
              </div>

              <div className="siteHeaderMobileMenuHeader">
                <span className="siteHeaderMobileMenuTitle">Categorías</span>
                <button type="button" className="siteHeaderMobileMenuClose" onClick={closeMobileMenu} aria-label="Cerrar menú">
                  ×
                </button>
              </div>

              <div className="siteHeaderMobileMenuWeather">
                <WeatherInfo weather={weather} compact panel />
              </div>

              <div className="siteHeaderMobileMenuSection">{renderCategorySelect('mobile-category-select')}</div>
              <nav className="siteHeaderMobileNav" aria-label="Categorías móviles">
                {navCategories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/?category=${encodeURIComponent(c.slug)}`}
                    className="siteHeaderMobileNavLink"
                    onClick={closeMobileMenu}
                  >
                    {c.name}
                  </Link>
                ))}
              </nav>
            </aside>
          </div>
        ) : null}
      </div>
    </header>
  );
}
