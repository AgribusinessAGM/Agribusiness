import { useEffect, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { html } from '../../lib/html.js';
import { fmt2, nf } from '../../engine/format.js';
import { buildPnlLayers } from '../../engine/pnlLayers.js';
import { MP, capexItemHa, discountPct, kgOlivesHa, opexItemYear, opexItemYearInfl } from '../../engine/compute.js';
import { useApp } from '../../state/store.js';
import { useActiveCompute } from '../../state/useActiveCompute.js';
import { RentTable } from './RentTable.js';
import { translateNow } from '../../i18n/translate.js';

// Informe PDF del modelo activo (diseño "Informe PDF Torrimpietra" de Claude Design,
// estilo institucional). Se ve en la pestaña Informe del editor. Son páginas A4 que
// se imprimen con el cuadro de impresión del navegador (impresora o "Guardar como
// PDF"); las de rentabilidad van en horizontal.
// Modelo IAG: 6 páginas. Modelo normal: 7 (añade la capa Fondo). Con la hoja
// "Estructura financiera" (SHOW_FIN), una más.

// Mostrar la hoja "Estructura financiera" (oculta de momento)
const SHOW_FIN = false;

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
  const pctTxt = (v) => (v == null ? '-' : (v * 100).toFixed(0) + '%');
  return rows.map((r, i) => {
    let vals = r.vals.map((v) => (r.kind === 'p' ? pctTxt(v) : acc(v)));
    // tablas de 35 años: los 11 últimos (25–35) van en una sola columna con su suma
    // (en las filas de % , el % del tramo = suma del numerador / suma de ingresos)
    if (r.vals.length === 35) {
      const sum = (arr) => arr.slice(GROUP_FROM - 1).reduce((s, v) => s + (+v || 0), 0);
      const g =
        r.kind === 'p'
          ? pctTxt(r.den && sum(r.den) > 0 ? sum(r.num) / sum(r.den) : null)
          : acc(sum(r.vals));
      vals = [...vals.slice(0, GROUP_FROM - 1), g];
    }
    return { label: r.label, kind: i === rows.length - 1 ? 'f' : r.kind, cells: vals, grouped: r.vals.length === 35 };
  });
}
// primer año del tramo final agrupado en las tablas de 35 años
const GROUP_FROM = 25;
const GROUP_HEADS = [...Array.from({ length: GROUP_FROM - 1 }, (_, i) => String(i + 1)), 'Σ ' + GROUP_FROM + '–35'];
const headsOf = (rows) => (rows && rows[0] && rows[0].grouped ? GROUP_HEADS : undefined);

function today() {
  const d = new Date();
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
}

// Iconos de línea (20 px, verde corporativo) de los cuadros de KPI del resumen
const KPI_ICON_PATHS = {
  // VAN: monedas apiladas
  van: ['M12 4c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3z', 'M4 7v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7', 'M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5'],
  // TIR agrícola: tendencia al alza
  tir: ['M3 17l6-6 4 4 8-8', 'M15 7h6v6'],
  // Payback: reloj con flecha de vuelta
  payback: ['M3 12a9 9 0 1 0 3-6.7', 'M3 4v4h4', 'M12 8v4l3 2'],
  // TIR SPV: barras
  spv: ['M4 20h16', 'M7 16v-5', 'M12 16V7', 'M17 16v-8'],
  // Préstamo: banco
  loan: ['M3 9l9-5 9 5', 'M5 9v9', 'M10 9v9', 'M14 9v9', 'M19 9v9', 'M3 20h18'],
  // TIR fondo: maletín
  fund: ['M4 8h16v11H4z', 'M9 8V5h6v3', 'M4 13h16'],
  // Inversión total: brote
  inv: ['M12 20v-8', 'M12 12c0-4 3-7 7-7 0 4-3 7-7 7z', 'M12 14c0-3-2.5-5.5-6-5.5 0 3 2.5 5.5 6 5.5z', 'M7 20h10'],
};
function KpiIcon(name) {
  const paths = KPI_ICON_PATHS[name];
  if (!paths) return null;
  return html`
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke=${C.value} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style=${{ flex: 'none' }}>
      ${paths.map((d) => html`<path d=${d} />`)}
    </svg>
  `;
}

function Footer({ page }) {
  return html`
    <div
      style=${{
        marginTop: 'auto',
        padding: '15px 60px',
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
        <img src="assets/agromillora-logo.png" alt="Agromillora" style=${{ height: 29, opacity: 0.8 }} /> Agromillora Group
      </span>
      <span>${'Confidencial · Página ' + String(page).padStart(2, '0')}</span>
    </div>
  `;
}

// Tabla de la hoja CAPEX (partidas del CAPEX y bloques del OPEX): €/Ha, % y total
function SummaryTable({ first, rows, totalRow }) {
  const pad = (side) => (side === 'l' ? '5.5px 0 5.5px 0.2cm' : side === 'r' ? '5.5px 0.2cm 5.5px 0' : '5.5px 0');
  return html`
    <table style=${{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style=${{ borderBottom: '2px solid ' + C.green }}>
          ${[
            [first, 'left', undefined, '6.5px 0 6.5px 0.2cm'],
            ['€/Ha', 'right', 110, '6.5px 0'],
            ['%', 'right', 100, '6.5px 0'],
            ['Total (k€)', 'right', 110, '6.5px 0.2cm 6.5px 0'],
          ].map(
            ([label, align, width, padding]) => html`
              <th key=${label} style=${{ textAlign: align, padding, fontSize: 13, textTransform: 'uppercase', color: C.green, fontWeight: 700, width }}>
                ${label}
              </th>
            `,
          )}
        </tr>
      </thead>
      <tbody>
        ${rows.map(
          (row) => html`
            <tr key=${row.key} style=${{ borderBottom: '1px solid ' + C.line2 }}>
              <td style=${{ padding: pad('l'), fontSize: 13, color: C.text }}>${row.title}</td>
              <td className="num" style=${{ padding: pad(), textAlign: 'right', fontSize: 13, color: C.text }}>${row.perHa}</td>
              <td className="num" style=${{ padding: pad(), textAlign: 'right', fontSize: 13, color: '#000' }}>${row.pct}</td>
              <td className="num" style=${{ padding: pad('r'), textAlign: 'right', fontSize: 13, fontWeight: 600, color: C.green }}>${row.total}</td>
            </tr>
          `,
        )}
        <tr style=${{ borderTop: '2px solid ' + C.green, background: '#f4f6f2' }}>
          <td style=${{ padding: '7.5px 12px 7.5px 0.2cm', fontWeight: 700, fontSize: 13, color: C.green }}>${totalRow.title}</td>
          <td className="num" style=${{ padding: '7.5px 0', textAlign: 'right', fontWeight: 700, fontSize: 13, color: C.green }}>${totalRow.perHa}</td>
          <td></td>
          <td className="num" style=${{ padding: '7.5px 0.2cm 7.5px 0', textAlign: 'right', fontWeight: 700, fontSize: 13, color: C.green }}>${totalRow.total}</td>
        </tr>
      </tbody>
    </table>
  `;
}

// Cabecera de sección: número, antetítulo, título y entradilla (igual en todas las hojas)
function SectionHead({ num, kicker, title, intro }) {
  return html`
    <div style=${{ padding: '51px 60px 0', flex: 'none' }}>
      <div style=${{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 4 }}>
        <span className="num" style=${{ fontFamily: HEAD_FONT, fontSize: 14, fontWeight: 600, color: C.gold }}>${num}</span>
        <span style=${{ fontFamily: HEAD_FONT, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: C.muted }}>${kicker}</span>
      </div>
      <h3 style=${{ fontFamily: HEAD_FONT, fontWeight: 700, fontSize: 32, margin: intro ? '0 0 4px' : 0, color: C.text }}>${title}</h3>
      ${intro && html`<p style=${{ margin: 0, fontSize: 14, color: C.sub }}>${intro}</p>`}
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

export function Report({ title }) {
  const { state } = useApp();
  // Al imprimir (botón Imprimir o Ctrl+P) se monta una copia de las páginas
  // directamente en <body> y la CSS de impresión oculta el resto de la app, que
  // si no recortaría las páginas dentro del editor.
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    const before = () => {
      flushSync(() => setPrinting(true));
      const portal = document.querySelector('.print-portal');
      if (portal) translateNow(portal);
    };
    const after = () => setPrinting(false);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);
  // En pantalla las páginas se reducen para caber en el ancho de la pestaña
  // (la horizontal, 297 mm ≈ 1123 px, es la más ancha). Al imprimir van a tamaño real.
  const viewRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const fit = () => setZoom(Math.min(1, (el.clientWidth - 32) / 1123));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
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
  const prodPlena = isIAG ? kgOlivesHa(a, MP) * ((+a.oilYield || 0) / 100) : a.prodPlena;
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
    { k: 'Marco de plantación', v: nf(a.marcoN, 2) + ' m × ' + nf(a.marcoM, 2) + ' m' },
    { k: 'Densidad', v: nf(r.densidad) + T(' Árboles/Ha', ' Trees/Ha') },
    { k: 'Árboles totales', v: nf(r.arboles) },
    { k: 'Producción plena', v: nf(prodPlena) + T(' kg AOVE/Ha', ' kg EVOO/Ha') },
    hasCycle
      ? { k: 'Precio AOVE inicial', v: nf(a.precioEVOO, 2) + ' €/Kg' }
      : { k: 'Precio AOVE', v: nf(a.precioEVOO, 2) + ' €/Kg' },
    { k: 'Alquiler', v: nf(a.alquiler) + T(' €/Ha/Año', ' €/Ha/Year') },
    { k: 'Coste personal', v: nf(a.personal) + T(' €/Ha/Año', ' €/Ha/Year') },
  ];
  const fin = [
    { k: 'Financiación', v: finPct },
    { k: 'Tipo de interés', v: fmt2(a.interes) + ' %' },
    { k: 'Deuda', v: nf(r.deuda) + ' k€' },
    { k: 'Equity (SPV)', v: nf(r.equity) + ' k€' },
    { k: 'Cuota anual', v: nf(r.cuota) + ' k€' },
    { k: 'Plazo · carencia', v: a.plazo + ' · ' + a.carencia + years },
    { k: 'Impuesto de Sociedades', v: fmt2(a.is) + ' %' },
    { k: 'Inflación', v: fmt2(a.inflacion) + ' %' },
  ];
  const grpHa = (g) => g.items.reduce((s, it) => s + capexItemHa(it, g, r.densidad, sup), 0);
  // Resumen del OPEX en plena producción por bloque (sin la fila "Otros"); el % es sobre el OPEX total
  // La poda y formación va en su propio bloque "OPEX en Formación" (años 1–2), no aquí;
  // el total de plena producción sigue siendo el OPEX completo del año de referencia
  const PRUNE_KEYS = ['poda', 'pruning'];
  const opexBlocks = a.opexItems
    .filter((cat) => cat.key !== 'otros' && cat.key !== 'other' && !PRUNE_KEYS.includes(cat.key))
    .map((cat) => ({ key: cat.key, title: cat.label, ha: cat.items.reduce((s, it) => s + opexItemYear(it, MP, a), 0) }))
    .sort((x, y) => y.ha - x.ha); // de mayor a menor peso
  const opexBlocksHa = r.opexHa; // el total incluye "Otros", aunque no se muestre como bloque
  // OPEX en formación: media de los años 1 y 2 (con inflación; la mitad de lo que se
  // capitaliza en el CAPEX), por categoría y de mayor a menor
  const formBlocks = a.opexItems
    .map((cat) => ({
      key: cat.key,
      title: cat.label,
      ha: [1, 2].reduce((s, y) => s + cat.items.reduce((t, it) => t + opexItemYearInfl(it, y, a), 0), 0) / 2, // media de los años 1 y 2
    }))
    .filter((b) => b.ha > 0)
    .sort((x, y) => y.ha - x.ha);
  const formHa = formBlocks.reduce((s, b) => s + b.ha, 0);
  // Partidas del CAPEX de mayor a menor peso (la capitalización del OPEX va siempre al final)
  // El bloque de plantación se parte en "Plantas" (planta + royalties) y "Plantación" (el resto)
  const PLANT_KEYS = ['olive', 'smarttree', 'royalties'];
  // espaldera / tutor (+ protector): fila propia "Sistema de guiado y soporte"
  const GUIDE_KEYS = ['trellis', 'stake', 'tutor'];
  // nombre de la fila según el sistema de plantación con importe (mismos nombres que en el CAPEX)
  // nombre de la fila de guiado con la modalidad elegida (la que tiene importe)
  const guideSys = (g) => {
    const val = (k) => +(g.items.find((it) => it.key === k) || {}).v || 0;
    return val('trellis') > 0
      ? 'Sistema de guiado y soporte (Espaldera + Protector)'
      : val('stake') > 0 || val('tutor') > 0
        ? 'Sistema de guiado y soporte (Tutor + Protector)'
        : 'Sistema de guiado y soporte';
  };
  const plantSys = (g) => {
    const val = (k) => +(g.items.find((it) => it.key === k) || {}).v || 0;
    return val('mechanical') > 0 ? 'Plantación Mecanizada' : val('manual') > 0 ? 'Plantación Manual' : 'Plantación';
  };
  const capexBlocks = a.capexGroups.flatMap((g) =>
    g.key !== 'plant'
      ? [g]
      : [
          { ...g, key: 'plantas', title: 'Plantas', items: g.items.filter((it) => PLANT_KEYS.includes(it.key)) },
          { ...g, key: 'guiado', title: guideSys(g), items: g.items.filter((it) => GUIDE_KEYS.includes(it.key)) },
          { ...g, key: 'plantacion', title: plantSys(g), items: g.items.filter((it) => !PLANT_KEYS.includes(it.key) && !GUIDE_KEYS.includes(it.key)) },
        ],
  );
  const capexRows = capexBlocks
    .map((g) => ({ g, ha: grpHa(g) }))
    .sort((x, y) => y.ha - x.ha)
    .map(({ g, ha }) => ({ key: g.key, title: g.title, perHa: nf(ha), pct: pctR(ha / r.capexEstab, 0), total: nf((ha * sup) / 1000) + ' k€' }));

  // ---- tablas de rentabilidad
  // Columna de etiquetas de las hojas 4 y 5 ajustada a la etiqueta más larga de cada idioma:
  // deja unos 5 px hasta las cifras del año 1
  const labW45 = T(94.1, 90);
  const projectRows = renRows(layers[0], true).map((row) =>
    row.label === 'Beneficio Neto de Explotación' || row.label === 'Beneficio neto'
      ? { ...row, label: T('Beneficio Neto', 'Net income') }
      : row.label === 'Impuesto de Sociedades'
      ? { ...row, label: T('Imp. Sociedades', 'Corp. Income Tax') }
      : row,
  );
  // La fila del IS va abreviada para que quepa en la columna de etiquetas y,
  // en esta hoja, las etiquetas van sin el prefijo "(=) "
  const spvRows = renRows(layers[1], false).map((row) =>
    row.label === 'IS (Impuesto de Sociedades)'
      ? { ...row, label: T('Imp. Sociedades', 'Corp. Income Tax') }
      : { ...row, label: row.label.replace(/^\(=\) /, '') },
  );
  const fundRows = isIAG ? null : renRows(layers[2], false);

  // ---- textos
  // Título de portada en una sola línea
  const coverTitle = almond ? T('Almendro SHD con regadío', 'Irrigated SHD almonds') : T('Olivar en seto con regadío', 'Irrigated SHD olives');
  const cropTxt = almond
    ? T('almendro superintensivo en regadío', 'irrigated super-high-density almond orchard')
    : isIAG
    ? T('olivar en seto en regadío', 'irrigated hedgerow olive grove')
    : T('olivar superintensivo en regadío', 'irrigated super-high-density olive grove');
  const intro1 = T('Rentabilidad del proyecto sobre ' + supTxt + ' de ' + cropTxt + '.', 'Project profitability over ' + supTxt + ' of ' + cropTxt + '.');
  const vanSub = nf(vanHa) + ' €/Ha' + T(' · Tasa Dcto. ', ' · Disc. rate ') + fmt2(dr) + '%';

  // Página en la que va cada sección (el modelo normal tiene una más: el Fondo)
  // La hoja "Estructura financiera" está oculta por decisión de Marc (2026-10-20);
  // para recuperarla basta con poner SHOW_FIN a true.
  const pFin = isIAG ? 6 : 7;
  // Las hojas de rentabilidad (proyecto y SPV) forman un solo bloque, el 03
  const sFin = isIAG ? '04' : '05';
  const pLegal = SHOW_FIN ? pFin + 1 : pFin;
  const sLegal = SHOW_FIN ? (isIAG ? '05' : '06') : sFin;

  // cuadro flotante de KPI: sin borde, sombra abajo a la izquierda e icono de su categoría
  const kpiCell = (label, value, sub, opts = {}) => html`
    <div
      style=${{
        padding: '20px 22px',
        background: '#fff',
        borderRadius: 10,
        boxShadow: '-4px 6px 14px rgba(15, 42, 23, 0.14)',
      }}
    >
      <div style=${{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: C.value, marginBottom: 10 }}>
        ${KpiIcon(opts.icon)}${label}
      </div>
      <div className="num" style=${{ fontSize: 28, fontWeight: 600, color: '#000', lineHeight: 1 }}>${value}</div>
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

  const pages = html`
      <div className="report-pages" style=${{ fontFamily: BODY_FONT }}>
        <!-- 1 · Portada -->
        <section className="report-page">
          <div style=${{ width: '100%', height: '100%', background: '#0f2a17', position: 'relative', overflow: 'hidden', color: '#fff' }}>
            <img src="assets/portada-olivar.webp" alt="" style=${{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />
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
                <h2
                  data-i18n-skip="1"
                  style=${{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 52, lineHeight: 1.04, margin: '0 0 10px', whiteSpace: 'nowrap' }}
                >
                  ${coverTitle}
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
          <div style=${{ padding: '20px 60px 0', flex: 'none' }}>
            <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              ${kpiCell('TIR agrícola', kpis.tirA, 'Proyecto sin apalancar', { icon: 'tir' })}
              ${kpiCell('TIR SPV', kpis.tirL, 'Apalancada', { icon: 'spv' })}
              ${kpiCell('Payback', kpis.payback, 'Recuperación FCF Acum.', { icon: 'payback' })}
              ${kpiCell('VAN proyecto', kpis.van, vanSub, { icon: 'van' })}
              ${kpiCell('Inversión total', kpis.inv, kpis.invHa, { icon: 'inv' })}
              ${isIAG
                ? kpiCell('Préstamo', nf(r.deuda) + ' k€', finPct + T(' de la inversión', ' of the investment'), { icon: 'loan' })
                : kpiCell('TIR fondo', kpis.tirF, 'Vehículo inversor', { icon: 'fund' })}
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
            intro=${almond
              ? 'Coste de establecimiento por hectárea y capitalización del OPEX de los dos primeros años.'
              : 'Coste de establecimiento del olivar por hectárea y capitalización del OPEX de los dos primeros años.'}
          />
          <div style=${{ padding: '20px 60px 0', flex: 'none' }}>
            <div
              style=${{
                marginBottom: 15,
                padding: '13px 22px',
                background: '#eaf1e8',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 36,
              }}
            >
              <div>
                <div style=${{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: C.sub, marginBottom: 6 }}>Superficie</div>
                <div className="num" style=${{ fontSize: 20, fontWeight: 600, color: C.green }}>
                  ${nf(sup)}${' '}<span style=${{ fontSize: 12, color: '#7b8473' }}>Ha</span>
                </div>
              </div>
              <div>
                <div style=${{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: C.sub, marginBottom: 6 }}>Marco de plantación</div>
                <div className="num" style=${{ fontSize: 20, fontWeight: 600, color: C.green }}>
                  ${nf(a.marcoN, 2)}${' '}<span style=${{ fontSize: 12, color: '#7b8473' }}>m</span>${' × '}${nf(a.marcoM, 2)}${' '}<span
                    style=${{ fontSize: 12, color: '#7b8473' }}
                    >m</span
                  >
                </div>
              </div>
              <div>
                <div style=${{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: C.sub, marginBottom: 6 }}>Densidad</div>
                <div className="num" style=${{ fontSize: 20, fontWeight: 600, color: C.green }}>
                  ${nf(r.densidad)}${' '}<span style=${{ fontSize: 12, color: '#7b8473' }}>Árboles/Ha</span>
                </div>
              </div>
              <div>
                <div style=${{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: C.sub, marginBottom: 6 }}>Nº árboles</div>
                <div className="num" style=${{ fontSize: 20, fontWeight: 600, color: C.green }}>${nf(r.arboles)}</div>
              </div>
            </div>
            <${SummaryTable}
              first="CAPEX · Inversión inicial"
              rows=${[
                ...capexRows.map((row) => ({ key: row.key, title: row.title, perHa: row.perHa, pct: row.pct, total: row.total })),
                {
                  key: 'capOpex',
                  title: html`Capitalización OPEX${' '}<span style=${{ color: '#000' }}>(años 1–2)</span>`,
                  perHa: nf(r.capexOpex),
                  pct: pctR(r.capexOpex / r.capexHa, 0),
                  total: nf((r.capexOpex * sup) / 1000) + ' k€',
                },
              ]}
              totalRow=${{ title: 'Inversión total', perHa: nf(r.capexHa), total: nf(r.totalCapex) + ' k€' }}
            />
            <div style=${{ height: 8 }} />
            <${SummaryTable}
              first="OPEX en Formación*"
              rows=${formBlocks.map((b) => ({
                key: b.key,
                title: b.title,
                perHa: nf(b.ha),
                pct: pctR(formHa ? b.ha / formHa : NaN, 0),
                total: nf((b.ha * sup) / 1000) + ' k€',
              }))}
              totalRow=${{ title: 'OPEX en formación', perHa: nf(formHa), total: nf((formHa * sup) / 1000) + ' k€' }}
            />
            <div style=${{ fontSize: 10, color: C.muted, padding: '4px 0 0 0.2cm' }}>* Media del OPEX de los años 1 y 2.</div>
            <div style=${{ height: 8 }} />
            <${SummaryTable}
              first="OPEX en Plena producción"
              rows=${opexBlocks.map((b) => ({
                key: b.key,
                title: b.title,
                perHa: nf(b.ha),
                pct: pctR(opexBlocksHa ? b.ha / opexBlocksHa : NaN, 0),
                total: nf((b.ha * sup) / 1000) + ' k€',
              }))}
              totalRow=${{ title: 'OPEX total', perHa: nf(opexBlocksHa), total: nf((opexBlocksHa * sup) / 1000) + ' k€' }}
            />
          </div>
          <${Footer} page=${3} />
        <//>

        <!-- 4 · Rentabilidad del proyecto (horizontal) -->
        <${Page} landscape>
          <${SectionHead}
            num="03"
            kicker=${T('Rentabilidad · Modelo financiero', 'Profitability · Financial Model')}
            title=${isIAG ? T('Modelo Financiero Agrícola', 'Agricultural Financial Model') : 'Cuenta de resultados y FCF — proyecto agrícola'}
            intro=${T('Explotación del olivar sin apalancar · TIR agrícola ', 'Unlevered olive grove operation · agricultural IRR ') + kpis.tirA}
          />
          <${RentTable} rows=${projectRows} heads=${headsOf(projectRows)} pad=${38} labW=${labW45} />
          <${Footer} page=${4} />
        <//>

        <!-- 5 · Rentabilidad del SPV (horizontal) -->
        <${Page} landscape>
          <${SectionHead}
            num="03"
            kicker=${T('Rentabilidad · Modelo financiero', 'Profitability · Financial Model')}
            title=${isIAG ? T('Modelo Financiero SPV', 'SPV Financial Model') : 'Cuenta de resultados y FCF — vehículo SPV'}
            intro=${T('Vehículo con deuda, fees y auditoría · TIR SPV ', 'Vehicle with debt, fees and audit · SPV IRR ') + kpis.tirL}
          />
          <!-- filas algo más bajas: el hueco entre la tabla y el pie es igual al que hay entre la entradilla y la tabla -->
          <${RentTable} rows=${spvRows} heads=${headsOf(spvRows)} pad=${38} vAdj=${-0.56} labW=${labW45} />
          <${Footer} page=${5} />
        <//>

        ${!isIAG &&
        html`
          <!-- 6 · Rentabilidad del Fondo (horizontal) -->
          <${Page} landscape>
            <${SectionHead}
              num="04"
              kicker="Rentabilidad · Fondo"
              title="Flujo del fondo al inversor"
              intro=${T('Equity del inversor ', 'Investor equity ') + nf(r.fondoEquity) + ' k€' + T(' · TIR fondo ', ' · Fund IRR ') + kpis.tirF}
            />
            <${RentTable} rows=${fundRows} heads=${headsOf(fundRows)} pad=${38} labW=${labW45} />
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

        <!-- Estructura financiera (oculta si SHOW_FIN es false) -->
        ${SHOW_FIN &&
        html`<${Page}>
          <${SectionHead}
            num=${sFin}
            kicker="Estructura financiera"
            title=${isIAG ? 'Del cultivo al SPV' : 'Del cultivo al fondo'}
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
        <//>`}

        <!-- Aviso legal -->
        <${Page}>
          <${SectionHead} num=${sLegal} kicker="Aviso legal" title="Confidencialidad y limitación de responsabilidad" />
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
  `;

  return html`
    <div className="report-wrap" ref=${viewRef}>
      <div className="report-toolbar">
        <div style=${{ flex: 1, minWidth: 0 }}>
          <div style=${{ fontWeight: 800, fontSize: 18 }}>${title}</div>
          <div style=${{ fontSize: 12, color: 'var(--ink2)' }}>
            Informe PDF con los resultados del modelo. Las páginas de rentabilidad salen en horizontal.
          </div>
        </div>
        <button onClick=${() => window.print()} className="lift report-print">Imprimir</button>
      </div>
      <div style=${{ zoom }}>${pages}</div>
      ${printing && createPortal(html`<div className="print-portal">${pages}</div>`, document.body)}
    </div>
  `;
}
