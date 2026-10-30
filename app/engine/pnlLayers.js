import { nfAcc, pct } from './format.js';

// Arma las capas de P&L a partir del resultado de compute(): Proyecto agrícola ·
// SPV · Fondo (modelo normal) o Orchard 1 · SPV (modelo IAG). Cada capa tiene
// título, TIR y filas con sus celdas ya formateadas y con su estilo. Cada fila
// guarda también su tipo (kind: 'n' normal, 's' subtotal, 'p' porcentaje,
// 'h' cabecera) y sus valores (vals, años 1..n) para el informe PDF.

function cellStyle(strong) {
  return {
    textAlign: 'right',
    padding: '8px 12px',
    fontFamily: 'var(--num)',
    whiteSpace: 'nowrap',
    borderTop: strong ? undefined : '1px solid var(--line)',
    fontWeight: strong ? 700 : undefined,
  };
}

function labelStyleFor(strong) {
  return {
    textAlign: 'left',
    padding: '8px 14px',
    position: 'sticky',
    left: 0,
    background: strong ? 'var(--brandL)' : 'var(--surface)',
    fontWeight: strong ? 800 : 500,
    borderTop: strong ? undefined : '1px solid var(--line)',
    whiteSpace: 'nowrap',
  };
}

function negArr(arr) {
  return arr.map((v) => (v == null || isNaN(v) || v === 0 ? v : -Math.abs(v)));
}

const pctLabelStyle = {
  textAlign: 'left',
  padding: '4px 14px',
  position: 'sticky',
  left: 0,
  background: 'var(--surface)',
  fontWeight: 600,
  fontStyle: 'italic',
  color: '#1E4423',
  whiteSpace: 'nowrap',
  fontSize: 12,
};

export function buildPnlHeader(nc) {
  const header = [];
  for (let y = 1; y <= nc; y++) header.push({ label: 'Año ' + y });
  return header;
}

export function buildPnlLayers(r, a) {
  const nc = r.ingresos.length - 1;

  function mkRow(label, arr, opts) {
    const cells = [];
    const vals = [];
    for (let y = 1; y <= nc; y++) {
      const v = arr[y];
      vals.push(v);
      cells.push({ v: v == null || isNaN(v) ? '—' : nfAcc(v), style: cellStyle(opts?.strong) });
    }
    return {
      label,
      kind: opts?.strong ? 's' : 'n',
      vals,
      cells,
      rowBg: opts?.strong ? 'var(--brandL)' : undefined,
      labelStyle: labelStyleFor(opts?.strong),
    };
  }

  function mkPct(label, numArr, ingresos) {
    const cells = [];
    const vals = [];
    for (let y = 1; y <= nc; y++) {
      const rev = ingresos[y];
      const v = rev > 0 && numArr[y] != null && !isNaN(numArr[y]) ? numArr[y] / rev : null;
      vals.push(v);
      cells.push({
        v: v == null ? '-' : (v * 100).toFixed(0) + '%',
        style: {
          textAlign: 'right',
          padding: '4px 12px',
          fontFamily: 'var(--num)',
          whiteSpace: 'nowrap',
          fontStyle: 'italic',
          color: '#1E4423',
          fontSize: 12,
        },
      });
    }
    // num/den: para recalcular el % de un tramo de años agrupado (cociente de sumas)
    return { label, kind: 'p', vals, num: numArr.slice(1, nc + 1), den: ingresos.slice(1, nc + 1), cells, labelStyle: pctLabelStyle };
  }

  const netOp = [];
  for (let y = 0; y <= nc; y++) netOp[y] = (r.ebit[y] || 0) + (r.tax[y] || 0);

  // serie a 0 cuando el motor no la calcula
  const zf = (arr) => arr || Array(nc + 1).fill(0);
  // capital del fondo = inversión inicial (CAPEX + OPEX capitalizada) × (1 − % financiación);
  // es el mismo importe todos los años (el capital permanece) y es la base de la comisión
  const capF = r.capitalF ?? -r.capexRow.reduce((s, v) => s + (v || 0), 0) * (1 - (+a.financiacion || 0) / 100);
  const capFondo = r.capexRow.map((_, y) => (y === 0 ? 0 : capF));

  if (r.engine === 'iag') {
    return [
      {
        title: 'Rentabilidad agrícola',
        sub: '',
        tirLabel: 'TIR',
        tir: pct(r.tirA),
        rows: [
          mkRow('Ingresos', r.ingresos),
          mkRow('OPEX', negArr(r.opex)),
          mkRow('Alquiler', negArr(r.rent)),
          mkRow('Capitalización OPEX', r.opexCapRow),
          mkRow('Gastos de personal', negArr(r.pers)),
          mkRow('EBITDA', r.ebitda, { strong: true }),
          mkPct('% sobre ventas', r.ebitda, r.ingresos),
          mkRow('Amortización', negArr(r.amort)),
          mkRow('EBIT', r.ebit, { strong: true }),
          mkRow('Impuesto de Sociedades', r.tax),
          mkRow('Beneficio neto', r.netOp, { strong: true }),
          mkPct('% sobre ventas', r.netOp, r.ingresos),
          mkRow('CAPEX', r.capexRow),
          mkRow('Amortización', r.amort),
          mkRow('FCF', r.fcfU, { strong: true }),
          mkRow('FCF acumulado', r.fcfAcum),
        ],
      },
      {
        title: 'SPV',
        sub: '',
        tirLabel: 'TIR SPV',
        tir: pct(r.tirL),
        rows: [
          mkRow('Ingresos', r.ingresos),
          mkRow('OPEX', negArr(r.opex)),
          mkRow('Alquiler', negArr(r.rent)),
          mkRow('Auditoría', negArr(r.audit)),
          mkRow('Capitalización OPEX', r.opexCapRow),
          mkRow('(=) Margen bruto', r.margenBrutoS, { strong: true }),
          mkPct('% sobre ventas', r.margenBrutoS, r.ingresos),
          mkRow('Gastos de personal', negArr(r.pers)),
          mkRow('(=) EBITDA', r.ebitdaS, { strong: true }),
          mkPct('% sobre ventas', r.ebitdaS, r.ingresos),
          mkRow('Comisión CAPEX', negArr(r.capexFeeRow)),
          mkRow('Comisión OPEX', negArr(r.opexFeeRow)),
          mkRow('Amortización', negArr(r.amort)),
          mkRow('(=) EBIT', r.ebitS, { strong: true }),
          mkPct('% sobre ventas', r.ebitS, r.ingresos),
          mkRow('Intereses', negArr(r.interest)),
          mkRow('(=) EBT', r.ebtSd, { strong: true }),
          mkRow('IS (Impuesto de Sociedades)', r.taxS),
          mkRow('(=) Beneficio Neto', r.netoS, { strong: true }),
          mkPct('% sobre ventas', r.netoS, r.ingresos),
          mkRow('CAPEX', r.capexRow),
          mkRow('Amortización', r.amort),
          mkRow('(=) FCF', r.fcfSin, { strong: true }),
          mkRow('Financiación', r.financ),
          mkRow('Amortización deuda', negArr(r.principal)),
          mkRow('FCF Apalancado', r.fcfL, { strong: true }),
        ],
      },
      // Capa Fondo: este modelo aún no la calcula, así que sale a 0; cuando el motor
      // IAG devuelva las series del fondo (mismos nombres que el modelo estándar) se vuelcan aquí
      {
        title: 'Fondo',
        sub: '',
        tirLabel: 'TIR Fondo',
        tir: pct(r.tirF ?? 0),
        rows: [
          // capital del fondo: la parte de la inversión inicial que no se financia con deuda
          mkRow('Capital', capFondo, { strong: true }),
          mkRow('Ingresos del fondo', zf(r.fundRev), { strong: true }),
          mkRow('Comisión Gestión Fondo', negArr(zf(r.fundCosts))),
          mkRow('Inversión en SPV', zf(r.spvInv)),
          mkRow('Impuestos', negArr(zf(r.impFondo))),
          mkRow('Auditoría', negArr(zf(r.otherF))),
          mkRow('Costes del fondo', zf(r.costesF), { strong: true }),
          mkRow('FCF', zf(r.fcfF), { strong: true }),
          mkRow('FCF acumulado', zf(r.fcfFAcum)),
        ],
      },
    ];
  }

  return [
    {
      title: '1 · Proyecto agrícola',
      sub: 'sin apalancar · sin fees',
      tirLabel: 'TIR Agrícola',
      tir: pct(r.tirA),
      rows: [
        mkRow('Ingresos', r.ingresos),
        mkRow('OPEX', negArr(r.opex)),
        mkRow('Alquiler', negArr(r.rent)),
        mkRow('Capitalización OPEX', r.opexCapRow),
        mkRow('Gastos de personal', negArr(r.pers)),
        mkRow('EBITDA', r.ebitda, { strong: true }),
        mkPct('% sobre ventas', r.ebitda, r.ingresos),
        mkRow('Amortización', negArr(r.amort)),
        mkRow('EBIT', r.ebit, { strong: true }),
        mkRow('Impuesto de Sociedades', r.tax),
        mkRow('Beneficio Neto de Explotación', netOp, { strong: true }),
        mkPct('% sobre ventas', netOp, r.ingresos),
        mkRow('CAPEX', r.capexRow),
        mkRow('Amortización', r.amort),
        mkRow('FCF', r.fcfU, { strong: true }),
      ],
    },
    {
      title: '2 · SPV',
      sub: 'con fees de gestión y deuda',
      tirLabel: 'TIR SPV',
      tir: pct(r.tirL),
      rows: [
        mkRow('Ingresos', r.ingresos),
        mkRow('OPEX', negArr(r.opex)),
        mkRow('Alquiler', negArr(r.rent)),
        mkRow('Auditoría', negArr(r.audit)),
        mkRow('Otros', negArr(r.otrosS)),
        mkRow('Capitalización OPEX', r.opexCapRow),
        mkRow('(=) Margen bruto', r.margenBrutoS, { strong: true }),
        mkPct('% sobre ventas', r.margenBrutoS, r.ingresos),
        mkRow('Gastos de personal', negArr(r.pers)),
        mkRow('Otros gastos operativos', negArr(r.otrosOpS)),
        mkRow('(=) EBITDA', r.ebitdaS, { strong: true }),
        mkPct('% sobre ventas', r.ebitdaS, r.ingresos),
        mkRow('Comisión CAPEX', negArr(r.capexFeeRow)),
        mkRow('Comisión OPEX', negArr(r.opexFeeRow)),
        mkRow('Comisión de éxito', negArr(r.comExitoRow)),
        mkPct('% sobre ventas', r.ebitdaPostFees, r.ingresos),
        mkRow('Amortización', negArr(r.amort)),
        mkRow('(=) EBIT', r.ebitS, { strong: true }),
        mkPct('% sobre ventas', r.ebitS, r.ingresos),
        mkRow('Intereses', negArr(r.interest)),
        mkRow('(=) EBT', r.ebtSd, { strong: true }),
        mkRow('IS (Impuesto de Sociedades)', r.taxS),
        mkRow('(=) Beneficio Neto', r.netoS, { strong: true }),
        mkPct('% sobre ventas', r.netoS, r.ingresos),
        mkRow('CAPEX', r.capexRow),
        mkRow('Amortización', r.amort),
        mkRow('(=) FCF', r.fcfSin, { strong: true }),
        mkRow('Financiación', r.financ),
        mkRow('Amortización deuda', negArr(r.principal)),
        mkRow('FCF Apalancado', r.fcfL, { strong: true }),
      ],
    },
    {
      title: '3 · Fondo',
      sub: 'resultado final para el inversor',
      tirLabel: 'TIR Fondo',
      tir: pct(r.tirF),
      rows: [
        mkRow('Capital', capFondo, { strong: true }),
        mkRow('Ingresos del fondo', r.fundRev, { strong: true }),
        mkRow('Comisión Gestión Fondo', negArr(r.fundCosts)),
        mkRow('Inversión en SPV', r.spvInv),
        mkRow('Impuestos', negArr(r.impFondo)),
        mkRow('Auditoría', negArr(r.otherF)),
        mkRow('Costes del fondo', r.costesF, { strong: true }),
        mkRow('FCF', r.fcfF, { strong: true }),
        mkRow('FCF acumulado', r.fcfFAcum),
      ],
    },
  ];
}
