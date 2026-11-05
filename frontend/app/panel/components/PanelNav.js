'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiExternalLink, FiFileText, FiImage, FiLogOut } from 'react-icons/fi';
import BrandMark from './BrandMark';

export default function PanelNav({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const inFlyers = pathname?.startsWith('/panel/flyers');

  async function handleLogout() {
    try {
      await fetch('/api/panel/auth', { method: 'DELETE' });
      router.push('/panel/login');
      router.refresh();
    } catch {
      window.location.href = '/panel/login';
    }
  }

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ')
    || user?.email?.split('@')[0]
    || 'Redacción';

  return (
    <nav className="panel-nav" aria-label="Principal">
      <Link href="/panel" className="panel-nav-brand" aria-label="Jujuy247, inicio del panel">
        <BrandMark size={36} />
      </Link>

      <Link href="/panel" className="panel-nav-item" aria-current={inFlyers ? undefined : 'page'}>
        <FiFileText size={20} aria-hidden="true" />
        <span>Noticias</span>
      </Link>
      <Link href="/panel/flyers" className="panel-nav-item" aria-current={inFlyers ? 'page' : undefined}>
        <FiImage size={20} aria-hidden="true" />
        <span>Flyers</span>
      </Link>

      <div className="panel-nav-end">
        <a href="/" target="_blank" rel="noreferrer" className="panel-nav-item">
          <FiExternalLink size={20} aria-hidden="true" />
          <span>Diario</span>
        </a>
        <button type="button" className="panel-nav-item" onClick={handleLogout} title={`Cerrar la sesión de ${displayName}`}>
          <FiLogOut size={20} aria-hidden="true" />
          <span>Salir</span>
        </button>
      </div>
    </nav>
  );
}
