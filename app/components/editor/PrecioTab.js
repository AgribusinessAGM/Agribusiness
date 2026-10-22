import { useEffect, useRef, useState } from 'react';
import { html } from '../../lib/html.js';
import { nf } from '../../engine/format.js';
import { chartColors as c } from '../charts/theme.js';
import { NumberField } from '../NumberField.js';
import { useApp } from '../../state/store.js';

const UP = '#2e8b4a';
const DOWN = '#c0392b';

// Precio año a año con su media y, debajo, la variación % de cada año (tipo volumen de bolsa).
function PriceChart({ price, priceVar, side }) {
  const p = price.slice(1);
  const N = p.length;
  const W = 1000;
  // números del eje pegados al margen izquierdo de la tarjeta (mismo que el título)
  const pl = 30;
  const pr = 16;
  const avg = p.reduce((x, v) => x + v, 0) / N;
  const sx = (i) => pl + i * ((W - pl - pr) / (N - 1));

  // Alto del gráfico de precio dinámico: ocupa lo que queda de ventana para que la pestaña
  // llegue justo al borde inferior sin barra de desplazamiento (mínimo 200 px de alto)
  const svgRef = useRef(null);
  const barsRef = useRef(null);
  const [H, setH] = useState(200);
  useEffect(() => {
    const fit = () => {
      const el = svgRef.current;
      const bars = barsRef.current;
      if (!el || !bars) return;
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      // debajo del gráfico: barras + su margen (4) + relleno de la tarjeta (5) + borde (1) + relleno de la página (26)
      const below = bars.getBoundingClientRect().height + 4 + 5 + 1 + 26;
      const px = window.innerHeight - (r.top + window.scrollY) - below;
      // mínimo de 200 px de alto: en ventanas bajas se acepta algo de scroll antes que un gráfico ilegible
      const next = Math.round((Math.max(200, px) / r.width) * 1000);
      setH((h) => (Math.abs(h - next) > 1 ? next : h));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(document.documentElement);
    window.addEventListener('resize', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, []);
  const pt = 8;
  const pb = 5;
  // eje desde 0 con marcas cada 1
  const STEP = 1;
  const mn = 0;
  const mx = Math.ceil((Math.max(...p, avg) * 1.02) / STEP) * STEP;
  const sy = (v) => H - pb - ((v - mn) / (mx - mn || 1)) * (H - pb - pt);
  const grid = Array.from({ length: Math.round(mx / STEP) + 1 }, (_, k) => k * STEP);

  const H2 = 55;
  const pt2 = 6;
  const pb2 = 16;
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
    <div style=${{ display: 'grid', gridTemplateColumns: side ? 'minmax(0,1fr) 150px' : 'minmax(0,1fr)', columnGap: 16 }}>
      <svg ref=${svgRef} viewBox=${`0 0 ${W} ${H}`} width="100%" style=${svgStyle}>
        ${grid.map(
          (v, k) => html`
            <g key=${k}>
              <line x1=${pl} y1=${sy(v)} x2=${W - pr} y2=${sy(v)} stroke=${c.line} strokeDasharray=${k ? '2 3' : undefined} />
              <text x=${0} y=${sy(v) + 3} fill=${c.ink2} fontSize=${8} textAnchor="start" fontFamily=${c.num}>${nf(v, 0)}</text>
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
      ${side &&
      html`<div style=${{ position: 'relative' }}>
        <!-- de la línea superior del eje (y = pt) al eje 0 (y = H − pb), en % del alto del gráfico -->
        <div style=${{ position: 'absolute', left: 0, right: 0, top: (pt / H) * 100 + '%', bottom: (pb / H) * 100 + '%' }}>${side}</div>
      </div>`}
      <svg ref=${barsRef} viewBox=${`0 0 ${W} ${H2}`} width="100%" style=${{ ...svgStyle, marginTop: 4, gridColumn: 1 }}>
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
            <text key=${i} x=${sx(i)} y=${H2 - 5} fill=${c.ink2} fontSize=${8} textAnchor="middle" fontFamily=${c.num}>${i + 1}</text>
          `,
        )}
      </svg>
    </div>
  `;
}

// Precio máximo, mínimo y medio de los años del proyecto (con el año en que se da)
function priceKpis(price) {
  const p = price.slice(1);
  const iMax = p.indexOf(Math.max(...p));
  const iMin = p.indexOf(Math.min(...p));
  const flat = p[iMax] - p[iMin] < 0.005;
  return [
    { label: 'Precio medio', v: p.reduce((s, v) => s + v, 0) / p.length, sub: '' },
    // precio plano: máximo y mínimo no caen en un año concreto
    { label: 'Precio máximo', v: p[iMax], sub: flat ? '—' : 'Año ' + (iMax + 1) },
    { label: 'Precio mínimo', v: p[iMin], sub: flat ? '—' : 'Año ' + (iMin + 1) },
  ];
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
      <h2 style=${{ fontSize: 18, fontWeight: 800, fontFamily: "Rockwell, 'Rockwell Nova', 'Roboto Slab', serif", margin: '0 0 6px' }}>${title}</h2>
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
                <td style=${stickyLabel('var(--brandL)', 800)}>Precio €/Kg AOVE</td>
                ${years.map(
                  (y) => html`
                    <td
                      key=${y.i}
                      style=${{
                        textAlign: 'right',
                        padding: '8px 6px',
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
      <div style=${{ ...card, padding: '18px 18px 5px', marginTop: 18 }}>
        <div style=${{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Ciclo de precios</div>
        <div style=${{ fontSize: 12, color: 'var(--ink2)', marginBottom: 3 }}>
          <span style=${{ color: c.brand, fontWeight: 700 }}>■</span> Precio €/Kg${'  '}
          <span style=${{ color: UP, fontWeight: 700 }}>■</span> % Var. (+)${'  '}
          <span style=${{ color: DOWN, fontWeight: 700 }}>■</span> % Var. (-)
        </div>
        <${PriceChart}
          price=${r.price}
          priceVar=${priceVar}
          side=${html`
          <!-- KPIs del precio: entre la línea superior del eje (máximo) y el eje 0 del gráfico -->
          <div style=${{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
            ${priceKpis(r.price).map(
              (k) => html`
                <div
                  key=${k.label}
                  style=${{
                    flex: 1,
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius)',
                    padding: '0 10px',
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    // el alto lo marca el gráfico: la letra se reduce con el alto del recuadro (cqh)
                    containerType: 'size',
                  }}
                >
                  <div style=${{ fontSize: 'clamp(9px, 26cqh, 10px)', lineHeight: 1.2, color: 'var(--ink2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>
                    ${k.label}
                  </div>
                  <div style=${{ fontSize: 'clamp(12px, 44cqh, 17px)', fontWeight: 800, color: 'var(--brandD)', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                    ${nf(k.v, 2)} €/Kg
                  </div>
                  ${k.sub &&
                  html`<div style=${{ fontSize: 'clamp(9px, 26cqh, 10px)', lineHeight: 1.2, color: 'var(--ink2)', fontWeight: 600, whiteSpace: 'nowrap' }}>${k.sub}</div>`}
                </div>
              `,
            )}
          </div>
          `}
        />
      </div>
    </div>
  `;
}
