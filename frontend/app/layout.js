import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

import SiteHeader from './components/SiteHeader';
import Footer from './components/Footer';
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME, serializeJsonLd } from '../lib/site';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: 'Noticias de Jujuy | Jujuy247', template: '%s | Jujuy247' },
  description: SITE_DESCRIPTION,
  icons: { icon: '/favicon.png', shortcut: '/favicon.png', apple: '/apple-icon.png' },
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION || undefined },
  openGraph: {
    title: 'Noticias de Jujuy | Jujuy247', description: SITE_DESCRIPTION,
    siteName: SITE_NAME, type: 'website', locale: 'es_AR',
    images: [{ url: '/seo-imgs/share-img.jpeg', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image', title: 'Noticias de Jujuy | Jujuy247',
    description: SITE_DESCRIPTION, images: ['/seo-imgs/share-img.jpeg'],
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd({
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'NewsMediaOrganization', '@id': `${getSiteUrl()}/#organization`, name: SITE_NAME,
              url: getSiteUrl(), logo: { '@type': 'ImageObject', url: `${getSiteUrl()}/logo3.png` } },
            { '@type': 'WebSite', '@id': `${getSiteUrl()}/#website`, name: SITE_NAME,
              url: getSiteUrl(), inLanguage: 'es-AR', publisher: { '@id': `${getSiteUrl()}/#organization` } },
          ],
        }) }} />
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <SiteHeader />
          <div style={{ flex: '1 0 auto' }}>{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
