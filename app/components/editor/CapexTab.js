import { html } from '../../lib/html.js';
import { nf, pctShare } from '../../engine/format.js';
import { capexItemHa } from '../../engine/compute.js';
import { NumberField } from '../NumberField.js';
import { useApp } from '../../state/store.js';

const CAP_UNIT = { ud: '€/Árbol', ha: '€/Ha' };

export function CapexTab({ a, r }) {
  const { onField, onCapexField, canEdit } = useApp();

  const capexDetail = a.capexGroups.map((g) => {
    const items = g.items.map((it) => {
      const ha = capexItemHa(it, g, r.densidad, +a.superficie || 0);
      return { ...it, ha: nf(ha, 0), unitLabel: it.total ? '€/Total' : CAP_UNIT[g.unit] };
    });
    const subtotal = g.items.reduce((s, it) => s + capexItemHa(it, g, r.densidad, +a.superficie || 0), 0);
    return {
      key: g.key,
      title: g.title,
      unitLabel: CAP_UNIT[g.unit],
      items,
      subtotalFmt: nf(subtotal, 0) + ' €/Ha',
      pct: pctShare(subtotal / r.capexHa),
    };
  });

  const card = {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    overflow: 'hidden',
  };
  const smallHead = { fontSize: 11, color: 'var(--ink2)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600, marginBottom: 8 };

  return html`
    <div>
      <div style=${{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <h2 style=${{ fontSize: 18, fontWeight: 800, fontFamily: "Rockwell, 'Rockwell Nova', 'Roboto Slab', serif", margin: 0 }}>2. CAPEX — Inversión inicial</h2>
        <span
          style=${{
            fontSize: 11,
            background: canEdit ? 'var(--editable)' : 'var(--bg)',
            color: canEdit ? 'var(--brandD)' : 'var(--ink2)',
            border: `1px solid ${canEdit ? 'var(--editableLine)' : 'var(--line)'}`,
            padding: '2px 8px',
            borderRadius: 999,
            fontWeight: 700,
          }}
        >
          ${canEdit ? 'coste unitario editable' : 'solo lectura'}
        </span>
      </div>
      <p style=${{ color: 'var(--ink2)', fontSize: 14, margin: '0 0 20px' }}>
        Coste de establecimiento por hectárea, con el mismo detalle que la hoja Excel. Las partidas de plantación se introducen en €/Árbol y se multiplican por la densidad (${nf(r.densidad)}${' '}Árboles/Ha); el resto en €/Ha.
      </p>

      <div style=${{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style=${card}>
          <div style=${{ padding: '11px 18px', background: 'var(--brandL)', color: 'var(--brandD)', fontWeight: 700, fontSize: 13.5 }}>
            Marco de plantación
          </div>
          <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div style=${{ padding: '14px 18px', borderRight: '1px solid var(--line)' }}>
              <div style=${smallHead}>
                Marco de plantación
              </div>
              <div style=${{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <${NumberField} id="sup:marcoN" value=${a.marcoN} width=${72} onChangeRaw=${(raw) => onField('marcoN', raw)} />
                <span style=${{ fontSize: 12, color: 'var(--ink2)' }}>m</span>
                <span style=${{ color: 'var(--ink2)' }}>×</span>
                <${NumberField} id="sup:marcoM" value=${a.marcoM} width=${72} onChangeRaw=${(raw) => onField('marcoM', raw)} />
                <span style=${{ fontSize: 12, color: 'var(--ink2)' }}>m</span>
              </div>
            </div>
            <div style=${{ padding: '14px 18px', borderRight: '1px solid var(--line)' }}>
              <div style=${smallHead}>
                Densidad
              </div>
              <div style=${{ fontFamily: 'var(--num)', fontSize: 20, fontWeight: 600 }}>${nf(r.densidad)}</div>
              <div style=${{ fontSize: 11, color: 'var(--ink2)' }}>Árboles/Ha</div>
            </div>
            <div style=${{ padding: '14px 18px' }}>
              <div style=${smallHead}>
                # Plantas
              </div>
              <div style=${{ fontFamily: 'var(--num)', fontSize: 20, fontWeight: 600 }}>${nf(r.arboles)}</div>
            </div>
          </div>
        </div>

        ${capexDetail.map(
          (g) => html`
            <div key=${g.key} style=${card}>
              <div
                style=${{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 18px',
                  background: 'var(--brandL)',
                  color: 'var(--brandD)',
                }}
              >
                <div style=${{ fontWeight: 700, fontSize: 13.5 }}>${g.title}</div>
                <div style=${{ fontSize: 13, fontWeight: 700 }}>
                  ${g.subtotalFmt} · ${g.pct}
                </div>
              </div>
              <div
                style=${{
                  display: 'grid',
                  gridTemplateColumns: '2.6fr 1.1fr 0.9fr 1fr',
                  padding: '8px 18px',
                  fontSize: 11,
                  color: 'var(--ink2)',
                  fontWeight: 600,
                  borderBottom: '1px solid var(--line)',
                }}
              >
                <div>Partida</div>
                <div style=${{ textAlign: 'right' }}>Coste unitario</div>
                <div style=${{ textAlign: 'center' }}>Unidad</div>
                <div style=${{ textAlign: 'right' }}>Total €/Ha</div>
              </div>
              ${g.items.map(
                (it) => html`
                  <div
                    key=${it.key}
                    style=${{
                      display: 'grid',
                      gridTemplateColumns: '2.6fr 1.1fr 0.9fr 1fr',
                      alignItems: 'center',
                      padding: '8px 18px',
                      borderTop: '1px solid var(--line)',
                    }}
                  >
                    <div style=${{ fontSize: 13.5 }}>${it.label}</div>
                    <div style=${{ textAlign: 'right' }}>
                      <${NumberField}
                        id=${'cap:' + g.key + '.' + it.key}
                        value=${it.v}
                        width=${100}
                        onChangeRaw=${(raw) => onCapexField(g.key, it.key, raw)}
                      />
                    </div>
                    <div style=${{ textAlign: 'center', fontSize: 12, color: 'var(--ink2)' }}>${it.unitLabel}</div>
                    <div style=${{ textAlign: 'right', fontFamily: 'var(--num)', fontSize: 14 }}>${it.ha}</div>
                  </div>
                `,
              )}
            </div>
          `,
        )}

        <div style=${card}>
          <div
            style=${{
              display: 'grid',
              gridTemplateColumns: '2.6fr 1.1fr 0.9fr 1fr',
              alignItems: 'center',
              padding: '11px 18px',
              fontWeight: 700,
            }}
          >
            <div style=${{ fontSize: 13.5 }}>
              Total CAPEX
            </div>
            <div />
            <div />
            <div style=${{ textAlign: 'right', fontSize: 14 }}>
              ${nf(r.capexEstab, 0)} €/Ha
            </div>
          </div>
          <div
            style=${{
              display: 'grid',
              gridTemplateColumns: '2.6fr 1.1fr 0.9fr 1fr',
              alignItems: 'center',
              padding: '11px 18px',
              borderTop: '1px solid var(--line)',
            }}
          >
            <div style=${{ fontSize: 13.5 }}>
              Capitalización OPEX${' '}<span style=${{ color: 'var(--ink2)', fontSize: 11.5 }}>(OPEX Año 1 + Año 2)</span>
            </div>
            <div style=${{ textAlign: 'right', fontSize: 11, color: 'var(--ink2)' }}>Calculado</div>
            <div style=${{ textAlign: 'center', fontSize: 12, color: 'var(--ink2)' }}>€/Ha</div>
            <div style=${{ textAlign: 'right', fontFamily: 'var(--num)', fontSize: 14, color: 'var(--ink2)' }}>
              ${nf(r.capexOpex, 0)} €/Ha
            </div>
          </div>
          <div
            style=${{
              display: 'grid',
              gridTemplateColumns: '2.6fr 1fr 1fr',
              alignItems: 'center',
              padding: '13px 18px',
              borderTop: '2px solid var(--brand)',
              fontWeight: 800,
            }}
          >
            <div>Total Inversión Inicial (por Ha)</div>
            <div style=${{ textAlign: 'right' }}>${nf(r.capexHa)} €</div>
            <div style=${{ textAlign: 'right' }}>${nf(r.totalCapex, 0)} k€ total</div>
          </div>
        </div>
      </div>
    </div>
  `;
}
