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
        { key: 'accessories', label: 'Accessories (Stake + Protector)', v: 0.8 },
        { key: 'manual', label: 'Manual planting (all inc.)', v: 0.7 },
        { key: 'fert', label: 'Fertiliser', v: 0 },
      ],
    },
    {
      key: 'riego',
      title: 'Irrigation system',
      unit: 'ha',
      items: [
        { key: 'irrsys', label: 'Irrigation system (all inc.)', v: 3000 },
        { key: 'energy', label: 'Energy', v: 350 },
      ],
    },
    {
      key: 'viab',
      title: 'Feasibility, Project, Construction Management, Administration',
      unit: 'ha',
      items: [
        { key: 'sourcing', label: 'Land sourcing', v: 0 },
        { key: 'topo', label: 'Topographic survey', v: 200 },
        { key: 'soil', label: 'Soil study and mapping', v: 350 },
        { key: 'irrproj', label: 'Irrigation project', v: 200 },
        { key: 'dd', label: 'Due Diligence', v: 15000, total: true },
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
      label: 'Harvesting and marketing',
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
        I('Tying', 'Ha', 1, 100, rp([100], 0)),
        I('1st training pruning', 'Ha', 1, 150, rp([150], 0)),
        I('2nd training pruning', 'Ha', 1, 200, rp([0, 200], 0)),
        I('Skirt pruning', 'Ha', 1, 150, rp([0, 0], 150)),
        I('Mechanical top pruning', 'Ha', 0, 0, z),
        I('Mechanical side pruning', 'Ha', 0, 0, z),
        I('Manual winter pruning', 'Ha', 1, 200, rp([0, 0], 200)),
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
        I('Plant protection products', 'Ha', 1, 700, rp([210, 350, 490, 700], 458.376)),
        I('Foliar application (alternate rows)', 'Ha', 0, 0, z),
        I('Foliar application (all rows)', 'Ha', 0, 0, z),
      ],
    },
  ];
}

// Ciclo de precios del EVOO: variación % anual ('E. Financial' fila 32), años 1..35.
export const PRICE_VAR_IAG = [
  0, -0.1, -0.05, -0.06600094874749907, 0.05, 0.10042328504199816, 0.15941237113241424, 0.157748219425617,
  0.09635554729068052, 0.007462364070705663, -0.06903581837092287, -0.10560975058106803, -0.0914444452050045,
  -0.03054361435760189, 0.05724279149631317, 0.09, 0.11, 0.07, 0.1, -0.034463037472035385, -0.09335534802552203,
  -0.10495829320752759, -0.06600094874749896, 0.011913654111607608, 0.05, 0.05, 0.05, 0.06, 0.007462364070705885,
  -0.08, -0.09, -0.09144444520500494, -0.030543614357601778, 0.05724279149631273, 0.1,
];

export function baseIAG(ov) {
  return Object.assign(
    {
      engine: 'iag',
      superficie: 300,
      marcoN: 3.8,
      marcoM: 1.4,
      precioEVOO: 5,
      kgTree: 8,
      oilYield: 14.5,
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
      // Orchard 2 (Lanuvio): solo para replicar el reparto de la amortización del Excel
      cons: { supO2: 350, plantO2: 5169.172932330828, irrO2: 4500 },
      capexGroups: buildCapexIAG(),
      opexItems: buildOpexIAG(),
    },
    ov || {},
  );
}
