import { HZ, type ComputeResult } from '../../engine/compute';
import { k, nf } from '../../engine/format';

export function FinancieraTab({ r }: { r: ComputeResult }) {
  const amortRows: { year: number; cuota: string; interes: string; principal: string; saldo: string }[] = [];
  let saldoA = r.deuda;
  for (let y = 1; y <= HZ; y++) {
    saldoA -= r.principal[y];
    amortRows.push({
      year: y,
      cuota: nf(r.interest[y] + r.principal[y]),
      interes: nf(r.interest[y]),
      principal: nf(r.principal[y]),
      saldo: nf(Math.max(0, saldoA)),
    });
  }

  const depRows: { year: number; dep: string; acum: string; pend: string }[] = [];
  let acumD = 0;
  for (let y = 1; y <= HZ; y++) {
    acumD += r.amort[y];
    depRows.push({
      year: y,
      dep: nf(r.amort[y]),
      acum: nf(acumD),
      pend: nf(Math.max(0, r.totalCapex - acumD)),
    });
  }

  const thStyle = {
    textAlign: 'right' as const,
    padding: '8px 14px',
    color: 'var(--ink2)',
    fontSize: 11,
    position: 'sticky' as const,
    top: 0,
    background: 'var(--brandL)',
  };
  const thLeft = { ...thStyle, textAlign: 'left' as const };
  const td = { padding: '7px 14px', fontFamily: 'var(--num)' };
  const tdR = { ...td, textAlign: 'right' as const };

  return (
    <div style={{ maxWidth: 1080 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>Estructura financiera</h2>
      <p style={{ color: 'var(--ink2)', fontSize: 14, margin: '0 0 20px' }}>
        Préstamo francés sobre la deuda, con años de carencia. Ajusta financiación e interés en
        Supuestos.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 22 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '14px 16px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 11, color: 'var(--ink2)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>Deuda</div>
          <div style={{ fontFamily: 'var(--num)', fontSize: 22, fontWeight: 600 }}>{k(r.deuda)}</div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '14px 16px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 11, color: 'var(--ink2)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>Equity</div>
          <div style={{ fontFamily: 'var(--num)', fontSize: 22, fontWeight: 600 }}>{k(r.equity)}</div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '14px 16px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 11, color: 'var(--ink2)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>Cuota anual</div>
          <div style={{ fontFamily: 'var(--num)', fontSize: 22, fontWeight: 600 }}>{k(r.cuota)}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid var(--line)' }}>
            <span>Cuadro de amortización · 35 años</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink2)' }}>Total intereses {k(r.totalIntereses)}</span>
          </div>
          <div style={{ maxHeight: 520, overflow: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={thLeft}>Año</th>
                  <th style={thStyle}>Cuota</th>
                  <th style={thStyle}>Interés</th>
                  <th style={thStyle}>Amort.</th>
                  <th style={thStyle}>Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {amortRows.map((row) => (
                  <tr key={row.year} style={{ borderTop: '1px solid var(--line)' }}>
                    <td style={td}>{row.year}</td>
                    <td style={tdR}>{row.cuota}</td>
                    <td style={tdR}>{row.interes}</td>
                    <td style={tdR}>{row.principal}</td>
                    <td style={tdR}>{row.saldo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid var(--line)' }}>
            <span>Cuadro de depreciación · 35 años</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink2)' }}>Base {k(r.totalCapex)}</span>
          </div>
          <div style={{ maxHeight: 520, overflow: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={thLeft}>Año</th>
                  <th style={thStyle}>Depreciación</th>
                  <th style={thStyle}>Acumulada</th>
                  <th style={thStyle}>Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {depRows.map((row) => (
                  <tr key={row.year} style={{ borderTop: '1px solid var(--line)' }}>
                    <td style={td}>{row.year}</td>
                    <td style={tdR}>{row.dep}</td>
                    <td style={tdR}>{row.acum}</td>
                    <td style={tdR}>{row.pend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
