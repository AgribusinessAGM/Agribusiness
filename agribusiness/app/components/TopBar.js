import { html } from '../lib/html.js';
import { useApp } from '../state/store.js';
import { ChangePasswordModal } from './ChangePasswordModal.js';

export function TopBar() {
  const { state, gotoDash, gotoAdmin, logout, setLang, openChangePassword } = useApp();
  const isAdmin = state.currentUser?.role === 'admin';
  const initials = (state.currentUser?.name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  const navStyle = (on) => ({
    background: on ? 'var(--brandL)' : 'none',
    color: on ? 'var(--brandD)' : 'var(--ink2)',
    border: 'none',
    borderRadius: 'var(--radius)',
    padding: '8px 14px',
    fontWeight: on ? 700 : 600,
    fontSize: 14,
    cursor: 'pointer',
  });

  return html`
    <header
      style=${{
        height: 60,
        flex: 'none',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--line)',
        display: 'flex',
        alignItems: 'center',
        gap: 22,
        padding: '0 22px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <img
        src="assets/agromillora-logo.png"
        alt="Agromillora"
        style=${{ height: 35, cursor: 'pointer' }}
        onClick=${gotoDash}
      />
      <nav style=${{ display: 'flex', gap: 4 }}>
        <button onClick=${gotoDash} style=${navStyle(state.screen === 'dashboard')}>
          Modelos
        </button>
        ${isAdmin &&
        html`
          <button onClick=${gotoAdmin} style=${navStyle(state.screen === 'admin')}>
            Usuarios y permisos
          </button>
        `}
      </nav>
      <div style=${{ flex: 1 }} />
      <div style=${{ width: 1, height: 26, background: 'var(--line)' }} />
      <select
        data-i18n-skip="1"
        value=${state.lang}
        onChange=${(e) => setLang(e.target.value)}
        aria-label="Language"
        style=${{
          border: '1px solid var(--line)',
          borderRadius: 999,
          background: 'var(--surface)',
          color: 'var(--ink)',
          fontSize: 12,
          fontWeight: 600,
          padding: '7px 12px',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <option value="es">Español (ESP)</option>
        <option value="en">English (EN)</option>
      </select>
      <div style=${{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          title=${state.currentUser?.name}
          style=${{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--brand)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          ${initials}
        </div>
        <button
          onClick=${openChangePassword}
          title="Cambiar mi contraseña"
          style=${{
            background: 'none',
            border: 'none',
            color: 'var(--ink2)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Contraseña
        </button>
        <button
          onClick=${logout}
          style=${{
            background: 'none',
            border: 'none',
            color: 'var(--ink2)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Salir
        </button>
      </div>
      <${ChangePasswordModal} />
    </header>
  `;
}
