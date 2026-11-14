'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ThemeToggle from '../ThemeToggle';
import { coverFileId } from '../../../../lib/panel-views.mjs';
import {
  coverRect,
  EXCERPT_SUGGESTED,
  exportBlockReason,
  FLYER,
  flyerFileName,
  isLowResolution,
  LABEL_MAX,
  layoutText,
  TITLE_SUGGESTED,
} from '../../../../lib/flyer/layout.mjs';
import { renderFlyer } from '../../../../lib/flyer/render.js';
import { DEFAULT_FILTER, normalizeFilter } from '../../../../lib/flyer/filters.mjs';
import FilterPicker from './FilterPicker';

const FONT_WEIGHTS = [400, 500, 600, 800];
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const NUDGE = 20;
const STATUS_TABS = [['all', 'Todas'], ['published', 'Publicadas'], ['draft', 'Borradores']];
const MOBILE_TABS = [['texto', 'Texto'], ['foto', 'Foto'], ['etiquetas', 'Etiquetas']];

function draftKey(id) {
  return `flyer-draft:v1:${id}`;
}

function defaultsFor(article) {
  const section = (article.category?.name || '').trim();
  return {
    title: article.title || '',
    section,
    pill: section,
    excerpt: article.excerpt || '',
    showExcerpt: false,
    filter: DEFAULT_FILTER,
    crop: { zoom: 1, x: 0, y: 0 },
  };
}

function readDraft(article) {
  const base = defaultsFor(article);
  try {
    const saved = JSON.parse(localStorage.getItem(draftKey(article.id)) || 'null');
    if (!saved) return base;
    const { gray, ...rest } = saved;
    return { ...base, ...rest, filter: normalizeFilter(saved.filter), crop: { ...base.crop, ...saved.crop } };
  } catch {
    return base;
  }
}

function writeDraft(id, fields) {
  try {
    localStorage.setItem(draftKey(id), JSON.stringify(fields));
  } catch {
    // Sin almacenamiento los ajustes duran mientras la página esté abierta.
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('image'));
    image.src = src;
  });
}

function canvasBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('blob'))), type, quality);
  });
}

function statusText(status) {
  return status === 'published' ? 'Publicada' : status === 'draft' ? 'Borrador' : 'Archivada';
}

export default function FlyerStudio({ initialId, family }) {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const measureCtxRef = useRef(null);
  const noteTimerRef = useRef(null);
  const uploadUrlRef = useRef(null);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [results, setResults] = useState([]);
  const [resultsState, setResultsState] = useState('loading');
  const [pickerOpen, setPickerOpen] = useState(!initialId);
  const [mobileTab, setMobileTab] = useState('texto');

  const [article, setArticle] = useState(null);
  const [articleState, setArticleState] = useState(initialId ? 'loading' : 'empty');
  const [fields, setFields] = useState(null);

  const [uploadUrl, setUploadUrl] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoState, setPhotoState] = useState('none');
  const [photoAttempt, setPhotoAttempt] = useState(0);
  const [logo, setLogo] = useState(null);
  const [fontsReady, setFontsReady] = useState(false);

  const [format, setFormat] = useState('PNG');
  const [webpSupported, setWebpSupported] = useState(true);
  const [copySupported, setCopySupported] = useState(true);
  const [guides, setGuides] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState(null);

  // Lo que depende del navegador se detecta una sola vez al montar.
  useEffect(() => {
    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    setWebpSupported(probe.toDataURL('image/webp').startsWith('data:image/webp'));
    setCopySupported(Boolean(navigator.clipboard?.write && window.ClipboardItem));
    measureCtxRef.current = probe.getContext('2d');

    loadImage('/logo3-white.png').then(setLogo).catch(() => setLogo(null));
    Promise.all(FONT_WEIGHTS.map(weight => document.fonts.load(`${weight} 40px ${family}`)))
      .catch(() => {})
      .then(() => setFontsReady(true));

    return () => {
      clearTimeout(noteTimerRef.current);
      if (uploadUrlRef.current) URL.revokeObjectURL(uploadUrlRef.current);
    };
  }, [family]);

  const clearUpload = useCallback(() => {
    if (uploadUrlRef.current) URL.revokeObjectURL(uploadUrlRef.current);
    uploadUrlRef.current = null;
    setUploadUrl(null);
  }, []);

  const selectArticle = useCallback(next => {
    clearUpload();
    setArticle(next);
    setFields(readDraft(next));
    setArticleState('ready');
    setNote(null);
    setPickerOpen(false);
  }, [clearUpload]);

  // Noticia que viene en la URL.
  useEffect(() => {
    if (!initialId) return undefined;
    let active = true;
    fetch(`/api/panel/articles/${initialId}`, { cache: 'no-store' })
      .then(async res => {
        const json = await res.json();
        if (!res.ok || !json.data) throw new Error();
        if (active) selectArticle(json.data);
      })
      .catch(() => {
        if (!active) return;
        setArticleState('missing');
        setPickerOpen(true);
      });
    return () => { active = false; };
  }, [initialId, selectArticle]);

  // Buscador.
  useEffect(() => {
    let active = true;
    setResultsState('loading');
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ limit: '30' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (query.trim()) params.set('search', query.trim());
      try {
        const res = await fetch(`/api/panel/articles?${params}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error();
        if (active) {
          setResults(Array.isArray(json.data) ? json.data : []);
          setResultsState('ready');
        }
      } catch {
        if (active) {
          setResults([]);
          setResultsState('error');
        }
      }
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [query, statusFilter]);

  // Foto: la subida a mano tiene prioridad sobre la de la noticia.
  const articleCover = coverFileId(article?.cover_image);
  const photoSrc = uploadUrl || (articleCover ? `/api/panel/flyer-image?id=${articleCover}` : null);
  useEffect(() => {
    if (!photoSrc) {
      setPhoto(null);
      setPhotoState('none');
      return undefined;
    }
    let active = true;
    setPhoto(null);
    setPhotoState('loading');
    loadImage(photoSrc)
      .then(image => {
        if (!active) return;
        setPhoto(image);
        setPhotoState('ready');
      })
      .catch(() => { if (active) setPhotoState('error'); });
    return () => { active = false; };
  }, [photoSrc, photoAttempt]);

  useEffect(() => {
    if (article && fields) writeDraft(article.id, fields);
  }, [article, fields]);

  const layout = useMemo(() => {
    if (!fields || !fontsReady || !measureCtxRef.current) return null;
    const ctx = measureCtxRef.current;
    return layoutText(
      { title: fields.title, excerpt: fields.showExcerpt ? fields.excerpt : '' },
      (text, font) => {
        ctx.font = font;
        return ctx.measureText(text).width;
      },
      family,
    );
  }, [fields, fontsReady, family]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fields || !fontsReady) return undefined;
    const frame = requestAnimationFrame(() => {
      renderFlyer(canvas.getContext('2d'), {
        section: fields.section,
        pill: fields.pill,
        filter: fields.filter,
        crop: fields.crop,
        layout,
      }, { photo, logo, family });
    });
    return () => cancelAnimationFrame(frame);
  }, [fields, layout, photo, logo, family, fontsReady]);

  const rect = photo && fields ? coverRect(photo.naturalWidth, photo.naturalHeight, fields.crop) : null;
  const lowResolution = rect ? isLowResolution(rect) : false;
  const blockReason = exportBlockReason({
    hasArticle: Boolean(article && fields),
    hasPhoto: photoState === 'ready',
    title: fields?.title,
    layout,
  });
  const canExport = !blockReason && Boolean(layout) && !busy && photoState === 'ready';
  const titleLength = fields?.title.trim().length || 0;
  const excerptLength = fields?.excerpt.trim().length || 0;

  function update(patch) {
    setFields(prev => ({ ...prev, ...patch }));
    setNote(null);
  }

  function updateCrop(patch) {
    setFields(prev => {
      const crop = { ...prev.crop, ...patch };
      if (!photo) return { ...prev, crop };
      const next = coverRect(photo.naturalWidth, photo.naturalHeight, crop);
      return { ...prev, crop: { zoom: crop.zoom, x: next.offsetX, y: next.offsetY } };
    });
    setNote(null);
  }

  function showNote(text, kind = 'ok') {
    setNote({ text, kind });
    clearTimeout(noteTimerRef.current);
    noteTimerRef.current = setTimeout(() => setNote(null), 6000);
  }

  function handleUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showNote('Elegí una imagen JPG, PNG o WebP', 'warn');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      showNote('La imagen no debe superar los 15 MB', 'warn');
      return;
    }
    clearUpload();
    const url = URL.createObjectURL(file);
    uploadUrlRef.current = url;
    setUploadUrl(url);
    updateCrop({ zoom: 1, x: 0, y: 0 });
  }

  async function handleDownload() {
    if (!canExport) return;
    setBusy('download');
    try {
      const wantsWebp = format === 'WebP' && webpSupported;
      const blob = await canvasBlob(canvasRef.current, wantsWebp ? 'image/webp' : 'image/png', 0.92);
      const extension = blob.type === 'image/webp' ? 'webp' : 'png';
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = flyerFileName(article.slug, extension);
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      showNote(`Flyer descargado en ${extension === 'webp' ? 'WebP' : 'PNG'}`);
    } catch {
      showNote('No se pudo generar la imagen. Volvé a intentar.', 'warn');
    } finally {
      setBusy('');
    }
  }

  async function handleCopy() {
    if (!canExport) return;
    if (!copySupported) {
      showNote('Este navegador no permite copiar imágenes. Usá Descargar.', 'warn');
      return;
    }
    setBusy('copy');
    try {
      // Safari exige crear el ClipboardItem durante el clic, con la imagen como promesa.
      await navigator.clipboard.write([
        new window.ClipboardItem({ 'image/png': canvasBlob(canvasRef.current, 'image/png') }),
      ]);
      showNote('Imagen copiada como PNG');
    } catch {
      showNote('No se pudo copiar la imagen. Usá Descargar.', 'warn');
    } finally {
      setBusy('');
    }
  }

  function dragStart(event) {
    event.currentTarget.setPointerCapture(event.pointerId);
    const scale = FLYER.width / event.currentTarget.getBoundingClientRect().width;
    dragRef.current = { x: event.clientX, y: event.clientY, cropX: fields.crop.x, cropY: fields.crop.y, scale };
    setDragging(true);
  }

  function dragMove(event) {
    const drag = dragRef.current;
    if (!drag) return;
    updateCrop({
      x: drag.cropX + (event.clientX - drag.x) * drag.scale,
      y: drag.cropY + (event.clientY - drag.y) * drag.scale,
    });
  }

  function dragEnd() {
    dragRef.current = null;
    setDragging(false);
  }

  function handleCropKey(event) {
    const delta = { ArrowLeft: [-NUDGE, 0], ArrowRight: [NUDGE, 0], ArrowUp: [0, -NUDGE], ArrowDown: [0, NUDGE] }[event.key];
    if (!delta) return;
    event.preventDefault();
    updateCrop({ x: fields.crop.x + delta[0], y: fields.crop.y + delta[1] });
  }

  const titleEdited = article && fields && fields.title !== article.title;
  const noteToShow = note || (article && blockReason ? { text: blockReason, kind: 'warn' } : null);

  return (
    <>
      <header className="studio-topbar">
        <h1>Estudio de flyers</h1>
        <button type="button" className="btn-secondary studio-picker-toggle" aria-expanded={pickerOpen} onClick={() => setPickerOpen(open => !open)}>
          Cambiar noticia
        </button>
        <p className={`studio-note ${noteToShow?.kind === 'ok' ? 'is-ok' : 'is-warn'}`} role="status">{noteToShow?.text || ''}</p>
        <div className="studio-actions">
          <ThemeToggle />
          <div className="studio-format" role="group" aria-label="Formato de archivo">
            <button type="button" aria-pressed={format === 'PNG'} onClick={() => setFormat('PNG')}>PNG</button>
            <button
              type="button"
              aria-pressed={format === 'WebP'}
              disabled={!webpSupported}
              title={webpSupported ? undefined : 'Este navegador no genera WebP'}
              onClick={() => setFormat('WebP')}
            >
              WebP
            </button>
          </div>
          <button type="button" className="btn-secondary" disabled={!canExport} onClick={handleCopy}>
            {busy === 'copy' ? 'Copiando…' : 'Copiar imagen'}
          </button>
          <button type="button" className="btn-primary" disabled={!canExport} onClick={handleDownload}>
            {busy === 'download' ? 'Generando…' : `Descargar ${format}`}
          </button>
        </div>
      </header>

      <div className="studio-layout">
        <section className={`studio-picker ${pickerOpen ? 'is-open' : ''}`} aria-label="Elegir noticia">
          <label className="studio-field">
            <span>Noticia</span>
            <input type="search" placeholder="Buscar por título o bajada" value={query} onChange={event => setQuery(event.target.value)} />
          </label>
          <div className="studio-status-tabs" role="group" aria-label="Filtrar por estado">
            {STATUS_TABS.map(([id, label]) => (
              <button key={id} type="button" aria-pressed={statusFilter === id} onClick={() => setStatusFilter(id)}>{label}</button>
            ))}
          </div>
          <div className="studio-results" aria-busy={resultsState === 'loading'}>
            {resultsState === 'error' && <p className="studio-empty" role="alert">No se pudieron cargar las noticias.</p>}
            {resultsState === 'ready' && results.length === 0 && <p className="studio-empty">Ninguna noticia coincide.</p>}
            {results.map(item => (
              <button key={item.id} type="button" className="studio-result" aria-pressed={article?.id === item.id} onClick={() => selectArticle(item)}>
                <strong>{item.title}</strong>
                <span>
                  {statusText(item.status)}
                  {item.category?.name ? ` · ${item.category.name}` : ''}
                  {coverFileId(item.cover_image) ? '' : ' · Sin foto'}
                </span>
              </button>
            ))}
          </div>
        </section>

        <main className="studio-stage">
          <div className="studio-canvas-wrap">
            <canvas
              ref={canvasRef}
              width={FLYER.width}
              height={FLYER.height}
              role="img"
              aria-label={fields ? `Vista previa del flyer: ${fields.title}` : 'Vista previa del flyer'}
            />
            {photoState === 'ready' && (
              <button
                type="button"
                className={`studio-crop ${dragging ? 'is-dragging' : ''}`}
                aria-label="Encuadrar la foto. Arrastrá o usá las flechas del teclado"
                onPointerDown={dragStart}
                onPointerMove={dragMove}
                onPointerUp={dragEnd}
                onPointerCancel={dragEnd}
                onKeyDown={handleCropKey}
              />
            )}
            {guides && <div className="studio-guides" aria-hidden="true" />}
            {!article && (
              <div className="studio-overlay is-empty">
                <strong>{articleState === 'loading' ? 'Cargando la noticia…' : articleState === 'missing' ? 'No encontramos esa noticia' : 'Elegí una noticia para empezar'}</strong>
              </div>
            )}
            {article && photoState === 'loading' && <div className="studio-overlay"><strong>Cargando la foto…</strong></div>}
            {article && photoState === 'none' && (
              <div className="studio-overlay">
                <strong>Esta noticia no tiene foto</strong>
                <label className="btn-secondary">Subir foto<input className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} /></label>
              </div>
            )}
            {article && photoState === 'error' && (
              <div className="studio-overlay" role="alert">
                <strong>No se pudo cargar la foto</strong>
                <button type="button" className="btn-secondary" onClick={() => setPhotoAttempt(attempt => attempt + 1)}>Reintentar</button>
                <label className="btn-secondary">Reemplazar<input className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} /></label>
              </div>
            )}
          </div>

          <div className="studio-controls">
            <label className="studio-zoom">
              Zoom
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.01"
                value={fields?.crop.zoom ?? 1}
                disabled={photoState !== 'ready'}
                onChange={event => updateCrop({ zoom: Number(event.target.value) })}
              />
            </label>
            <button type="button" className="btn-secondary" disabled={photoState !== 'ready'} onClick={() => updateCrop({ zoom: 1, x: 0, y: 0 })}>Centrar</button>
            <label className="studio-check">
              <input type="checkbox" checked={guides} onChange={event => setGuides(event.target.checked)} />
              Recorte de perfil
            </label>
          </div>
          {lowResolution && <p className="studio-warning">Con este encuadre la foto pierde definición.</p>}
        </main>

        <section className="studio-fields" data-tab={mobileTab} aria-label="Contenido del flyer">
          <div className="studio-mobile-tabs" role="tablist" aria-label="Controles del flyer">
            {MOBILE_TABS.map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={mobileTab === id} onClick={() => setMobileTab(id)}>{label}</button>
            ))}
          </div>

          {!fields ? (
            <p className="studio-empty">Los textos de la noticia aparecen acá.</p>
          ) : (
            <>
              <label className="studio-field" data-group="texto">
                <span className="studio-field-head">
                  <span>Título para redes</span>
                  <small className={layout?.titleOverflow ? 'is-error' : titleLength > TITLE_SUGGESTED ? 'is-warn' : ''}>{titleLength} / {TITLE_SUGGESTED}</small>
                </span>
                <textarea
                  className="is-title"
                  rows={3}
                  value={fields.title}
                  aria-invalid={Boolean(layout?.titleOverflow)}
                  onChange={event => update({ title: event.target.value })}
                />
              </label>
              {layout?.titleOverflow && <p className="studio-error" data-group="texto">No entra en el flyer. Acortalo para poder exportar.</p>}
              {titleEdited && (
                <div className="studio-original" data-group="texto">
                  <span>Original: {article.title}</span>
                  <button type="button" className="studio-link-button" onClick={() => update({ title: article.title })}>Volver al título original</button>
                </div>
              )}

              <div className="studio-field" data-group="texto">
                <label className="studio-check is-between">
                  Sumar bajada
                  <input type="checkbox" checked={fields.showExcerpt} onChange={event => update({ showExcerpt: event.target.checked })} />
                </label>
                {fields.showExcerpt && (
                  <label className="studio-field">
                    <span className="studio-field-head">
                      <span>Bajada</span>
                      <small className={layout?.excerptOverflow ? 'is-error' : excerptLength > EXCERPT_SUGGESTED ? 'is-warn' : ''}>{excerptLength} / {EXCERPT_SUGGESTED}</small>
                    </span>
                    <textarea rows={3} value={fields.excerpt} aria-invalid={Boolean(layout?.excerptOverflow)} onChange={event => update({ excerpt: event.target.value })} />
                  </label>
                )}
                {fields.showExcerpt && layout?.excerptOverflow && <p className="studio-error">No entra en dos líneas. Acortala para poder exportar.</p>}
              </div>

              <label className="studio-field" data-group="etiquetas">
                <span>Etiqueta superior</span>
                <input type="text" maxLength={LABEL_MAX} value={fields.section} onChange={event => update({ section: event.target.value })} />
              </label>
              <label className="studio-field" data-group="etiquetas">
                <span>Etiqueta inferior</span>
                <input type="text" maxLength={LABEL_MAX} value={fields.pill} onChange={event => update({ pill: event.target.value })} />
              </label>

              <div className="studio-photo" data-group="foto">
                <span className="studio-label">Foto</span>
                <label className="btn-secondary">
                  {photoState === 'none' ? 'Subir foto' : 'Reemplazar foto'}
                  <input className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} />
                </label>
                {uploadUrl && articleCover && (
                  <button type="button" className="studio-link-button" onClick={() => { clearUpload(); updateCrop({ zoom: 1, x: 0, y: 0 }); }}>Usar la foto de la noticia</button>
                )}
                <FilterPicker value={fields.filter} onChange={filter => update({ filter })} photo={photo} crop={fields.crop} />
                <small>Los cambios quedan en el flyer. La noticia no se modifica.</small>
                <button type="button" className="studio-link-button" onClick={() => { clearUpload(); setFields(defaultsFor(article)); setNote(null); }}>Restablecer el flyer</button>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
