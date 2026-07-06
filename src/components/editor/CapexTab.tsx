import type { ComputeResult } from '../../engine/compute';
import { nf } from '../../engine/format';
import { NumberField } from '../NumberField';
import { useApp } from '../../state/store';
import type { Assumptions, CapexUnit } from '../../types';

const CAP_UNIT: Record<CapexUnit, string> = { ud: '€/árbol', ha: '€/Ha' };

export function CapexTab({ a, r }: { a: Assumptions; r: ComputeResult }) {
  const { onField, onCapexField } = useApp();

  const capexDetail = a.capexGroups.map((g) => {
    const items = g.items.map((it) => {
      const ha = (+it.v || 0) * (g.unit === 'ud' ? r.densidad : 1);
      return { ...it, ha: nf(ha, 0) };
    });
    const subtotal = g.items.reduce((s, it) => s + (+it.v || 0) * (g.unit === 'ud' ? r.densidad : 1), 0);
    return {
      key: g.key,
      title: g.title,
      unitLabel: CAP_UNIT[g.unit],
      items,
      subtotalFmt: nf(subtotal, 0) + ' €/Ha',
      pct: Math.round((subtotal / r.capexHa) * 100) + '%',
    };
  });

  return (
    <div style={{ maxWidth: 1080 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>1 · CAPEX — Inversión inicial</h2>
        <span
          style={{
            fontSize: 11,
            background: 'var(--editable)',
            color: 'var(--brandD)',
            border: '1px solid var(--editableLine)',
            padding: '2px 8px',
            borderRadius: 999,
            fontWeight: 700,
          }}
        >
          coste unitario editable
        </span>
      </div>
      <p style={{ color: 'var(--ink2)', fontSize: 14, margin: '0 0 20px' }}>
        Coste de establecimiento por hectárea, con el mismo detalle que la hoja Excel. Las partidas
        de plantación se introducen en €/árbol y se multiplican por la densidad ({nf(r.densidad)}{' '}
        árboles/Ha); el resto en €/Ha.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '11px 18px', background: 'var(--brandL)', color: 'var(--brandD)', fontWeight: 700, fontSize: 13.5 }}>
            Marco de plantación
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div style={{ padding: '14px 18px', borderRight: '1px solid var(--line)' }}>
              <div style={{ fontSize: 11, color: 'var(--ink2)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600, marginBottom: 8 }}>
                Marco (n × m)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <NumberField id="sup:marcoN" value={a.marcoN} width={72} onChangeRaw={(raw) => onField('marcoN', raw)} />
                <span style={{ color: 'var(--ink2)' }}>×</span>
                <NumberField id="sup:marcoM" value={a.marcoM} width={72} onChangeRaw={(raw) => onField('marcoM', raw)} />
                <span style={{ fontSize: 12, color: 'var(--ink2)' }}>m</span>
              </div>
            </div>
            <div style={{ padding: '14px 18px', borderRight: '1px solid var(--line)' }}>
              <div style={{ fontSize: 11, color: 'var(--ink2)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600, marginBottom: 8 }}>
                Densidad
              </div>
              <div style={{ fontFamily: 'var(--num)', fontSize: 20, fontWeight: 600 }}>{nf(r.densidad)}</div>
              <div style={{ fontSize: 11, color: 'var(--ink2)' }}>árboles/Ha</div>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: 11, color: 'var(--ink2)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600, marginBottom: 8 }}>
                # Plantas
              </div>
              <div style={{ fontFamily: 'var(--num)', fontSize: 20, fontWeight: 600 }}>{nf(r.arboles)}</div>
              <div style={{ fontSize: 11, color: 'var(--ink2)' }}>sobre {nf(a.superficie)} Ha</div>
            </div>
          </div>
        </div>

        {capexDetail.map((g) => (
          <div
            key={g.key}
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 18px',
                background: 'var(--brandL)',
                color: 'var(--brandD)',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{g.title}</div>
              <div style={{ fontFamily: 'var(--num)', fontSize: 13, fontWeight: 700 }}>
                {g.subtotalFmt} · {g.pct}
              </div>
            </div>
            <div
              style={{
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
              <div style={{ textAlign: 'right' }}>Coste unitario</div>
              <div style={{ textAlign: 'center' }}>Unidad</div>
              <div style={{ textAlign: 'right' }}>Total €/Ha</div>
            </div>
            {g.items.map((it) => (
              <div
                key={it.key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2.6fr 1.1fr 0.9fr 1fr',
                  alignItems: 'center',
                  padding: '8px 18px',
                  borderTop: '1px solid var(--line)',
                }}
              >
                <div style={{ fontSize: 13.5 }}>{it.label}</div>
                <div style={{ textAlign: 'right' }}>
                  <NumberField
                    id={'cap:' + g.key + '.' + it.key}
                    value={it.v}
                    width={100}
                    onChangeRaw={(raw) => onCapexField(g.key, it.key, raw)}
                  />
                </div>
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink2)' }}>{g.unitLabel}</div>
                <div style={{ textAlign: 'right', fontFamily: 'var(--num)', fontSize: 14 }}>{it.ha}</div>
              </div>
            ))}
          </div>
        ))}

        <div
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
              display: 'grid',
              gridTemplateColumns: '2.6fr 1.1fr 0.9fr 1fr',
              alignItems: 'center',
              padding: '11px 18px',
              fontWeight: 700,
            }}
          >
            <div style={{ fontSize: 13.5 }}>
              Total CAPEX{' '}
              <span style={{ fontWeight: 500, color: 'var(--ink2)', fontSize: 12 }}>
                (no incluye la capitalización del OPEX)
              </span>
            </div>
            <div />
            <div />
            <div style={{ textAlign: 'right', fontFamily: 'var(--num)', fontSize: 14 }}>
              {nf(r.capexEstab, 0)} €/Ha
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2.6fr 1.1fr 0.9fr 1fr',
              alignItems: 'center',
              padding: '11px 18px',
              borderTop: '1px solid var(--line)',
            }}
          >
            <div style={{ fontSize: 13.5 }}>
              Capitalización OPEX{' '}
              <span style={{ color: 'var(--ink2)', fontSize: 11.5 }}>· OPEX año 1 + año 2</span>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--ink2)' }}>calculado</div>
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink2)' }}>€/Ha</div>
            <div style={{ textAlign: 'right', fontFamily: 'var(--num)', fontSize: 14, color: 'var(--ink2)' }}>
              {nf(r.capexOpex, 0)} €/Ha
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2.6fr 1fr 1fr',
              alignItems: 'center',
              padding: '13px 18px',
              borderTop: '2px solid var(--brand)',
              fontWeight: 800,
            }}
          >
            <div>Total Inversión Inicial (por Ha)</div>
            <div style={{ textAlign: 'right', fontFamily: 'var(--num)' }}>{nf(r.capexHa)} €</div>
            <div style={{ textAlign: 'right', fontFamily: 'var(--num)' }}>{nf(r.totalCapex, 0)} k€ total</div>
          </div>
        </div>
      </div>
    </div>
  );
}
