import type { OpexCategory, OpexItem } from '../types';

// Misma estructura que la hoja "2. OPEX" del Excel: 9 categorías → sub-partidas.
// Cada sub-partida tiene Cantidad y Coste unitario editables; "sched" es el perfil €/Ha por año
// (años 1..13; el año>13 continúa por paridad). Editar cant o coste escala esa línea proporcionalmente.
export function buildOpex(): OpexCategory[] {
  const rep = (head: number[], val: number, n: number) => head.concat(Array(n).fill(val));
  const I = (
    label: string,
    unidad: string,
    cant: number,
    coste: number,
    sched: number[],
  ): OpexItem => ({
    key: label.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24) + '_' + cant,
    label,
    unidad,
    cant,
    coste,
    base: cant * coste,
    sched,
  });

  return [
    {
      key: 'malezas',
      label: 'Control de malezas',
      items: [
        I('Productos fitosanitarios', 'Ha', 1, 72.534, rep([72.53, 72.53], 60.23, 11)),
        I('Tratamiento con herbicidas', 'Ha', 1, 40, rep([160, 160], 120, 11)),
      ],
    },
    {
      key: 'cosecha',
      label: 'Cosecha y comercialización',
      items: [
        I('Cabalgante', 'Ha', 1, 350, rep([0, 0], 350, 11)),
        I(
          'Transporte interno',
          '€/Kg/\nAceitunas',
          1,
          0.01,
          [0, 0, 89.25, 107.1, 116.03].concat(Array(8).fill(133.88)),
        ),
        I(
          'Transporte a planta central',
          '€/Kg/\nAceitunas',
          1,
          0.01,
          [0, 0, 89.25, 107.1, 116.03].concat(Array(8).fill(133.88)),
        ),
        I(
          'Maquila',
          '€/Kg/\nAceitunas',
          1,
          0.03,
          [0, 0, 267.75, 321.3, 348.07].concat(Array(8).fill(401.63)),
        ),
      ],
    },
    {
      key: 'infra',
      label: 'Mantenimiento de infraestructura',
      items: [
        I('Reabastecimiento (de agua)', 'Ha', 1, 20, rep([20, 20], 0, 11)),
        I('Mantenimiento de embalses', 'Ha', 1, 15, Array(13).fill(15)),
        I(
          'Limpieza de alcantarillado',
          'Ha',
          1,
          25,
          [0, 25, 0, 25, 0, 25, 0, 25, 0, 25, 0, 25, 0],
        ),
      ],
    },
    {
      key: 'terrenos',
      label: 'Mantenimiento de terrenos',
      items: [I('Limpieza mecánica', 'Ha', 1, 40, [80].concat(Array(12).fill(40)))],
    },
    {
      key: 'nutricion',
      label: 'Nutrición',
      items: [
        I('Fertilizantes', 'Kg/Ha', 1, 240, [144, 192, 288].concat(Array(10).fill(336))),
        I('Análisis', 'Ha', 1, 5, Array(13).fill(5)),
        I(
          'Enmiendas orgánicas',
          'Ha',
          3,
          44,
          [66, 132, 132, 132, 132, 0, 132, 0, 132, 0, 132, 0, 132],
        ),
        I('Materia orgánica', 'Ha', 1, 40.5, Array(13).fill(40.5)),
      ],
    },
    {
      key: 'otros',
      label: 'Otros',
      items: [
        I('Tramitación de la PAC', 'Ha', 1, 3, Array(13).fill(3)),
        I('Abejas', 'Ha', 1, 0, Array(13).fill(0)),
        I('Otros', 'Ha', 1, 0, Array(13).fill(0)),
      ],
    },
    {
      key: 'poda',
      label: 'Poda y formación',
      items: [
        I('Poda de emergencia', 'Ha', 5, 14.5, [72.5].concat(Array(12).fill(0))),
        I('2ª Poda de formación', 'Ha', 14, 14.5, [203].concat(Array(12).fill(0))),
        I('3ª Poda de formación', 'Ha', 7.5, 14.5, [108.75].concat(Array(12).fill(0))),
        I('Poda terciaria en "U"', 'Ha', 1, 65, [0, 65].concat(Array(11).fill(0))),
        I('Poda mecánica de cobertura', 'Ha', 1, 50, [0].concat(Array(12).fill(50))),
        I('Poda mecánica lateral', 'Ha', 2, 50, [0].concat(Array(12).fill(100))),
        I('Poda manual en invierno', 'Ha', 14, 18, [0, 0].concat(Array(11).fill(252))),
      ],
    },
    {
      key: 'riego',
      label: 'Riego',
      items: [
        I('Canon CCRR + CHG', 'Ha', 1, 100, Array(13).fill(100)),
        I('Consumo de energía', 'm³/Ha', 1, 0.07, [70, 175].concat(Array(11).fill(245))),
        I('Probabilidades de vegetación', 'Ha', 1, 2, Array(13).fill(2)),
        I('Limpieza de riego por goteo', 'Ha', 2, 14.5, Array(13).fill(29)),
      ],
    },
    {
      key: 'sanidad',
      label: 'Sanidad vegetal',
      items: [
        I(
          'Protección vegetal (productos)',
          'Ha',
          1,
          258.38,
          [25.35, 58.14, 164.41].concat(Array(10).fill(258.38)),
        ),
        I('Aplicación foliar (calle sí/no)', 'Ha', 7, 25, [175].concat(Array(12).fill(0))),
        I('Aplicación foliar (todas hileras)', 'Ha', 5, 40, [33.34].concat(Array(12).fill(200))),
      ],
    },
  ];
}
