'use client';

import { usePathname } from 'next/navigation';

export default function SiteLayoutWrapper({ header, footer, children }) {
  const pathname = usePathname();
  const isPanel = pathname?.startsWith('/panel');

  if (isPanel) {
    return <>{children}</>;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {header}
      <div style={{ flex: '1 0 auto' }}>{children}</div>
      {footer}
    </div>
  );
}
