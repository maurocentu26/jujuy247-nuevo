'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiLock, FiMail, FiAlertCircle } from 'react-icons/fi';

export default function PanelLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor completá tu correo y contraseña.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/panel/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || 'Credenciales inválidas');
      }

      router.push('/panel');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-brand">
          <img className="brand-on-light" src="/logo3.png" alt="Jujuy247" width="180" height="63" />
          <img className="brand-on-dark" src="/logo3-white.png" alt="Jujuy247" width="180" height="63" />
          <h2>Panel de Redacción</h2>
          <p>Ingresá con tu cuenta editorial para gestionar las noticias del portal.</p>
        </div>

        {error && (
          <div className="login-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiAlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="editor-field">
            <label htmlFor="login-email">
              Correo electrónico
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="ejemplo@jujuy247.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="editor-field">
            <label htmlFor="login-password">
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}
            disabled={loading}
          >
            {loading ? 'Accediendo...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
