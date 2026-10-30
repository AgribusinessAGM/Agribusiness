import { useState } from 'react';
import { html } from '../lib/html.js';

// Campo de contraseña con un ojo para ver u ocultar lo que se escribe (solo en pantalla:
// la contraseña guardada no se puede leer). Acepta las mismas props que un <input>.
const EYE = ['M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'];
const EYE_OFF = ['M3 3l18 18', 'M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2', 'M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6', 'M9.9 9.9a3 3 0 0 0 4.2 4.2'];

export function PasswordInput({ style = {}, ...props }) {
  const [show, setShow] = useState(false);
  const { marginBottom, ...inputStyle } = style;
  return html`
    <div style=${{ position: 'relative', marginBottom }}>
      <input
        ...${props}
        type=${show ? 'text' : 'password'}
        style=${{ ...inputStyle, width: '100%', boxSizing: 'border-box', paddingRight: 42, marginBottom: 0 }}
      />
      <button
        type="button"
        onClick=${() => setShow(!show)}
        title=${show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-label=${show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        style=${{
          position: 'absolute',
          right: 6,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          padding: 6,
          cursor: 'pointer',
          display: 'flex',
          color: 'var(--ink2)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          ${(show ? EYE_OFF : EYE).map((d) => html`<path d=${d} />`)}
        </svg>
      </button>
    </div>
  `;
}
