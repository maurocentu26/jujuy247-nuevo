'use client';

import { useMemo, useState } from 'react';

export default function AudioPlayer() {
  const streamUrl = process.env.NEXT_PUBLIC_RADIO_STREAM_URL;
  const [error, setError] = useState('');

  const src = useMemo(() => {
    if (!streamUrl) return '';
    return streamUrl;
  }, [streamUrl]);

  return (
//     <div style={{ border: '1px solid #e5e5e5', borderRadius: 12, padding: 12 }}>
//       <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Radio / Streaming</div>
//       {!src ? (
//         <div style={{ fontSize: 12, opacity: 0.75 }}>
//           Configurá <code style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>NEXT_PUBLIC_RADIO_STREAM_URL</code>
//           {' '}para reproducir un stream (Icecast/Shoutcast/HLS).
//         </div>
//       ) : (
//         <>
//           <audio
//             controls
//             preload="none"
//             src={src}
//             style={{ width: '100%' }}
//             onError={() => setError('No se pudo reproducir el stream. Verificá el formato/URL y CORS.')}
//           />
//           {error ? <div style={{ marginTop: 8, fontSize: 12, color: '#b42318' }}>{error}</div> : null}
//         </>
//       )}
//     </div>
//   );
null);
}
