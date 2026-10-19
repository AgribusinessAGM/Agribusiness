import { buildCapex } from './capex.js';
import { buildOpex } from './opex.js';

/** @returns {import('../types.js').Assumptions} */
export function baseA(ov) {
  return Object.assign(
    {
      superficie: 250,
      marcoN: 3.75,
      marcoM: 1.35,
      precioEVOO: 4.55,
      prodPlena: 2075.06,
      alquiler: 1320,
      personal: 800,
      inflacion: 2,
      is: 25,
      financiacion: 60,
      interes: 3,
      plazo: 25,
      carencia: 3,
      capexFee: 1000,
      opexFee: 355,
      fondoCost: 1.5,
      duracionProyecto: 35,
      capexGroups: buildCapex(),
      opexItems: buildOpex(),
    },
    ov || {},
  );
}

// Modelo en blanco para "Nuevo modelo": conserva la superficie elegida en el
// modal de creación, pero deja el resto de casillas editables (Supuestos,
// CAPEX, OPEX) a 0 para que el usuario las rellene desde cero.
export function blankA(superficie) {
  const a = baseA({ superficie });
  return {
    ...a,
    marcoN: 0,
    marcoM: 0,
    precioEVOO: 0,
    prodPlena: 0,
    alquiler: 0,
    personal: 0,
    inflacion: 0,
    is: 0,
    financiacion: 0,
    interes: 0,
    plazo: 0,
    carencia: 0,
    capexFee: 0,
    opexFee: 0,
    fondoCost: 0,
    capexGroups: a.capexGroups.map((g) => ({
      ...g,
      items: g.items.map((it) => ({ ...it, v: 0 })),
    })),
    opexItems: a.opexItems.map((cat) => ({
      ...cat,
      items: cat.items.map((it) => ({ ...it, cant: 0, coste: 0 })),
    })),
  };
}

// Los modelos y usuarios de ejemplo viven en la base de datos: los crea la API
// la primera vez (api/data/seed-models.json y api/lib/db.php).
