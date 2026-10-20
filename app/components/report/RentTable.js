import { html } from '../../lib/html.js';

// Tabla de rentabilidad del informe PDF (componente RentTable del diseño, variante
// "institucional", sin cabecera ni columna Σ). rows: [{ label, kind, cells: [texto] }]
// con kind 'n' normal, 's' subtotal, 'p' porcentaje, 'f' fila final. Con más de 25
// años se compacta (letra más pequeña, filas algo más altas) para que quepa en A4.
const T = {
  rowBorder: '1px solid #f0f2ee',
  subBg: '#f4f6f2',
  subBorder: '1px solid #e4e9df',
  subText: '#1e4423',
  finalBg: '#1e4423',
  text: '#1c261a',
  sub: '#5b6656',
  muted: '#8a9182',
  green: '#1e4423',
};

function rowStyles(kind, wide, vAdj) {
  // [padding vertical, tamaño etiqueta, tamaño número] según el tipo de fila
  const v = { f: 7, p: 3, s: 5, n: 4 }[kind] + (wide ? 2.5 : 0) + vAdj;
  const numFs = wide ? 6.6 : kind === 'p' ? 8 : 8.5;
  const lblFs = kind === 'p' ? 9.5 : wide ? 9 : kind === 'f' ? 10.5 : 10;
  const numPadH = wide ? 0 : 1;
  const base = { lbl: { textAlign: 'left', padding: `${v}px 8px`, fontSize: lblFs, whiteSpace: 'nowrap' }, num: { textAlign: 'right', padding: `${v}px ${numPadH}px`, fontSize: numFs } };
  if (kind === 'f')
    return {
      tr: { background: T.finalBg, color: '#fff' },
      lbl: { ...base.lbl, fontWeight: 800 },
      num: { ...base.num, fontWeight: 700 },
    };
  if (kind === 'p')
    return {
      tr: { borderBottom: T.rowBorder },
      lbl: { ...base.lbl, fontStyle: 'italic', color: T.subText },
      num: { ...base.num, fontStyle: 'italic', color: T.subText },
    };
  if (kind === 's')
    return {
      tr: { background: T.subBg, borderTop: '1.5px solid ' + T.green, borderBottom: T.subBorder },
      lbl: { ...base.lbl, fontWeight: 800, color: T.subText },
      num: { ...base.num, fontWeight: 700, color: T.text },
    };
  return {
    tr: { borderBottom: T.rowBorder },
    lbl: { ...base.lbl, color: T.sub },
    num: { ...base.num, color: T.muted },
  };
}

// vAdj: px que se suman (o restan) al relleno vertical de cada fila del cuerpo
export function RentTable({ rows, pad = 60, vAdj = 0 }) {
  const n = rows[0]?.cells.length || 25;
  const wide = n > 25;
  const labW = wide ? 115 : 172;
  const thV = wide ? 5 : 7;
  const years = Array.from({ length: n }, (_, i) => i + 1);
  return html`
    <div style=${{ padding: `10px calc(${pad}px + 0.1cm) 0 ${pad}px`, flex: 1, minHeight: 0 }}>
      <table style=${{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr style=${{ borderBottom: '2px solid #1e4423' }}>
            <th
              style=${{
                textAlign: 'left',
                width: labW,
                padding: `${thV}px 8px`,
                fontSize: 10,
                textTransform: 'uppercase',
                color: '#8a9182',
                fontWeight: 800,
              }}
            >
              Concepto · k€
            </th>
            ${years.map(
              (y) => html`
                <th
                  key=${y}
                  className="num"
                  style=${{ textAlign: 'right', padding: `${thV}px 0`, fontSize: wide ? 6.6 : 8, color: '#8a9182', fontWeight: 700 }}
                >
                  ${y}
                </th>
              `,
            )}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row, ri) => {
            const st = rowStyles(row.kind, wide, vAdj);
            return html`
              <tr key=${ri} style=${st.tr}>
                <td style=${st.lbl}>${row.label}</td>
                ${row.cells.map((t, ci) => html`<td key=${ci} className="num" style=${st.num}>${t}</td>`)}
              </tr>
            `;
          })}
        </tbody>
      </table>
    </div>
  `;
}
