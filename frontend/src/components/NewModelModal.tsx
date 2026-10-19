import { useApp } from '../state/store';
import type { TemplateKey } from '../types';

const TEMPLATE_OPTS: [TemplateKey, string][] = [
  ['olivo', 'Olivo SHD'],
  ['almendro', 'Almendro SHD'],
  ['blank', 'En blanco'],
];

export function NewModelModal() {
  const { state, closeNew, setNewName, setNewHa, setNewTemplate, createModel } = useApp();
  if (!state.showNew) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20,30,18,.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        padding: 20,
      }}
      onClick={closeNew}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 30px 80px -20px rgba(0,0,0,.4)',
          width: '100%',
          maxWidth: 460,
          padding: 26,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 4px' }}>Nuevo modelo</h2>
        <p style={{ color: 'var(--ink2)', fontSize: 13, margin: '0 0 20px' }}>
          Crea un modelo a partir de una plantilla. Podrás ajustar todas las variables después.
        </p>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Nombre del modelo</label>
        <input
          value={state.newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Ej. Finca Los Olivos · Jaén"
          style={{
            width: '100%',
            padding: '11px 13px',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            fontSize: 14,
            marginBottom: 16,
            background: 'var(--surface)',
            color: 'var(--ink)',
          }}
        />
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Plantilla</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {TEMPLATE_OPTS.map(([key, label]) => {
            const on = state.newTemplate === key;
            return (
              <button
                key={key}
                onClick={() => setNewTemplate(key)}
                style={{
                  flex: 1,
                  padding: '9px 6px',
                  borderRadius: 'var(--radius)',
                  border: `1px solid ${on ? 'var(--brand)' : 'var(--line)'}`,
                  background: on ? 'var(--brandL)' : 'var(--surface)',
                  color: on ? 'var(--brandD)' : 'var(--ink)',
                  fontWeight: on ? 700 : 500,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Superficie (Ha)</label>
        <input
          type="number"
          value={state.newHa}
          onChange={(e) => setNewHa(parseFloat(e.target.value) || 0)}
          style={{
            width: '100%',
            padding: '11px 13px',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            fontSize: 14,
            marginBottom: 24,
            fontFamily: 'var(--num)',
            background: 'var(--surface)',
            color: 'var(--ink)',
          }}
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={closeNew}
            style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '10px 16px', fontWeight: 600, cursor: 'pointer', color: 'var(--ink)' }}
          >
            Cancelar
          </button>
          <button
            onClick={createModel}
            style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}
          >
            Crear modelo
          </button>
        </div>
      </div>
    </div>
  );
}
