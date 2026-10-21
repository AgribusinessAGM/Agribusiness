import { html } from '../../lib/html.js';
import { nf } from '../../engine/format.js';
import { discountPct } from '../../engine/compute.js';
import { NumberField } from '../NumberField.js';
import { FillLine } from '../FillLine.js';
import { useApp } from '../../state/store.js';

// Cada fila edita una clave de los supuestos (model.a[key]).
const GROUPS = [
  {
    title: 'Parcela y plantación',
    rows: [
      { key: 'superficie', label: 'Superficie total', unit: 'Ha' },
      { key: 'marcoN', label: 'Marco · ancho de calle', unit: 'm' },
      { key: 'marcoM', label: 'Marco · entre árboles', unit: 'm' },
    ],
  },
  {
    title: 'Producción y precio',
    rows: [
      { key: 'prodPlena', label: 'Productividad plena', unit: 'kg aceite/Ha' },
      { key: 'precioEVOO', label: 'Precio EVOO (constante)', unit: '€/Kg' },
      { key: 'duracionProyecto', label: 'Duración proyecto', unit: 'Años' },
    ],
  },
  {
    title: 'Costes estructurales',
    rows: [
      { key: 'alquiler', label: 'Alquiler de la finca', unit: '€/Ha/Año' },
      { key: 'personal', label: 'Personal', unit: '€/Ha/Año' },
    ],
  },
  {
    title: 'Supuestos macro',
    rows: [
      { key: 'inflacion', label: 'Inflación anual (costes)', unit: '%' },
      { key: 'is', label: 'Impuesto Sociedades', unit: '%' },
      { key: 'descuento', label: 'Tasa de descuento (VAN)', unit: '%' },
    ],
  },
  {
    title: 'Estructura financiera',
    rows: [
      { key: 'financiacion', label: 'Financiación (deuda)', unit: '%' },
      { key: 'interes', label: 'Tasa de interés', unit: '%' },
      { key: 'plazo', label: 'Plazo préstamo', unit: 'Años' },
      { key: 'carencia', label: 'Años de carencia', unit: 'Años' },
    ],
  },
  {
    title: 'Fees y fondo',
    rows: [
      { key: 'capexFee', label: 'CAPEX Fee (Año 1)', unit: '€/Ha' },
      { key: 'opexFee', label: 'OPEX Fee (Anual)', unit: '€/Ha' },
      { key: 'fondoCost', label: 'Costes del fondo', unit: '% Capital' },
    ],
  },
];

// Modelo IAG: los supuestos de su Excel (producción por árbol y rendimiento graso
// en lugar de productividad por Ha, tasa de descuento propia y auditoría del SPV).
const GROUPS_IAG = [
  {
    title: 'Parcela y plantación',
    rows: [
      { key: 'superficie', label: 'Superficie de la parcela', unit: 'Ha' },
      { key: 'marcoN', label: 'Marco de plantación', unit: 'm' },
      { key: 'marcoM', label: 'Marco de plantación', unit: 'm' },
    ],
  },
  {
    title: 'Producción y precio',
    rows: [
      { key: 'kgTree', label: 'Kg/Aceituna/Árbol · Plena Producción', unit: 'kg' },
      { key: 'oilYield', label: 'Rendimiento graso', unit: '%' },
      { key: 'precioEVOO', label: 'Precio inicial (EVOO)', unit: '€/Kg' },
    ],
  },
  {
    title: 'Costes estructurales',
    rows: [
      { key: 'alquiler', label: 'Alquiler', unit: '€/Ha/Año' },
      { key: 'personal', label: 'Costes de personal (equipo de operaciones)', unit: '€/Ha/Año' },
    ],
  },
  {
    title: 'Supuestos macro',
    rows: [
      { key: 'inflacion', label: 'Inflación', unit: '%' },
      { key: 'is', label: 'Impuesto de Sociedades', unit: '%' },
      { key: 'descuento', label: 'Tasa de descuento (VAN)', unit: '%' },
    ],
  },
  {
    title: 'Estructura financiera',
    rows: [
      { key: 'financiacion', label: 'Financiación', unit: '%' },
      { key: 'interes', label: 'Tipo de interés', unit: '%' },
      { key: 'plazo', label: 'Plazo', unit: 'Años' },
      { key: 'carencia', label: 'Carencia', unit: 'Años' },
    ],
  },
  {
    title: 'Fees y costes del SPV',
    rows: [
      { key: 'capexFee', label: 'CAPEX Fee (Año 1)', unit: '€/Ha' },
      { key: 'opexFee', label: 'OPEX Fee (Anual)', unit: '€/Ha' },
      // pendiente de definir su cálculo (de momento no afecta a los resultados)
      { key: 'successFee', label: 'Success Fee', unit: '%' },
      { key: 'audit', label: 'Auditoría', unit: '€/Año' },
    ],
  },
  {
    title: 'Fondo de inversión',
    rows: [
      // calculado: lo que no se financia con deuda (100 % − financiación)
      { key: 'fondoPct', label: 'Capital Fondo', unit: '%', calc: (a) => 100 - (+a.financiacion || 0) },
      { key: 'fondoCost', label: 'Comisión Gestión Fondo', unit: '% Capital' },
      { key: 'fondoOtros', label: 'Auditoría', unit: '€/Año' },
    ],
  },
];

export function SupuestosTab({ a, r }) {
  const { onField, canEdit } = useApp();
  const groups = a.engine === 'iag' ? GROUPS_IAG : GROUPS;
  return html`
    <div>
      <div style=${{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <h2 style=${{ fontSize: 18, fontWeight: 800, fontFamily: "Rockwell, 'Rockwell Nova', 'Roboto Slab', serif", margin: 0 }}>Supuestos generales</h2>
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
          ${canEdit ? 'celdas editables' : 'solo lectura'}
        </span>
      </div>
      <p style=${{ color: 'var(--ink2)', fontSize: 14, margin: '0 0 22px' }}>
        Ajusta las variables de tu proyecto.
      </p>
      <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        ${groups.map(
          (g) => html`
            <div
              key=${g.title}
              style=${{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style=${{
                  padding: '12px 16px',
                  fontWeight: 700,
                  fontSize: 13,
                  borderBottom: '1px solid var(--line)',
                  background: 'var(--brandL)',
                  color: 'var(--brandD)',
                }}
              >
                ${g.title}
              </div>
              <div style=${{ padding: '0 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                ${g.rows.map(
                  (row, ri) => html`
                    <div
                      key=${row.key}
                      style=${{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        // sin línea en la última fila antes del borde de la tarjeta
                        borderBottom: ri < g.rows.length - 1 || g.title === 'Fees y fondo' ? '1px solid var(--line)' : 'none',
                      }}
                    >
                      <div style=${{ fontSize: 13.5 }}>${row.label}</div>
                      <div style=${{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        ${row.calc
                          ? html`<div
                              title="Calculado"
                              style=${{
                                width: 95,
                                textAlign: 'right',
                                fontSize: 14,
                                padding: '6px 9px',
                                border: '1px solid var(--line)',
                                borderRadius: 6,
                              }}
                            >
                              ${nf(row.calc(a), 0)}
                            </div>`
                          : html`<${NumberField}
                              id=${'sup:' + row.key}
                              value=${row.key === 'descuento' ? discountPct(a) : a[row.key]}
                              onChangeRaw=${(raw) => onField(row.key, raw)}
                            />`}
                        <span style=${{ fontSize: 12, color: 'var(--ink2)', width: 74 }}>${row.unit}</span>
                      </div>
                    </div>
                  `,
                )}
                ${g.title === 'Fees y fondo' &&
                html`
                  <div
                    style=${{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                    }}
                  >
                    <div style=${{ fontSize: 13.5 }}>Equity comprometido</div>
                    <div style=${{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style=${{
                          minWidth: 98,
                          textAlign: 'right',
                          background: 'var(--brandL)',
                          color: 'var(--brandD)',
                          fontFamily: 'var(--num)',
                          fontSize: 14,
                          fontWeight: 700,
                          padding: '6px 8px',
                          borderRadius: 6,
                        }}
                      >
                        ${nf(r.fondoEquity, 0)}
                      </div>
                      <span style=${{ fontSize: 12, color: 'var(--ink2)', width: 74 }}>k€</span>
                    </div>
                  </div>
                `}
                <!-- relleno hasta el borde: su sombra interior dibuja la línea bajo la última fila
                     solo si queda espacio en blanco claro -->
                <${FillLine} />
              </div>
            </div>
          `,
        )}
      </div>
    </div>
  `;
}
