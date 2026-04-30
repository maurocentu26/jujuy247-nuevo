'use client';

import { useEffect } from 'react';

export default function GoogleAdSlot({ client, slot, variant = 'wide' }) {
  useEffect(() => {
    if (!client || !slot) return;
    if (typeof window === 'undefined') return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ignore AdSense loader issues so the page still renders.
    }
  }, [client, slot]);

  if (!client || !slot) return null;

  const minHeight = variant === 'sidebar' ? 250 : variant === 'compact' ? 120 : 180;

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block', width: '100%', minHeight }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}