import { html } from '../../lib/html.js';
import { k, nf, nfAcc } from '../../engine/format.js';

// Impuesto de sociedades del SPV visto como activo por impuesto diferido
// ('E. Financial' filas 10-14 del Excel IAG; en el resto de modelos es el mismo
// arrastre de pérdidas que ya calculaba el motor).
function DeferredTaxTable({ r }) {
  const horizon = r.isDev.length - 1;
  const years = Array.from({ length: horizon }, (_, i) => i + 1);
  const rows = [
    { label: 'IS - Impuesto diferido', head: true },
    { label: 'Impuesto devengado', arr: r.isDev },
    { label: 'Valor del activo por impuesto diferido (AID)', arr: r.aidVal },
    { label: 'AID aplicado', arr: r.aidApl },
    { label: 'Restante', arr: r.aidRest },
    { label: 'IS a pagar', arr: r.isPay, strong: true },
  ];
  const labelTd = (strong, head) => ({
    textAlign: 'left',
    padding: '8px 14px',
    position: 'sticky',
    left: 0,
    background: strong || head ? 'var(--brandL)' : 'var(--surface)',
    fontWeight: head || strong ? 800 : 500,
    borderTop: strong || head ? undefined : '1px solid var(--line)',
    whiteSpace: 'nowrap',
  });
  const numTd = (strong, head) => ({
    textAlign: 'right',
    padding: '8px 12px',
    fontFamily: 'var(--num)',
    whiteSpace: 'nowrap',
    borderTop: strong ? undefined : '1px solid var(--line)',
    fontWeight: strong ? 700 : undefined,
    ...(head ? { padding: 0 } : {}),
  });
  return html`
    <div
      style=${{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        overflow: 'hidden',
        marginBottom: 22,
      }}
    >
      <div
        style=${{
          padding: '11px 16px',
          background: 'var(--brandL)',
          color: 'var(--brandD)',
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
        }}
      >
        <span style=${{ fontWeight: 800, fontSize: 14 }}>IS - Impuesto diferido</span>
        <span style=${{ fontSize: 12, opacity: 0.75 }}>SPV · k€ · pérdidas compensadas con el IS futuro</span>
      </div>
      <div style=${{ overflow: 'auto' }}>
        <table style=${{ borderCollapse: 'collapse', width: '100%', minWidth: 840, fontSize: 13 }}>
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
              ${years.map(
                (y) => html`
                  <th
                    key=${y}
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
                    ${'Año ' + y}
                  </th>
                `,
              )}
            </tr>
          </thead>
          <tbody>
            ${rows.map(
              (row) => html`
                <tr key=${row.label} style=${{ background: row.strong || row.head ? 'var(--brandL)' : undefined }}>
                  <td style=${labelTd(row.strong, row.head)}>${row.label}</td>
                  ${years.map(
                    (y) => html`<td key=${y} style=${numTd(row.strong, row.head)}>${row.head ? '' : nfAcc(row.arr[y])}</td>`,
                  )}
                </tr>
              `,
            )}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function FinancieraTab({ a, r }) {
  const isIAG = a.engine === 'iag';
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
      pend: nf(Math.max(0, (r.depBase || r.totalCapex) - acumD)),
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
      <!-- mismo ancho que las columnas de la pestaña OPEX (3 de 4, sin la foto) -->
      <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <div style=${{ gridColumn: '1 / 4', minWidth: 0 }}>
          <${DeferredTaxTable} r=${r} />
        </div>
      </div>
      <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div style=${tableCard}>
          <div style=${tableHead}>
            <span>${`Cuadro de amortización · ${horizon} años`}</span>
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
            <span>${isIAG ? 'Amortización · olivo 10 % · riego 5 % · OPEX cap. 10 %' : `Cuadro de depreciación · ${horizon} años`}</span>
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
