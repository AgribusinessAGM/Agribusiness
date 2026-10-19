import { html } from '../../lib/html.js';
import { k, nf } from '../../engine/format.js';

export function FinancieraTab({ r }) {
  const horizon = r.interest.length - 1;
  const amortRows = [];
  let saldoA = r.deuda;
  for (let y = 1; y <= horizon; y++) {
    saldoA -= r.principal[y];
    amortRows.push({
      year: y,
      cuota: nf(r.interest[y] + r.principal[y]),
      interes: nf(r.interest[y]),
      principal: nf(r.principal[y]),
      saldo: nf(Math.max(0, saldoA)),
    });
  }

  const depRows = [];
  let acumD = 0;
  for (let y = 1; y <= horizon; y++) {
    acumD += r.amort[y];
    depRows.push({
      year: y,
      dep: nf(r.amort[y]),
      acum: nf(acumD),
      pend: nf(Math.max(0, r.totalCapex - acumD)),
    });
  }

  const thStyle = {
    textAlign: 'right',
    padding: '8px 14px',
    color: 'var(--ink2)',
    fontSize: 11,
    position: 'sticky',
    top: 0,
    background: 'var(--brandL)',
  };
  const thLeft = { ...thStyle, textAlign: 'left' };
  const td = { padding: '7px 14px', fontFamily: 'var(--num)' };
  const tdR = { ...td, textAlign: 'right' };

  const kpiCard = { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '14px 16px', boxShadow: 'var(--shadow)' };
  const kpiLabel = { fontSize: 11, color: 'var(--ink2)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 };
  const kpiValue = { fontFamily: 'var(--num)', fontSize: 22, fontWeight: 600 };
  const tableCard = { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden' };
  const tableHead = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid var(--line)' };

  return html`
    <div style=${{ maxWidth: 1080 }}>
      <h2 style=${{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>Estructura financiera</h2>
      <p style=${{ color: 'var(--ink2)', fontSize: 14, margin: '0 0 20px' }}>
        Préstamo francés sobre la deuda, con años de carencia. Ajusta financiación e interés en Supuestos.
      </p>
      <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 22 }}>
        <div style=${kpiCard}>
          <div style=${kpiLabel}>Deuda</div>
          <div style=${kpiValue}>${k(r.deuda)}</div>
        </div>
        <div style=${kpiCard}>
          <div style=${kpiLabel}>Equity</div>
          <div style=${kpiValue}>${k(r.equity)}</div>
        </div>
        <div style=${kpiCard}>
          <div style=${kpiLabel}>Cuota anual</div>
          <div style=${kpiValue}>${k(r.cuota)}</div>
        </div>
      </div>
      <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div style=${tableCard}>
          <div style=${tableHead}>
            <span>Cuadro de amortización · ${horizon} años</span>
            <span style=${{ fontSize: 11, fontWeight: 500, color: 'var(--ink2)' }}>Total intereses ${k(r.totalIntereses)}</span>
          </div>
          <div style=${{ maxHeight: 520, overflow: 'auto' }}>
            <table style=${{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style=${thLeft}>Año</th>
                  <th style=${thStyle}>Cuota</th>
                  <th style=${thStyle}>Interés</th>
                  <th style=${thStyle}>Amort.</th>
                  <th style=${thStyle}>Pendiente</th>
                </tr>
              </thead>
              <tbody>
                ${amortRows.map(
                  (row) => html`
                    <tr key=${row.year} style=${{ borderTop: '1px solid var(--line)' }}>
                      <td style=${td}>${row.year}</td>
                      <td style=${tdR}>${row.cuota}</td>
                      <td style=${tdR}>${row.interes}</td>
                      <td style=${tdR}>${row.principal}</td>
                      <td style=${tdR}>${row.saldo}</td>
                    </tr>
                  `,
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div style=${tableCard}>
          <div style=${tableHead}>
            <span>Cuadro de depreciación · ${horizon} años</span>
            <span style=${{ fontSize: 11, fontWeight: 500, color: 'var(--ink2)' }}>Base ${k(r.totalCapex)}</span>
          </div>
          <div style=${{ maxHeight: 520, overflow: 'auto' }}>
            <table style=${{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style=${thLeft}>Año</th>
                  <th style=${thStyle}>Depreciación</th>
                  <th style=${thStyle}>Acumulada</th>
                  <th style=${thStyle}>Pendiente</th>
                </tr>
              </thead>
              <tbody>
                ${depRows.map(
                  (row) => html`
                    <tr key=${row.year} style=${{ borderTop: '1px solid var(--line)' }}>
                      <td style=${td}>${row.year}</td>
                      <td style=${tdR}>${row.dep}</td>
                      <td style=${tdR}>${row.acum}</td>
                      <td style=${tdR}>${row.pend}</td>
                    </tr>
                  `,
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}
