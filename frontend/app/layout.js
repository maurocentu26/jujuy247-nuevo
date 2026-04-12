import './globals.css';

import SiteHeader from './components/SiteHeader';
import Footer from './components/Footer';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Jujuy247',
  description: 'Portal de noticias',
  openGraph: {
    title: 'Jujuy247',
    description: 'Estamos en el aire de Jujuy.',
    siteName: 'Jujuy247',
    type: 'website',
    url: "https://www.jujuy247.com.ar",
    images: [
      {
        url: '/seo-imgs/share-img.jpeg',
        width: 1200,
        height: 630,
        alt: 'Jujuy247',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jujuy247',
    description: 'Estamos en el aire de Jujuy.',
    images: ['/seo-imgs/share-img.jpeg'],
  },
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
