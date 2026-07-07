import { nf } from '../../engine/format';
import type { ComputeResult } from '../../engine/compute';
import { NumberField } from '../NumberField';
import { useApp } from '../../state/store';
import type { Assumptions } from '../../types';

interface Row {
  key: keyof Assumptions;
  label: string;
  unit: string;
}

interface Group {
  title: string;
  rows: Row[];
}

const GROUPS: Group[] = [
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
    ],
  },
  {
    title: 'Costes estructurales',
    rows: [
      { key: 'alquiler', label: 'Alquiler de la finca', unit: '€/Ha·año' },
      { key: 'personal', label: 'Personal', unit: '€/Ha·año' },
    ],
  },
  {
    title: 'Supuestos macro',
    rows: [
      { key: 'inflacion', label: 'Inflación anual (costes)', unit: '%' },
      { key: 'is', label: 'Impuesto Sociedades', unit: '%' },
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
      { key: 'equityFondo', label: 'Equity comprometido', unit: 'k€' },
    ],
  },
];

export function SupuestosTab({ a, r }: { a: Assumptions; r: ComputeResult }) {
  const { onField, canEdit } = useApp();
  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Supuestos generales</h2>
        <span
          style={{
            fontSize: 11,
            background: canEdit ? 'var(--editable)' : 'var(--bg)',
            color: canEdit ? 'var(--brandD)' : 'var(--ink2)',
            border: `1px solid ${canEdit ? 'var(--editableLine)' : 'var(--line)'}`,
            padding: '2px 8px',
            borderRadius: 999,
            fontWeight: 700,
          }}
        >
          {canEdit ? 'celdas editables' : 'solo lectura'}
        </span>
      </div>
      <p style={{ color: 'var(--ink2)', fontSize: 14, margin: '0 0 22px' }}>
        Ajusta las variables de tu proyecto. Los valores en gris se calculan automáticamente y no
        se pueden editar.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {GROUPS.map((g) => (
          <div
            key={g.title}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                fontWeight: 700,
                fontSize: 13,
                borderBottom: '1px solid var(--line)',
                background: 'var(--brandL)',
                color: 'var(--brandD)',
              }}
            >
              {g.title}
            </div>
            <div style={{ padding: '6px 16px' }}>
              {g.rows.map((row) => (
                <div
                  key={row.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 0',
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  <div style={{ fontSize: 13.5 }}>{row.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <NumberField
                      id={'sup:' + row.key}
                      value={a[row.key] as number}
                      onChangeRaw={(raw) => onField(row.key, raw)}
                    />
                    <span style={{ fontSize: 12, color: 'var(--ink2)', width: 74 }}>{row.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div
          style={{
            gridColumn: '1 / -1',
            background: 'var(--surface)',
            border: '1px dashed var(--line)',
            borderRadius: 'var(--radius)',
            padding: 16,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink2)', marginBottom: 12 }}>
            Calculado automáticamente
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink2)' }}>Densidad</div>
              <div style={{ fontFamily: 'var(--num)', fontSize: 17, fontWeight: 600 }}>
                {nf(r.densidad)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink2)' }}>árboles/Ha</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink2)' }}>Árboles totales</div>
              <div style={{ fontFamily: 'var(--num)', fontSize: 17, fontWeight: 600 }}>
                {nf(r.arboles)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink2)' }}>CAPEX por Ha</div>
              <div style={{ fontFamily: 'var(--num)', fontSize: 17, fontWeight: 600 }}>
                {nf(r.capexHa)} €
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink2)' }}>OPEX/Ha (pleno)</div>
              <div style={{ fontFamily: 'var(--num)', fontSize: 17, fontWeight: 600 }}>
                {nf(r.opexHa)} €
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
