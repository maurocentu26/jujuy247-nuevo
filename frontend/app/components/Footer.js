import Link from 'next/link';

export default function Footer() {
  const socialLinks = [
    { label: 'Instagram', href: '#' },
    { label: 'Facebook', href: '#' },
    { label: 'X', href: '#' },
    { label: 'YouTube', href: '#' },
  ];

  return (
    <footer style={{ borderTop: '1px solid #e5e5e5', marginTop: 32 }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
          <nav aria-label="Redes sociales" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.75 }}>Redes:</span>
            {socialLinks.map((s) => (
              <Link key={s.label} href={s.href} style={{ fontSize: 12, textDecoration: 'none', color: 'inherit', opacity: 0.85 }}>
                {s.label}
              </Link>
            ))}
          </nav>

          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Desarrollado por{' '}
            <Link href="#" style={{ fontWeight: 700, textDecoration: 'none', color: 'inherit' }}>
              Mauro Centurión
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
