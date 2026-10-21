import { html } from '../../lib/html.js';
import { nf } from '../../engine/format.js';
import { buildPnlHeader, buildPnlLayers } from '../../engine/pnlLayers.js';

const LAB_W = 230;
const YEAR_W = 88; // cabe un negativo de 5 cifras en miles, p. ej. (10.000)

export function RentabilidadTab({ a, r }) {
  const horizon = r.ingresos.length - 1;
  const pnlHeader = buildPnlHeader(horizon);
  const pnlLayers = buildPnlLayers(r, a);
  const isIAG = a.engine === 'iag';

  return html`
    <div>
      <h2 style=${{ fontSize: 18, fontWeight: 800, fontFamily: "Rockwell, 'Rockwell Nova', 'Roboto Slab', serif", margin: '0 0 6px' }}>5. Rentabilidad</h2>
      <p style=${{ color: 'var(--ink2)', fontSize: 14, margin: '0 0 18px' }}>
        ${isIAG
          ? 'PDTE.'
          : "Análisis de la rentabilidad del proyecto: Proyecto agrícola · Estructura SPV · Estructura Fondo, cada uno con su TIR. Cifras en miles € ('000)."}
      </p>
      <div style=${{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        ${pnlLayers.map(
          (L) => html`
            <div
              key=${L.title}
              style=${{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow)',
                overflow: 'hidden',
              }}
            >
              <div
                style=${{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '11px 16px',
                  background: 'var(--brandL)',
                  color: 'var(--brandD)',
                }}
              >
                <div style=${{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style=${{ fontWeight: 800, fontSize: 14 }}>${L.title}</span>
                  <span style=${{ fontSize: 12, opacity: 0.75 }}>${L.sub}</span>
                </div>
                <div
                  style=${{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'var(--brandD)',
                    color: '#fff',
                    padding: '4px 14px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  ${L.tirLabel} <span style=${{ fontFamily: 'var(--num)', fontSize: 14 }}>${L.tir}</span>
                </div>
              </div>
              <div style=${{ overflow: 'auto' }}>
                <table style=${{ borderCollapse: 'collapse', tableLayout: 'fixed', width: LAB_W + pnlHeader.length * YEAR_W, fontSize: 13 }}>
                  <!-- mismos anchos en todas las capas para que los años queden alineados -->
                  <colgroup><col style=${{ width: LAB_W }} />${pnlHeader.map((h) => html`<col key=${h.label} style=${{ width: YEAR_W }} />`)}</colgroup>
                  <thead>
                    <tr>
                      <th
                        style=${{
                          textAlign: 'left',
                          padding: '9px 14px',
                          position: 'sticky',
                          left: 0,
                          background: 'var(--surface)',
                          color: 'var(--ink2)',
                          fontSize: 11,
                          borderBottom: '1px solid var(--line)',
                        }}
                      >
                        Concepto
                      </th>
                      ${pnlHeader.map(
                        (h) => html`
                          <th
                            key=${h.label}
                            style=${{
                              textAlign: 'right',
                              padding: '9px 12px',
                              color: 'var(--ink2)',
                              fontFamily: 'var(--num)',
                              fontSize: 11,
                              whiteSpace: 'nowrap',
                              borderBottom: '1px solid var(--line)',
                            }}
                          >
                            ${h.label}
                          </th>
                        `,
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    ${L.rows.map(
                      (row, ri) => html`
                        <tr key=${ri} style=${{ background: row.rowBg }}>
                          <td style=${row.labelStyle}>${row.label}</td>
                          ${row.cells.map((c, ci) => html`<td key=${ci} style=${c.style}>${c.v}</td>`)}
                        </tr>
                      `,
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          `,
        )}
      </div>
    </div>
  `;
}
