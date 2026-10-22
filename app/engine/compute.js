/** @typedef {import('../types.js').Assumptions} Assumptions */
/** @typedef {import('../types.js').OpexItem} OpexItem */
import { computeIAG } from './computeIAG.js';

export const MP = 6; // año de referencia para el "€/Ha pleno" mostrado
export const HZ = 35; // horizonte de cálculo de las TIR (como el Excel)

// €/Ha de una sub-partida en el año y (años>13 continúan por paridad: 13 es impar)
export function opexYear(sched, y) {
  if (y <= 13) return sched[y - 1];
  const a12 = sched[11];
  const a13 = sched[12];
  if (Math.abs(a12 - a13) < 1e-9) return a13;
  return y % 2 === 1 ? a13 : a12;
}

/** @param {OpexItem} it */
export function opexItemScale(it) {
  const base = +it.base || 0;
  return base > 0 ? ((+it.cant || 0) * (+it.coste || 0)) / base : 1;
}

// kg de aceituna por Ha en el año y (modelo IAG): rampa 0 · 0 · 50% · 75% · 100%.
export function kgOlivesHa(a, y) {
  const ramp = y <= 2 ? 0 : y === 3 ? 0.5 : y === 4 ? 0.75 : 1;
  // el supuesto es kg de aceite/Ha en plena producción; la aceituna sale del rendimiento graso
  // (modelos antiguos sin kgOil: kg de aceituna por árbol × densidad)
  if (a.kgOil != null) {
    const yld = (+a.oilYield || 0) / 100;
    return yld > 0 ? ((+a.kgOil || 0) / yld) * ramp : 0;
  }
  return ((+a.kgTree || 0) * ramp * 10000) / (a.marcoN * a.marcoM);
}

// €/Ha de una sub-partida en el año y. Las partidas en €/Kg de aceituna (perKg,
// solo en el modelo IAG) se recalculan con la producción de ese año.
export function opexItemYear(it, y, a) {
  if (it.perKg) return (+it.cant || 0) * (+it.coste || 0) * kgOlivesHa(a, y);
  return opexYear(it.sched, y) * opexItemScale(it);
}

// Año desde el que una sub-partida OPEX se actualiza con la inflación (pedido de Marc, 22/10/2026):
// mientras el importe de los años 1–5 cambia, va tal cual; la inflación empieza en el segundo año
// del último tramo igual (1–5 iguales → año 2; 2–5 iguales → año 3; año 5 distinto del 4 → año 6).
// Las partidas €/Kg siguen la regla general (desde el año 2).
// Dos años seguidos cuentan como "iguales" si el cambio no supera la inflación del modelo más un
// 0,5 % (decimales de Excel o importes que ya traen la inflación); un salto mayor es rampa.
export function opexInflStart(it, inflPct = 0) {
  if (it.perKg || !Array.isArray(it.sched)) return 2;
  const v = it.sched;
  // partida periódica (alterna en los últimos años, p. ej. cada 2 años): regla general
  if (Math.abs(v[v.length - 2] - v[v.length - 1]) > 1e-9) return 2;
  const tol = Math.max(0, inflPct) / 100 + 0.005;
  const eq = (x, y) => Math.abs(x - y) <= Math.max(1e-9, tol * Math.max(Math.abs(x), Math.abs(y)));
  // último tramo igual de todo el calendario (hay partidas que siguen subiendo después del año 5)
  let k = v.length - 1;
  while (k > 0 && eq(v[k - 1], v[k])) k--;
  return k + 2;
}

// €/Ha de la sub-partida en el año y con su inflación. Dentro del tramo constante se parte del
// importe de su primer año y se le aplica la inflación (así no se infla dos veces lo que ya la traía)
export function opexItemYearInfl(it, y, a) {
  const i = (+a.inflacion || 0) / 100;
  const first = opexInflStart(it, +a.inflacion || 0) - 1; // primer año del tramo constante
  const v = it.sched;
  const periodic = Array.isArray(v) && Math.abs(v[v.length - 2] - v[v.length - 1]) > 1e-9;
  if (it.perKg || !Array.isArray(v) || periodic) return opexItemYear(it, y, a) * Math.pow(1 + i, y - 1);
  if (y < first) return opexItemYear(it, y, a);
  return opexItemYear(it, first, a) * Math.pow(1 + i, y - first);
}

// Busca cambios de signo del VAN en una malla y devuelve la raíz más cercana al 10% (guess de Excel).
export function irr(cfs) {
  const npv = (r) => cfs.reduce((s, c, i) => s + c / Math.pow(1 + r, i), 0);
  let best = null;
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

// Tasa de descuento del VAN, en %. Los modelos guardados antes de que fuera
// editable no la tienen: usan el 8 % del Excel Iberocrops.
export function discountPct(a) {
  return a.descuento == null || a.descuento === '' ? 8 : +a.descuento || 0;
}

// Cada modelo usa el motor de su Excel: el de Iberocrops (por defecto) o el de
// IAG (a.engine === 'iag', modelo Torrimpietra).
/** @param {Assumptions} a */
// €/Ha de una partida de CAPEX: por árbol (grupo 'ud') × densidad, por Ha, o
// importe total de la finca (it.total, p. ej. la Due Diligence) ÷ superficie
export function capexItemHa(it, g, densidad, sup) {
  const v = +it.v || 0;
  if (it.total) return sup > 0 ? v / sup : 0;
  // una partida puede llevar su propia unidad (it.unit) distinta de la de su bloque
  return v * ((it.unit || g.unit) === 'ud' ? densidad : 1);
}

export function compute(a) {
  return a.engine === 'iag' ? computeIAG(a) : computeStd(a);
}

// Réplica del motor de "3. Rentabilidad" del Excel Iberocrops. Años 1..35; el CAPEX se paga en el año 1.
// Devuelve las series por año (índice 0 vacío, años 1..horizonte), las TIR, el VAN y los totales.
/** @param {Assumptions} a */
function computeStd(a) {
  const horizon = Math.max(1, Math.round(+a.duracionProyecto) || HZ);
  const sup = a.superficie;
  const densidad = 10000 / (a.marcoN * a.marcoM);
  const arboles = densidad * sup;
  const fin = a.financiacion / 100;
  const intr = a.interes / 100;
  const infl = a.inflacion / 100;
  const isr = a.is / 100;
  const inflF = (y) => Math.pow(1 + infl, y - 1);
  const pr = (y) => (y <= 2 ? 0 : y === 3 ? 5 / 7.5 : y === 4 ? 6 / 7.5 : y === 5 ? 6.5 / 7.5 : 1); // rampa de producción (5 · 6 · 6,5 · 7,5 kg/árbol)

  // OPEX por categoría y año, sumando sub-partidas (cada una escalada por cant×coste) con la
  // inflación de cada una (opexInflStart)
  const opexByItem = a.opexItems.map((cat) => {
    const cells = [0];
    for (let y = 1; y <= horizon; y++) {
      let cy = 0;
      for (const it of cat.items) cy += opexItemYearInfl(it, y, a);
      cells[y] = (cy * sup) / 1000;
    }
    return { key: cat.key, label: cat.label, cells };
  });
  const opex = [0];
  for (let y = 1; y <= horizon; y++) opex[y] = opexByItem.reduce((s, bi) => s + bi.cells[y], 0);

  // OPEX/Ha "pleno" (año de referencia MP, sin inflación) para las tarjetas y %
  const opexHa = a.opexItems.reduce(
    (s, cat) => s + cat.items.reduce((x, it) => x + opexYear(it.sched, MP) * opexItemScale(it), 0),
    0,
  );

  // CAPEX (€/Ha, año 1) y capitalización del OPEX (años 1-2)
  const grpHa = (g) => g.items.reduce((s, it) => s + capexItemHa(it, g, densidad, +a.superficie || 0), 0);
  const capexEstab = a.capexGroups.reduce((s, g) => s + grpHa(g), 0);
  const capexT = (capexEstab * sup) / 1000;
  const capexOpex = ((opex[1] + opex[2]) * 1000) / sup;
  const capexHa = capexEstab + capexOpex;
  const depBase = capexT + opex[1] + opex[2]; // inversión total = base amortizable (k€)
  const totalCapex = depBase;

  // Amortización contable en dos tramos (años 3-12 y 13-22), fracciones calcadas del Excel
  const dep = [0];
  for (let y = 1; y <= horizon; y++)
    dep[y] = y >= 3 && y <= 12 ? depBase * 0.0393405 : y >= 13 && y <= 22 ? depBase * 0.0112316 : 0;

  // Ingresos con el ciclo de precios (variación % anual de la pestaña Precio; sin
  // variaciones el precio es constante, como en el Excel). Alquiler, personal y
  // auditoría con inflación.
  const ingresos = [0];
  const rent = [0];
  const pers = [0];
  const audit = [0];
  const price = [0];
  for (let y = 1; y <= horizon; y++) {
    price[y] = y === 1 ? +a.precioEVOO || 0 : price[y - 1] * (1 + ((a.priceVar || [])[y - 1] || 0));
    ingresos[y] = (sup * a.prodPlena * pr(y) * price[y]) / 1000;
    rent[y] = ((+a.alquiler || 0) * sup * inflF(y)) / 1000;
    pers[y] = ((+a.personal || 0) * sup * inflF(y)) / 1000;
    audit[y] = 10.2 * (sup / 250) * inflF(y); // auditoría + otros del SPV
  }

  // Préstamo francés sobre la inversión total, con carencia
  const deuda = depBase * fin;
  const equity = depBase - deuda;
  const nAm = Math.max(1, a.plazo - a.carencia);
  const cuota = intr > 0 ? (deuda * intr) / (1 - Math.pow(1 + intr, -nAm)) : deuda / nAm;
  const interest = [0];
  const principal = [0];
  let bal = deuda;
  for (let y = 1; y <= horizon; y++) {
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
  const ebitda = [0];
  const amort = dep;
  const ebit = [0];
  const tax = [0];
  const fcfU = [0];
  const fcfAcum = [0];
  const opexCapRow = [0];
  const capexRow = [0];
  let acum = 0;

  // Capa 2 · SPV (fees + deuda, IS con bases imponibles negativas)
  const capexFeeRow = [0];
  const opexFeeRow = [0];
  const comExitoRow = [0];
  const margenBrutoS = [0];
  const otrosS = [0];
  const otrosOpS = [0];
  const ebitdaS = [0];
  const ebitS = [0];
  const ebtSd = [0];
  const taxS = [0];
  const netoS = [0];
  const fcfSin = [0];
  const financ = [0];
  const fcfL = [0];
  const isDev = [0];
  const aidVal = [0];
  const aidApl = [0];
  const aidRest = [0];
  const isPay = [0];
  let carry = 0;

  // Capa 3 · Fondo
  const fundRev = [0];
  const spvInv = [0];
  const fundCosts = [0];
  const impFondo = [0];
  const otherF = [0];
  const costesF = [0];
  const fcfF = [0];
  const fcfFAcum = [0];
  let acumF = 0;

  for (let y = 1; y <= horizon; y++) {
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
    ebitdaS[y] = margenBrutoS[y] - pers[y] - otrosOpS[y];
    capexFeeRow[y] = y === 1 ? capexFeeT : 0;
    opexFeeRow[y] = opexFeeT; // fee plano, sin inflación
    ebitS[y] = ebitdaS[y] - capexFeeRow[y] - opexFeeRow[y] - comExitoRow[y] - dep[y];
    // IS del SPV: arrastre de pérdidas sobre el EBT (EBIT - intereses), como el Excel.
    const ebtY = ebitS[y] - interest[y];
    let taxable;
    // Lo mismo visto como activo por impuesto diferido (tabla "IS - Impuesto
    // diferido" de la pestaña Financiera): AID = pérdidas pendientes × tipo del IS.
    isDev[y] = ebtY * isr;
    if (ebtY > 0) {
      aidVal[y] = -carry * isr;
      aidApl[y] = Math.min(ebtY, carry) * isr;
      taxable = Math.max(0, ebtY - carry);
      carry = Math.max(0, carry - ebtY);
    } else {
      carry += -ebtY;
      aidVal[y] = -carry * isr;
      aidApl[y] = 0;
      taxable = 0;
    }
    aidRest[y] = -carry * isr;
    isPay[y] = taxable * isr;
    taxS[y] = -taxable * isr;
    ebtSd[y] = ebtY; // EBT tras intereses (presentación)
    netoS[y] = ebtSd[y] + taxS[y];
    fcfSin[y] = netoS[y] + dep[y] + capexRow[y];
    financ[y] = y === 1 ? deuda : 0;
    fcfL[y] = fcfSin[y] + financ[y] - principal[y];

    // Fondo
    fundRev[y] = Math.max(0, fcfL[y]);
    spvInv[y] = Math.min(0, fcfL[y]);
  }

  // Equity comprometido: no es un input, es la suma de las llamadas de capital
  // ("Inversión en SPV") que el Fondo tiene que aportar a lo largo del proyecto.
  const fondoEquity = -spvInv.slice(1).reduce((s, v) => s + v, 0);

  for (let y = 1; y <= horizon; y++) {
    fundCosts[y] = fondoEquity * ((+a.fondoCost || 0) / 100);
    impFondo[y] = fundRev[y] * 0.0125; // retención del 1,25% sobre los ingresos del fondo (como el Excel)
    otherF[y] = y <= 2 ? 10 * (sup / 250) : 0;
    costesF[y] = spvInv[y] - fundCosts[y] - impFondo[y] - otherF[y];
    fcfF[y] = fundRev[y] + costesF[y];
    acumF += fcfF[y];
    fcfFAcum[y] = acumF;
  }

  const tirA = irr(fcfU.slice(1));
  const tirL = irr(fcfL.slice(1));
  const tirF = irr(fcfF.slice(1));
  const dr = discountPct(a) / 100;
  const van = fcfU.slice(1).reduce((s, c, i) => s + c / Math.pow(1 + dr, i), 0);
  const vanF = fcfF.slice(1).reduce((s, c, i) => s + c / Math.pow(1 + dr, i), 0);
  let payback = null;
  let wentNeg = false;
  for (let y = 1; y <= horizon; y++) {
    if (fcfAcum[y] < 0) {
      wentNeg = true;
    } else if (wentNeg) {
      payback = y;
      break;
    }
  }
  const totalIntereses = interest.reduce((s, c) => s + c, 0);

  const ebitdaPostFees = [];
  for (let y = 0; y <= horizon; y++)
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
    price,
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
    isDev,
    aidVal,
    aidApl,
    aidRest,
    isPay,
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
