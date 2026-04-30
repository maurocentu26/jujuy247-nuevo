import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

import SiteHeader from './components/SiteHeader';
import Footer from './components/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Jujuy247',
  description: 'Portal de noticias',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/apple-icon.png',
  },
  keywords: [
    'Jujuy247',
    'Noticias de Jujuy',
    'Actualidad Jujuy',
    'Radio Jujuy',
    'Portal de noticias',
    'Jujuy24/7',
    'NOA Noticias',
    'Berta Geronimo',
    'Periodismo Jujuy',
    'diarios de jujuy',
    'feriado en jujuy',
    'clima en jujuy',
    'deportes jujuy',
    'politica jujuy',
    'economia jujuy',
    'cultura jujuy',
    'espectaculos jujuy',
    'sucesos jujuy',
    'jujuy hoy',
    'jujuy noticias de ultima hora',
  ],
  robots: {
    index: true,
    follow: true,
  },
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
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || '';

  return (
    <html lang="es" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        {adsenseClient ? (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </head>
      <body suppressHydrationWarning style={{ margin: 0 }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <SiteHeader />
          <div style={{ flex: '1 0 auto' }}>{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
