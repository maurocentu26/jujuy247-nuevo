'use client';

import { useEffect, useMemo, useState } from 'react';

const TIME_ZONE = 'America/Argentina/Jujuy';

function formatTime(date) {
  try {
    return new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: TIME_ZONE,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}

export default function Clock({ label = 'San Salvador de Jujuy' }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const time = useMemo(() => formatTime(now), [now]);

  return (
    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap' }}>
      {label ? <span style={{ opacity: 0.8 }}>{label}</span> : null}
      <span style={{ fontWeight: 700 }}>{time}</span>
    </span>
  );
}
