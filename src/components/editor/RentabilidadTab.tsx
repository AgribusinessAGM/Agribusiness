import type { ComputeResult } from '../../engine/compute';
import { buildPnlHeader, buildPnlLayers } from '../../engine/pnlLayers';

export function RentabilidadTab({ r }: { r: ComputeResult }) {
  const pnlHeader = buildPnlHeader();
  const pnlLayers = buildPnlLayers(r);

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>3 · Rentabilidad — por capas</h2>
      <p style={{ color: 'var(--ink2)', fontSize: 14, margin: '0 0 18px' }}>
        Misma estructura que el Excel: proyecto agrícola, SPV y Fondo, cada uno con su TIR. Cifras
        en k€ · 35 años (horizonte completo del modelo).
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {pnlLayers.map((L) => (
          <div
            key={L.title}
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
                gap: 12,
                padding: '11px 16px',
                background: 'var(--brandL)',
                color: 'var(--brandD)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontWeight: 800, fontSize: 14 }}>{L.title}</span>
                <span style={{ fontSize: 12, opacity: 0.75 }}>{L.sub}</span>
              </div>
              <div
                style={{
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
                {L.tirLabel} <span style={{ fontFamily: 'var(--num)', fontSize: 14 }}>{L.tir}</span>
              </div>
            </div>
            <div style={{ overflow: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 840, fontSize: 13 }}>
                <thead>
                  <tr>
                    <th
                      style={{
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
                    {pnlHeader.map((h) => (
                      <th
                        key={h.label}
                        style={{
                          textAlign: 'right',
                          padding: '9px 12px',
                          color: 'var(--ink2)',
                          fontFamily: 'var(--num)',
                          fontSize: 11,
                          whiteSpace: 'nowrap',
                          borderBottom: '1px solid var(--line)',
                        }}
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {L.rows.map((row, ri) => (
                    <tr key={ri} style={{ background: row.rowBg }}>
                      <td style={row.labelStyle}>{row.label}</td>
                      {row.cells.map((c, ci) => (
                        <td key={ci} style={c.style}>
                          {c.v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
