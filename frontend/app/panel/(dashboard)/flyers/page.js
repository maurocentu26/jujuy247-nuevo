import { Montserrat } from 'next/font/google';
import FlyerStudio from '../../components/flyer/FlyerStudio';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '800'],
  display: 'swap',
});

export const metadata = {
  title: 'Estudio de Flyers | Panel Jujuy247',
};

export default async function FlyersPage({ searchParams }) {
  const params = await searchParams;
  const raw = Array.isArray(params?.noticia) ? params.noticia[0] : params?.noticia;
  const initialId = /^\d+$/.test(raw || '') ? raw : null;

  return (
    <div className={`studio-root ${montserrat.className}`} style={{ display: 'contents' }}>
      <FlyerStudio initialId={initialId} family={montserrat.style.fontFamily} />
    </div>
  );
}
