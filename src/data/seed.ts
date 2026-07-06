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
