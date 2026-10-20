import { html } from '../../lib/html.js';
import { fmt2, nf, pct, k } from '../../engine/format.js';
import { discountPct } from '../../engine/compute.js';
import { useApp } from '../../state/store.js';
import { useActiveCompute } from '../../state/useActiveCompute.js';
import { SupuestosTab } from './SupuestosTab.js';
import { CapexTab } from './CapexTab.js';
import { OpexTab } from './OpexTab.js';
import { RentabilidadTab } from './RentabilidadTab.js';
import { FinancieraTab } from './FinancieraTab.js';
import { PrecioTab } from './PrecioTab.js';
import { Report } from '../report/Report.js';

// [clave, título, editable]
const TAB_DEFS = [
  ['supuestos', '1. Supuestos', true],
  ['capex', '2. CAPEX', true],
  ['opex', '3. OPEX', true],
  ['precio', '4. Precio', true],
  ['rent', '5. Rentabilidad', false],
  ['fin', '6. E. Financiera', false],
  ['informe', '7. Informe', false],
];
// Modelo IAG: las hojas de su Excel, más el ciclo de precios
const TAB_DEFS_IAG = [
  ['supuestos', '1. Supuestos', true],
  ['capex', '2. CAPEX', true],
  ['opex', '3. OPEX', true],
  ['precio', '4. Precio', true],
  ['rent', '5. Rentabilidad', false],
  ['fin', '6. Financiero', false],
  ['informe', '7. Informe', false],
];

function editorKpis(a, r) {
  const p = r.price.slice(1);
  const avgPrice = { label: 'Precio medio', value: nf(p.length ? p.reduce((x, v) => x + v, 0) / p.length : NaN, 2) + ' €/kg' };
  if (a.engine === 'iag') {
    return [
      { label: 'TIR SPV · Orchard 1', value: pct(r.tirL), highlight: true },
      { label: 'TIR Agrícola', value: pct(r.tirA) },
      { label: 'VAN por ha (' + nf(discountPct(a), 1) + '%)', value: nf(r.vanHa) + ' €' },
      { label: 'Inversión total', value: nf(r.totalCapex / 1000, 2) + ' M€' },
      avgPrice,
    ];
  }
  return [
    { label: 'TIR Fondo · final', value: pct(r.tirF), highlight: true },
    { label: 'VAN Fondo (' + fmt2(discountPct(a)) + '%)', value: k(r.vanF) },
    { label: 'Equity comprometido', value: k(r.fondoEquity) },
    { label: 'Inversión total', value: nf(r.totalCapex / 1000, 2) + ' M€' },
    avgPrice,
  ];
}

function TabWithPhoto({ photo, alt, objectPosition = 'center', children }) {
  return html`
    <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
      <div style=${{ gridColumn: '1 / 4' }}>${children}</div>
      <img
        src=${photo}
        alt=${alt}
        style=${{
          gridColumn: '4 / 5',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition,
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
        }}
      />
    </div>
  `;
}

function KpiBox({ label, value, highlight }) {
  return html`
    <div
      style=${{
        border: `1px solid ${highlight ? 'var(--brand)' : 'var(--line)'}`,
        background: highlight ? 'var(--brandL)' : undefined,
        borderRadius: 'var(--radius)',
        padding: '10px 14px',
      }}
    >
      <div
        style=${{
          fontSize: 11,
          color: highlight ? 'var(--brandD)' : 'var(--ink2)',
          textTransform: 'uppercase',
          letterSpacing: '.05em',
          fontWeight: highlight ? 700 : 600,
        }}
      >
        ${label}
      </div>
      <div style=${{ fontFamily: 'var(--num)', fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>
        ${value}
      </div>
    </div>
  `;
}

export function EditorLayout() {
  const { state, gotoDash, setEtab, gotoResults, save, exportXlsx, exportPdf, canEdit } = useApp();
  const { model, a, r } = useActiveCompute();
  const isIAG = a.engine === 'iag';
  const tabDefs = isIAG ? TAB_DEFS_IAG : TAB_DEFS;
  // Si el modelo no tiene la pestaña abierta (p. ej. Precio en un modelo normal), se muestra Supuestos.
  const etab = tabDefs.some(([key]) => key === state.etab) ? state.etab : 'supuestos';

  return html`
    <div style=${{ display: 'flex', flex: 1, minHeight: 0 }}>
      <aside
        style=${{
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
          onClick=${gotoDash}
          style=${{
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
          style=${{
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
        ${tabDefs.map(([key, label, editable]) => {
          const on = etab === key;
          return html`
            <button
              key=${key}
              onClick=${() => setEtab(key)}
              style=${{
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
              <span>${label}</span>
              ${editable &&
              canEdit &&
              html`
                <span
                  style=${{
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
              `}
            </button>
          `;
        })}
        <div style=${{ flex: 1 }} />
        <div
          style=${{
            borderTop: '1px solid var(--line)',
            paddingTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          ${canEdit &&
          html`
            <button
              onClick=${save}
              style=${{
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
          `}
          <div style=${{ display: 'flex', gap: 8 }}>
            <button
              onClick=${exportXlsx}
              style=${{
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
              onClick=${exportPdf}
              style=${{
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

      <div style=${{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div
          style=${{
            background: 'var(--surface)',
            borderBottom: '1px solid var(--line)',
            padding: '16px 26px',
            position: 'sticky',
            top: 60,
            zIndex: 20,
          }}
        >
          <div
            style=${{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style=${{ fontSize: 12, color: 'var(--ink2)', fontWeight: 600 }}>${model.region}</div>
              <div style=${{ fontSize: 19, fontWeight: 800, letterSpacing: '-.01em' }}>${model.name}</div>
            </div>
            <button
              onClick=${gotoResults}
              className="lift"
              style=${{
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
          <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginTop: 14 }}>
            ${editorKpis(a, r).map(
              (kp) => html`<${KpiBox} key=${kp.label} label=${kp.label} value=${kp.value} highlight=${kp.highlight} />`,
            )}
          </div>
        </div>

        <div style=${{ flex: 1, overflow: 'auto', padding: 26 }}>
          ${etab === 'supuestos' &&
          html`
            <${TabWithPhoto}
              photo=${model.crop === 'almendro' ? 'assets/supuestos-almendro-detalle.webp' : 'assets/olivar-detalle.webp'}
              alt=${model.crop === 'almendro' ? 'Detalle de almendras' : 'Detalle de olivar'}
            >
              <${SupuestosTab} a=${a} r=${r} />
            <//>
          `}
          ${etab === 'capex' &&
          html`
            <${TabWithPhoto}
              photo=${model.crop === 'almendro' ? 'assets/capex-almendro-detalle.webp' : 'assets/capex-detalle.webp'}
              alt=${model.crop === 'almendro' ? 'Plantones de almendro en filas' : 'Vivero de plantones en filas'}
              objectPosition="right center"
            >
              <${CapexTab} a=${a} r=${r} />
            <//>
          `}
          ${etab === 'opex' &&
          html`
            <${OpexTab}
              a=${a}
              r=${r}
              photo=${model.crop === 'almendro' ? 'assets/opex-almendro-detalle.webp' : 'assets/opex-detalle.webp'}
              photoAlt=${model.crop === 'almendro' ? 'Cosechadora trabajando en el almendral' : 'Cosechadoras trabajando en el olivar'}
              photoObjectPosition=${model.crop === 'almendro' ? '22% center' : 'center'}
            />
          `}
          ${etab === 'rent' && html`<${RentabilidadTab} a=${a} r=${r} />`}
          ${etab === 'fin' && html`<${FinancieraTab} a=${a} r=${r} />`}
          ${etab === 'precio' && html`<${PrecioTab} a=${a} r=${r} title=${isIAG ? '4. Precio' : '4. Precio'} />`}
          ${etab === 'informe' && html`<${Report} title=${isIAG ? '7. Informe' : '7. Informe'} />`}
        </div>
      </div>
    </div>
  `;
}
