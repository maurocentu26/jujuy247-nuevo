'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const EMAIL = 'bertageronimoperiodista@gmail.com';
const WHATSAPP_NUMBER = '+543885867757';
const WHATSAPP_LINK = 'https://wa.me/543885867757?text=Hola%20Jujuy247%2C%20quiero%20hacer%20una%20consulta%20de%20publicidad.';
const AD_WHATSAPP_LINK = 'https://wa.me/543885867757?text=Hola%20Jujuy247%2C%20quiero%20consultar%20por%20publicidad%20en%20el%20portal.';

export default function FooterClient({ sections }) {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const navSections = Array.isArray(sections) ? sections : [];

  return (
    <footer className="siteFooter">
      <div className="siteFooterInner">
        <div className="siteFooterBrandCol">
          <Link href="/" className="siteFooterBrandLink" aria-label="Ir a inicio">
            <Image src="/logo3.png" alt="Jujuy247" width={360} height={120} className="siteFooterBrandLogo" />
          </Link>
          <p>ESTAMOS EN EL AIRE DE JUJUY</p>
        </div>

        <div className="siteFooterLinksCol">
          <h2>Secciones</h2>
          <nav aria-label="Secciones del sitio" className="siteFooterLinkList">
            {navSections.map((section) => (
              <Link key={section.id} href={`/?category=${encodeURIComponent(section.slug)}`} className="siteFooterLink">
                {section.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="siteFooterLinksCol">
          <h2>El medio</h2>
          <nav aria-label="Enlaces institucionales" className="siteFooterLinkList">
            <button type="button" className="siteFooterLink siteFooterButtonLink" onClick={() => setIsContactOpen(true)}>
              Contacto
            </button>
            <a href={AD_WHATSAPP_LINK} target="_blank" rel="noreferrer" className="siteFooterLink">
              Anunciar
            </a>
          </nav>
        </div>
      </div>

      <div className="siteFooterBottom">
        <div>© 2026 Jujuy 24/7. Todos los derechos reservados.</div>
      </div>

      {isContactOpen ? (
        <div className="siteFooterModalOverlay" role="presentation" onClick={() => setIsContactOpen(false)}>
          <div className="siteFooterModal" role="dialog" aria-modal="true" aria-label="Contacto" onClick={(event) => event.stopPropagation()}>
            <div className="siteFooterModalHeader">
              <h3>Contacto</h3>
              <button type="button" className="siteFooterModalClose" aria-label="Cerrar" onClick={() => setIsContactOpen(false)}>
                ×
              </button>
            </div>

            <div className="siteFooterModalBody">
              <div className="siteFooterContactItem">
                <span>Correo</span>
                <Link href={`mailto:${EMAIL}`}>{EMAIL}</Link>
              </div>

              <div className="siteFooterContactItem">
                <span>Mensaje de WhatsApp</span>
                <div className="siteFooterContactInline">
                  <span>{WHATSAPP_NUMBER}</span>
                  <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
                    Enviar mensaje
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </footer>
  );
}
