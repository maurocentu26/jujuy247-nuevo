import { getStagingBannerInfo } from '../../../lib/env.mjs';

export default function StagingBanner() {
  const info = getStagingBannerInfo();
  if (!info) return null;

  return (
    <div className="staging-banner" role="status" aria-live="polite">
      <span className="staging-banner-badge">STAGING</span>
      <span className="staging-banner-text">
        Entorno de pruebas (rama <code>{info.branch}</code>). Los cambios acá no se publican en producción.
      </span>
      <span className="staging-banner-pill">
        {info.dryRun ? 'Redes: simulación (dry-run)' : 'Redes: modo LIVE'}
      </span>
    </div>
  );
}
