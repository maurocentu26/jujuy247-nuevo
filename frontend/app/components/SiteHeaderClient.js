'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Clock from './Clock';
import { headerScrollState } from '../../lib/editorial';

export default function SiteHeaderClient({ categories = [], weather }) {
  const [hidden, setHidden] = useState(false);
  const [compact, setCompact] = useState(false);
  const [menu, setMenu] = useState(false);
  const [focused, setFocused] = useState(false);
  const previous = useRef(0);
  const hiddenRef = useRef(false);
  const path = usePathname();
  useEffect(() => { setMenu(false); setHidden(false); }, [path]);
  useEffect(() => {
    function scroll() {
      const y = Math.max(0, window.scrollY);
      const state = headerScrollState(y, previous.current, hiddenRef.current);
      setCompact(state.compact);
      setHidden(state.hidden);
      hiddenRef.current = state.hidden;
      previous.current = state.previousY;
    }
    window.addEventListener('scroll', scroll, { passive: true });
    return () => window.removeEventListener('scroll', scroll);
  }, []);
  return <div className="editorial-header-space"><header className={['editorial-header', compact ? 'is-compact' : '', hidden && !menu && !focused ? 'is-hidden' : ''].join(' ')} onKeyDown={e => { if (e.key === 'Escape') { setMenu(false); e.currentTarget.querySelector('button')?.focus(); } }} onFocusCapture={() => setFocused(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }}>
    <div className="editorial-header-inner"><div className="editorial-utility"><span>San Salvador de Jujuy</span><Clock label={null} /><span>{weather ? `${weather.temperatureC} °C · ${weather.summary}` : 'Clima no disponible'}</span></div>
    <div className="editorial-masthead"><Link href="/" aria-label="Jujuy247, inicio"><Image src="/logo3.png" alt="Jujuy247" width={758} height={265} priority /></Link><div className="editorial-header-tools"><a href="https://www.youtube.com/@jujuy247" target="_blank" rel="noreferrer">YouTube</a><button type="button" aria-expanded={menu} aria-controls="editorial-nav" onClick={() => setMenu(!menu)}>{menu ? 'Cerrar menú' : 'Secciones'}</button></div></div>
    <nav id="editorial-nav" className={menu ? 'editorial-nav is-open' : 'editorial-nav'} aria-label="Navegación principal"><Link href="/" aria-current={path === '/' ? 'page' : undefined}>Inicio</Link>{categories.map(c => <Link key={c.id} href={`/categoria/${encodeURIComponent(c.slug)}`} aria-current={path === `/categoria/${c.slug}` ? 'page' : undefined}>{c.name}</Link>)}</nav></div>
  </header></div>;
}
