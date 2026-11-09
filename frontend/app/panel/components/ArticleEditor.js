'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FiArrowLeft,
  FiBold,
  FiItalic,
  FiList,
  FiLink,
  FiImage,
  FiUploadCloud,
  FiTrash2,
  FiEye,
  FiCheck,
  FiAlertCircle,
  FiYoutube,
  FiEdit2,
  FiSliders,
  FiColumns,
  FiClock,
  FiFileText,
  FiRotateCcw,
  FiRotateCw,
  FiHelpCircle,
  FiX,
} from 'react-icons/fi';
import ArticlePreviewModal from './ArticlePreviewModal';
import ThemeToggle from './ThemeToggle';

const CONFIRM_COPY = {
  publish: {
    title: '¿Publicar esta noticia?',
    body: 'Se va a ver de inmediato en el diario.',
    action: 'Publicar',
  },
  update: {
    title: '¿Actualizar la noticia publicada?',
    body: 'Los cambios se ven de inmediato en el diario. La fecha de publicación no cambia.',
    action: 'Actualizar',
  },
  unpublish: {
    title: '¿Pasar la noticia a borrador?',
    body: 'Deja de verse en el diario hasta que la vuelvas a publicar.',
    action: 'Pasar a borrador',
  },
};

function parseYoutubeId(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const u = new URL(url);
    if (!['http:', 'https:'].includes(u.protocol)) return null;
    let id = null;
    if (u.hostname === 'youtu.be') {
      id = u.pathname.slice(1);
    } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(u.hostname)) {
      if (u.pathname.startsWith('/shorts/')) {
        id = u.pathname.split('/')[2];
      } else {
        id = u.searchParams.get('v');
      }
    }
    return /^[a-zA-Z0-9_-]{11}$/.test(id || '') ? id : null;
  } catch {
    return null;
  }
}

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export default function ArticleEditor({ initialArticle = null }) {
  const router = useRouter();
  const contentRef = useRef(null);
  const typingTimerRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [mobileTab, setMobileTab] = useState('write'); // 'write' | 'settings'
  const [viewMode, setViewMode] = useState('write'); // 'write' | 'split'

  const initialCoverId = typeof initialArticle?.cover_image === 'string'
    ? initialArticle.cover_image
    : initialArticle?.cover_image?.id || null;

  const directusBase = (process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055').replace(/\/$/, '');

  const [formData, setFormData] = useState({
    title: initialArticle?.title || '',
    slug: initialArticle?.slug || '',
    excerpt: initialArticle?.excerpt || '',
    content: initialArticle?.content || '',
    // Sin valor por defecto: una nota nueva no puede caer en una sección sin que nadie la elija.
    category: initialArticle?.category?.id || initialArticle?.category || '',
    cover_image: initialCoverId,
    cover_url: initialCoverId ? `${directusBase}/assets/${initialCoverId}` : '',
    caption: initialArticle?.caption || '',
    youtube_url: initialArticle?.youtube_url || '',
    front_page: Boolean(initialArticle?.front_page),
    status: initialArticle?.status || 'draft',
    seo_title: initialArticle?.seo_title || '',
    seo_description: initialArticle?.seo_description || '',
  });

  // Undo / Redo History Stack
  const [history, setHistory] = useState([initialArticle?.content || '']);
  const [historyIdx, setHistoryIdx] = useState(0);

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [flyerLinkId, setFlyerLinkId] = useState(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Load categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/panel/categories');
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setCategories(json.data);
        }
      } catch {
        // Fallback
      }
    }
    fetchCategories();
  }, []);

  // Before unload warn
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  function handleChange(field, value) {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'title' && !initialArticle && !prev.slugModified) {
        next.slug = slugify(value);
      }
      return next;
    });
    setIsDirty(true);
  }

  // Record a new state in undo/redo history
  function recordHistory(newContent) {
    setHistory(prev => {
      const next = prev.slice(0, historyIdx + 1);
      next.push(newContent);
      if (next.length > 50) next.shift();
      return next;
    });
    setHistoryIdx(prev => Math.min(prev + 1, 49));
  }

  function handleUndo() {
    if (historyIdx > 0) {
      const targetIdx = historyIdx - 1;
      const targetContent = history[targetIdx];
      setHistoryIdx(targetIdx);
      setFormData(prev => ({ ...prev, content: targetContent }));
      setIsDirty(true);
      showToast('Deshacer');
    }
  }

  function handleRedo() {
    if (historyIdx < history.length - 1) {
      const targetIdx = historyIdx + 1;
      const targetContent = history[targetIdx];
      setHistoryIdx(targetIdx);
      setFormData(prev => ({ ...prev, content: targetContent }));
      setIsDirty(true);
      showToast('Rehacer');
    }
  }

  // Handle typing with debounced history recording
  function handleContentInput(value) {
    handleChange('content', value);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      recordHistory(value);
    }, 800);
  }

  // Formatting tools for markdown content
  function applyFormatting(syntaxBefore, syntaxAfter = '') {
    const el = contentRef.current;
    if (!el) return;
    el.focus();
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.slice(start, end) || 'texto';
    const replacement = `${syntaxBefore}${selected}${syntaxAfter}`;

    const newContent = text.slice(0, start) + replacement + text.slice(end);
    handleChange('content', newContent);
    recordHistory(newContent);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + syntaxBefore.length, start + syntaxBefore.length + selected.length);
    }, 10);
  }

  // Textarea specific shortcuts (Ctrl+B, Ctrl+I, Ctrl+Z, Tab, etc.)
  function handleContentKeyDown(e) {
    const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    const mod = isMac ? e.metaKey : e.ctrlKey;

    // Undo: Ctrl+Z / Cmd+Z (without Shift)
    if (mod && !e.shiftKey && e.key.toLowerCase() === 'z') {
      if (historyIdx > 0) {
        e.preventDefault();
        handleUndo();
      }
      return;
    }

    // Redo: Ctrl+Y / Cmd+Shift+Z / Ctrl+Shift+Z
    if ((mod && e.key.toLowerCase() === 'y') || (mod && e.shiftKey && e.key.toLowerCase() === 'z')) {
      if (historyIdx < history.length - 1) {
        e.preventDefault();
        handleRedo();
      }
      return;
    }

    // Bold: Ctrl+B / Cmd+B
    if (mod && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      applyFormatting('**', '**');
      return;
    }

    // Italic: Ctrl+I / Cmd+I
    if (mod && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      applyFormatting('*', '*');
      return;
    }

    // Link: Ctrl+K / Cmd+K
    if (mod && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      applyFormatting('[', '](https://)');
      return;
    }

    // Subtitle H2: Ctrl+H or Alt+2
    if ((mod && e.key.toLowerCase() === 'h') || (e.altKey && e.key === '2')) {
      e.preventDefault();
      applyFormatting('\n\n## ', '\n\n');
      return;
    }

    // Quote: Ctrl+Q or Alt+Q
    if ((mod && e.key.toLowerCase() === 'q') || (e.altKey && e.key.toLowerCase() === 'q')) {
      e.preventDefault();
      applyFormatting('\n\n> ', '\n\n');
      return;
    }

    // Bullet list: Ctrl+L or Ctrl+Shift+L
    if ((mod && e.key.toLowerCase() === 'l') || (mod && e.shiftKey && e.key.toLowerCase() === 'l')) {
      e.preventDefault();
      applyFormatting('\n\n- ', '\n');
      return;
    }

    // Tab key: Insert 2 spaces
    if (e.key === 'Tab' && !mod) {
      e.preventDefault();
      const el = contentRef.current;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const spaces = '  ';
      const newContent = el.value.slice(0, start) + spaces + el.value.slice(end);
      handleChange('content', newContent);
      setTimeout(() => {
        el.setSelectionRange(start + 2, start + 2);
      }, 0);
      return;
    }
  }

  // Global window keyboard shortcuts (Ctrl+S for save, Ctrl+Enter for publish)
  useEffect(() => {
    function handleGlobalKeyDown(e) {
      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const mod = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl+S / Cmd+S: Save Draft
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        // En una nota publicada guardar impacta en el diario: siempre se confirma.
        if (formData.status === 'published') setConfirmAction('update');
        else handleSave('draft');
        return;
      }

      // Ctrl+Enter / Cmd+Enter: Publish Dialog
      if (mod && e.key === 'Enter') {
        e.preventDefault();
        if (formData.title.trim() && formData.content.trim()) {
          setConfirmAction(formData.status === 'published' ? 'update' : 'publish');
        }
        return;
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [formData]);

  // Image upload
  async function handleImageFile(file) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg('Elegí una imagen en formato JPG, PNG o WebP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('La imagen no debe superar los 10 MB.');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');

    try {
      const data = new FormData();
      data.append('file', file);

      const res = await fetch('/api/panel/upload', {
        method: 'POST',
        body: data,
      });

      const json = await res.json();
      if (!res.ok || !json.fileId) {
        throw new Error(json.error || 'Error al subir la imagen');
      }

      setFormData(prev => ({
        ...prev,
        cover_image: json.fileId,
        cover_url: json.url,
      }));
      setIsDirty(true);
      showToast('Imagen subida correctamente');
    } catch (err) {
      setErrorMsg(err.message || 'Error al subir el archivo');
    } finally {
      setIsUploading(false);
    }
  }

  function showToast(msg, flyerId = null) {
    setToast(msg);
    setFlyerLinkId(flyerId);
    setTimeout(() => { setToast(''); setFlyerLinkId(null); }, flyerId ? 9000 : 4000);
  }

  async function handleSave(targetStatus) {
    if (!formData.title.trim()) {
      setErrorMsg('El título de la noticia es obligatorio.');
      return;
    }
    if (!formData.category) {
      setErrorMsg('Elegí la sección de la noticia.');
      setConfirmAction(null);
      setMobileTab('settings');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        title: formData.title.trim(),
        slug: formData.slug || slugify(formData.title),
        excerpt: formData.excerpt.trim(),
        content: formData.content,
        category: formData.category,
        cover_image: formData.cover_image,
        youtube_url: formData.youtube_url.trim() || null,
        front_page: formData.front_page,
        status: targetStatus,
        published_at: initialArticle?.published_at || undefined,
        seo_title: formData.seo_title.trim() || null,
        seo_description: formData.seo_description.trim() || null,
      };

      const isEdit = Boolean(initialArticle?.id);
      const url = isEdit ? `/api/panel/articles/${initialArticle.id}` : '/api/panel/articles';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || 'Error al guardar la noticia');
      }

      setIsDirty(false);
      setFormData(prev => ({ ...prev, status: targetStatus }));
      setConfirmAction(null);

      const savedId = initialArticle?.id || json.data?.id;
      if (targetStatus === 'draft') {
        showToast(confirmAction === 'unpublish' ? 'La noticia dejó de verse en el diario' : 'Borrador guardado');
      } else if (confirmAction === 'update') {
        showToast('Noticia actualizada');
      } else {
        showToast('Noticia publicada', savedId);
      }

      if (!isEdit && json.data?.id) {
        router.push(`/panel/${json.data.id}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar la noticia');
    } finally {
      setIsSaving(false);
    }
  }

  const isPublished = formData.status === 'published';
  const selectedCategory = categories.find(c => String(c.id) === String(formData.category));
  const wordCount = formData.content.trim() ? formData.content.trim().split(/\s+/).length : 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));
  const youtubeValid = formData.youtube_url ? parseYoutubeId(formData.youtube_url) !== null : true;

  return (
    <>
      <header className="editor-topbar">
        <Link href="/panel" className="editor-topbar-back">
          <FiArrowLeft size={16} aria-hidden="true" />
          <span>Noticias</span>
        </Link>
        <span className={`editor-topbar-status ${isDirty && !isSaving ? 'is-dirty' : ''}`} role="status">
          {isSaving ? 'Guardando…' : isDirty ? 'Cambios sin guardar' : isPublished ? 'Publicada' : initialArticle?.id ? 'Borrador guardado' : 'Noticia nueva'}
        </span>
        <div className="editor-topbar-actions">
          <ThemeToggle />
          {initialArticle?.id && (
            <Link href={`/panel/flyers?noticia=${initialArticle.id}`} className="btn-secondary">Crear flyer</Link>
          )}
          <button type="button" className="btn-secondary" onClick={() => setShowPreview(true)}>
            <FiEye size={16} aria-hidden="true" />
            <span>Vista previa</span>
          </button>
          {isPublished ? (
            <button type="button" className="btn-secondary" disabled={isSaving} onClick={() => setConfirmAction('unpublish')}>
              Pasar a borrador
            </button>
          ) : (
            <button type="button" className="btn-secondary" disabled={isSaving || !formData.title.trim()} onClick={() => handleSave('draft')} aria-keyshortcuts="Control+S">
              Guardar borrador
            </button>
          )}
          <button
            type="button"
            className="btn-primary"
            disabled={isSaving || !formData.title.trim() || !formData.content.trim() || !youtubeValid}
            onClick={() => setConfirmAction(isPublished ? 'update' : 'publish')}
            aria-keyshortcuts="Control+Enter"
          >
            {isPublished ? 'Actualizar' : 'Publicar'}
          </button>
        </div>
      </header>

      <div className="editor-page">
      {errorMsg && (
        <div className="login-error" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <FiAlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mobile Tabs Segmented Control */}
      <div className="mobile-editor-tabs" role="tablist" aria-label="Secciones del editor">
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'write'}
          className={`mobile-tab-btn ${mobileTab === 'write' ? 'active' : ''}`}
          onClick={() => setMobileTab('write')}
        >
          <FiEdit2 size={16} />
          <span>Redacción</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'settings'}
          className={`mobile-tab-btn ${mobileTab === 'settings' ? 'active' : ''}`}
          onClick={() => setMobileTab('settings')}
        >
          <FiSliders size={16} />
          <span>Portada y Ajustes</span>
          {formData.cover_image && <span className="tab-dot-indicator" title="Foto cargada" />}
        </button>
      </div>

      {/* Editor Grid: 2 Columns on Desktop, Tabbed on Mobile */}
      <div className="editor-grid">
        {/* Main Writing Canvas */}
        <div className={`editor-main-col ${mobileTab === 'write' ? 'mobile-visible' : 'mobile-hidden'}`}>
          <div className="canvas-card">
            {/* Title (Canvas-First) */}
            <div className="canvas-title-wrap">
              <textarea
                id="article-title"
                className="canvas-headline-input"
                aria-label="Título de la noticia"
                rows={2}
                placeholder="Escribí un titular potente..."
                value={formData.title}
                onChange={e => handleChange('title', e.target.value.replace(/\s*\n\s*/g, ' '))}
                onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                maxLength={300}
                autoFocus={!initialArticle?.id}
              />

              <div className="canvas-slug-line">
                <span>URL:</span>
                <code>/noticias/{formData.slug || 'slug-de-la-noticia'}</code>
              </div>
            </div>

            {/* Excerpt (Canvas-First) */}
            <div className="canvas-deck-wrap">
              <textarea
                id="article-excerpt"
                className="canvas-deck-input"
                rows={2}
                placeholder="Agregá una bajada o copete que acompañe al titular y aporte contexto inmediato..."
                value={formData.excerpt}
                onChange={e => handleChange('excerpt', e.target.value)}
                maxLength={600}
              />
            </div>

            {/* Markdown Smart Toolbar & Reading Metrics */}
            <div className="canvas-body-section">
              <div className="markdown-smart-toolbar">
                <div className="toolbar-tools">
                  {/* Undo & Redo */}
                  <button
                    type="button"
                    className="smart-tool-btn"
                    disabled={historyIdx === 0}
                    onClick={handleUndo}
                    title="Deshacer (Ctrl+Z)"
                  >
                    <FiRotateCcw size={14} />
                    <span className="tool-label">Deshacer</span>
                  </button>

                  <button
                    type="button"
                    className="smart-tool-btn"
                    disabled={historyIdx >= history.length - 1}
                    onClick={handleRedo}
                    title="Rehacer (Ctrl+Y)"
                  >
                    <FiRotateCw size={14} />
                    <span className="tool-label">Rehacer</span>
                  </button>

                  <span style={{ color: 'var(--panel-field)', margin: '0 4px' }}>|</span>

                  {/* Formatting Buttons with Shortcut Tooltips */}
                  <button
                    type="button"
                    className="smart-tool-btn"
                    title="Negrita (Ctrl+B)"
                    onClick={() => applyFormatting('**', '**')}
                  >
                    <FiBold size={15} />
                    <span className="tool-label">Negrita</span>
                  </button>

                  <button
                    type="button"
                    className="smart-tool-btn"
                    title="Cursiva (Ctrl+I)"
                    onClick={() => applyFormatting('*', '*')}
                  >
                    <FiItalic size={15} />
                    <span className="tool-label">Cursiva</span>
                  </button>

                  <button
                    type="button"
                    className="smart-tool-btn"
                    title="Subtítulo H2 (Ctrl+H o Alt+2)"
                    onClick={() => applyFormatting('\n\n## ', '\n\n')}
                  >
                    <strong>H2</strong>
                    <span className="tool-label">Subtítulo</span>
                  </button>

                  <button
                    type="button"
                    className="smart-tool-btn"
                    title="Cita textual (Ctrl+Q)"
                    onClick={() => applyFormatting('\n\n> ', '\n\n')}
                  >
                    <span>&ldquo;</span>
                    <span className="tool-label">Cita</span>
                  </button>

                  <button
                    type="button"
                    className="smart-tool-btn"
                    title="Lista con viñetas (Ctrl+L)"
                    onClick={() => applyFormatting('\n\n- ', '\n')}
                  >
                    <FiList size={15} />
                    <span className="tool-label">Lista</span>
                  </button>

                  <button
                    type="button"
                    className="smart-tool-btn"
                    title="Insertar enlace (Ctrl+K)"
                    onClick={() => applyFormatting('[', '](https://)')}
                  >
                    <FiLink size={15} />
                    <span className="tool-label">Enlace</span>
                  </button>

                  <button
                    type="button"
                    className="smart-tool-btn"
                    title="Ver atajos de teclado"
                    onClick={() => setShowShortcutsModal(true)}
                    style={{ color: 'var(--panel-muted)' }}
                  >
                    <FiHelpCircle size={15} />
                  </button>
                </div>

                {/* View Mode Toggle (Edit vs Split Preview on wide desktop) */}
                <div className="toolbar-view-toggle">
                  <button
                    type="button"
                    className={`toggle-view-btn ${viewMode === 'write' ? 'active' : ''}`}
                    onClick={() => setViewMode('write')}
                    title="Modo sólo editor"
                  >
                    <FiFileText size={14} />
                    <span>Editor</span>
                  </button>
                  <button
                    type="button"
                    className={`toggle-view-btn ${viewMode === 'split' ? 'active' : ''}`}
                    onClick={() => setViewMode('split')}
                    title="Vista previa en tiempo real"
                  >
                    <FiColumns size={14} />
                    <span>Dividido</span>
                  </button>
                </div>

                <div className="toolbar-editorial-metrics">
                  <FiClock size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  <span>{wordCount} palabras</span>
                  <span>•</span>
                  <span>~{readTimeMin} min lectura</span>
                </div>
              </div>

              {/* Textarea or Split View */}
              <div className={`canvas-editor-area ${viewMode === 'split' ? 'split-mode' : ''}`}>
                <textarea
                  id="article-content"
                  ref={contentRef}
                  className="canvas-textarea"
                  placeholder="Escribí aquí el desarrollo de la noticia. Podés usar subtítulos, negritas, listas y citas... (Ctrl+B para negrita, Ctrl+I para cursiva)"
                  value={formData.content}
                  onChange={e => handleContentInput(e.target.value)}
                  onKeyDown={handleContentKeyDown}
                />

                {viewMode === 'split' && (
                  <div className="split-preview-pane">
                    <div className="split-preview-header">Vista previa en vivo</div>
                    <div className="article-reading" style={{ fontSize: '16px', lineHeight: '1.6' }}>
                      {formData.content ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {formData.content}
                        </ReactMarkdown>
                      ) : (
                        <p style={{ color: 'var(--panel-subtle)', fontStyle: 'italic' }}>El contenido redactado se reflejará aquí...</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar / Settings Column */}
        <aside className={`editor-settings-col ${mobileTab === 'settings' ? 'mobile-visible' : 'mobile-hidden'}`}>
          {/* Pre-publication Checklist */}
          <div className="settings-panel-box">
            <h3 className="settings-box-title">Antes de publicar</h3>
            <div className="checklist-items">
              <div className={`check-row ${formData.title.trim() ? 'done' : ''}`}>
                {formData.title.trim() ? <FiCheck size={16} /> : <span>○</span>}
                <span>Titular redactado</span>
              </div>
              <div className={`check-row ${formData.content.trim() ? 'done' : ''}`}>
                {formData.content.trim() ? <FiCheck size={16} /> : <span>○</span>}
                <span>Desarrollo de la nota ({wordCount} palabras)</span>
              </div>
              <div className={`check-row ${formData.cover_image ? 'done' : ''}`}>
                {formData.cover_image ? <FiCheck size={16} /> : <span>○</span>}
                <span>Foto principal cargada</span>
              </div>
              <div className={`check-row ${formData.category ? 'done' : ''}`}>
                {formData.category ? <FiCheck size={16} /> : <span>○</span>}
                <span>Sección elegida</span>
              </div>
            </div>
          </div>
          {/* Section Selector */}
          <div className="settings-panel-box">
            <h3 className="settings-box-title"><label htmlFor="article-category">Sección del diario</label></h3>
            <select
              id="article-category"
              value={formData.category}
              onChange={e => handleChange('category', e.target.value)}
              className="settings-select"
              required
            >
              <option value="" disabled>Elegí una sección</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Front page switch */}
          <div className="settings-panel-box">
            <h3 className="settings-box-title">Ubicación en portada</h3>
            <label className="settings-switch-label">
              <input
                type="checkbox"
                checked={formData.front_page}
                onChange={e => handleChange('front_page', e.target.checked)}
                className="settings-checkbox"
              />
              <div>
                <strong>Destacar en la portada</strong>
                <p>Ubicación privilegiada en la página de inicio del diario.</p>
              </div>
            </label>
          </div>

          {/* Featured Image */}
          <div className="settings-panel-box">
            <h3 className="settings-box-title">Foto Principal</h3>

            {formData.cover_url ? (
              <div>
                <div className="cover-preview-card">
                  <img src={formData.cover_url} alt="Portada de la noticia" />
                  <button
                    type="button"
                    className="btn-delete-cover"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, cover_image: null, cover_url: '' }));
                      setIsDirty(true);
                    }}
                    title="Eliminar imagen de portada"
                  >
                    <FiTrash2 size={13} style={{ marginRight: '4px' }} />
                    Quitar foto
                  </button>
                </div>
              </div>
            ) : (
              <label className="enhanced-dropzone">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleImageFile(f);
                  }}
                  disabled={isUploading}
                />
                <FiUploadCloud size={32} color={isUploading ? 'var(--panel-red)' : 'var(--panel-subtle)'} style={{ marginBottom: '8px' }} />
                <div className="dropzone-main-text">
                  {isUploading ? 'Subiendo imagen a Directus...' : 'Subir foto principal'}
                </div>
                <div className="dropzone-sub-text">
                  Hacé clic o arrastrá acá (JPG, PNG, WebP)
                </div>
              </label>
            )}
          </div>

          {/* YouTube Video */}
          <div className="settings-panel-box">
            <h3 className="settings-box-title">Video de la noticia</h3>
            <div style={{ position: 'relative' }}>
              <input
                id="article-youtube"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.youtube_url}
                onChange={e => handleChange('youtube_url', e.target.value)}
                className={`settings-input ${!youtubeValid ? 'input-error' : ''}`}
              />
            </div>
            {!youtubeValid ? (
              <p className="field-hint-error">Enlace de YouTube no reconocido.</p>
            ) : formData.youtube_url ? (
              <p className="field-hint-valid">✓ Video reconocido para reproducción.</p>
            ) : (
              <p className="field-hint">Admite enlaces de YouTube, YouTu.be o Shorts.</p>
            )}
          </div>

          {/* Google SEO Details */}
          <details className="settings-seo-details">
            <summary className="settings-seo-summary">
              <span>Optimización Google SEO</span>
            </summary>
            <div className="seo-details-body">
              <div>
                <label htmlFor="seo-title" className="seo-field-label">Título para Google</label>
                <input
                  id="seo-title"
                  placeholder={formData.title || 'Título por defecto'}
                  value={formData.seo_title}
                  onChange={e => handleChange('seo_title', e.target.value)}
                  className="settings-input"
                />
              </div>

              <div>
                <label htmlFor="seo-desc" className="seo-field-label">Descripción para buscadores</label>
                <textarea
                  id="seo-desc"
                  rows={2}
                  placeholder={formData.excerpt || 'Bajada por defecto'}
                  value={formData.seo_description}
                  onChange={e => handleChange('seo_description', e.target.value)}
                  className="settings-textarea"
                />
              </div>

              <div className="google-snippet-card">
                <div className="google-snippet-url">
                  jujuy247.com.ar › noticias › {formData.slug || 'slug'}
                </div>
                <div className="google-snippet-title">
                  {formData.seo_title || formData.title || 'Título de tu noticia'}
                </div>
                <div className="google-snippet-desc">
                  {formData.seo_description || formData.excerpt || 'Descripción del artículo en los resultados de búsqueda.'}
                </div>
              </div>
            </div>
          </details>

        </aside>
      </div>

      </div>

      {/* Fullscreen Preview Modal */}
      {showPreview && (
        <ArticlePreviewModal
          article={formData}
          categoryName={selectedCategory?.name || 'Las noticias'}
          coverUrl={formData.cover_url}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Confirmación de publicar, actualizar o despublicar */}
      {confirmAction && (
        <div className="panel-modal-backdrop">
          <div className="panel-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <h3 id="confirm-title">{CONFIRM_COPY[confirmAction].title}</h3>
            <p>{CONFIRM_COPY[confirmAction].body}</p>
            <p className="mesa-modal-quote">{formData.title}</p>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" disabled={isSaving} onClick={() => setConfirmAction(null)}>
                Seguir revisando
              </button>
              <button
                type="button"
                className={confirmAction === 'unpublish' ? 'btn-danger' : 'btn-primary'}
                disabled={isSaving}
                onClick={() => handleSave(confirmAction === 'unpublish' ? 'draft' : 'published')}
              >
                {isSaving ? 'Guardando…' : CONFIRM_COPY[confirmAction].action}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showShortcutsModal && (
        <div className="panel-modal-backdrop" onClick={() => setShowShortcutsModal(false)}>
          <div className="panel-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Atajos de teclado</h3>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                style={{ background: 'none', border: 0, padding: '4px', color: 'var(--panel-muted)', cursor: 'pointer' }}
                aria-label="Cerrar modal"
              >
                <FiX size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
              <div style={{ background: 'var(--panel-surface-2)', padding: '10px 12px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Negrita</span>
                <kbd style={{ background: 'var(--panel-surface)', border: '1px solid var(--panel-field)', padding: '2px 6px', borderRadius: '3px', fontWeight: '600' }}>Ctrl + B</kbd>
              </div>

              <div style={{ background: 'var(--panel-surface-2)', padding: '10px 12px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Cursiva</span>
                <kbd style={{ background: 'var(--panel-surface)', border: '1px solid var(--panel-field)', padding: '2px 6px', borderRadius: '3px', fontWeight: '600' }}>Ctrl + I</kbd>
              </div>

              <div style={{ background: 'var(--panel-surface-2)', padding: '10px 12px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Enlace</span>
                <kbd style={{ background: 'var(--panel-surface)', border: '1px solid var(--panel-field)', padding: '2px 6px', borderRadius: '3px', fontWeight: '600' }}>Ctrl + K</kbd>
              </div>

              <div style={{ background: 'var(--panel-surface-2)', padding: '10px 12px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtítulo H2</span>
                <kbd style={{ background: 'var(--panel-surface)', border: '1px solid var(--panel-field)', padding: '2px 6px', borderRadius: '3px', fontWeight: '600' }}>Ctrl + H</kbd>
              </div>

              <div style={{ background: 'var(--panel-surface-2)', padding: '10px 12px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Cita</span>
                <kbd style={{ background: 'var(--panel-surface)', border: '1px solid var(--panel-field)', padding: '2px 6px', borderRadius: '3px', fontWeight: '600' }}>Ctrl + Q</kbd>
              </div>

              <div style={{ background: 'var(--panel-surface-2)', padding: '10px 12px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Lista</span>
                <kbd style={{ background: 'var(--panel-surface)', border: '1px solid var(--panel-field)', padding: '2px 6px', borderRadius: '3px', fontWeight: '600' }}>Ctrl + L</kbd>
              </div>

              <div style={{ background: 'var(--panel-surface-2)', padding: '10px 12px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Deshacer</span>
                <kbd style={{ background: 'var(--panel-surface)', border: '1px solid var(--panel-field)', padding: '2px 6px', borderRadius: '3px', fontWeight: '600' }}>Ctrl + Z</kbd>
              </div>

              <div style={{ background: 'var(--panel-surface-2)', padding: '10px 12px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Rehacer</span>
                <kbd style={{ background: 'var(--panel-surface)', border: '1px solid var(--panel-field)', padding: '2px 6px', borderRadius: '3px', fontWeight: '600' }}>Ctrl + Y</kbd>
              </div>

              <div style={{ background: 'var(--panel-surface-2)', padding: '10px 12px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', gridColumn: '1 / -1' }}>
                <span>Guardar borrador</span>
                <kbd style={{ background: 'var(--panel-surface)', border: '1px solid var(--panel-field)', padding: '2px 6px', borderRadius: '3px', fontWeight: '600' }}>Ctrl + S</kbd>
              </div>

              <div style={{ background: 'var(--panel-surface-2)', padding: '10px 12px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', gridColumn: '1 / -1' }}>
                <span>Publicar noticia</span>
                <kbd style={{ background: 'var(--panel-surface)', border: '1px solid var(--panel-field)', padding: '2px 6px', borderRadius: '3px', fontWeight: '600' }}>Ctrl + Enter</kbd>
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowShortcutsModal(false)}
                style={{ padding: '6px 14px', minHeight: '34px', fontSize: '13px' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="panel-toast" role="status">
          {toast}
          {flyerLinkId && <Link className="editor-toast-link" href={`/panel/flyers?noticia=${flyerLinkId}`}>Crear flyer</Link>}
        </div>
      )}
    </>
  );
}
