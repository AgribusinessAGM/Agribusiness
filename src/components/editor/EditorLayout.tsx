import { nf, pct, k } from '../../engine/format';
import { useApp } from '../../state/store';
import { useActiveCompute } from '../../state/useActiveCompute';
import type { EditorTab } from '../../types';
import { SupuestosTab } from './SupuestosTab';
import { CapexTab } from './CapexTab';
import { OpexTab } from './OpexTab';
import { RentabilidadTab } from './RentabilidadTab';
import { FinancieraTab } from './FinancieraTab';

const TAB_DEFS: [EditorTab, string, boolean][] = [
  ['supuestos', 'Supuestos', true],
  ['capex', '1 · CAPEX', true],
  ['opex', '2 · OPEX', true],
  ['rent', '3 · Rentabilidad', false],
  ['fin', 'E. Financiera', false],
];

function KpiBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      style={{
        border: `1px solid ${highlight ? 'var(--brand)' : 'var(--line)'}`,
        background: highlight ? 'var(--brandL)' : undefined,
        borderRadius: 'var(--radius)',
        padding: '10px 14px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: highlight ? 'var(--brandD)' : 'var(--ink2)',
          textTransform: 'uppercase',
          letterSpacing: '.05em',
          fontWeight: highlight ? 700 : 600,
        }}
      >
        {label}
      </div>
      <div style={{ fontFamily: 'var(--num)', fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>
        {value}
      </div>
    </div>
  );
}

export function EditorLayout() {
  const { state, gotoDash, setEtab, gotoResults, save, exportXlsx, exportPdf } = useApp();
  const { model, a, r } = useActiveCompute();

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      <aside
        style={{
          width: 230,
          flex: 'none',
          background: 'var(--surface)',
          borderRight: '1px solid var(--line)',
          padding: '18px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <button
          onClick={gotoDash}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink2)',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            padding: '6px 10px',
            marginBottom: 8,
          }}
        >
          ‹ Volver a modelos
        </button>
        <div
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            color: 'var(--ink2)',
            fontWeight: 700,
            padding: '6px 10px',
          }}
        >
          Hojas del modelo
        </div>
        {TAB_DEFS.map(([key, label, editable]) => {
          const on = state.etab === key;
          return (
            <button
              key={key}
              onClick={() => setEtab(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                textAlign: 'left',
                background: on ? 'var(--brandL)' : 'none',
                color: on ? 'var(--brandD)' : 'var(--ink)',
                border: 'none',
                borderRadius: 'var(--radius)',
                padding: '10px 12px',
                fontWeight: on ? 700 : 500,
                fontSize: 14,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              <span>{label}</span>
              {editable && (
                <span
                  style={{
                    fontSize: 10,
                    background: 'var(--editable)',
                    color: 'var(--brandD)',
                    border: '1px solid var(--editableLine)',
                    padding: '1px 6px',
                    borderRadius: 999,
                    fontWeight: 700,
                  }}
                >
                  editable
                </span>
              )}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <div
          style={{
            borderTop: '1px solid var(--line)',
            paddingTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <button
            onClick={save}
            style={{
              background: 'var(--brand)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius)',
              padding: 10,
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Guardar cambios
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={exportXlsx}
              style={{
                flex: 1,
                background: 'none',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                padding: 9,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 12,
                color: 'var(--ink)',
              }}
            >
              Excel
            </button>
            <button
              onClick={exportPdf}
              style={{
                flex: 1,
                background: 'none',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                padding: 9,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 12,
                color: 'var(--ink)',
              }}
            >
              PDF
            </button>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            background: 'var(--surface)',
            borderBottom: '1px solid var(--line)',
            padding: '16px 26px',
            position: 'sticky',
            top: 60,
            zIndex: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: 'var(--ink2)', fontWeight: 600 }}>{model.region}</div>
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.01em' }}>{model.name}</div>
            </div>
            <button
              onClick={gotoResults}
              className="lift"
              style={{
                background: 'var(--brandD)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius)',
                padding: '10px 16px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Ver resultados →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 14 }}>
            <KpiBox label="TIR Fondo · final" value={pct(r.tirF)} highlight />
            <KpiBox label="VAN Fondo (8%)" value={k(r.vanF)} />
            <KpiBox label="Equity comprometido" value={k(r.fondoEquity)} />
            <KpiBox label="Inversión total" value={nf(r.totalCapex / 1000, 2) + ' M€'} />
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 26 }}>
          {state.etab === 'supuestos' && <SupuestosTab a={a} r={r} />}
          {state.etab === 'capex' && <CapexTab a={a} r={r} />}
          {state.etab === 'opex' && <OpexTab a={a} r={r} />}
          {state.etab === 'rent' && <RentabilidadTab r={r} />}
          {state.etab === 'fin' && <FinancieraTab r={r} />}
        </div>
      </div>
    </div>
  );
}
