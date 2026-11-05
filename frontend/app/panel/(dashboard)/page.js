'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FiExternalLink, FiImage, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import BrandMark from '../components/BrandMark';
import ThemeToggle from '../components/ThemeToggle';
import { coverFileId, EDITORIAL_VIEWS, formatArticleWhen } from '../../../lib/panel-views.mjs';

const PAGE_SIZE = 50;
const directusBase = (process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055').replace(/\/$/, '');

function assetUrl(fileId, query) {
  return `${directusBase}/assets/${fileId}?${query}`;
}

function statusLabel(status) {
  if (status === 'published') return 'Publicada';
  if (status === 'draft') return 'Borrador';
  return 'Archivada';
}

export default function PanelArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [counts, setCounts] = useState(null);
  const [view, setView] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState('');
  const requestRef = useRef(0);
  const selected = articles.find(article => article.id === selectedId) || articles[0] || null;

  useEffect(() => {
    fetch('/api/panel/categories')
      .then(res => res.json())
      .then(json => { if (Array.isArray(json.data)) setCategories(json.data); })
      .catch(() => {});
  }, []);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/panel/articles/stats', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.data) setCounts(json.data);
    } catch {
      // Los filtros siguen funcionando aunque falten los números.
    }
  }, []);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const buildParams = useCallback(offset => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
    if (view !== 'all') params.set('view', view);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    return params;
  }, [view, categoryFilter, searchQuery]);

  const fetchArticles = useCallback(async () => {
    const request = ++requestRef.current;
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch(`/api/panel/articles?${buildParams(0)}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error('No se pudieron cargar las noticias.');
      if (request !== requestRef.current) return;
      const rows = Array.isArray(json.data) ? json.data : [];
      setArticles(rows);
      setHasMore(rows.length === PAGE_SIZE);
    } catch (error) {
      if (request !== requestRef.current) return;
      setFetchError(error.message || 'No se pudieron cargar las noticias.');
      setArticles([]);
      setHasMore(false);
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    const timer = setTimeout(fetchArticles, 200);
    return () => clearTimeout(timer);
  }, [fetchArticles]);

  async function loadMore() {
    const request = requestRef.current;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/panel/articles?${buildParams(articles.length)}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error();
      if (request !== requestRef.current) return;
      const rows = Array.isArray(json.data) ? json.data : [];
      setArticles(prev => [...prev, ...rows.filter(row => !prev.some(item => item.id === row.id))]);
      setHasMore(rows.length === PAGE_SIZE);
    } catch {
      showToast('No se pudieron cargar más noticias. Volvé a intentar.');
    } finally {
      setLoadingMore(false);
    }
  }

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(''), 4000);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/panel/articles/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setArticles(prev => prev.filter(article => article.id !== deleteTarget.id));
      setSheetOpen(false);
      setDeleteTarget(null);
      showToast('Noticia eliminada');
      fetchCounts();
    } catch {
      setDeleteError('No se pudo eliminar la noticia. Volvé a intentar.');
    } finally {
      setIsDeleting(false);
    }
  }

  const selectedCover = selected ? coverFileId(selected.cover_image) : null;

  return (
    <>
      <header className="mesa-topbar">
        <Link href="/panel" className="mesa-topbar-brand" aria-label="Jujuy247, inicio del panel"><BrandMark size={28} /></Link>
        <h1>Noticias</h1>
        <label className="mesa-search">
          <span className="visually-hidden">Buscar noticias</span>
          <input
            type="search"
            placeholder="Buscar por título o bajada"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
          />
        </label>
        <div className="mesa-topbar-actions">
          <ThemeToggle />
          <Link href="/panel/nueva" className="btn-primary">
            <FiPlus size={16} aria-hidden="true" />
            <span>Nueva noticia</span>
          </Link>
        </div>
      </header>

      <div className="mesa-filters">
        <div className="mesa-counters" role="group" aria-label="Filtrar noticias">
          {EDITORIAL_VIEWS.map(({ id, label }) => (
            <button key={id} type="button" className="mesa-counter" aria-pressed={view === id} onClick={() => { setView(id); setSheetOpen(false); }}>
              <strong>{counts ? counts[id] : '–'}</strong>
              <span>{label}</span>
            </button>
          ))}
        </div>
        <label className="mesa-section-filter">
          <span>Sección</span>
          <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}>
            <option value="all">Todas</option>
            {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
      </div>

      <div className="mesa-workspace">
        <section className="mesa-list" aria-label="Listado de noticias" aria-busy={loading}>
          {fetchError ? (
            <div className="mesa-state" role="alert">
              <strong>{fetchError}</strong>
              <button type="button" className="btn-secondary" onClick={fetchArticles}>Reintentar</button>
            </div>
          ) : loading ? (
            <div aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map(item => <div className="mesa-row-skeleton" key={item}><span /><span /></div>)}
            </div>
          ) : articles.length === 0 ? (
            <div className="mesa-state">
              <strong>Ninguna noticia coincide con este filtro.</strong>
              <Link href="/panel/nueva" className="btn-secondary">Crear una noticia</Link>
            </div>
          ) : (
            <>
              {articles.map(article => {
                const cover = coverFileId(article.cover_image);
                const isCurrent = selected?.id === article.id;
                return (
                  <button
                    key={article.id}
                    type="button"
                    className="mesa-row"
                    aria-pressed={isCurrent}
                    onClick={() => { setSelectedId(article.id); setSheetOpen(true); }}
                  >
                    {cover ? (
                      <img className="mesa-thumb" src={assetUrl(cover, 'width=112&height=112&fit=cover&quality=70')} alt="" loading="lazy" />
                    ) : (
                      <span className="mesa-thumb mesa-thumb-missing">Sin foto</span>
                    )}
                    <span className="mesa-row-main">
                      <span className="mesa-row-title">{article.title}</span>
                      <span className="mesa-row-meta">
                        <span>{article.category?.name || 'Sin sección'}</span>
                        {article.front_page && article.status === 'published' && <span className="mesa-row-front">En portada</span>}
                      </span>
                    </span>
                    <span className="mesa-row-side">
                      <span className={`mesa-status mesa-status-${article.status}`}>{statusLabel(article.status)}</span>
                      <span>{formatArticleWhen(article.published_at)}</span>
                    </span>
                  </button>
                );
              })}
              {hasMore && (
                <div className="mesa-load-more">
                  <button type="button" className="btn-secondary" disabled={loadingMore} onClick={loadMore}>
                    {loadingMore ? 'Cargando…' : 'Cargar más noticias'}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {selected && !loading && !fetchError && (
          <aside className={`mesa-detail ${sheetOpen ? 'is-open' : ''}`} aria-label="Detalle de la noticia">
            <button type="button" className="icon-button mesa-detail-close" aria-label="Cerrar detalle" onClick={() => setSheetOpen(false)}>
              <FiX size={18} aria-hidden="true" />
            </button>
            {selectedCover ? (
              <img className="mesa-detail-photo" src={assetUrl(selectedCover, 'width=720&quality=80')} alt="" />
            ) : (
              <div className="mesa-detail-nophoto">
                <FiImage size={22} aria-hidden="true" />
                <strong>Esta noticia no tiene foto</strong>
                <span>Agregala desde el editor</span>
              </div>
            )}
            <div className="mesa-detail-body">
              <div className="mesa-detail-meta">
                <span className={`mesa-status mesa-status-${selected.status}`}>{statusLabel(selected.status)}</span>
                <span>{selected.category?.name || 'Sin sección'}</span>
                <span>{formatArticleWhen(selected.published_at)}</span>
              </div>
              <h2>{selected.title}</h2>
              <p>{selected.excerpt || 'Esta noticia todavía no tiene bajada.'}</p>
              <div className="mesa-detail-actions">
                <Link href={`/panel/${selected.id}`} className="btn-secondary">Editar</Link>
                <Link href={`/panel/flyers?noticia=${selected.id}`} className="btn-primary">Crear flyer</Link>
              </div>
              <div className="mesa-detail-links">
                {selected.status === 'published' ? (
                  <a href={`/noticias/${selected.slug}`} target="_blank" rel="noreferrer">
                    Ver en el diario <FiExternalLink size={14} aria-hidden="true" />
                  </a>
                ) : <span />}
                <button type="button" className="mesa-delete" onClick={() => { setDeleteError(''); setDeleteTarget(selected); }}>
                  <FiTrash2 size={15} aria-hidden="true" /> Eliminar
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {deleteTarget && (
        <div className="panel-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="panel-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title" onClick={event => event.stopPropagation()}>
            <h3 id="delete-title">¿Eliminar esta noticia?</h3>
            <p>No se puede deshacer. La noticia se borra de la base de datos y deja de verse en el diario.</p>
            <p className="mesa-modal-quote">{deleteTarget.title}</p>
            {deleteError && <p className="mesa-modal-error" role="alert">{deleteError}</p>}
            <div className="modal-actions">
              <button type="button" className="btn-secondary" disabled={isDeleting} onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button type="button" className="btn-danger" disabled={isDeleting} onClick={handleDelete}>
                {isDeleting ? 'Eliminando…' : 'Eliminar noticia'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="panel-toast" role="status">{toast}</div>}
    </>
  );
}
