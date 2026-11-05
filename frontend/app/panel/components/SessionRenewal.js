'use client';

import { useEffect, useRef, useState } from 'react';

export default function SessionRenewal() {
  const started = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Strict Mode must not rotate the same refresh token twice.
    if (started.current) return;
    started.current = true;
    async function renew() {
      try {
        const response = await fetch('/api/panel/auth', { cache: 'no-store' });
        if (response.ok) window.location.reload();
        else if (response.status === 401) window.location.replace('/panel/login');
        else setFailed(true);
      } catch { setFailed(true); }
    }
    renew();
  }, []);

  return (
    <div className="panel-state-card" role="status">
      <h1>{failed ? 'No se pudo renovar la sesión' : 'Verificando sesión…'}</h1>
      {failed && <><p>No se modificó ninguna noticia. Intentá nuevamente.</p><button type="button" className="btn-secondary" onClick={() => window.location.reload()}>Reintentar</button></>}
    </div>
  );
}
