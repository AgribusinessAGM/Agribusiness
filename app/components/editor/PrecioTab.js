import { html } from '../../lib/html.js';
import { nf } from '../../engine/format.js';
import { chartColors as c } from '../charts/theme.js';
import { NumberField } from '../NumberField.js';
import { useApp } from '../../state/store.js';

const UP = '#2e8b4a';
const DOWN = '#c0392b';

// Precio año a año con su media y, debajo, la variación % de cada año (tipo volumen de bolsa).
function PriceChart({ price, priceVar }) {
  const p = price.slice(1);
  const N = p.length;
  const W = 1000;
  const pl = 44;
  const pr = 16;
  const avg = p.reduce((x, v) => x + v, 0) / N;
  const sx = (i) => pl + i * ((W - pl - pr) / (N - 1));

  // alturas reducidas para que la pestaña quepa en una pantalla sin desplazarse
  const H = 125;
  const pt = 16;
  const pb = 10;
  const mn = Math.min(...p, avg) * 0.9;
  const mx = Math.max(...p, avg) * 1.05;
  const sy = (v) => H - pb - ((v - mn) / (mx - mn || 1)) * (H - pb - pt);
  const grid = [0, 1, 2, 3, 4].map((k) => mn + ((mx - mn) * k) / 4);

  const H2 = 55;
  const pt2 = 6;
  const pb2 = 22;
  const mid = (H2 - pb2 + pt2) / 2;
  const vmax = Math.max(0.05, ...Array.from(priceVar, (x) => Math.abs(x || 0)));
  const half = (H2 - pb2 - pt2) / 2;
  const bw = (W - pl - pr) / N;
  const bars = [];
  for (let i = 1; i < N; i++) {
    const v = priceVar[i] || 0;
    const hh = Math.max((Math.abs(v) / vmax) * half, 0.5);
    bars.push({ i, v, hh });
  }
  const svgStyle = { maxWidth: '100%', display: 'block' };

  return html`
    <div>
      <svg viewBox=${`0 0 ${W} ${H}`} width="100%" style=${svgStyle}>
        ${grid.map(
          (v, k) => html`
            <g key=${k}>
              <line x1=${pl} y1=${sy(v)} x2=${W - pr} y2=${sy(v)} stroke=${c.line} strokeDasharray=${k ? '2 3' : undefined} />
              <text x=${pl - 6} y=${sy(v) + 3} fill=${c.ink2} fontSize=${8} textAnchor="end" fontFamily=${c.num}>${nf(v, 2)}</text>
            </g>
          `,
        )}
        <line x1=${pl} y1=${sy(avg)} x2=${W - pr} y2=${sy(avg)} stroke=${c.accent} strokeWidth=${1.5} strokeDasharray="6 4" />
        <!-- etiqueta de la media, 5 px por encima de su línea (se mueve con ella) -->
        <text x=${pl + 4} y=${sy(avg) - 5} fill=${c.accent} fontSize=${8} fontWeight=${700} textAnchor="start">Precio Medio</text>
        <polyline
          points=${p.map((v, i) => sx(i) + ',' + sy(v)).join(' ')}
          fill="none"
          stroke=${c.brand}
          strokeWidth=${2.5}
          strokeLinejoin="round"
        />
      </svg>
      <svg viewBox=${`0 0 ${W} ${H2}`} width="100%" style=${{ ...svgStyle, marginTop: 4 }}>
        <line x1=${pl} y1=${mid} x2=${W - pr} y2=${mid} stroke=${c.line} />
        ${bars.map(
          (b) => html`
            <rect
              key=${b.i}
              x=${sx(b.i) - bw * 0.32}
              y=${b.v >= 0 ? mid - b.hh : mid}
              width=${bw * 0.64}
              height=${b.hh}
              fill=${b.v >= 0 ? UP : DOWN}
              rx=${1}
            />
          `,
        )}
        ${p.map(
          (_, i) => html`
            <text key=${i} x=${sx(i)} y=${H2 - 6} fill=${c.ink2} fontSize=${9} textAnchor="middle" fontFamily=${c.num}>${i + 1}</text>
          `,
        )}
      </svg>
    </div>
  `;
}

export function PrecioTab({ a, r, title }) {
  const { onPriceVar, resetPriceVar, canEdit } = useApp();
  const priceVar = a.priceVar || [];
  const years = r.price.slice(1).map((price, i) => ({ i, price }));

  const card = {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    overflow: 'hidden',
  };
  const pill = {
    boxSizing: 'border-box',
    height: 28,
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 12,
    padding: '0 12px',
    borderRadius: 999,
    fontWeight: 700,
  };
  const stickyLabel = (bg, weight) => ({
    textAlign: 'left',
    padding: '8px 14px',
    position: 'sticky',
    left: 0,
    background: bg,
    fontWeight: weight,
    whiteSpace: 'nowrap',
    zIndex: 1,
  });

  return html`
    <div>
      <h2 style=${{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>${title}</h2>
      <p style=${{ color: 'var(--ink2)', fontSize: 14, margin: '0 0 18px' }}>
        ${'Ciclo de precios del AOVE: precio inicial en supuestos y variación anual editable aquí. Alimenta los ingresos desde el año 1 hasta el ' +
        years.length +
        '.'}
      </p>
      <div style=${card}>
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
          <span style=${{ fontWeight: 800, fontSize: 14 }}>Ciclo de precios</span>
          ${canEdit &&
          html`
            <span style=${{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style=${{ ...pill, background: 'var(--editable)', color: 'var(--brandD)', border: '1px solid var(--editableLine)' }}>
                Var. % editable
              </span>
              <button
                onClick=${resetPriceVar}
                style=${{
                  ...pill,
                  fontFamily: 'inherit',
                  color: 'var(--brandD)',
                  background: 'var(--surface)',
                  border: '1px solid var(--brandD)',
                  cursor: 'pointer',
                }}
              >
                Restablecer
              </button>
            </span>
          `}
        </div>
        <div style=${{ overflow: 'auto' }}>
          <table style=${{ borderCollapse: 'collapse', minWidth: 900, fontSize: 13 }}>
            <thead>
              <tr>
                <th
                  style=${{
                    ...stickyLabel('var(--surface)', 600),
                    padding: '9px 14px',
                    color: 'var(--ink2)',
                    fontSize: 11,
                    borderBottom: '1px solid var(--line)',
                  }}
                />
                ${years.map(
                  (y) => html`
                    <th
                      key=${y.i}
                      style=${{
                        textAlign: 'right',
                        padding: '9px 6px',
                        color: 'var(--ink2)',
                        fontFamily: 'var(--num)',
                        fontSize: 11,
                        whiteSpace: 'nowrap',
                        borderBottom: '1px solid var(--line)',
                      }}
                    >
                      ${'Año ' + (y.i + 1)}
                    </th>
                  `,
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style=${stickyLabel('var(--brandL)', 800)}>Precio €/Kg EVOO</td>
                ${years.map(
                  (y) => html`
                    <td
                      key=${y.i}
                      style=${{
                        textAlign: 'right',
                        padding: '8px 6px',
                        fontFamily: 'var(--num)',
                        fontWeight: 700,
                        background: 'var(--brandL)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ${nf(y.price, 2)}
                    </td>
                  `,
                )}
              </tr>
              <tr>
                <td style=${stickyLabel('var(--surface)', 500)}>Var. % vs. año anterior</td>
                ${years.map(
                  (y) => html`
                    <td key=${y.i} style=${{ padding: '5px 4px', textAlign: 'right' }}>
                      ${y.i === 0
                        ? html`<span style=${{ display: 'inline-block', width: 58, textAlign: 'right', color: 'var(--ink2)', paddingRight: 6 }}>—</span>`
                        : html`
                            <${NumberField}
                              id=${'pv:' + y.i}
                              value=${(priceVar[y.i] || 0) * 100}
                              width=${58}
                              style=${{ fontSize: 12.5, padding: '5px 6px' }}
                              onChangeRaw=${(raw) => onPriceVar(y.i, raw)}
                            />
                          `}
                    </td>
                  `,
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div style=${{ ...card, padding: 18, marginTop: 18 }}>
        <div style=${{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Ciclo de precios</div>
        <div style=${{ fontSize: 12, color: 'var(--ink2)', marginBottom: 12 }}>
          <span style=${{ color: c.brand, fontWeight: 700 }}>■</span> Precio €/Kg${'  '}
          <span style=${{ color: UP, fontWeight: 700 }}>■</span> % Var. (+)${'  '}
          <span style=${{ color: DOWN, fontWeight: 700 }}>■</span> % Var. (-)
        </div>
        <${PriceChart} price=${r.price} priceVar=${priceVar} />
      </div>
    </div>
  `;
}
