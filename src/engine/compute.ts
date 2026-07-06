import type { Assumptions, OpexItem } from '../types';

export const MP = 6; // año de referencia para el "€/Ha pleno" mostrado
export const HZ = 35; // horizonte de cálculo de las TIR (como el Excel)

// €/Ha de una sub-partida en el año y (años>13 continúan por paridad: 13 es impar)
export function opexYear(sched: number[], y: number): number {
  if (y <= 13) return sched[y - 1];
  const a12 = sched[11];
  const a13 = sched[12];
  if (Math.abs(a12 - a13) < 1e-9) return a13;
  return y % 2 === 1 ? a13 : a12;
}

export function opexItemScale(it: OpexItem): number {
  const base = +it.base || 0;
  return base > 0 ? ((+it.cant || 0) * (+it.coste || 0)) / base : 1;
}

// Busca cambios de signo del VAN en una malla y devuelve la raíz más cercana al 10% (guess de Excel).
export function irr(cfs: number[]): number | null {
  const npv = (r: number) => cfs.reduce((s, c, i) => s + c / Math.pow(1 + r, i), 0);
  let best: number | null = null;
  let prevR = -0.6;
  let prev = npv(prevR);
  if (isNaN(prev)) return null;
  for (let r = -0.55; r <= 3.0001; r += 0.05) {
    const v = npv(r);
    if ((prev > 0 && v <= 0) || (prev < 0 && v >= 0)) {
      let lo = prevR;
      let hi = r;
      let flo = prev;
      for (let ki = 0; ki < 90; ki++) {
        const mid = (lo + hi) / 2;
        const fm = npv(mid);
        if (flo * fm <= 0) {
          hi = mid;
        } else {
          lo = mid;
          flo = fm;
        }
      }
      const root = (lo + hi) / 2;
      if (best === null || Math.abs(root - 0.1) < Math.abs(best - 0.1)) best = root;
    }
    prev = v;
    prevR = r;
  }
  return best;
}

export interface ComputeResult {
  densidad: number;
  arboles: number;
  capexHa: number;
  capexEstab: number;
  capexOpex: number;
  opexHa: number;
  totalCapex: number;
  deuda: number;
  equity: number;
  cuota: number;
  ingresos: number[];
  opex: number[];
  rent: number[];
  pers: number[];
  audit: number[];
  opexCapRow: number[];
  capexRow: number[];
  ebitda: number[];
  amort: number[];
  ebit: number[];
  tax: number[];
  fcfU: number[];
  fcfAcum: number[];
  capexFeeRow: number[];
  opexFeeRow: number[];
  comExitoRow: number[];
  margenBrutoS: number[];
  otrosS: number[];
  otrosOpS: number[];
  ebitdaS: number[];
  ebitS: number[];
  ebtSd: number[];
  taxS: number[];
  netoS: number[];
  fcfSin: number[];
  financ: number[];
  interest: number[];
  principal: number[];
  fcfL: number[];
  fondoEquity: number;
  fundRev: number[];
  spvInv: number[];
  fundCosts: number[];
  impFondo: number[];
  otherF: number[];
  costesF: number[];
  fcfF: number[];
  fcfFAcum: number[];
  tirA: number | null;
  tirL: number | null;
  tirF: number | null;
  van: number;
  vanF: number;
  payback: number | null;
  totalIntereses: number;
  opexByItem: { key: string; label: string; cells: number[] }[];
  capexFeeT: number;
  ebitdaPostFees: number[];
}

// Réplica del motor de "3. Rentabilidad" del Excel Iberocrops. Años 1..35; el CAPEX se paga en el año 1.
export function compute(a: Assumptions): ComputeResult {
  const sup = a.superficie;
  const densidad = 10000 / (a.marcoN * a.marcoM);
  const arboles = densidad * sup;
  const fin = a.financiacion / 100;
  const intr = a.interes / 100;
  const infl = a.inflacion / 100;
  const isr = a.is / 100;
  const inflF = (y: number) => Math.pow(1 + infl, y - 1);
  const pr = (y: number) => (y <= 2 ? 0 : y === 3 ? 5 / 7.5 : y === 4 ? 6 / 7.5 : y === 5 ? 6.5 / 7.5 : 1); // rampa de producción (5 · 6 · 6,5 · 7,5 kg/árbol)

  // OPEX por categoría y año, sumando sub-partidas (cada una escalada por cant×coste); inflación desde el año 2
  const opexByItem = a.opexItems.map((cat) => {
    const cells: number[] = [0];
    for (let y = 1; y <= HZ; y++) {
      let cy = 0;
      for (const it of cat.items) cy += opexYear(it.sched, y) * opexItemScale(it);
      cells[y] = (cy * sup * inflF(y)) / 1000;
    }
    return { key: cat.key, label: cat.label, cells };
  });
  const opex: number[] = [0];
  for (let y = 1; y <= HZ; y++) opex[y] = opexByItem.reduce((s, bi) => s + bi.cells[y], 0);

  // OPEX/Ha "pleno" (año de referencia MP, sin inflación) para las tarjetas y %
  const opexHa = a.opexItems.reduce(
    (s, cat) => s + cat.items.reduce((x, it) => x + opexYear(it.sched, MP) * opexItemScale(it), 0),
    0,
  );

  // CAPEX (€/Ha, año 1) y capitalización del OPEX (años 1-2)
  const grpHa = (g: (typeof a.capexGroups)[number]) =>
    g.items.reduce((s, it) => s + (+it.v || 0), 0) * (g.unit === 'ud' ? densidad : 1);
  const capexEstab = a.capexGroups.reduce((s, g) => s + grpHa(g), 0);
  const capexT = (capexEstab * sup) / 1000;
  const capexOpex = ((opex[1] + opex[2]) * 1000) / sup;
  const capexHa = capexEstab + capexOpex;
  const depBase = capexT + opex[1] + opex[2]; // inversión total = base amortizable (k€)
  const totalCapex = depBase;

  // Amortización contable en dos tramos (años 3-12 y 13-22), fracciones calcadas del Excel
  const dep: number[] = [0];
  for (let y = 1; y <= HZ; y++)
    dep[y] = y >= 3 && y <= 12 ? depBase * 0.0393405 : y >= 13 && y <= 22 ? depBase * 0.0112316 : 0;

  // Ingresos a precio constante (sin inflación); alquiler, personal y auditoría con inflación
  const ingresos: number[] = [0];
  const rent: number[] = [0];
  const pers: number[] = [0];
  const persS: number[] = [0];
  const audit: number[] = [0];
  for (let y = 1; y <= HZ; y++) {
    ingresos[y] = (sup * a.prodPlena * pr(y) * a.precioEVOO) / 1000;
    rent[y] = ((+a.alquiler || 0) * sup * inflF(y)) / 1000;
    pers[y] = ((+a.personal || 0) * sup * inflF(y)) / 1000;
    persS[y] = y < HZ ? ((+a.personal || 0) * sup * Math.pow(1 + infl, y)) / 1000 : 0; // el SPV lo lleva desplazado un año (como el Excel)
    audit[y] = 10.2 * (sup / 250) * inflF(y); // auditoría + otros del SPV
  }

  // Préstamo francés sobre la inversión total, con carencia
  const deuda = depBase * fin;
  const equity = depBase - deuda;
  const nAm = Math.max(1, a.plazo - a.carencia);
  const cuota = intr > 0 ? (deuda * intr) / (1 - Math.pow(1 + intr, -nAm)) : deuda / nAm;
  const interest: number[] = [0];
  const principal: number[] = [0];
  let bal = deuda;
  for (let y = 1; y <= HZ; y++) {
    if (y <= a.carencia) {
      interest[y] = bal * intr;
      principal[y] = 0;
    } else if (bal > 0.0001) {
      const it = bal * intr;
      const p = Math.min(cuota - it, bal);
      interest[y] = it;
      principal[y] = p;
      bal -= p;
    } else {
      interest[y] = 0;
      principal[y] = 0;
    }
  }

  const capexFeeT = ((+a.capexFee || 0) * sup) / 1000;
  const opexFeeT = ((+a.opexFee || 0) * sup) / 1000;

  // Capa 1 · Proyecto agrícola
  const ebitda: number[] = [0];
  const amort = dep;
  const ebit: number[] = [0];
  const tax: number[] = [0];
  const fcfU: number[] = [0];
  const fcfAcum: number[] = [0];
  const opexCapRow: number[] = [0];
  const capexRow: number[] = [0];
  let acum = 0;

  // Capa 2 · SPV (fees + deuda, IS con bases imponibles negativas)
  const capexFeeRow: number[] = [0];
  const opexFeeRow: number[] = [0];
  const comExitoRow: number[] = [0];
  const margenBrutoS: number[] = [0];
  const otrosS: number[] = [0];
  const otrosOpS: number[] = [0];
  const ebitdaS: number[] = [0];
  const ebitS: number[] = [0];
  const ebtSd: number[] = [0];
  const taxS: number[] = [0];
  const netoS: number[] = [0];
  const fcfSin: number[] = [0];
  const financ: number[] = [0];
  const fcfL: number[] = [0];
  let carry = 0;

  // Capa 3 · Fondo
  const fondoEquity = +a.equityFondo || 0;
  const fundRev: number[] = [0];
  const spvInv: number[] = [0];
  const fundCosts: number[] = [0];
  const impFondo: number[] = [0];
  const otherF: number[] = [0];
  const costesF: number[] = [0];
  const fcfF: number[] = [0];
  const fcfFAcum: number[] = [0];
  let acumF = 0;

  for (let y = 1; y <= HZ; y++) {
    opexCapRow[y] = y <= 2 ? opex[y] : 0;
    capexRow[y] = y === 1 ? -capexT : 0;
    ebitda[y] = ingresos[y] - opex[y] - rent[y] - pers[y] + opexCapRow[y];
    ebit[y] = ebitda[y] - dep[y];
    tax[y] = -isr * ebit[y]; // IS devengado (positivo en años de pérdida)
    fcfU[y] = ebitda[y] + tax[y] + capexRow[y];
    acum += fcfU[y];
    fcfAcum[y] = acum;

    // SPV
    otrosS[y] = 0;
    otrosOpS[y] = 0;
    comExitoRow[y] = 0;
    margenBrutoS[y] = ingresos[y] - opex[y] - rent[y] - audit[y] - otrosS[y] + opexCapRow[y];
    ebitdaS[y] = margenBrutoS[y] - persS[y] - otrosOpS[y];
    capexFeeRow[y] = y === 1 ? capexFeeT : 0;
    opexFeeRow[y] = opexFeeT; // fee plano, sin inflación
    ebitS[y] = ebitdaS[y] - capexFeeRow[y] - opexFeeRow[y] - comExitoRow[y] - dep[y];
    // IS del SPV (calibrado al Data Table del Excel): arrastre de pérdidas operativas (EBIT)
    // + escudo fiscal de los intereses (deducibles, contra el beneficio operativo del año, sin arrastrar).
    let opTaxable: number;
    if (ebitS[y] > 0) {
      opTaxable = Math.max(0, ebitS[y] - carry);
      carry = Math.max(0, carry - ebitS[y]);
    } else {
      carry += -ebitS[y];
      opTaxable = 0;
    }
    const taxable = Math.max(0, opTaxable - interest[y]);
    taxS[y] = -taxable * isr;
    ebtSd[y] = ebitS[y] - interest[y]; // EBT tras intereses (presentación)
    netoS[y] = ebtSd[y] + taxS[y];
    fcfSin[y] = netoS[y] + dep[y] + capexRow[y];
    financ[y] = y === 1 ? deuda : 0;
    fcfL[y] = fcfSin[y] + financ[y] - principal[y];

    // Fondo
    fundRev[y] = Math.max(0, fcfL[y]);
    spvInv[y] = Math.min(0, fcfL[y]);
    fundCosts[y] = fondoEquity * ((+a.fondoCost || 0) / 100);
    impFondo[y] = 0; // sin doble imposición: el SPV ya paga IS; el dividendo al Fondo no se vuelve a gravar (calibrado al Data Table del Excel)
    otherF[y] = y <= 2 ? 10 * (sup / 250) : 0;
    costesF[y] = spvInv[y] - fundCosts[y] - impFondo[y] - otherF[y];
    fcfF[y] = fundRev[y] + costesF[y];
    acumF += fcfF[y];
    fcfFAcum[y] = acumF;
  }

  const tirA = irr(fcfU.slice(1));
  const tirL = irr(fcfL.slice(1));
  const tirF = irr(fcfF.slice(1));
  const van = fcfU.slice(1).reduce((s, c, i) => s + c / Math.pow(1.08, i), 0);
  const vanF = fcfF.slice(1).reduce((s, c, i) => s + c / Math.pow(1.08, i), 0);
  let payback: number | null = null;
  let wentNeg = false;
  for (let y = 1; y <= HZ; y++) {
    if (fcfAcum[y] < 0) {
      wentNeg = true;
    } else if (wentNeg) {
      payback = y;
      break;
    }
  }
  const totalIntereses = interest.reduce((s, c) => s + c, 0);

  const ebitdaPostFees: number[] = [];
  for (let y = 0; y <= HZ; y++)
    ebitdaPostFees[y] = (ebitdaS[y] || 0) - (capexFeeRow[y] || 0) - (opexFeeRow[y] || 0) - (comExitoRow[y] || 0);

  return {
    densidad,
    arboles,
    capexHa,
    capexEstab,
    capexOpex,
    opexHa,
    totalCapex,
    deuda,
    equity,
    cuota,
    ingresos,
    opex,
    rent,
    pers,
    audit,
    opexCapRow,
    capexRow,
    ebitda,
    amort,
    ebit,
    tax,
    fcfU,
    fcfAcum,
    capexFeeRow,
    opexFeeRow,
    comExitoRow,
    margenBrutoS,
    otrosS,
    otrosOpS,
    ebitdaS,
    ebitS,
    ebtSd,
    taxS,
    netoS,
    fcfSin,
    financ,
    interest,
    principal,
    fcfL,
    fondoEquity,
    fundRev,
    spvInv,
    fundCosts,
    impFondo,
    otherF,
    costesF,
    fcfF,
    fcfFAcum,
    tirA,
    tirL,
    tirF,
    van,
    vanF,
    payback,
    totalIntereses,
    opexByItem,
    capexFeeT,
    ebitdaPostFees,
  };
}
