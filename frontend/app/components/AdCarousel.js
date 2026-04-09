'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { directusAssetUrl, getDirectusFileId } from '../../lib/directus';

function resolvePhotoFileId(photoItem) {
  if (!photoItem) return '';
  if (typeof photoItem === 'string') return photoItem;
  if (typeof photoItem !== 'object') return '';

  // Direct file object
  if (photoItem.id && typeof photoItem.id === 'string') return photoItem.id;

  // M2M/Junction payload from Directus Files alias
  const directusFile = photoItem.directus_files_id;
  if (typeof directusFile === 'string') return directusFile;
  if (directusFile && typeof directusFile === 'object') {
    const fileId = getDirectusFileId(directusFile);
    if (fileId) return fileId;
  }

  return '';
}

export default function AdCarousel({ ads, variant = 'wide' }) {
  const [adIndex, setAdIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(variant === 'sidebar' ? 4 / 5 : 21 / 9);
  const adIntervalRef = useRef(null);
  const photoIntervalRef = useRef(null);

  const adsArray = useMemo(() => (Array.isArray(ads) ? ads.filter(Boolean) : []), [ads]);
  const currentAd = adsArray[adIndex] || null;
  const photos = useMemo(() => {
    if (!currentAd?.photos) return [];
    const photosField = currentAd.photos;
    if (Array.isArray(photosField)) {
      return photosField
        .map((p) => resolvePhotoFileId(p))
        .filter(Boolean)
        .map((fileId) => directusAssetUrl(fileId));
    }
    if (typeof photosField === 'string') {
      return [directusAssetUrl(photosField)];
    }
    if (typeof photosField === 'object' && photosField?.id) {
      return [directusAssetUrl(photosField.id)];
    }
    return [];
  }, [currentAd?.photos]);

  // Photo rotation: 3 seconds per photo
  useEffect(() => {
    if (photos.length <= 1) return;

    if (photoIntervalRef.current) clearInterval(photoIntervalRef.current);
    photoIntervalRef.current = setInterval(() => {
      setPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 3000);

    return () => {
      if (photoIntervalRef.current) clearInterval(photoIntervalRef.current);
    };
  }, [photos.length]);

  // Ad rotation: 15 seconds per ad (only if multiple ads)
  useEffect(() => {
    if (adsArray.length <= 1) return;
    setPhotoIndex(0);

    if (adIntervalRef.current) clearInterval(adIntervalRef.current);
    adIntervalRef.current = setInterval(() => {
      setAdIndex((prev) => (prev + 1) % adsArray.length);
    }, 15000);

    return () => {
      if (adIntervalRef.current) clearInterval(adIntervalRef.current);
    };
  }, [adsArray.length]);

  if (!currentAd || photos.length === 0) return null;

  const currentPhotoUrl = photos[photoIndex];
  const adUrl = typeof currentAd.url === 'string' ? currentAd.url.trim() : '';
  const isSidebar = variant === 'sidebar';

  const onImageLoad = (event) => {
    const img = event.currentTarget;
    const w = Number(img?.naturalWidth || 0);
    const h = Number(img?.naturalHeight || 0);
    if (!w || !h) return;
    const ratio = w / h;
    if (!Number.isFinite(ratio)) return;
    const minRatio = isSidebar ? 0.55 : 1.2;
    const maxRatio = isSidebar ? 2.2 : 4.2;
    const clamped = Math.min(maxRatio, Math.max(minRatio, ratio));
    setAspectRatio(clamped);
  };

  return (
    <div
      style={{
        borderRadius: 14,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #f8fafc, #eef2f7)',
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 28px rgba(15, 23, 42, 0.08)',
        aspectRatio: String(aspectRatio),
        width: '100%',
        position: 'relative',
      }}
    >
      {adUrl ? (
        <a
          href={adUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <img
            src={currentPhotoUrl}
            alt="Publicidad"
            onLoad={onImageLoad}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              background: '#fff',
            }}
          />
        </a>
      ) : (
        <img
          src={currentPhotoUrl}
          alt="Publicidad"
          onLoad={onImageLoad}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            background: '#fff',
          }}
        />
      )}

      {photos.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 6,
          }}
        >
          {photos.map((_, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: i === photoIndex ? '#fff' : 'rgba(255,255,255,0.6)',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>
      )}

      {adsArray.length > 1 && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            fontSize: 10,
            fontWeight: 700,
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: 4,
            opacity: 0.9,
          }}
        >
          {adIndex + 1} / {adsArray.length}
        </div>
      )}
    </div>
  );
}
