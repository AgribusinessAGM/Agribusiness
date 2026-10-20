import { html } from '../../lib/html.js';
import { fmt2, nf } from '../../engine/format.js';
import { buildPnlLayers } from '../../engine/pnlLayers.js';
import { discountPct } from '../../engine/compute.js';
import { useApp } from '../../state/store.js';
import { useActiveCompute } from '../../state/useActiveCompute.js';
import { RentTable } from './RentTable.js';

// Informe PDF del modelo activo (diseño "Informe PDF Torrimpietra" de Claude Design,
// estilo institucional). Son páginas A4 que se imprimen con el cuadro de impresión
// del navegador ("Guardar como PDF"); las de rentabilidad van en horizontal.
// Modelo IAG: 7 páginas. Modelo normal: 8 (añade la capa Fondo).

const HEAD_FONT = "Rockwell, 'Rockwell Nova', 'Roboto Slab', serif";
const BODY_FONT = 'Arial, Helvetica, sans-serif';

const C = {
  green: '#1e4423',
  green2: '#2e6b34',
  value: '#385723',
  gold: '#b07d2e',
  text: '#1c261a',
  sub: '#5b6656',
  muted: '#8a9182',
  line: '#dbe1d6',
  line2: '#eef1ec',
};

// Formatos del informe: porcentaje con 1 decimal y contable sin decimales
function pctR(n, d = 1) {
  if (n == null || !isFinite(n)) return '—';
  return nf(n * 100, d) + '%';
}
function acc(n) {
  if (n == null || !isFinite(n)) return '—';
  if (Math.abs(n) < 0.5) return '–';
  const a = nf(Math.abs(n), 0);
  return n < 0 ? '(' + a + ')' : a;
}

// Partidas del SPV que el motor normal deja siempre a cero: si lo son, no se imprimen
// (sin ellas la tabla del SPV cabe en una hoja A4 apaisada).
const OPTIONAL_ROWS = new Set(['Otros', 'Otros gastos operativos', 'Comisión de éxito']);
const allZero = (vals) => vals.every((v) => !v || Math.abs(v) < 0.5);

// Filas de una capa de rentabilidad para RentTable: sin cabeceras ni FCF acumulado,
// la última fila es la final (fondo verde). withPct=false quita las filas de %.
function renRows(layer, withPct) {
  const rows = layer.rows.filter(
    (r) =>
      r.kind !== 'h' &&
      r.label !== 'FCF acumulado' &&
      (withPct || r.kind !== 'p') &&
      !(OPTIONAL_ROWS.has(r.label) && allZero(r.vals)),
  );
  return rows.map((r, i) => ({
    label: r.label,
    kind: i === rows.length - 1 ? 'f' : r.kind,
    cells: r.vals.map((v) => (r.kind === 'p' ? (v == null ? '-' : (v * 100).toFixed(0) + '%') : acc(v))),
  }));
}

function today() {
  const d = new Date();
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
}

function Footer({ page }) {
  return html`
    <div
      style=${{
        marginTop: 'auto',
        padding: '22px 60px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid ' + C.line,
        fontSize: 11,
        textTransform: 'uppercase',
        color: C.muted,
        flex: 'none',
      }}
    >
      <span style=${{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <img src="assets/agromillora-logo.png" alt="Agromillora" style=${{ height: 15, opacity: 0.8 }} /> Agromillora Group
      </span>
      <span>${'Confidencial · Página ' + String(page).padStart(2, '0')}</span>
    </div>
  `;
}

// Cabecera de sección: número, antetítulo, título y entradilla
function SectionHead({ num, kicker, title, intro, titleFont = HEAD_FONT, introSize = 12 }) {
  return html`
    <div style=${{ padding: '56px 60px 0', flex: 'none' }}>
      <div style=${{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 4 }}>
        <span className="num" style=${{ fontFamily: HEAD_FONT, fontSize: 14, fontWeight: 600, color: C.gold }}>${num}</span>
        <span style=${{ fontFamily: HEAD_FONT, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: C.muted }}>${kicker}</span>
      </div>
      <h3 style=${{ fontFamily: titleFont, fontWeight: 700, fontSize: 32, margin: intro ? '0 0 4px' : 0, color: C.text }}>${title}</h3>
      ${intro && html`<p style=${{ margin: 0, fontSize: introSize, color: C.sub }}>${intro}</p>`}
    </div>
  `;
}

function Page({ landscape, children }) {
  return html`
    <section className=${'report-page' + (landscape ? ' landscape' : '')}>
      <div style=${{ width: '100%', height: '100%', background: '#fff', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style=${{ height: 8, background: C.green, flex: 'none' }} />
        ${children}
      </div>
    </section>
  `;
}

function KeyValueList({ title, rows }) {
  return html`
    <div>
      <div
        style=${{
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          color: C.green,
          borderBottom: '2px solid ' + C.green,
          paddingBottom: 8,
          marginBottom: 4,
        }}
      >
        ${title}
      </div>
      ${rows.map(
        (row) => html`
          <div
            key=${row.k}
            style=${{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              padding: '7px 0 7px 0.2cm',
              borderBottom: '1px solid ' + C.line2,
              fontSize: 13,
              color: '#000',
            }}
          >
            <span>${row.k}</span>
            <span className="num" style=${{ fontWeight: 600, color: C.text }}>${row.v}</span>
          </div>
        `,
      )}
    </div>
  `;
}

function LayerBox({ title, sub, tir, accent, tinted }) {
  return html`
    <div
      style=${{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        border: '1px solid ' + (tinted ? '#cddcc8' : C.line),
        borderLeft: '5px solid ' + accent,
        borderRadius: 8,
        background: tinted ? '#eaf1e8' : undefined,
      }}
    >
      <div>
        <div style=${{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 20, color: C.text }}>${title}</div>
        <div style=${{ fontSize: 12.5, color: C.sub, marginTop: 2 }}>${sub}</div>
      </div>
      <div style=${{ textAlign: 'right' }}>
        <div className="num" style=${{ fontSize: 30, fontWeight: 600, color: tinted ? '#8a5a1e' : C.green, lineHeight: 1 }}>${tir}</div>
        <div style=${{ fontSize: 11, textTransform: 'uppercase', color: C.muted }}>TIR</div>
      </div>
    </div>
  `;
}

const Arrow = () => html`<div style=${{ textAlign: 'center', color: '#b9c2b0', fontSize: 16, lineHeight: 0.6 }}>↓</div>`;

export function Report() {
  const { state, closeReport } = useApp();
  const { model, a, r } = useActiveCompute();
  const en = state.lang === 'en';
  const T = (es, enText) => (en ? enText : es);
  const isIAG = a.engine === 'iag';
  const almond = model.crop === 'almendro';
  const sup = +a.superficie || 0;
  const supTxt = nf(sup) + ' Ha';
  const layers = buildPnlLayers(r, a);

  // ---- datos
  const dr = discountPct(a);
  const hasCycle = (a.priceVar || []).some((v) => v);
  const vanHa = isIAG ? r.vanHa : sup > 0 ? (r.van * 1000) / sup : 0;
  const prodPlena = isIAG ? (+a.kgTree || 0) * r.densidad * ((+a.oilYield || 0) / 100) : a.prodPlena;
  const years = T(' años', ' years');
  const kpis = {
    van: nf(r.van) + ' k€',
    tirA: pctR(r.tirA),
    tirL: pctR(r.tirL),
    tirF: pctR(r.tirF),
    payback: r.payback != null ? r.payback + years : '>35' + years,
    inv: nf(r.totalCapex) + ' k€',
    invHa: nf(r.capexHa) + ' €/Ha',
  };
  const finPct = fmt2(a.financiacion) + ' %';
  const premisas = [
    { k: 'Superficie', v: supTxt },
    { k: 'Marco de plantación', v: nf(a.marcoN, 2) + ' × ' + nf(a.marcoM, 2) + ' m' },
    { k: 'Densidad', v: nf(r.densidad) + T(' árb/Ha', ' trees/Ha') },
    { k: 'Árboles totales', v: nf(r.arboles) },
    { k: 'Producción plena', v: nf(prodPlena) + ' kg EVOO/Ha' },
    hasCycle
      ? { k: 'Precio EVOO inicial', v: nf(a.precioEVOO, 2) + T(' €/kg · con ciclo', ' €/kg · with cycle') }
      : { k: 'Precio EVOO', v: nf(a.precioEVOO, 2) + ' €/kg' },
    { k: 'Alquiler', v: nf(a.alquiler) + T(' €/Ha/año', ' €/Ha/year') },
    { k: 'Coste personal', v: nf(a.personal) + T(' €/Ha/año', ' €/Ha/year') },
  ];
  const fin = [
    { k: 'Financiación', v: finPct },
    { k: 'Deuda', v: nf(r.deuda) + ' k€' },
    { k: 'Equity (SPV)', v: nf(r.equity) + ' k€' },
    { k: 'Tipo de interés', v: fmt2(a.interes) + ' %' },
    { k: 'Plazo · carencia', v: a.plazo + ' · ' + a.carencia + years },
    { k: 'Cuota anual', v: nf(r.cuota) + ' k€' },
    { k: 'Inflación', v: fmt2(a.inflacion) + ' %' },
    { k: 'Impuesto de sociedades', v: fmt2(a.is) + ' %' },
  ];
  const grpHa = (g) => g.items.reduce((s, it) => s + (+it.v || 0), 0) * (g.unit === 'ud' ? r.densidad : 1);
  const capexRows = a.capexGroups.map((g) => {
    const ha = grpHa(g);
    return { key: g.key, title: g.title, perHa: nf(ha), pct: pctR(ha / r.capexEstab, 0), total: nf((ha * sup) / 1000) + ' k€' };
  });

  // ---- tablas de rentabilidad
  const projectRows = renRows(layers[0], true);
  const spvRows = renRows(layers[1], false);
  const fundRows = isIAG ? null : renRows(layers[2], false);

  // ---- textos
  const coverTitle = almond
    ? T(['Almendro', 'superintensivo', 'en regadío'], ['Irrigated', 'super-high-density', 'almond orchard'])
    : isIAG
    ? T(['Olivar', 'en seto', 'en regadío'], ['Irrigated', 'hedgerow', 'olive grove'])
    : T(['Olivar', 'superintensivo', 'en regadío'], ['Irrigated', 'super-high-density', 'olive grove']);
  const cropTxt = almond
    ? T('almendro superintensivo en regadío', 'irrigated super-high-density almond orchard')
    : isIAG
    ? T('olivar en seto en regadío', 'irrigated hedgerow olive grove')
    : T('olivar superintensivo en regadío', 'irrigated super-high-density olive grove');
  const intro1 = T('Rentabilidad del proyecto sobre ' + supTxt + ' de ' + cropTxt + '.', 'Project profitability over ' + supTxt + ' of ' + cropTxt + '.');
  const vanSub = nf(vanHa) + ' €/Ha' + T(' · Tasa Dcto. ', ' · Disc. rate ') + fmt2(dr) + '%';
  const op = (orchard) => (isIAG ? ' · Orchard 1' : orchard);

  // Página en la que va cada sección (el modelo normal tiene una más: el Fondo)
  const pFin = isIAG ? 6 : 7;
  const pLegal = isIAG ? 7 : 8;
  const sFin = isIAG ? '05' : '06';
  const sLegal = isIAG ? '06' : '07';

  const kpiCell = (label, value, sub, opts = {}) => html`
    <div
      style=${{
        padding: '22px 24px',
        borderRight: opts.last ? undefined : '1px solid ' + C.line,
        borderBottom: opts.top ? '1px solid ' + C.line : undefined,
      }}
    >
      <div style=${{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#000', marginBottom: 10 }}>${label}</div>
      <div className="num" style=${{ fontSize: opts.big ? 34 : 32, fontWeight: 600, color: C.value, lineHeight: 1 }}>${value}</div>
      <div style=${{ fontSize: 13, color: C.muted, marginTop: 6 }}>${sub}</div>
    </div>
  `;
  const loanCell = (label, value, opts = {}) => html`
    <div
      style=${{
        padding: '16px 20px',
        borderRight: opts.last ? undefined : '1px solid ' + C.line2,
        borderBottom: opts.top ? '1px solid ' + C.line2 : undefined,
      }}
    >
      <div style=${{ fontSize: 11, textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>${label}</div>
      <div className="num" style=${{ fontSize: 20, fontWeight: 600, color: C.text }}>${value}</div>
    </div>
  `;

  return html`
    <div className="report-wrap">
      <div className="report-toolbar no-print">
        <button onClick=${closeReport} className="report-back">‹ Volver</button>
        <div style=${{ flex: 1, minWidth: 0 }}>
          <div style=${{ fontWeight: 800, fontSize: 15 }}>Informe PDF · ${model.name}</div>
          <div style=${{ fontSize: 12, color: 'var(--ink2)' }}>
            En el cuadro de impresión elige «Guardar como PDF». Las páginas de rentabilidad salen en horizontal.
          </div>
        </div>
        <button onClick=${() => window.print()} className="lift report-print">Imprimir / Guardar PDF</button>
      </div>

      <div className="report-pages" style=${{ fontFamily: BODY_FONT }}>
        <!-- 1 · Portada -->
        <section className="report-page">
          <div style=${{ width: '100%', height: '100%', background: '#0f2a17', position: 'relative', overflow: 'hidden', color: '#fff' }}>
            <img src="assets/portada-olivar.png" alt="" style=${{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />
            <div
              style=${{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg,rgba(15,42,23,.55) 0%,rgba(15,42,23,.35) 40%,rgba(15,42,23,.92) 100%)',
              }}
            />
            <div style=${{ position: 'absolute', inset: 0, padding: '64px 64px 56px', display: 'flex', flexDirection: 'column' }}>
              <div>
                <img src="assets/agromillora-logo-white.png" alt="Agromillora" style=${{ height: 46 }} />
              </div>
              <div style=${{ marginTop: 'auto' }}>
                <div style=${{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', color: '#d8b57a', marginBottom: 20 }}>Business Plan</div>
                <h2 data-i18n-skip="1" style=${{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 62, lineHeight: 1.04, margin: '0 0 10px' }}>
                  ${coverTitle[0]}<br />${coverTitle[1]}<br />${coverTitle[2]}
                </h2>
                <div style=${{ width: 64, height: 3, background: C.gold, margin: '26px 0 24px' }} />
                <div style=${{ fontSize: 19, fontWeight: 500, color: 'rgba(255,255,255,.92)' }}>
                  ${T('Proyecto: ', 'Project: ') + model.name}
                </div>
                <div style=${{ fontSize: 15, color: 'rgba(255,255,255,.72)', marginTop: 4 }}>
                  ${(almond ? 'Almendro SHD' : 'Olivo SHD') + ' · ' + model.region}
                </div>
              </div>
              <div
                style=${{
                  marginTop: 44,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid rgba(255,255,255,.22)',
                  paddingTop: 18,
                  fontSize: 12,
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.7)',
                }}
              >
                <span>Modelo financiero agrícola</span>
                <span>${'Confidencial - ' + today()}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 2 · Resumen ejecutivo -->
        <${Page}>
          <${SectionHead} num="01" kicker="Resumen ejecutivo" title="Escenario central" intro=${intro1} />
          <div style=${{ padding: '30px 60px 0', flex: 'none' }}>
            <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', border: '1px solid ' + C.line, borderRadius: 8, overflow: 'hidden' }}>
              ${kpiCell('VAN proyecto', kpis.van, vanSub, { top: true })}
              ${kpiCell('TIR agrícola', kpis.tirA, 'Proyecto desapalancado', { top: true, big: true })}
              ${kpiCell('Payback', kpis.payback, 'Recuperación FCF Acum.', { top: true, last: true })}
              ${kpiCell('TIR SPV', kpis.tirL, 'Apalancada')}
              ${isIAG
                ? kpiCell('Préstamo', nf(r.deuda) + ' k€', finPct + T(' de la inversión', ' of the investment'))
                : kpiCell('TIR fondo', kpis.tirF, 'Vehículo inversor')}
              ${kpiCell('Inversión total', kpis.inv, kpis.invHa, { last: true })}
            </div>
          </div>
          <div style=${{ padding: '30px 60px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 34, flex: 'none' }}>
            <${KeyValueList} title="Premisas agronómicas" rows=${premisas} />
            <${KeyValueList} title="Estructura financiera" rows=${fin} />
          </div>
          <div style=${{ flex: 1, minHeight: 0, padding: '24px 60px' }}>
            <img src="assets/foto-olivar.jpg" alt="" style=${{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75, borderRadius: 4 }} />
          </div>
          <${Footer} page=${2} />
        <//>

        <!-- 3 · CAPEX -->
        <${Page}>
          <${SectionHead}
            num="02"
            kicker="Inversión inicial · CAPEX"
            title="Estructura de la inversión"
            titleFont=${BODY_FONT}
            introSize=${13.5}
            intro=${almond
              ? 'Coste de establecimiento por hectárea y capitalización del OPEX de los dos primeros años.'
              : 'Coste de establecimiento del olivar por hectárea y capitalización del OPEX de los dos primeros años.'}
          />
          <div style=${{ padding: '32px 60px 0', flex: 'none' }}>
            <div
              style=${{
                marginBottom: 26,
                padding: '18px 22px',
                background: '#eaf1e8',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 36,
              }}
            >
              <div>
                <div style=${{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: C.sub, marginBottom: 6 }}>Densidad</div>
                <div className="num" style=${{ fontSize: 20, fontWeight: 600, color: C.green }}>
                  ${nf(r.densidad)}${' '}<span style=${{ fontSize: 12, color: '#7b8473' }}>Árboles</span>
                </div>
              </div>
              <div>
                <div style=${{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: C.sub, marginBottom: 6 }}>Árboles totales</div>
                <div className="num" style=${{ fontSize: 20, fontWeight: 600, color: C.green }}>${nf(r.arboles)}</div>
              </div>
              <div>
                <div style=${{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: C.sub, marginBottom: 6 }}>Marco</div>
                <div className="num" style=${{ fontSize: 20, fontWeight: 600, color: C.green }}>
                  ${nf(a.marcoN, 2)}${' '}<span style=${{ fontSize: 12, color: '#7b8473' }}>m</span>${' × '}${nf(a.marcoM, 2)}${' '}<span
                    style=${{ fontSize: 12, color: '#7b8473' }}
                    >m</span
                  >
                </div>
              </div>
            </div>
            <table style=${{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style=${{ borderBottom: '2px solid ' + C.green }}>
                  ${[
                    ['Partida', 'left', undefined, '10px 0 10px 0.2cm'],
                    ['€/Ha', 'right', 110, '10px 0'],
                    ['%', 'right', 100, '10px 0'],
                    ['Total (k€)', 'right', 110, '10px 0.2cm 10px 0'],
                  ].map(
                    ([label, align, width, padding]) => html`
                      <th
                        key=${label}
                        style=${{ textAlign: align, padding, fontSize: 12, textTransform: 'uppercase', color: C.green, fontWeight: 700, width }}
                      >
                        ${label}
                      </th>
                    `,
                  )}
                </tr>
              </thead>
              <tbody>
                ${capexRows.map(
                  (row) => html`
                    <tr key=${row.key} style=${{ borderBottom: '1px solid ' + C.line2 }}>
                      <td style=${{ padding: '14px 0 14px 0.2cm', fontSize: 13, color: C.text }}>${row.title}</td>
                      <td className="num" style=${{ padding: '14px 0', textAlign: 'right', fontSize: 13, color: C.text }}>${row.perHa}</td>
                      <td className="num" style=${{ padding: '14px 0', textAlign: 'right', fontSize: 13, color: '#000' }}>${row.pct}</td>
                      <td className="num" style=${{ padding: '14px 0.2cm 14px 0', textAlign: 'right', fontSize: 13, fontWeight: 600, color: C.green }}>${row.total}</td>
                    </tr>
                  `,
                )}
                <tr style=${{ borderBottom: '1px solid ' + C.line2 }}>
                  <td style=${{ padding: '14px 0 14px 0.2cm', fontSize: 14, color: C.text }}>
                    Capitalización OPEX${' '}<span style=${{ color: '#000' }}>(años 1–2)</span>
                  </td>
                  <td className="num" style=${{ padding: '14px 0', textAlign: 'right', fontSize: 14, color: C.text }}>${nf(r.capexOpex)}</td>
                  <td className="num" style=${{ padding: '14px 0', textAlign: 'right', fontSize: 12.5, color: '#000' }}>
                    ${pctR(r.capexOpex / r.capexHa, 0)}
                  </td>
                  <td className="num" style=${{ padding: '14px 0.2cm 14px 0', textAlign: 'right', fontSize: 14, fontWeight: 600, color: C.green }}>
                    ${nf((r.capexOpex * sup) / 1000) + ' k€'}
                  </td>
                </tr>
                <tr style=${{ borderTop: '2px solid ' + C.green, background: '#f4f6f2' }}>
                  <td style=${{ padding: '16px 12px 16px 0.2cm', fontWeight: 700, fontSize: 13, color: C.green }}>Inversión total</td>
                  <td className="num" style=${{ padding: '16px 0', textAlign: 'right', fontWeight: 700, fontSize: 13, color: C.green }}>${nf(r.capexHa)}</td>
                  <td></td>
                  <td className="num" style=${{ padding: '16px 0.2cm 16px 0', textAlign: 'right', fontWeight: 700, fontSize: 13, color: C.green }}>
                    ${nf(r.totalCapex) + ' k€'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style=${{ flex: 1, minHeight: 0, padding: '24px 60px' }}>
            <img src="assets/foto-plantacion.jpg" alt="" style=${{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75, borderRadius: 4 }} />
          </div>
          <${Footer} page=${3} />
        <//>

        <!-- 4 · Rentabilidad del proyecto (horizontal) -->
        <${Page} landscape>
          <${SectionHead}
            num="03"
            kicker=${'Rentabilidad' + op(' · Proyecto')}
            title=${isIAG ? 'Standalone returns — Orchard 1 (EBITDA → FCF)' : 'Cuenta de resultados y FCF — proyecto agrícola'}
            intro=${T('Explotación del olivar sin apalancar · TIR agrícola ', 'Unlevered olive grove operation · agricultural IRR ') + kpis.tirA}
          />
          <${RentTable} rows=${projectRows} />
          <${Footer} page=${4} />
        <//>

        <!-- 5 · Rentabilidad del SPV (horizontal) -->
        <${Page} landscape>
          <${SectionHead}
            num="04"
            kicker=${isIAG ? 'Rentabilidad · SPV — Orchard 1' : 'Rentabilidad · SPV'}
            title=${isIAG ? T('SPV — deuda, fees y auditoría sobre ', 'SPV — debt, fees and audit over ') + supTxt : 'Cuenta de resultados y FCF — vehículo SPV'}
            intro=${T('Vehículo con deuda, fees y auditoría · TIR SPV ', 'Vehicle with debt, fees and audit · SPV IRR ') + kpis.tirL}
          />
          <${RentTable} rows=${spvRows} />
          <${Footer} page=${5} />
        <//>

        ${!isIAG &&
        html`
          <!-- 6 · Rentabilidad del Fondo (horizontal) -->
          <${Page} landscape>
            <${SectionHead}
              num="05"
              kicker="Rentabilidad · Fondo"
              title="Flujo del fondo al inversor"
              intro=${T('Equity del inversor ', 'Investor equity ') + nf(r.fondoEquity) + ' k€' + T(' · TIR fondo ', ' · Fund IRR ') + kpis.tirF}
            />
            <${RentTable} rows=${fundRows} />
            <div style=${{ padding: '0 60px 14px', flex: 'none', display: 'flex', gap: 12 }}>
              <div style=${{ flex: 1, padding: '16px 20px', border: '1px solid ' + C.line, borderLeft: '4px solid ' + C.green, borderRadius: 4 }}>
                <div style=${{ fontSize: 10, textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>TIR agrícola</div>
                <div className="num" style=${{ fontSize: 26, fontWeight: 700, color: C.green, lineHeight: 1 }}>${kpis.tirA}</div>
              </div>
              <div style=${{ flex: 1, padding: '16px 20px', border: '1px solid ' + C.line, borderLeft: '4px solid ' + C.green2, borderRadius: 4 }}>
                <div style=${{ fontSize: 10, textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>TIR SPV</div>
                <div className="num" style=${{ fontSize: 26, fontWeight: 700, color: C.green2, lineHeight: 1 }}>${kpis.tirL}</div>
              </div>
              <div style=${{ flex: 1, padding: '16px 20px', background: C.green, borderRadius: 4 }}>
                <div style=${{ fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,.65)', marginBottom: 6 }}>TIR fondo</div>
                <div className="num" style=${{ fontSize: 26, fontWeight: 700, color: '#e2b877', lineHeight: 1 }}>${kpis.tirF}</div>
              </div>
            </div>
            <${Footer} page=${6} />
          <//>
        `}

        <!-- Estructura financiera -->
        <${Page}>
          <${SectionHead}
            num=${sFin}
            kicker="Estructura financiera"
            title=${isIAG ? 'Del cultivo al SPV' : 'Del cultivo al fondo'}
            titleFont=${BODY_FONT}
            introSize=${13.5}
            intro=${isIAG
              ? 'Rentabilidad del proyecto agrícola y del SPV del Orchard 1, y condiciones del préstamo.'
              : 'Rentabilidad en las tres capas del vehículo de inversión y condiciones del préstamo.'}
          />
          <div style=${{ padding: '32px 60px 0', flex: 1 }}>
            <div style=${{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <${LayerBox} title="Proyecto agrícola" sub="Explotación del olivar · sin apalancar" tir=${kpis.tirA} accent=${C.green2} />
              <${Arrow} />
              <${LayerBox}
                title="SPV"
                sub=${isIAG ? 'Vehículo con deuda, fees de gestión y auditoría' : 'Vehículo con deuda y fees de gestión'}
                tir=${kpis.tirL}
                accent=${C.green}
              />
              ${!isIAG &&
              html`
                <${Arrow} />
                <${LayerBox}
                  title="Fondo"
                  sub=${T('Equity del inversor · ', 'Investor equity · ') + nf(r.fondoEquity) + ' k€'}
                  tir=${kpis.tirF}
                  accent=${C.gold}
                  tinted
                />
              `}
            </div>
            <div
              style=${{
                marginTop: 30,
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                color: C.green,
                borderBottom: '2px solid ' + C.green,
                paddingBottom: 8,
              }}
            >
              Préstamo y condiciones
            </div>
            <div
              style=${{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                border: '1px solid ' + C.line,
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                overflow: 'hidden',
              }}
            >
              ${loanCell(T('Deuda (', 'Debt (') + finPct + ')', nf(r.deuda) + ' k€', { top: true })}
              ${loanCell('Equity SPV', nf(r.equity) + ' k€', { top: true })}
              ${loanCell('Tipo de interés', fmt2(a.interes) + ' %', { top: true, last: true })}
              ${loanCell('Plazo · carencia', a.plazo + years + ' · ' + a.carencia + years)}
              ${loanCell('Cuota anual', nf(r.cuota) + ' k€')}
              ${loanCell('Intereses totales', nf(r.totalIntereses) + ' k€', { last: true })}
            </div>
            <div style=${{ marginTop: 18, display: 'flex', gap: 36, fontSize: 12.5, color: C.sub }}>
              <span>Fee CAPEX · <strong className="num" style=${{ color: C.text }}>${nf(a.capexFee) + ' €/Ha'}</strong></span>
              <span>Fee OPEX · <strong className="num" style=${{ color: C.text }}>${nf(a.opexFee) + ' €/Ha'}</strong></span>
            </div>
          </div>
          <${Footer} page=${pFin} />
        <//>

        <!-- Aviso legal -->
        <${Page}>
          <${SectionHead} num=${sLegal} kicker="Aviso legal" title="Confidencialidad y limitación de responsabilidad" titleFont=${BODY_FONT} />
          <div style=${{ padding: '30px 60px 0', flex: 1, fontSize: 12, lineHeight: 1.7, color: C.sub, textAlign: 'justify' }}>
            <p style=${{ margin: '0 0 14px' }}>
              La presente presentación (en adelante, la «Presentación») ha sido elaborada a partir de fuentes oficiales, información y datos de publicaciones especializadas del sector agrícola, así como de información elaborada por el equipo de Agromillora Catalana, S.A.U. (en adelante, «Agromillora»), con fines exclusivamente informativos para el desarrollo de proyectos agrícolas. Agromillora no ha verificado la veracidad, suficiencia o exactitud de la información publicada por fuentes oficiales y, por tanto, no asume responsabilidad alguna derivada de su uso.
            </p>
            <p style=${{ margin: '0 0 14px' }}>
              Esta Presentación no pretende ser exhaustiva ni contener necesariamente toda la información que el destinatario pudiera desear. Se trata de una presentación de carácter general que no ha sido preparada específicamente para el destinatario en función de sus necesidades. Al facilitar esta Presentación, ni Agromillora ni sus representantes asumen obligación alguna de proporcionar información adicional ni de corregir eventuales inexactitudes.
            </p>
            <p style=${{ margin: '0 0 14px' }}>
              Todas las estimaciones sobre productividad agrícola tienen carácter meramente informativo, ya que pueden variar en función de la región, el entorno, las variaciones climáticas, las prácticas del productor o las condiciones de gestión, entre otros factores. Del mismo modo, los datos, opiniones y estimaciones se ofrecen a la fecha actual y pueden variar con el tiempo, sin que Agromillora quede obligada a comunicar tales cambios.
            </p>
            <p style=${{ margin: '0 0 14px' }}>
              Toda la información financiera contenida no ha sido sometida a auditoría, salvo indicación en contrario. Ni esta Presentación ni los escenarios financieros incluidos constituyen garantía alguna ni análisis del riesgo implícito, evaluación crediticia o asesoramiento de inversión. No se pretende predecir los resultados reales ni se ofrece garantía al respecto.
            </p>
            <p style=${{ margin: '0 0 14px' }}>
              Ni Agromillora ni sus filiales o representantes asumirán responsabilidad, directa o indirecta, frente a los destinatarios como consecuencia de esta Presentación, de su contenido o de cualquier decisión que el destinatario adopte sobre la base de la misma.
            </p>
            <p style=${{ margin: 0 }}>
              Esta Presentación contiene información confidencial propiedad de Agromillora cuya divulgación podría perjudicarla; queda prohibida su difusión o distribución salvo autorización expresa y por escrito de Agromillora.
            </p>
          </div>
          <${Footer} page=${pLegal} />
        <//>
      </div>
    </div>
  `;
}
