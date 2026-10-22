// Modelo Torrimpietra (IAG · Lazio). Fuente: 20261015_Modelo Financiero Olivo_IAG.xlsx,
// solo el Orchard 1 (300 ha). Etiquetas en inglés, como el Excel; el selector de
// idioma las traduce al español.

export function buildCapexIAG() {
  return [
    {
      key: 'prep',
      title: 'Soil preparation',
      unit: 'ha',
      items: [
        { key: 'clearing', label: 'Clearing and drainage', v: 0 },
        { key: 'levelling', label: 'Land levelling', v: 0 },
        { key: 'subsoiling', label: 'Subsoiling', v: 400 },
        { key: 'chisel', label: 'Chisel/Harrow', v: 200 },
        { key: 'correction', label: 'Soil correction', v: 0 },
        { key: 'ridging', label: 'Ridging', v: 1000 },
      ],
    },
    {
      key: 'plant',
      title: 'Planting',
      unit: 'ud',
      items: [
        { key: 'olive', label: 'Olive plant', v: 2.75 },
        { key: 'royalties', label: 'Royalties', v: 0.05 },
        { key: 'trellis', label: 'Trellis system (Trellis + Protector)', v: 0 },
        { key: 'stake', label: 'Trellis system (Stake + Protector)', v: 0.8 },
        { key: 'manual', label: 'Manual planting', v: 1316, unit: 'ha' },
        { key: 'mechanical', label: 'Mechanised planting', v: 0, unit: 'ha' },
        { key: 'fert', label: 'Fertiliser', v: 0, unit: 'ha' },
      ],
    },
    {
      key: 'riego',
      title: 'Irrigation system',
      unit: 'ha',
      items: [
        { key: 'irrproj', label: 'Irrigation project', v: 200 },
        { key: 'irrsys', label: 'Irrigation system (all inc.)', v: 3000 },
        { key: 'energy', label: 'Energy', v: 350 },
      ],
    },
    {
      key: 'viab',
      title: 'Feasibility, Project, Construction Management, Admin.',
      unit: 'ha',
      items: [
        { key: 'sourcing', label: 'Land sourcing', v: 0 },
        { key: 'topo', label: 'Topographic survey', v: 200 },
        { key: 'soil', label: 'Soil study and mapping', v: 350 },
        // Due Diligence en €/Ha (ddHa: ya no es un importe total)
        { key: 'dd', label: 'Due Diligence', v: 70, ddHa: true },
      ],
    },
  ];
}

// OPEX de "2. OPEX" (Excel IAG 15/10/2026). sched = €/Ha por año 1..13 (estable desde el año 5).
// Las partidas en €/Kg/Olives se recalculan con la producción (perKg).
export function buildOpexIAG() {
  const I = (label, unidad, cant, coste, sched, perKg) => ({
    key: label.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24) + '_' + cant,
    label,
    unidad,
    cant,
    coste,
    base: cant * coste,
    sched,
    perKg: !!perKg,
  });
  const z = Array(13).fill(0);
  const f = (v) => Array(13).fill(v);
  const rp = (head, v) => head.concat(Array(13 - head.length).fill(v));
  return [
    {
      key: 'weed',
      label: 'Weed control',
      items: [I('Plant protection products', 'Ha', 1, 200, rp([360, 320, 320], 200)), I('Herbicide treatment', 'Ha', 0, 0, z)],
    },
    {
      key: 'harvest',
      label: 'Harvesting',
      items: [
        I('Straddle harvester', 'Ha', 1, 500, rp([0, 0], 500)),
        I('Internal transport', '€/Kg/Olives', 0, 0, z, true),
        I('Transport to central plant', '€/Kg/Olives', 1, 0.01, z, true),
        I('Toll milling', '€/Kg/Olives', 1, 0.03, z, true),
      ],
    },
    {
      key: 'infra',
      label: 'Infrastructure maintenance',
      items: [
        I('Water replenishment', 'Ha', 0, 0, z),
        I('Reservoir maintenance', 'Ha', 1, 10, f(10)),
        I('Sewer cleaning', 'Ha', 1, 15, f(15)),
        // En el Excel va en "Farm maintenance"; Marc la quiere dentro de infraestructura
        I('Roads, facilities, etc.', 'Ha', 1, 40, rp([80, 80], 40)),
      ],
    },
    {
      key: 'nutrition',
      label: 'Nutrition',
      items: [
        I('NPK fertilisers', 'Ha', 1, 350, rp([175, 280, 350], 420)),
        I('Nutritional analyses', 'Ha', 1, 5, f(5)),
        I('Biostimulants and nutritional corrections', 'Ha', 1, 25, f(25)),
        I('Organic matter', 'Ha', 1, 25, f(25)),
      ],
    },
    {
      key: 'other',
      label: 'Other',
      items: [
        I('CAP processing (Common Agricultural Policy)', 'Ha', 1, 3, f(3)),
        I('Bees', 'Ha', 0, 0, z),
        I('Other', 'Ha', 0, 0, z),
      ],
    },
    {
      key: 'pruning',
      label: 'Pruning and training',
      items: [
        // mismas partidas y calendario que el modelo estándar (tabla de poda de Marc, 22/10/2026)
        I('1st training pruning', 'Ha', 5, 14.5, rp([72.5], 0)),
        I('2nd training pruning', 'Ha', 14, 14.5, rp([203], 0)),
        I('3rd training pruning', 'Ha', 7.5, 14.5, rp([108.75], 0)),
        I('Tertiary "U" training pruning', 'Ha', 1, 65, rp([0, 65], 0)),
        I('Mechanical top pruning', 'Ha', 1, 50, rp([0], 50)),
        I('Mechanical side pruning', 'Ha', 2, 50, rp([0], 100)),
        I('Manual winter pruning', 'Ha', 14, 18, rp([0, 0], 252)),
      ],
    },
    {
      key: 'irrigation',
      label: 'Irrigation',
      items: [
        I('Water consumption', 'Ha', 1, 200, rp([100, 200 / 1.35, 200 / 1.135], 200)),
        I('Energy consumption', 'm3/Ha', 1, 0.05, rp([50], 125)),
        I('Servicing and repairs', 'Ha', 1, 35, rp([35 / 3, 35 / 2, 35 / 1.5, 35 / 1.18], 35)),
        I('Drip irrigation cleaning', 'Ha', 1, 15, f(15)),
      ],
    },
    {
      key: 'health',
      label: 'Plant health',
      items: [
        I('Plant protection products', 'Ha', 1, 700, f(700)), // constante (más inflación) todos los años
        I('Foliar application (alternate rows)', 'Ha', 0, 0, z),
        I('Foliar application (all rows)', 'Ha', 0, 0, z),
      ],
    },
  ];
}

// Ciclo de precios del EVOO: variación % anual, años 1..35. Modelo de ciclicidad de Marc
// (Book7, hoja Ciclo_AOVE, 22/10/2026): tendencia +2,09 %/año × ciclo sinusoidal de 9,5 años,
// sin la sequía 2023-2024, con tope de 6 €/Kg y la amplitud reducida (en escala log) para que
// el mínimo sea 2,92 €/Kg. Año 1 = 3,36 €/Kg (precioEVOO).
export const PRICE_VAR_IAG = [
  0, -0.08296765655673677, -0.05193629167282576, 0.009293710882837702, 0.07761207013050342, 0.1224743269212547,
  0.12121566884546309, 0.07449935295595589, 0.005824125932951452, -0.05434339014731693, -0.08348905543822538,
  -0.07217037030454065, -0.023938459912630217, 0.044438680710067624, 0.1048021649970825, 0.128213528300809,
  0.10245990058670462, 0.04094605295894693, -0.02702215638817762, -0.07369499693948156, -0.0829676565567371,
  -0.05193629167282543, 0.00929371088283748, 0.07761207013050275, 0.12247432692125515, 0.12121566884546264,
  0.07449935295595633, 0.00582412593295123, -0.054343390147316484, -0.08348905543822538, -0.07217037030454088,
  -0.023938459912629995, 0.044438680710066736, 0.1048021649970825, 0.128213528300809,
];

export function baseIAG(ov) {
  return Object.assign(
    {
      engine: 'iag',
      superficie: 300,
      marcoN: 3.8,
      marcoM: 1.4,
      precioEVOO: 3.3586185003178937,
      kgOil: 1800,
      oilYield: 16,
      alquiler: 0,
      personal: 500,
      inflacion: 2,
      is: 24,
      financiacion: 30,
      interes: 4.5,
      plazo: 25,
      carencia: 3,
      capexFee: 1000,
      opexFee: 355,
      audit: Math.round((10000 * 300) / 650),
      // fondo de inversión (su capital se calcula: 100 % − financiación)
      successFee: 0,
      fondoCost: 0,
      fondoOtros: 0,
      descuento: 6,
      priceVar: PRICE_VAR_IAG.slice(),
      // otra finca con la que repartir la amortización (como el Excel original); a 0, cada
      // finca amortiza solo sus propios activos
      cons: { supO2: 0, plantO2: 0, irrO2: 0 },
      capexGroups: buildCapexIAG(),
      opexItems: buildOpexIAG(),
    },
    ov || {},
  );
}
