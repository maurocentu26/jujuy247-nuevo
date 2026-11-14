import Image from 'next/image';
import { coverFrame } from '../../../lib/article-layout.mjs';

// The photo is always shown whole (object-fit: contain). When its shape does
// not match the frame, a blurred copy of the same photo fills the bands, the
// way most news sites present vertical flyers and square photos.
export default function ArticleCover({ src, file, alt }) {
  if (!src) return null;
  const frame = coverFrame(file);
  const width = Number(file?.width) || 1600;
  const height = Number(file?.height) || 900;

  return (
    <figure
      className="article-cover"
      data-orientation={frame.orientation}
      data-fills-desktop={frame.fillsDesktop ? 'true' : 'false'}
      data-fills-mobile={frame.fillsMobile ? 'true' : 'false'}
      style={{ '--cover-ar-d': frame.desktopRatio, '--cover-ar-m': frame.mobileRatio }}
    >
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        width={64}
        height={Math.max(1, Math.round((64 * height) / width))}
        sizes="64px"
        className="article-cover-backdrop"
      />
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(max-width: 700px) 100vw, (max-width: 1100px) calc(100vw - 80px), 780px"
        preload
        className="article-cover-photo"
      />
    </figure>
  );
}
