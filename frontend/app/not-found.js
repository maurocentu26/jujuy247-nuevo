import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: 24 }}>
      <h1>Página no encontrada</h1>
      <p>El contenido no existe o ya no está publicado.</p>
      <Link href="/">Volver a las noticias de Jujuy</Link>
    </main>
  );
}
