import type { Assumptions, AppUser, FinModel } from '../types';
import { buildCapex } from './capex';
import { buildOpex } from './opex';

export function baseA(ov?: Partial<Assumptions>): Assumptions {
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
      equityFondo: 2930,
      capexGroups: buildCapex(),
      opexItems: buildOpex(),
    },
    ov || {},
  );
}

// Modelo en blanco para "Nuevo modelo": conserva la superficie elegida en el
// modal de creación, pero deja el resto de casillas editables (Supuestos,
// CAPEX, OPEX) a 0 para que el usuario las rellene desde cero.
export function blankA(superficie: number): Assumptions {
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
    equityFondo: 0,
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

export function buildSeed(): FinModel[] {
  return [
    {
      id: 1,
      name: 'Iberocrops · Olivar Andalucía',
      crop: 'olivo',
      region: 'Écija, Sevilla · España',
      status: 'Activo',
      updated: 'hoy',
      shared: '3 personas',
      a: baseA({}),
    },
    {
      id: 2,
      name: 'Finca La Dehesa',
      crop: 'almendro',
      region: 'Mérida, Extremadura · España',
      status: 'Borrador',
      updated: 'hace 4 días',
      shared: '2 personas',
      a: baseA({ superficie: 120, precioEVOO: 4.8, prodPlena: 1800, equityFondo: 1410 }),
    },
    {
      id: 3,
      name: 'Projeto Alentejo',
      crop: 'olivo',
      region: 'Beja · Portugal',
      status: 'En revisión',
      updated: 'hace 2 semanas',
      shared: '4 personas',
      a: baseA({
        superficie: 400,
        precioEVOO: 4.35,
        prodPlena: 2100,
        financiacion: 50,
        equityFondo: 5860,
      }),
    },
  ];
}

export function buildUsers(): AppUser[] {
  return [
    {
      name: 'María Ferrer',
      email: 'm.ferrer@iberocrops.com',
      org: 'Iberocrops (Cliente)',
      access: { 1: 'edit', 2: 'view', 3: 'none' },
    },
    {
      name: 'James Whitfield',
      email: 'j.whitfield@greenfund.eu',
      org: 'GreenFund (Inversor)',
      access: { 1: 'view', 2: 'none', 3: 'view' },
    },
    {
      name: 'Carlos Ruiz',
      email: 'c.ruiz@agromillora.com',
      org: 'Agromillora (Admin)',
      access: { 1: 'edit', 2: 'edit', 3: 'edit' },
    },
    {
      name: 'Ana Costa',
      email: 'a.costa@alentejofarms.pt',
      org: 'Alentejo Farms (Cliente)',
      access: { 1: 'none', 2: 'none', 3: 'edit' },
    },
  ];
}
