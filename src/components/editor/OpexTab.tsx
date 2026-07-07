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

export function OpexTab({ a, r }: { a: Assumptions; r: ComputeResult }) {
  const { state, onOpexField, onProjHaField, canEdit } = useApp();

  const opexDetail = a.opexItems.map((cat) => {
    let catPlena = 0;
    const items = cat.items.map((it) => {
      const scale = opexItemScale(it);
      const plena = opexYear(it.sched, MP) * scale;
      catPlena += plena;
      return { ...it, plenaFmt: nf(plena, 0) };
    });
    return {
      key: cat.key,
      title: cat.label,
      items,
      subtotalFmt: nf(catPlena, 0) + ' €/Ha',
      pct: pctShare(catPlena / r.opexHa),
    };
  });

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
      <div style={{ maxWidth: 1080 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1080 }}>
          {opexDetail.map((g) => (
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
                <div style={{ fontFamily: 'var(--num)', fontSize: 13, fontWeight: 700 }}>
                  {g.subtotalFmt} · {g.pct}
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2.4fr 0.9fr 1fr 0.8fr 1fr',
                  padding: '8px 18px',
                  fontSize: 11,
                  color: 'var(--ink2)',
                  fontWeight: 600,
                  borderBottom: '1px solid var(--line)',
                }}
              >
                <div>Sub-partida</div>
                <div style={{ textAlign: 'right' }}>Cantidad</div>
                <div style={{ textAlign: 'right' }}>Coste unitario</div>
                <div style={{ textAlign: 'center' }}>Unidad</div>
                <div style={{ textAlign: 'right' }}>€/Ha pleno</div>
              </div>
              {g.items.map((it) => (
                <div
                  key={it.key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2.4fr 0.9fr 1fr 0.8fr 1fr',
                    alignItems: 'center',
                    padding: '8px 18px',
                    borderTop: '1px solid var(--line)',
                  }}
                >
                  <div style={{ fontSize: 13.5 }}>{it.label}</div>
                  <div style={{ textAlign: 'right' }}>
                    <NumberField
                      id={'op:cant:' + g.key + '.' + it.key}
                      value={it.cant}
                      width={74}
                      style={{ fontSize: 13.5 }}
                      onChangeRaw={(raw) => onOpexField(g.key, it.key, 'cant', raw)}
                    />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <NumberField
                      id={'op:coste:' + g.key + '.' + it.key}
                      value={it.coste}
                      width={92}
                      style={{ fontSize: 13.5 }}
                      onChangeRaw={(raw) => onOpexField(g.key, it.key, 'coste', raw)}
                    />
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink2)' }}>{it.unidad}</div>
                  <div style={{ textAlign: 'right', fontFamily: 'var(--num)', fontSize: 14 }}>{it.plenaFmt}</div>
                </div>
              ))}
            </div>
          ))}
          <div
            style={{
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
