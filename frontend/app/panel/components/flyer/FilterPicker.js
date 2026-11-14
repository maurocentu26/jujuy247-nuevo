'use client';

import { useEffect, useRef } from 'react';
import { FLYER } from '../../../../lib/flyer/layout.mjs';
import { PHOTO_FILTERS } from '../../../../lib/flyer/filters.mjs';
import { drawPhoto } from '../../../../lib/flyer/render.js';

const THUMB_WIDTH = 96;
const SCALE = THUMB_WIDTH / FLYER.width;
const THUMB_HEIGHT = Math.round(FLYER.height * SCALE);

// Miniatura de la foto, con el mismo encuadre del flyer, ya filtrada.
function FilterThumb({ photo, crop, filter }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const frame = requestAnimationFrame(() => {
      const ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#2a2d30';
      ctx.fillRect(0, 0, THUMB_WIDTH, THUMB_HEIGHT);
      if (!photo) return;
      ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
      drawPhoto(ctx, photo, crop, filter);
    });
    return () => cancelAnimationFrame(frame);
  }, [photo, crop, filter]);
  return <canvas ref={ref} width={THUMB_WIDTH} height={THUMB_HEIGHT} aria-hidden="true" />;
}

export default function FilterPicker({ value, onChange, photo, crop }) {
  return (
    <fieldset className="studio-filters">
      <legend className="studio-label">Filtro de la foto</legend>
      <div className="studio-filter-list">
        {PHOTO_FILTERS.map(({ id, label }) => (
          <label key={id} className={`studio-filter ${value === id ? 'is-selected' : ''}`}>
            <input
              type="radio"
              name="flyer-filter"
              value={id}
              className="visually-hidden"
              checked={value === id}
              onChange={() => onChange(id)}
            />
            <FilterThumb photo={photo} crop={crop} filter={id} />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
