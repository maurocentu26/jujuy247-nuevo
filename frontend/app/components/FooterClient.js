import Image from 'next/image';
import Link from 'next/link';
export default function FooterClient({ sections = [] }) {
  return <footer className="editorial-footer"><div className="editorial-footer-grid">
    <div><Link href="/" aria-label="Jujuy247, inicio"><Image src="/logo3.png" alt="Jujuy247" width={758} height={265} /></Link><p>Periodismo desde San Salvador de Jujuy.</p></div>
    <nav aria-label="Secciones del pie de página"><h2>Secciones</h2><div className="footer-sections">{sections.map(s => <Link key={s.id} href={`/categoria/${encodeURIComponent(s.slug)}`}>{s.name}</Link>)}</div></nav>
    <div><h2>Contacto editorial</h2><a href="mailto:bertageronimoperiodista@gmail.com">bertageronimoperiodista@gmail.com</a><p>San Salvador de Jujuy, Argentina</p><a href="https://www.youtube.com/@jujuy247" target="_blank" rel="noreferrer">Nuestro canal de YouTube</a></div>
    <div><h2>Publicidad</h2><p>Consultá por espacios para tu marca.</p><a href="https://wa.me/543885867757?text=Hola%20Jujuy247%2C%20quiero%20consultar%20por%20publicidad." target="_blank" rel="noreferrer">Contactar por WhatsApp</a></div>
  </div><div className="editorial-footer-bottom"><span>© {new Date().getFullYear()} Jujuy247. Todos los derechos reservados.</span><a href="https://www.linkedin.com/in/maurocenturion26/" target="_blank" rel="noreferrer">Desarrollado por Mauro Centurión</a></div></footer>;
}
