import { HZ, MP, capexItemHa, discountPct, irr, kgOlivesHa, opexItemYear, opexItemYearInfl } from './compute.js';

// Réplica de "3. Profitability" del Excel IAG (sección 4 · Orchard 1 en solitario)
// más la capa SPV aplicada a sus Ha. Años 1..35; sin capa Fondo.
// Verificado contra el Excel (20261015_Modelo Financiero Olivo_IAG.xlsx):
// IRR 22,28 %, NPV/ha 59.728 € (6 %), payback año 7.
export function computeIAG(a) {
  const sup = +a.superficie || 0;
  const densidad = 10000 / (a.marcoN * a.marcoM);
  const arboles = densidad * sup;
  const fin = a.financiacion / 100;
  const intr = a.interes / 100;
  const infl = a.inflacion / 100;
  const isr = a.is / 100;
  const dr = discountPct(a) / 100;
  const inflF = (y) => Math.pow(1 + infl, y - 1);

  const opexByItem = a.opexItems.map((cat) => {
    const cells = [0];
    for (let y = 1; y <= HZ; y++) {
      let cy = 0;
      for (const it of cat.items) cy += opexItemYearInfl(it, y, a); // con la inflación de cada partida
      cells[y] = (cy * sup) / 1000;
    }
    return { key: cat.key, label: cat.label, cells };
  });
  const opex = [0];
  for (let y = 1; y <= HZ; y++) opex[y] = opexByItem.reduce((s, bi) => s + bi.cells[y], 0);
  const opexHa = a.opexItems.reduce(
    (s, cat) => s + cat.items.reduce((x, it) => x + opexItemYear(it, MP, a), 0),
    0,
  );

  const grpHa = (g) => g.items.reduce((s, it) => s + capexItemHa(it, g, densidad, +a.superficie || 0), 0);
  const capexEstab = a.capexGroups.reduce((s, g) => s + grpHa(g), 0);
  const capexT = (capexEstab * sup) / 1000;
  const capexOpex = sup > 0 ? ((opex[1] + opex[2]) * 1000) / sup : 0;
  const capexHa = capexEstab + capexOpex;
  const totalCapex = capexT + opex[1] + opex[2];

  // Amortización ('E. Financial' filas 3-5): olivo 10% (años 3-12), riego 5% (años 3-22),
  // OPEX capitalizada 10% (años 3-12). El Excel calcula olivo y riego con el €/Ha del
  // Orchard 1 × la superficie total (Orchard 1 + Orchard 2) y luego aplica la cuota del
  // Orchard 1; se replica igual (en riego da 35,5 k€/año en vez de 45).
  const line = (gk, ik) => {
    const g = a.capexGroups.find((x) => x.key === gk);
    const it = g && g.items.find((x) => x.key === ik);
    return it ? capexItemHa(it, g, densidad, +a.superficie || 0) : 0;
  };
  const plantHa = line('plant', 'olive');
  const irrHa = line('riego', 'irrsys');
  const c = a.cons || { supO2: 0, plantO2: 0, irrO2: 0 };
  const supTot = sup + c.supO2;
  const shr = (v, v2) => {
    const den = v * sup + v2 * c.supO2;
    return den > 0 ? (v * sup) / den : supTot > 0 ? sup / supTot : 0;
  };
  const dOl = ((plantHa * supTot * 0.1) / 1000) * shr(plantHa, c.plantO2);
  const dIr = ((irrHa * supTot * 0.05) / 1000) * shr(irrHa, c.irrO2);
  const dOp = (opex[1] + opex[2]) * 0.1;
  const dep = [0];
  for (let y = 1; y <= HZ; y++) dep[y] = (y >= 3 && y <= 12 ? dOl + dOp : 0) + (y >= 3 && y <= 22 ? dIr : 0);
  const depBase = dep.reduce((s, v) => s + v, 0);

  // Ingresos con el ciclo de precios (variación % anual editable en la pestaña Precio)
  const ingresos = [0];
  const rent = [0];
  const pers = [0];
  const audit = [0];
  const price = [0];
  for (let y = 1; y <= HZ; y++) {
    price[y] = y === 1 ? +a.precioEVOO || 0 : price[y - 1] * (1 + ((a.priceVar || [])[y - 1] || 0));
    ingresos[y] = (kgOlivesHa(a, y) * ((+a.oilYield || 0) / 100) * price[y] * sup) / 1000;
    rent[y] = ((+a.alquiler || 0) * sup * inflF(y)) / 1000;
    pers[y] = ((+a.personal || 0) * sup) / 1000;
    audit[y] = ((+a.audit || 0) * inflF(y)) / 1000;
  }

  // Préstamo francés (importes en k€ redondeados a 2 decimales, como el Excel)
  const deuda = totalCapex * fin;
  const equity = totalCapex - deuda;
  const nAm = Math.max(1, a.plazo - a.carencia);
  const cuota = Math.round((intr > 0 ? (deuda * intr) / (1 - Math.pow(1 + intr, -nAm)) : deuda / nAm) * 100) / 100;
  const interest = [0];
  const principal = [0];
  let bal = deuda;
  for (let y = 1; y <= HZ; y++) {
    if (y > a.plazo || bal <= 0.0001) {
      interest[y] = 0;
      principal[y] = 0;
      continue;
    }
    interest[y] = Math.round(bal * intr * 100) / 100;
    principal[y] = y <= a.carencia ? 0 : Math.min(cuota - interest[y], bal);
    bal -= principal[y];
  }

  const capexFeeT = ((+a.capexFee || 0) * sup) / 1000;
  const opexFeeT = ((+a.opexFee || 0) * sup) / 1000;
  const ebitda = [0];
  const ebit = [0];
  const tax = [0];
  const netOp = [0];
  const fcfU = [0];
  const fcfAcum = [0];
  const opexCapRow = [0];
  const capexRow = [0];
  const capexFeeRow = [0];
  const opexFeeRow = [0];
  const comExitoRow = [0];
  const margenBrutoS = [0];
  const ebitdaS = [0];
  const ebitS = [0];
  const ebtSd = [0];
  const taxS = [0];
  const netoS = [0];
  const fcfSin = [0];
  const financ = [0];
  const fcfL = [0];
  const fcfLAcum = [0];
  const isDev = [0];
  const aidVal = [0];
  const aidApl = [0];
  const aidRest = [0];
  const isPay = [0];
  let acum = 0;
  let acumL = 0;
  let dta = 0;
  for (let y = 1; y <= HZ; y++) {
    opexCapRow[y] = y <= 2 ? opex[y] : 0;
    capexRow[y] = -opexCapRow[y] - (y === 1 ? capexT : 0);
    ebitda[y] = ingresos[y] - opex[y] - rent[y] + opexCapRow[y] - pers[y];
    ebit[y] = ebitda[y] - dep[y];
    tax[y] = -isr * ebit[y];
    netOp[y] = ebit[y] + tax[y];
    fcfU[y] = netOp[y] + capexRow[y] + dep[y];
    acum += fcfU[y];
    fcfAcum[y] = acum;

    // SPV
    margenBrutoS[y] = ingresos[y] - opex[y] - rent[y] - audit[y] + opexCapRow[y];
    ebitdaS[y] = margenBrutoS[y] - pers[y];
    capexFeeRow[y] = y === 1 ? capexFeeT : 0;
    opexFeeRow[y] = opexFeeT;
    comExitoRow[y] = 0;
    ebitS[y] = ebitdaS[y] - capexFeeRow[y] - opexFeeRow[y] - dep[y];
    ebtSd[y] = ebitS[y] - interest[y];

    // IS con activo por impuesto diferido ('E. Financial' filas 10-14): las pérdidas
    // generan un activo que se aplica contra el IS de los años con beneficio.
    const acr = ebtSd[y] * isr;
    let pay = 0;
    let apl = 0;
    if (acr < 0) {
      dta += acr;
      aidVal[y] = dta;
    } else {
      aidVal[y] = dta;
      apl = Math.min(acr, -dta);
      dta += apl;
      pay = acr - apl;
    }
    isDev[y] = acr;
    aidApl[y] = apl;
    aidRest[y] = dta;
    isPay[y] = pay;
    taxS[y] = -pay;
    netoS[y] = ebtSd[y] + taxS[y];
    fcfSin[y] = netoS[y] + capexRow[y] + dep[y];
    financ[y] = y === 1 ? deuda : 0;
    fcfL[y] = fcfSin[y] + financ[y] - principal[y];
    acumL += fcfL[y];
    fcfLAcum[y] = acumL;
  }

  const tirA = irr(fcfU.slice(1));
  const tirL = irr(fcfL.slice(1));

  // Capa Fondo (supuestos "Fondo de inversión"): el fondo pone el capital que no es deuda;
  // como en el modelo original, sus ingresos son el FCF apalancado positivo del SPV y aporta
  // el negativo (el capital que no es deuda ya está dentro de ese FCF). Le restan
  // la comisión de gestión (% del capital del fondo), el IS de Supuestos sobre sus
  // ingresos y "otros" (€/Año con inflación).
  const fPct = (100 - (+a.financiacion || 0)) / 100; // Capital Fondo = 1 − % financiación
  const fundRev = [0];
  const spvInv = [0];
  const fundCosts = [0];
  const impFondo = [0];
  const otherF = [0];
  const costesF = [0];
  const fcfF = [0];
  const fcfFAcum = [0];
  for (let y = 1; y <= HZ; y++) {
    fundRev[y] = Math.max(0, fcfL[y]);
    spvInv[y] = Math.min(0, fcfL[y]);
  }
  // capital del fondo: inversión inicial sin la parte financiada; base de la comisión de gestión
  const capitalF = -capexRow.reduce((s, v) => s + v, 0) * fPct;
  const fondoEquity = capitalF;
  let acumF = 0;
  for (let y = 1; y <= HZ; y++) {
    fundCosts[y] = fondoEquity * ((+a.fondoCost || 0) / 100);
    impFondo[y] = fundRev[y] * ((+a.is || 0) / 100);
    otherF[y] = fPct > 0 ? ((+a.fondoOtros || 0) * inflF(y)) / 1000 : 0;
    costesF[y] = spvInv[y] - fundCosts[y] - impFondo[y] - otherF[y];
    fcfF[y] = fundRev[y] + costesF[y];
    acumF += fcfF[y];
    fcfFAcum[y] = acumF;
  }
  const tirF = fPct > 0 ? irr(fcfF.slice(1)) : 0;
  const vanF = fcfF.slice(1).reduce((s, v, i) => s + v / Math.pow(1 + dr, i), 0);
  const vanHa = sup > 0 ? (fcfU.slice(1).reduce((s, v, i) => s + v / Math.pow(1 + dr, i), 0) * 1000) / sup : 0;
  let payback = null;
  for (let y = 1; y <= HZ; y++) {
    if (fcfAcum[y] >= 0) {
      payback = y;
      break;
    }
  }
  const totalIntereses = interest.reduce((s, v) => s + v, 0);
  const zeros = dep.map(() => 0);

  return {
    engine: 'iag',
    densidad,
    arboles,
    capexHa,
    capexEstab,
    capexOpex,
    opexHa,
    totalCapex,
    depBase,
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
    amort: dep,
    ebit,
    tax,
    netOp,
    fcfU,
    fcfAcum,
    capexFeeRow,
    opexFeeRow,
    comExitoRow,
    margenBrutoS,
    otrosS: zeros,
    otrosOpS: zeros,
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
    fcfLAcum,
    isDev,
    aidVal,
    aidApl,
    aidRest,
    isPay,
    fondoEquity,
    capitalF,
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
    van: (vanHa * sup) / 1000,
    vanHa,
    vanF,
    payback,
    totalIntereses,
    opexByItem,
    capexFeeT,
  };
}
