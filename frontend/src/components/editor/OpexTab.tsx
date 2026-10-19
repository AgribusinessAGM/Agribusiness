import type { CSSProperties } from 'react';
import type { ComputeResult } from '../../engine/compute';
import { MP, opexItemScale, opexYear } from '../../engine/compute';
import { nf, pctShare } from '../../engine/format';
import { NumberField } from '../NumberField';
import { useApp } from '../../state/store';
import type { Assumptions } from '../../types';

const projCell = (strong: boolean): CSSProperties => ({
  textAlign: 'right',
  padding: '7px 8px',
  fontFamily: 'var(--num)',
  fontSize: 11.5,
  whiteSpace: 'nowrap',
  fontWeight: strong ? 700 : undefined,
  borderTop: strong ? undefined : '1px solid var(--line)',
});

const projLabel = (strong: boolean): CSSProperties => ({
  textAlign: 'left',
  padding: '7px 12px',
  position: 'sticky',
  left: 0,
  background: strong ? 'var(--brandL)' : 'var(--surface)',
  fontWeight: strong ? 800 : 500,
  borderTop: strong ? undefined : '1px solid var(--line)',
  whiteSpace: 'nowrap',
  fontSize: 12,
  zIndex: 1,
});

export function OpexTab({
  a,
  r,
  photo,
  photoAlt,
  photoObjectPosition = 'center',
}: {
  a: Assumptions;
  r: ComputeResult;
  photo?: string;
  photoAlt?: string;
  photoObjectPosition?: string;
}) {
  const { state, onOpexField, onProjHaField, canEdit } = useApp();

  const opexDetail = a.opexItems.map((cat) => {
    let catPlena = 0;
    const items = cat.items.map((it) => {
      const scale = opexItemScale(it);
      const plena = opexYear(it.sched, MP) * scale;
      const year1 = opexYear(it.sched, 1) * scale;
      catPlena += plena;
      return { ...it, catKey: cat.key, plenaFmt: nf(plena, 0), year1Fmt: nf(year1, 0) };
    });
    return {
      key: cat.key,
      title: cat.label,
      items,
      rawPlena: catPlena,
      subtotalFmt: nf(catPlena, 0) + ' €/Ha',
      pct: pctShare(catPlena / r.opexHa),
    };
  });

  // Agrupación visual: "Mantenimiento de infraestructura" se muestra dentro
  // de la tarjeta de "Riego" (sus sub-partidas son de agua/riego), dejando 8
  // tarjetas en una cuadrícula de 4x2. Los datos siguen viviendo en sus
  // categorías originales — cada fila edita con su catKey real.
  const infraCard = opexDetail.find((g) => g.key === 'infra');
  const opexCards = opexDetail
    .filter((g) => g.key !== 'infra')
    .map((g) => {
      if (g.key !== 'riego' || !infraCard) return g;
      const rawPlena = g.rawPlena + infraCard.rawPlena;
      return {
        ...g,
        title: 'Riego y mantenimiento',
        items: [...g.items, ...infraCard.items],
        rawPlena,
        subtotalFmt: nf(rawPlena, 0) + ' €/Ha',
        pct: pctShare(rawPlena / r.opexHa),
      };
    });

  // Orden visual pedido: Malezas/Sanidad · Nutrición/Terrenos · Poda/Riego · Cosecha/Otros.
  const CARD_ORDER = ['malezas', 'sanidad', 'nutricion', 'terrenos', 'poda', 'riego', 'cosecha', 'otros'];
  const orderedCards = CARD_ORDER.map((key) => opexCards.find((g) => g.key === key)).filter(
    (g): g is (typeof opexCards)[number] => g != null,
  );

  const projHa = +state.projHa || 0;
  const inflFp = (y: number) => Math.pow(1 + a.inflacion / 100, y - 1);
  const horizon = r.opex.length - 1;
  const years = Array.from({ length: horizon }, (_, i) => i + 1);

  const opexProjRows = a.opexItems.map((cat) => {
    const cells = years.map((y) => {
      let perHaY = 0;
      for (const it of cat.items) perHaY += opexYear(it.sched, y) * opexItemScale(it);
      const v = perHaY * inflFp(y) * projHa;
      return { v: v > 0 ? nf(v) : '·', style: projCell(false) };
    });
    return { label: cat.label, cells, labelStyle: projLabel(false) };
  });
  const opexTotalCells = years.map((y) => {
    let tot = 0;
    for (const cat of a.opexItems) for (const it of cat.items) tot += opexYear(it.sched, y) * opexItemScale(it);
    return { v: nf(tot * inflFp(y) * projHa), style: projCell(true) };
  });

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <div style={{ gridColumn: '1 / 4' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>2 · OPEX — Costes operativos</h2>
          <span
            style={{
              fontSize: 11,
              background: canEdit ? 'var(--editable)' : 'var(--bg)',
              color: canEdit ? 'var(--brandD)' : 'var(--ink2)',
              border: `1px solid ${canEdit ? 'var(--editableLine)' : 'var(--line)'}`,
              padding: '2px 8px',
              borderRadius: 999,
              fontWeight: 700,
            }}
          >
            {canEdit ? 'Cantidad y coste editables' : 'Solo lectura'}
          </span>
        </div>
        <p style={{ color: 'var(--ink2)', fontSize: 14, margin: '0 0 20px' }}>
          Misma estructura que la hoja OPEX del Excel: 9 categorías con sus sub-partidas. Cada una
          tiene <strong>Cantidad</strong> y <strong>Coste unitario</strong> editables; el perfil
          anual (rampa e inflación) se conserva y la línea escala con lo que edites. €/Ha pleno =
          año de referencia.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {orderedCards.map((g) => (
            <div
              key={g.key}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 18px',
                  background: 'var(--brandL)',
                  color: 'var(--brandD)',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{g.title}</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {g.subtotalFmt} · {g.pct}
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2.2fr 1.9fr 1.3fr 1fr 1fr',
                  padding: '8px 18px',
                  fontSize: 11,
                  color: 'var(--ink2)',
                  fontWeight: 600,
                  borderBottom: '1px solid var(--line)',
                }}
              >
                <div>Sub-partida</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <div style={{ width: 84, textAlign: 'right' }}>Cantidad</div>
                  <div style={{ width: 84, textAlign: 'right' }}>Coste unitario</div>
                </div>
                <div style={{ textAlign: 'center' }}>Unidad</div>
                <div style={{ textAlign: 'right' }}>€/Ha 1er Año</div>
                <div style={{ textAlign: 'right' }}>€/Ha pleno</div>
              </div>
              {g.items.map((it) => (
                <div
                  key={it.key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2.2fr 1.9fr 1.3fr 1fr 1fr',
                    alignItems: 'center',
                    padding: '8px 18px',
                    borderTop: '1px solid var(--line)',
                  }}
                >
                  <div style={{ fontSize: 13.5, whiteSpace: 'pre-line' }}>{it.label}</div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <NumberField
                      id={'op:cant:' + it.catKey + '.' + it.key}
                      value={it.cant}
                      width={84}
                      style={{ fontSize: 13.5 }}
                      onChangeRaw={(raw) => onOpexField(it.catKey, it.key, 'cant', raw)}
                    />
                    <NumberField
                      id={'op:coste:' + it.catKey + '.' + it.key}
                      value={it.coste}
                      width={84}
                      style={{ fontSize: 13.5 }}
                      onChangeRaw={(raw) => onOpexField(it.catKey, it.key, 'coste', raw)}
                    />
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink2)', whiteSpace: 'pre-line' }}>
                    {it.unidad}
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: 'var(--num)', fontSize: 14, color: 'var(--ink2)' }}>
                    {it.year1Fmt}
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: 'var(--num)', fontSize: 14 }}>{it.plenaFmt}</div>
                </div>
              ))}
            </div>
          ))}
          <div
            style={{
              gridColumn: '1 / -1',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '14px 18px',
              fontWeight: 800,
              borderTop: '2px solid var(--brand)',
            }}
          >
            <div>Total OPEX (año de referencia)</div>
            <div style={{ fontFamily: 'var(--num)', fontSize: 14 }}>
              {nf(r.opexHa)} € · {nf((r.opexHa * a.superficie) / 1000, 0)} k€ total
            </div>
          </div>
        </div>
        </div>
        {photo && (
          <img
            src={photo}
            alt={photoAlt}
            style={{
              gridColumn: '4 / 5',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: photoObjectPosition,
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)',
            }}
          />
        )}
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, margin: '26px 0 8px', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Proyección OPEX a {horizon} años</h3>
            <div style={{ fontSize: 11, color: 'var(--ink2)', marginTop: 3 }}>€/Ha por año · con inflación</div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginLeft: 'auto',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              padding: '5px 10px',
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--ink2)', fontWeight: 600 }}>Hectáreas</span>
            <NumberField id="ui:projHa" value={state.projHa} width={72} onChangeRaw={onProjHaField} />
            <span style={{ fontSize: 12, color: 'var(--ink2)' }}>Ha</span>
          </div>
        </div>
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow)',
            overflow: 'auto',
          }}
        >
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '9px 12px',
                    position: 'sticky',
                    left: 0,
                    background: 'var(--brandL)',
                    color: 'var(--brandD)',
                    fontSize: 11,
                    zIndex: 2,
                  }}
                >
                  Partida
                </th>
                {years.map((y) => (
                  <th
                    key={y}
                    style={{
                      textAlign: 'right',
                      padding: '9px 8px',
                      background: 'var(--brandL)',
                      color: 'var(--brandD)',
                      fontFamily: 'var(--num)',
                      fontSize: 11,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {y}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {opexProjRows.map((row) => (
                <tr key={row.label}>
                  <td style={row.labelStyle}>{row.label}</td>
                  {row.cells.map((c, i) => (
                    <td key={i} style={c.style}>
                      {c.v}
                    </td>
                  ))}
                </tr>
              ))}
              <tr style={{ background: 'var(--brandL)' }}>
                <td style={projLabel(true)}>Total OPEX</td>
                {opexTotalCells.map((c, i) => (
                  <td key={i} style={c.style}>
                    {c.v}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
