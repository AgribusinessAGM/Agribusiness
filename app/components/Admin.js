import { useState } from 'react';
import { html } from '../lib/html.js';
import { useApp } from '../state/store.js';
import { InviteModal } from './InviteModal.js';

const roleMap = {
  edit: { label: 'Editar', bg: 'var(--brand)', fg: '#fff' },
  view: { label: 'Ver', bg: 'var(--muted)', fg: '#fff' },
  none: { label: '—', bg: 'var(--line)', fg: 'var(--ink2)' },
};

const card = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow)',
};
const th = { textAlign: 'left', padding: '12px 18px', background: 'var(--brandL)', color: 'var(--brandD)', fontSize: 12, whiteSpace: 'nowrap' };
const td = { padding: '12px 18px', fontSize: 13, verticalAlign: 'middle' };
const linkBtn = (color = 'var(--brand)') => ({
  background: 'none',
  border: 'none',
  color,
  fontWeight: 600,
  fontSize: 12,
  cursor: 'pointer',
  padding: 0,
  whiteSpace: 'nowrap',
});
const input = { fontFamily: 'inherit', fontSize: 13, padding: '6px 8px', border: '1px solid var(--editableLine)', borderRadius: 6, width: '100%', boxSizing: 'border-box' };

// Iconos de línea de las dos tarjetas de entrada
const ICONS = {
  perfiles: ['M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20', 'M10 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35', 'M15.5 4.6a3.5 3.5 0 0 1 0 6.8'],
  accesos: ['M5 11h14v9H5z', 'M8 11V7.5a4 4 0 0 1 8 0V11', 'M12 15v2'],
};
const Icon = ({ name, size = 40 }) => html`
  <svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    ${ICONS[name].map((d) => html`<path d=${d} />`)}
  </svg>
`;

// Orden de las personas: primero los administradores y luego el resto, cada grupo por nombre
const byName = (x, y) => x.name.localeCompare(y.name, 'es', { sensitivity: 'base' });
const sortUsers = (users) => [...users.filter((u) => u.role === 'admin').sort(byName), ...users.filter((u) => u.role !== 'admin').sort(byName)];

const Pill = ({ children, bg, fg, border }) => html`
  <span style=${{ fontSize: 10.5, fontWeight: 700, color: fg, background: bg, border, padding: '1px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>${children}</span>
`;

export function Admin() {
  const { state } = useApp();
  // 'home' (las dos tarjetas) | 'perfiles' | 'accesos'. El contenido va alineado a la izquierda con
  // el logo de la barra superior (22 px), sin centrar
  const [section, setSection] = useState('home');

  const SECTIONS = {
    perfiles: { title: 'Gestión de perfiles', intro: 'Gestiona las cuentas: datos de cada persona, rol, contraseña e invitaciones.' },
    accesos: { title: 'Acceso a modelos', intro: 'Asigna a cada persona el acceso a cada modelo. Haz clic en una celda para cambiar el permiso.' },
  };

  return html`
    <main style=${{ width: '100%', padding: '30px 22px', boxSizing: 'border-box' }}>
      <div style=${{ marginBottom: 20 }}>
        ${section !== 'home' &&
        html`<button onClick=${() => setSection('home')} style=${{ ...linkBtn(), fontSize: 13, marginBottom: 8 }}>← Usuarios y permisos</button>`}
        <h1 style=${{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>
          ${section === 'home' ? 'Usuarios y permisos' : SECTIONS[section].title}
        </h1>
        <p style=${{ color: 'var(--ink2)', margin: 0, fontSize: 14 }}>
          ${section === 'home' ? 'Elige qué quieres gestionar.' : SECTIONS[section].intro}
        </p>
      </div>

      ${section === 'home' &&
      html`
        <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))', gap: 18 }}>
          ${['perfiles', 'accesos'].map(
            (k) => html`
              <button
                key=${k}
                className="lift"
                onClick=${() => setSection(k)}
                style=${{
                  ...card,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: 'var(--ink)',
                  padding: '34px 24px 26px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <${Icon} name=${k} />
                <div style=${{ fontWeight: 700, fontSize: 16 }}>${SECTIONS[k].title}</div>
              </button>
            `,
          )}
        </div>
      `}
      ${section === 'perfiles' && html`<${Profiles} />`}
      ${section === 'accesos' && html`<${AccessMatrix} />`}

      <${InviteModal} />
    </main>
  `;
}

// Pestaña "Gestión de perfiles": una fila por persona, con edición en línea de nombre, correo y organización
function Profiles() {
  const { state, openInvite, sendAccess, deleteUser, updateProfile } = useApp();
  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState({ name: '', email: '', org: '' });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const startEdit = (u) => {
    setEditId(u.id);
    setDraft({ name: u.name, email: u.email, org: u.org || '' });
    setError(null);
  };
  const save = () => {
    setSaving(true);
    setError(null);
    updateProfile(editId, draft)
      .then(() => setEditId(null))
      .catch((e) => setError(e.message || 'No se pudo guardar'))
      .finally(() => setSaving(false));
  };

  return html`
    <div style=${{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
      <button
        onClick=${openInvite}
        className="lift"
        style=${{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '11px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
      >
        + Añadir persona
      </button>
    </div>
    <div style=${{ ...card, overflow: 'auto' }}>
      <table style=${{ borderCollapse: 'collapse', width: '100%', minWidth: 820, tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th style=${th}>Usuario</th>
            <th style=${th}>Contacto</th>
            <th style=${th}>Organización</th>
            <th style=${th}>Rol</th>
            <th style=${th}>Estado</th>
            <th style=${th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${sortUsers(state.users).map((u) => {
            const me = state.currentUser?.id === u.id;
            const editing = editId === u.id;
            return html`
              <tr key=${u.id} style=${{ borderTop: '1px solid var(--line)' }}>
                <td style=${td}>
                  ${editing
                    ? html`<input style=${{ ...input, minWidth: 160 }} value=${draft.name} placeholder="Nombre" onInput=${(e) => setDraft({ ...draft, name: e.target.value })} />`
                    : html`<div style=${{ fontWeight: 600, fontSize: 14 }}>${u.name}</div>`}
                </td>
                <td style=${td}>
                  ${editing
                    ? html`<input style=${{ ...input, minWidth: 200 }} type="email" value=${draft.email} placeholder="Correo" onInput=${(e) => setDraft({ ...draft, email: e.target.value })} />`
                    : html`<span style=${{ color: 'var(--ink2)' }}>${u.email}</span>`}
                </td>
                <td style=${td}>
                  ${editing
                    ? html`<input style=${input} value=${draft.org} placeholder="Organización" onInput=${(e) => setDraft({ ...draft, org: e.target.value })} />`
                    : html`<span style=${{ color: 'var(--ink2)' }}>${u.org || '—'}</span>`}
                </td>
                <td style=${td}>
                  ${u.role === 'admin'
                    ? html`<${Pill} bg="var(--brandD)" fg="#fff">Administrador<//>`
                    : html`<${Pill} bg="var(--bg)" fg="var(--ink2)" border="1px solid var(--line)">Usuario<//>`}
                </td>
                <td style=${td}>
                  ${u.status === 'invited'
                    ? html`<${Pill} bg="var(--brandL)" fg="var(--accent)" border="1px solid var(--editableLine)">invitación pendiente<//>`
                    : html`<span style=${{ color: 'var(--ink2)' }}>Activa</span>`}
                </td>
                <td style=${td}>
                  ${editing
                    ? html`
                        <div style=${{ display: 'flex', gap: 12, justifyContent: 'flex-start' }}>
                          <button onClick=${save} disabled=${saving} style=${linkBtn()}>Guardar</button>
                          <button onClick=${() => setEditId(null)} style=${linkBtn('var(--ink2)')}>Cancelar</button>
                        </div>
                        ${error && html`<div style=${{ color: '#c0392b', fontSize: 12, marginTop: 4 }}>${error}</div>`}
                      `
                    : html`
                        <div style=${{ display: 'flex', gap: 12, justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                          <button onClick=${() => startEdit(u)} style=${linkBtn()}>Editar perfil</button>
                          ${!me &&
                          html`<button onClick=${() => sendAccess(u.id)} style=${linkBtn()}>
                            ${u.status === 'invited' ? 'Reenviar invitación' : 'Enviar enlace de contraseña'}
                          </button>`}
                          ${!me &&
                          html`
                            <button onClick=${() => deleteUser(u.id)} style=${linkBtn('#c0392b')}>Eliminar</button>
                          `}
                        </div>
                      `}
                </td>
              </tr>
            `;
          })}
        </tbody>
      </table>
    </div>
  `;
}

// Pestaña "Acceso a modelos": matriz persona × modelo, con acciones rápidas por modelo.
// Los administradores ya pueden con todo: se muestran con "Acceso total" y sin botones.
function AccessMatrix() {
  const { state, cyclePerm, setPermsBulk } = useApp();
  const people = sortUsers(state.users).filter((u) => u.role !== 'admin');
  const admins = sortUsers(state.users).filter((u) => u.role === 'admin');
  const quick = (pairs) =>
    ['edit', 'view', 'none'].map(
      (lv) => html`
        <button
          key=${lv}
          title=${lv === 'none' ? 'Sin acceso' : roleMap[lv].label}
          onClick=${() => setPermsBulk(pairs, lv)}
          style=${{ ...linkBtn(lv === 'none' ? 'var(--ink2)' : 'var(--brand)'), fontSize: 11 }}
        >
          ${roleMap[lv].label}
        </button>
      `,
    );

  return html`
    <div style=${{ display: 'flex', gap: 16, margin: '0 0 14px', fontSize: 12, color: 'var(--ink2)', flexWrap: 'wrap' }}>
      ${['edit', 'view', 'none'].map(
        (lv) => html`
          <span key=${lv}>
            <span style=${{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: roleMap[lv].bg, verticalAlign: 'middle', marginRight: 5 }} />
            ${lv === 'none' ? 'Sin acceso' : roleMap[lv].label}
          </span>
        `,
      )}
      <span>· Bajo cada modelo: dar el mismo permiso a todas las personas</span>
    </div>
    <div style=${{ ...card, overflow: 'auto' }}>
      <table style=${{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
        <thead>
          <tr>
            <th style=${{ ...th, verticalAlign: 'bottom' }}>Persona</th>
            ${state.models.map(
              (m) => html`
                <th key=${m.id} style=${{ ...th, textAlign: 'center', padding: '12px 14px', minWidth: 130, whiteSpace: 'normal' }}>
                  <div>${m.name}</div>
                  <div style=${{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 6, fontWeight: 400 }}>
                    ${quick(people.map((u) => [u.id, m.id]))}
                  </div>
                </th>
              `,
            )}
          </tr>
        </thead>
        <tbody>
          ${admins.map(
            (u) => html`
              <tr key=${u.id} style=${{ borderTop: '1px solid var(--line)' }}>
                <td style=${td}>
                  <div style=${{ fontWeight: 600, fontSize: 14 }}>${u.name}</div>
                  <div style=${{ fontSize: 12, color: 'var(--ink2)' }}>${u.org || u.email}</div>
                </td>
                <td colSpan=${state.models.length} style=${{ textAlign: 'center', padding: '10px 14px' }}>
                  <${Pill} bg="var(--brandD)" fg="#fff">Acceso total (Administrador)<//>
                </td>
              </tr>
            `,
          )}
          ${people.map(
            (u) => html`
              <tr key=${u.id} style=${{ borderTop: '1px solid var(--line)' }}>
                <td style=${td}>
                  <div style=${{ fontWeight: 600, fontSize: 14 }}>${u.name}</div>
                  <div style=${{ fontSize: 12, color: 'var(--ink2)' }}>${u.org || u.email}</div>
                </td>
                ${state.models.map((m) => {
                  const rm = roleMap[u.access[m.id] || 'none'];
                  return html`
                    <td key=${m.id} style=${{ textAlign: 'center', padding: '10px 14px' }}>
                      <button
                        onClick=${() => cyclePerm(u.id, m.id)}
                        className="lift"
                        style=${{ background: rm.bg, color: rm.fg, border: 'none', borderRadius: 999, padding: '6px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer', minWidth: 70 }}
                      >
                        ${rm.label}
                      </button>
                    </td>
                  `;
                })}
              </tr>
            `,
          )}
        </tbody>
      </table>
    </div>
  `;
}
