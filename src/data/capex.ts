import type { CapexGroup } from '../types';

export function buildCapex(): CapexGroup[] {
  return [
    {
      key: 'prep',
      title: 'Preparación del suelo',
      unit: 'ha',
      items: [
        { key: 'cond', label: 'Condiciones generales de la parcela e infraestructuras', v: 300 },
        { key: 'arado', label: 'Arado del suelo (Subsolado)', v: 500 },
        { key: 'cultivo', label: 'Cultivo del suelo (x3) Chisel/Grada', v: 175 },
        { key: 'nivel', label: 'Nivelación del suelo (Alomado)', v: 150 },
        { key: 'despedreg', label: 'Despedregados', v: 150 },
        { key: 'otros', label: 'Otros costes', v: 0 },
      ],
    },
    {
      key: 'plant',
      title: 'Plantación',
      unit: 'ud',
      items: [
        { key: 'smarttree', label: 'Smarttree Olivo con protector', v: 2.15 },
        { key: 'royalties', label: 'Royalties', v: 0 },
        { key: 'tutor', label: 'Tutor en campo 1M 18-20 mm & colocación y atado', v: 0.4 },
        { key: 'plantacion', label: 'Plantación', v: 0.25 },
        { key: 'fert', label: 'Fertilizante', v: 0.15 },
      ],
    },
    {
      key: 'riego',
      title: 'Sistema de riego',
      unit: 'ha',
      items: [
        { key: 'riego', label: 'Sistema de riego', v: 3394.39 },
        { key: 'energia', label: 'Energía', v: 786 },
      ],
    },
    {
      key: 'viab',
      title: 'Viabilidad, Proyecto, Dirección ejecución, Administración',
      unit: 'ha',
      items: [
        { key: 'captacion', label: 'Captación de Fincas', v: 693 },
        { key: 'topo', label: 'Levantamiento topográfico', v: 45 },
        { key: 'suelo', label: 'Estudio y Mapa Suelo', v: 75 },
        { key: 'dd', label: 'Due Diligence Técnica Idoneidad ubicación', v: 75 },
      ],
    },
  ];
}
