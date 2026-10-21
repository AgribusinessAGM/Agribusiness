import { useRef, useState } from 'react';
import { html } from '../lib/html.js';
import { compute } from '../engine/compute.js';
import { nf, pct } from '../engine/format.js';
import { useApp } from '../state/store.js';

const statusColor = {
  Activo: 'var(--brand)',
  Borrador: '#595959',
};

const ALMENDRO_THEME = {
  '--brand': '#997300',
  '--brandD': '#6b5000',
  '--brandL': '#f4eeda',
  '--accent': '#8a5a1e',
};

function ModelCard({ m }) {
  const { state, openModel, openResults, duplicateModel, renameModel } = useApp();
  const canRename = state.currentUser?.role === 'admin' || m.myAccess === 'edit';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(m.name);
  const nameRef = useRef(null);
  const [nameH, setNameH] = useState(0); // alto del nombre, para que el campo no cambie la tarjeta
  const finish = (ok) => {
    if (ok) renameModel(m.id, draft);
    setEditing(false);
  };
  const r = compute(m.a);
  const cropLabel = m.crop === 'almendro' ? 'Almendro SHD' : 'Olivo SHD';
  // El modelo IAG no tiene capa Fondo: su TIR de referencia es la del SPV.
  const isIAG = m.a.engine === 'iag';
  return html`
    <div
      className="lift"
      style=${{
        ...(m.crop === 'almendro' ? ALMENDRO_THEME : {}),
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        overflow: 'hidden',
      }}
    >
      <div style=${{ padding: '18px 18px 14px' }}>
        <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          ${editing
            ? html`<textarea
                autoFocus
                value=${draft}
                onInput=${(e) => setDraft(e.target.value)}
                onKeyDown=${(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault(); // el nombre no lleva saltos de línea
                    finish(true);
                  } else if (e.key === 'Escape') finish(false);
                }}
                onBlur=${() => finish(true)}
                style=${{ fontFamily: 'inherit', fontWeight: 700, fontSize: 16, lineHeight: 1.3, minWidth: 0, flex: 1, height: nameH ? nameH + 2 : undefined, padding: '0 6px', border: '1px solid var(--editableLine)', borderRadius: 6, resize: 'none', overflow: 'hidden' }}
              />`
            : html`<div style=${{ display: 'flex', alignItems: 'flex-start', gap: 6, minWidth: 0 }}>
                <div ref=${nameRef} style=${{ fontWeight: 700, fontSize: 16, lineHeight: 1.3 }}>${m.name}</div>
                ${canRename &&
                html`<button
                  onClick=${() => {
                    setDraft(m.name);
                    setNameH(nameRef.current ? nameRef.current.offsetHeight : 0);
                    setEditing(true);
                  }}
                  style=${{ background: 'none', border: 'none', padding: 2, marginTop: 2, cursor: 'pointer', color: 'var(--ink2)', display: 'flex' }}
                >
                  <!-- lápiz -->
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>`}
              </div>`}
          <span
            style=${{
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
              background: statusColor[m.status],
              padding: '3px 9px',
              borderRadius: 999,
              whiteSpace: 'nowrap',
            }}
          >
            ${m.status}
          </span>
        </div>
        <div style=${{ color: 'var(--ink2)', fontSize: 13, marginTop: 4 }}>${m.region}</div>
        <div style=${{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <span
            style=${{
              fontSize: 12,
              background: 'var(--brandL)',
              color: 'var(--brandD)',
              padding: '4px 9px',
              borderRadius: 999,
              fontWeight: 600,
            }}
          >
            ${nf(m.a.superficie)} Ha
          </span>
          <span
            style=${{
              fontSize: 12,
              background: 'var(--brandL)',
              color: 'var(--brandD)',
              padding: '4px 9px',
              borderRadius: 999,
              fontWeight: 600,
            }}
          >
            ${cropLabel}
          </span>
        </div>
        <div style=${{ display: 'flex', gap: 20, marginTop: 16 }}>
          <div>
            <div
              style=${{
                fontSize: 11,
                color: 'var(--ink2)',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                fontWeight: 600,
              }}
            >
              ${isIAG ? 'TIR SPV' : 'TIR Fondo'}
            </div>
            <div style=${{ fontFamily: 'var(--num)', fontSize: 22, fontWeight: 600, color: 'var(--ink)' }}>
              ${pct(isIAG ? r.tirL : r.tirF)}
            </div>
          </div>
          <div>
            <div
              style=${{
                fontSize: 11,
                color: 'var(--ink2)',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                fontWeight: 600,
              }}
            >
              Inversión
            </div>
            <div style=${{ fontFamily: 'var(--num)', fontSize: 22, fontWeight: 600 }}>
              ${nf(r.totalCapex / 1000, 1)} M€
            </div>
          </div>
        </div>
      </div>
      <div style=${{ display: 'flex', borderTop: '1px solid var(--line)' }}>
        <button
          onClick=${() => openModel(m.id)}
          style=${{
            flex: 1,
            padding: 12,
            background: 'none',
            border: 'none',
            borderRight: '1px solid var(--line)',
            cursor: 'pointer',
            fontWeight: 700,
            color: 'var(--brand)',
            fontSize: 13,
          }}
        >
          Abrir editor
        </button>
        <button
          onClick=${() => openResults(m.id)}
          style=${{
            flex: 1,
            padding: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            color: 'var(--ink2)',
            fontSize: 13,
          }}
        >
          Resultados
        </button>
        <button
          onClick=${() => duplicateModel(m.id)}
          style=${{
            flex: 1,
            padding: 12,
            background: 'none',
            border: 'none',
            borderLeft: '1px solid var(--line)',
            cursor: 'pointer',
            fontWeight: 600,
            color: 'var(--ink2)',
            fontSize: 13,
          }}
        >
          Duplicar
        </button>
      </div>
      <div style=${{ padding: '8px 18px', borderTop: '1px solid var(--line)', fontSize: 11, color: 'var(--ink2)' }}>
        Actualizado ${m.updated} · ${m.shared}
      </div>
    </div>
  `;
}

export function Dashboard() {
  const { state, openNew } = useApp();
  return html`
    <main style=${{ maxWidth: 1120, width: '100%', margin: '0 auto', padding: '34px 26px' }}>
      <div
        style=${{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 24,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style=${{ fontSize: 26, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-.02em' }}>
            Tus modelos
          </h1>
          <p style=${{ color: 'var(--ink2)', margin: 0, fontSize: 14 }}>
            Selecciona un modelo para ajustar sus variables o consultar la rentabilidad.
          </p>
        </div>
        <button
          onClick=${openNew}
          className="lift"
          style=${{
            background: 'var(--brand)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius)',
            padding: '11px 18px',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: 14,
            boxShadow: 'var(--shadow)',
          }}
        >
          + Nuevo modelo
        </button>
      </div>
      <div
        style=${{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))',
          gap: 18,
        }}
      >
        ${state.models.map((m) => html`<${ModelCard} key=${m.id} m=${m} />`)}
      </div>
    </main>
  `;
}
