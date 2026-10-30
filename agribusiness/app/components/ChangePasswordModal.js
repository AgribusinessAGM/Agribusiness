import { useState } from 'react';
import { html } from '../lib/html.js';
import { useApp } from '../state/store.js';
import { PasswordInput } from './PasswordInput.js';

// "Cambiar mi contraseña" (menú de usuario): cada persona cambia la suya con la actual.
// Nadie más puede ver ni escribir contraseñas; al cambiarla se cierran sus otras sesiones.
export function ChangePasswordModal() {
  const { state, closeChangePassword, submitChangePassword } = useApp();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  if (!state.showChangePassword) return null;

  const inputStyle = {
    width: '100%',
    padding: '11px 13px',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    marginBottom: 16,
    background: 'var(--surface)',
    color: 'var(--ink)',
    boxSizing: 'border-box',
  };
  const label = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 };
  const close = () => {
    setCurrent('');
    setPassword('');
    setRepeat('');
    closeChangePassword();
  };

  return html`
    <div
      style=${{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20,30,18,.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        padding: 20,
      }}
      onClick=${close}
    >
      <form
        style=${{
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 30px 80px -20px rgba(0,0,0,.4)',
          width: '100%',
          maxWidth: 420,
          padding: 26,
        }}
        onClick=${(e) => e.stopPropagation()}
        onSubmit=${(e) => {
          e.preventDefault();
          submitChangePassword(current, password, repeat);
        }}
      >
        <h2 style=${{ fontSize: 19, fontWeight: 800, margin: '0 0 4px' }}>Cambiar mi contraseña</h2>
        <p style=${{ color: 'var(--ink2)', fontSize: 13, margin: '0 0 20px' }}>
          Al cambiarla se cerrará tu sesión en los demás dispositivos.
        </p>
        <label style=${label}>Contraseña actual</label>
        <${PasswordInput} autocomplete="current-password" value=${current} onInput=${(e) => setCurrent(e.target.value)} style=${inputStyle} />
        <label style=${label}>Nueva contraseña</label>
        <${PasswordInput} autocomplete="new-password" value=${password} placeholder="Mínimo 8 caracteres" onInput=${(e) => setPassword(e.target.value)} style=${inputStyle} />
        <label style=${label}>Repite la nueva contraseña</label>
        <${PasswordInput}
          autocomplete="new-password"
          value=${repeat}
          onInput=${(e) => setRepeat(e.target.value)}
          style=${{ ...inputStyle, marginBottom: state.resetError ? 8 : 24 }}
        />
        ${state.resetError && html`<div style=${{ color: '#c0392b', fontSize: 13, marginBottom: 16 }}>${state.resetError}</div>`}
        <div style=${{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick=${close}
            style=${{ background: 'none', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '10px 16px', fontWeight: 600, cursor: 'pointer', color: 'var(--ink)' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled=${state.resetPending}
            style=${{
              background: 'var(--brand)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius)',
              padding: '10px 18px',
              fontWeight: 700,
              cursor: state.resetPending ? 'default' : 'pointer',
              opacity: state.resetPending ? 0.7 : 1,
            }}
          >
            ${state.resetPending ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </div>
      </form>
    </div>
  `;
}
