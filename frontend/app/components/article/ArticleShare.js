'use client';

import { useState } from 'react';
import { FaFacebookF, FaWhatsapp, FaXTwitter } from 'react-icons/fa6';
import { FiCheck, FiLink, FiShare2 } from 'react-icons/fi';

export function shareLinks(url, title) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  return {
    whatsapp: `https://wa.me/?text=${t}%20${u}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    x: `https://x.com/intent/post?text=${t}&url=${u}`,
  };
}

export function useCopyLink(url) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copiá el enlace', url);
    }
  }
  return [copied, copy];
}

export default function ArticleShare({ url, title }) {
  const links = shareLinks(url, title);
  const [copied, copy] = useCopyLink(url);

  async function nativeShare() {
    if (!navigator.share) {
      copy();
      return;
    }
    try {
      await navigator.share({ title, url });
    } catch {
      // Cancelled by the reader.
    }
  }

  return (
    <div className="article-share" role="group" aria-label="Compartir la nota">
      <a className="share-btn share-whatsapp" href={links.whatsapp} target="_blank" rel="noreferrer" aria-label="Compartir por WhatsApp">
        <FaWhatsapp aria-hidden="true" />
      </a>
      <a className="share-btn" href={links.facebook} target="_blank" rel="noreferrer" aria-label="Compartir en Facebook">
        <FaFacebookF aria-hidden="true" />
      </a>
      <a className="share-btn" href={links.x} target="_blank" rel="noreferrer" aria-label="Compartir en X">
        <FaXTwitter aria-hidden="true" />
      </a>
      <button type="button" className="share-btn" onClick={copy} aria-label={copied ? 'Enlace copiado' : 'Copiar enlace'}>
        {copied ? <FiCheck aria-hidden="true" /> : <FiLink aria-hidden="true" />}
      </button>
      <button type="button" className="share-btn share-native" onClick={nativeShare} aria-label="Más opciones para compartir">
        <FiShare2 aria-hidden="true" />
      </button>
      <span className="visually-hidden" aria-live="polite">{copied ? 'Enlace copiado' : ''}</span>
    </div>
  );
}
