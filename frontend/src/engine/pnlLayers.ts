import type { CSSProperties } from 'react';
import type { ComputeResult } from './compute';
import { nfAcc, pct } from './format';

export interface PnlCell {
  v: string;
  style: CSSProperties;
}

export interface PnlRow {
  label: string;
  cells: PnlCell[];
  rowBg?: string;
  labelStyle: CSSProperties;
}

export interface PnlLayer {
  title: string;
  sub: string;
  tirLabel: string;
  tir: string;
  rows: PnlRow[];
}

function cellStyle(strong?: boolean): CSSProperties {
  return {
    textAlign: 'right',
    padding: '8px 12px',
    fontFamily: 'var(--num)',
    whiteSpace: 'nowrap',
    borderTop: strong ? undefined : '1px solid var(--line)',
    fontWeight: strong ? 700 : undefined,
  };
}

function labelStyleFor(strong?: boolean): CSSProperties {
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

function negArr(arr: number[]): number[] {
  return arr.map((v) => (v == null || isNaN(v) || v === 0 ? v : -Math.abs(v)));
}

const pctLabelStyle: CSSProperties = {
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

export function buildPnlHeader(nc: number) {
  const header: { label: string }[] = [];
  for (let y = 1; y <= nc; y++) header.push({ label: 'Año ' + y });
  return header;
}

export function buildPnlLayers(r: ComputeResult): PnlLayer[] {
  const nc = r.ingresos.length - 1;

  function mkRow(label: string, arr: number[], opts?: { strong?: boolean }): PnlRow {
    const cells: PnlCell[] = [];
    for (let y = 1; y <= nc; y++) {
      const v = arr[y];
      cells.push({ v: v == null || isNaN(v) ? '—' : nfAcc(v), style: cellStyle(opts?.strong) });
    }
    return {
      label,
      cells,
      rowBg: opts?.strong ? 'var(--brandL)' : undefined,
      labelStyle: labelStyleFor(opts?.strong),
    };
  }

  function mkPct(label: string, numArr: number[], ingresos: number[]): PnlRow {
    const cells: PnlCell[] = [];
    for (let y = 1; y <= nc; y++) {
      const rev = ingresos[y];
      const v = rev > 0 && numArr[y] != null && !isNaN(numArr[y]) ? numArr[y] / rev : null;
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
    return { label, cells, labelStyle: pctLabelStyle };
  }

  function mkHead(label: string): PnlRow {
    const cells: PnlCell[] = [];
    for (let y = 1; y <= nc; y++) cells.push({ v: '', style: { borderTop: '1px solid var(--line)' } });
    return {
      label,
      cells,
      rowBg: 'var(--brandL)',
      labelStyle: {
        textAlign: 'left',
        padding: '8px 14px',
        position: 'sticky',
        left: 0,
        background: 'var(--brandL)',
        fontWeight: 800,
        whiteSpace: 'nowrap',
      },
    };
  }

  const netOp: number[] = [];
  for (let y = 0; y <= nc; y++) netOp[y] = (r.ebit[y] || 0) + (r.tax[y] || 0);

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
        mkRow('Capitalización del OPEX', r.opexCapRow),
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
        mkRow('Capitalización del OPEX', r.opexCapRow),
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
        mkRow('(=) Resultado Neto', r.netoS, { strong: true }),
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
        mkHead('Capital'),
        mkRow('Ingresos del fondo', r.fundRev, { strong: true }),
        mkRow('Comisión Gestión Fondo', negArr(r.fundCosts)),
        mkRow('Inversión en SPV', r.spvInv),
        mkRow('Impuestos', negArr(r.impFondo)),
        mkRow('Otros', negArr(r.otherF)),
        mkRow('Costes del fondo', r.costesF, { strong: true }),
        mkRow('FCF', r.fcfF, { strong: true }),
        mkRow('FCF acumulado', r.fcfFAcum),
      ],
    },
  ];
}
