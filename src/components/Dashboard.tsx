import { compute } from '../engine/compute';
import { nf, pct } from '../engine/format';
import { useApp } from '../state/store';
import type { FinModel, ModelStatus } from '../types';

const statusColor: Record<ModelStatus, string> = {
  Activo: 'var(--brand)',
  Borrador: 'var(--muted)',
  'En revisión': 'var(--accent)',
};

function ModelCard({ m }: { m: FinModel }) {
  const { openModel, openResults } = useApp();
  const r = compute(m.a);
  const cropLabel = m.crop === 'almendro' ? 'Almendro SHD' : 'Olivo SHD';
  return (
    <div
      className="lift"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '18px 18px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.3 }}>{m.name}</div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
              background: statusColor[m.status],
              padding: '3px 9px',
              borderRadius: 999,
              whiteSpace: 'nowrap',
            }}
          >
            {m.status}
          </span>
        </div>
        <div style={{ color: 'var(--ink2)', fontSize: 13, marginTop: 4 }}>{m.region}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 12,
              background: 'var(--brandL)',
              color: 'var(--brandD)',
              padding: '4px 9px',
              borderRadius: 999,
              fontWeight: 600,
            }}
          >
            {nf(m.a.superficie)} Ha
          </span>
          <span
            style={{
              fontSize: 12,
              background: 'var(--brandL)',
              color: 'var(--brandD)',
              padding: '4px 9px',
              borderRadius: 999,
              fontWeight: 600,
            }}
          >
            {cropLabel}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
          <div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--ink2)',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                fontWeight: 600,
              }}
            >
              TIR Fondo
            </div>
            <div style={{ fontFamily: 'var(--num)', fontSize: 22, fontWeight: 600, color: 'var(--ink)' }}>
              {pct(r.tirF)}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--ink2)',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                fontWeight: 600,
              }}
            >
              Inversión
            </div>
            <div style={{ fontFamily: 'var(--num)', fontSize: 22, fontWeight: 600 }}>
              {nf(r.totalCapex / 1000, 1)} M€
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', borderTop: '1px solid var(--line)' }}>
        <button
          onClick={() => openModel(m.id)}
          style={{
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
          onClick={() => openResults(m.id)}
          style={{
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
      </div>
      <div style={{ padding: '8px 18px', borderTop: '1px solid var(--line)', fontSize: 11, color: 'var(--ink2)' }}>
        Actualizado {m.updated} · {m.shared}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { state, openNew } = useApp();
  return (
    <main style={{ maxWidth: 1120, width: '100%', margin: '0 auto', padding: '34px 26px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 24,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-.02em' }}>
            Tus modelos
          </h1>
          <p style={{ color: 'var(--ink2)', margin: 0, fontSize: 14 }}>
            Selecciona un modelo para ajustar sus variables o consultar la rentabilidad.
          </p>
        </div>
        <button
          onClick={openNew}
          className="lift"
          style={{
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
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))',
          gap: 18,
        }}
      >
        {state.models.map((m) => (
          <ModelCard key={m.id} m={m} />
        ))}
      </div>
    </main>
  );
}
