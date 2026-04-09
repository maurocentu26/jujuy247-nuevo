import './globals.css';

import SiteHeader from './components/SiteHeader';
import Footer from './components/Footer';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Jujuy247',
  description: 'Portal de noticias',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        suppressHydrationWarning
        style={{ margin: 0, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}
      >
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <SiteHeader />
          <div style={{ flex: '1 0 auto' }}>{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
