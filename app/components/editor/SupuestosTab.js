import { html } from '../../lib/html.js';
import { nf } from '../../engine/format.js';
import { discountPct } from '../../engine/compute.js';
import { NumberField } from '../NumberField.js';
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
      { key: 'precioEVOO', label: 'Precio EVOO (constante)', unit: '€/kg' },
      { key: 'duracionProyecto', label: 'Duración proyecto', unit: 'años' },
    ],
  },
  {
    title: 'Costes estructurales',
    rows: [
      { key: 'alquiler', label: 'Alquiler de la finca', unit: '€/Ha/año' },
      { key: 'personal', label: 'Personal', unit: '€/Ha/año' },
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
      { key: 'plazo', label: 'Plazo préstamo', unit: 'años' },
      { key: 'carencia', label: 'Años de carencia', unit: 'años' },
    ],
  },
  {
    title: 'Fees y fondo',
    rows: [
      { key: 'capexFee', label: 'CAPEX Fee (año 1)', unit: '€/Ha' },
      { key: 'opexFee', label: 'OPEX Fee (anual, plano)', unit: '€/Ha' },
      { key: 'fondoCost', label: 'Costes del fondo', unit: '% equity/año' },
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
      { key: 'marcoN', label: 'Marco de plantación (n)', unit: 'm' },
      { key: 'marcoM', label: 'Marco de plantación (m)', unit: 'm' },
    ],
  },
  {
    title: 'Producción y precio',
    rows: [
      { key: 'kgTree', label: 'Kg/Aceituna/Árbol (olivo) · Plena Producción', unit: 'kg' },
      { key: 'oilYield', label: 'Rendimiento graso', unit: '%' },
      { key: 'precioEVOO', label: 'Precio inicial (EVOO)', unit: '€/kg' },
    ],
  },
  {
    title: 'Costes estructurales',
    rows: [
      { key: 'alquiler', label: 'Alquiler', unit: '€/Ha/año' },
      { key: 'personal', label: 'Costes de personal (equipo de operaciones)', unit: '€/Ha/año' },
    ],
  },
  {
    title: 'Supuestos macro',
    rows: [
      { key: 'inflacion', label: 'Inflación', unit: '%' },
      { key: 'is', label: 'Impuesto de sociedades', unit: '%' },
      { key: 'descuento', label: 'Tasa de descuento (VAN)', unit: '%' },
    ],
  },
  {
    title: 'Estructura financiera',
    rows: [
      { key: 'financiacion', label: 'Financiación', unit: '%' },
      { key: 'interes', label: 'Tipo de interés', unit: '%' },
      { key: 'plazo', label: 'Plazo', unit: 'años' },
      { key: 'carencia', label: 'Carencia', unit: 'años' },
    ],
  },
  {
    title: 'Fees y costes del SPV',
    rows: [
      { key: 'capexFee', label: 'CAPEX fee (año 1)', unit: '€/Ha' },
      { key: 'opexFee', label: 'OPEX fee (anual, plano)', unit: '€/Ha' },
      { key: 'audit', label: 'Auditoría (prorrateada al Orchard 1)', unit: '€/año' },
    ],
  },
];

export function SupuestosTab({ a, r }) {
  const { onField, canEdit } = useApp();
  const groups = a.engine === 'iag' ? GROUPS_IAG : GROUPS;
  return html`
    <div>
      <div style=${{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <h2 style=${{ fontSize: 18, fontWeight: 800, margin: 0 }}>Supuestos generales</h2>
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
              <div style=${{ padding: '0 16px' }}>
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
                        <${NumberField}
                          id=${'sup:' + row.key}
                          value=${row.key === 'descuento' ? discountPct(a) : a[row.key]}
                          onChangeRaw=${(raw) => onField(row.key, raw)}
                        />
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
              </div>
            </div>
          `,
        )}
      </div>
    </div>
  `;
}
