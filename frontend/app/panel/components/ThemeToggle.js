'use client';

import { useEffect, useState } from 'react';
import { FiMoon, FiSun } from 'react-icons/fi';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const root = document.querySelector('.panel-body-wrapper');
    setTheme(root?.getAttribute('data-theme') || 'light');
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.querySelector('.panel-body-wrapper')?.setAttribute('data-theme', next);
    try {
      localStorage.setItem('panel-theme', next);
    } catch {
      // Sin almacenamiento el tema dura hasta recargar.
    }
    setTheme(next);
  }

  const label = theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
  return (
    <button type="button" className="icon-button" onClick={toggle} aria-label={label} title={label}>
      {theme === 'dark' ? <FiSun size={18} aria-hidden="true" /> : <FiMoon size={18} aria-hidden="true" />}
    </button>
  );
}
