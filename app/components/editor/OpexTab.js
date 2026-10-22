import { useState } from 'react';
import { html } from '../../lib/html.js';
import { MP, opexItemYear, opexItemYearInfl } from '../../engine/compute.js';
import { nf, pctShare } from '../../engine/format.js';
import { NumberField } from '../NumberField.js';
import { FillLine } from '../FillLine.js';
import { useApp } from '../../state/store.js';

const projCell = (strong) => ({
  textAlign: 'right',
  padding: '7px 8px',
  fontFamily: 'var(--num)',
  fontSize: 11.5,
  whiteSpace: 'nowrap',
  fontWeight: strong ? 700 : undefined,
  borderTop: strong ? undefined : '1px solid var(--line)',
});

const projLabel = (strong) => ({
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

// Etiquetas que se muestran en dos líneas (el diccionario traduce la versión con salto)
const TWO_LINES = {
  'Aplicación foliar (calle sí/no)': 'Aplicación foliar\n(calle Sí/No)',
  'Aplicación foliar (todas hileras)': 'Aplicación foliar\n(todas las hileras)',
  'Mechanical top pruning': 'Poda mecánica\nde cobertura',
  'Mechanical side pruning': 'Poda mecánica\nlateral',
  // no es de dos líneas: se muestra como "PAC" (EN: "CAP (Common Agricultural Policy)")
  'CAP processing (Common Agricultural Policy)': 'PAC',
};
// Unidad de las partidas por kilo de aceituna: siempre "€/Kg/" y "Aceituna" en dos líneas
// (los datos la traen como '€/Kg/Olives' o '€/Kg/\nAceitunas')
const unitLabel = (u) => (/^€\/Kg\/\s*(Olives|Aceitunas?)$/.test(u) ? '€/Kg/\nAceituna' : u);
// En Sanidad vegetal la partida de productos se llama "Protección vegetal" (en
// Manejo del suelo el mismo texto del Excel sigue como "Productos fitosanitarios")
const splitLabel = (label, catKey) =>
  (catKey === 'health' || catKey === 'sanidad') && label === 'Plant protection products'
    ? 'Protección vegetal'
    : TWO_LINES[label] || label;

// Partida de plena producción (asterisco rojo): su coste es constante del año 3 en adelante
// y distinto en los años 1–2, así que la cifra de la tarjeta es la de plena producción
const fullProdOnly = (it) => {
  if (it.perKg || !Array.isArray(it.sched)) return false;
  const last = it.sched[it.sched.length - 1];
  const same = (v) => Math.abs(v - last) < 1e-9;
  // las que acaban en 0 (podas de formación, en "U") son solo de formación: sin asterisco
  return last > 0 && it.sched.slice(2).every(same) && !(same(it.sched[0]) && same(it.sched[1]));
};

export function OpexTab({ a, r, photo, photoAlt, photoObjectPosition = 'center' }) {
  const { state, onOpexField, onOpexSched, onProjHaField, canEdit } = useApp();
  const [editProj, setEditProj] = useState(false);

  const opexDetail = a.opexItems.map((cat) => {
    let catPlena = 0;
    const items = cat.items.map((it) => {
      const plena = opexItemYear(it, MP, a);
      catPlena += plena;
      return { ...it, catKey: cat.key, plenaFmt: nf(plena, 0) };
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

  // Orden base: el modelo IAG, el de su Excel; el resto, CARD_ORDER.
  const CARD_ORDER = ['malezas', 'sanidad', 'nutricion', 'terrenos', 'poda', 'riego', 'cosecha', 'otros'];
  const baseCards =
    a.engine === 'iag'
      ? opexDetail
      : CARD_ORDER.map((key) => opexCards.find((g) => g.key === key)).filter((g) => g != null);
  // Columna izquierda (pedido de Marc): Poda · Nutrición · Sanidad vegetal · Control de
  // malezas (en IAG, Mantenimiento de infraestructura va antes de malezas, a la altura de Riego);
  // el resto, a la derecha en su orden.
  // La cuadrícula es de 2 columnas, así que se intercalan izquierda/derecha.
  const LEFT = ['poda', 'pruning', 'nutricion', 'nutrition', 'sanidad', 'health', 'infra', 'malezas', 'weed'];
  // En IAG la derecha va fila a fila: Cosecha · Riego (junto a Nutrición) · Control de
  // malezas (junto a Sanidad) · Otros (junto a Mantenimiento de infraestructura)
  const RIGHT_IAG = ['harvest', 'irrigation', 'weed', 'other'];
  const leftCards = LEFT.filter((key) => !(a.engine === 'iag' && RIGHT_IAG.includes(key)))
    .map((key) => baseCards.find((g) => g.key === key))
    .filter((g) => g != null);

  const rest = baseCards.filter((g) => !leftCards.includes(g));
  const rightCards =
    a.engine === 'iag'
      ? RIGHT_IAG.map((key) => (key ? rest.find((g) => g.key === key) || null : null)).concat(
          rest.filter((g) => !RIGHT_IAG.includes(g.key)),
        )
      : rest;
  const orderedCards = [];
  for (let i = 0; i < Math.max(leftCards.length, rightCards.length); i++) {
    // un hueco vacío cuando una columna tiene menos tarjetas, para no descolocar la otra
    orderedCards.push(leftCards[i] || null, rightCards[i] || null);
  }

  // Filas de la proyección en el orden de las tarjetas de arriba: primero la columna
  // izquierda y luego la derecha (en el estándar, Riego lleva debajo Mantenimiento de infraestructura)
  const cardKeys = [...leftCards, ...rightCards]
    .filter(Boolean)
    .flatMap((g) => (a.engine !== 'iag' && g.key === 'riego' && infraCard ? ['riego', 'infra'] : [g.key]));
  const projCats = [
    ...cardKeys.map((k) => a.opexItems.find((c) => c.key === k)).filter(Boolean),
    ...a.opexItems.filter((c) => !cardKeys.includes(c.key)),
  ];
  const projHa = +state.projHa || 0;
  const horizon = r.opex.length - 1;
  const years = Array.from({ length: horizon }, (_, i) => i + 1);

  const opexProjRows = projCats.map((cat) => {
    const cells = years.map((y) => {
      let perHaY = 0;
      for (const it of cat.items) perHaY += opexItemYearInfl(it, y, a);
      const v = perHaY * projHa;
      return { v: v > 0 ? nf(v) : '·', style: projCell(false) };
    });
    return { label: cat.label, cells, labelStyle: projLabel(false) };
  });
  // Modo "Editar": una fila por sub-partida con su €/Ha (sin inflación) de cada año; se pueden
  // tocar los años 1–5; el 5 fija el importe constante del año 5 en adelante (y con él, la inflación).
  // en Editar solo se ven los años 1–5: del 5 en adelante el importe es constante
  const colYears = editProj ? years.slice(0, 5) : years;
  const editRows = projCats.map((cat) => ({
    key: cat.key,
    label: cat.label,
    items: cat.items
      .filter((it) => !it.perKg && Array.isArray(it.sched))
      .map((it) => ({ ...it, editUpTo: 5 })), // años 1–5; el 5 fija el importe constante del 5 en adelante
  }));

  const opexTotalCells = years.map((y) => {
    let tot = 0;
    for (const cat of a.opexItems) for (const it of cat.items) tot += opexItemYearInfl(it, y, a);
    return { v: nf(tot * projHa), style: projCell(true) };
  });

  const card = {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  };

  return html`
    <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
      <div style=${{ gridColumn: '1 / 4' }}>
        <div style=${{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h2 style=${{ fontSize: 18, fontWeight: 800, fontFamily: "Rockwell, 'Rockwell Nova', 'Roboto Slab', serif", margin: 0 }}>3. OPEX — Costes operativos</h2>
          <span
            style=${{
              fontSize: 11,
              background: canEdit ? 'var(--editable)' : 'var(--bg)',
              color: canEdit ? 'var(--brandD)' : 'var(--ink2)',
              border: `1px solid ${canEdit ? 'var(--editableLine)' : 'var(--line)'}`,
              padding: '2px 8px',
              borderRadius: 999,
              fontWeight: 700,
            }}
          >
            ${canEdit ? 'Cantidad y coste editables' : 'Solo lectura'}
          </span>
        </div>
        <p style=${{ color: 'var(--ink2)', fontSize: 14, margin: '0 0 20px' }}>
          Costes operativos anuales de la explotación necesarios para mantener la plantación y producir. Los importes de esta pestaña son los datos base por hectárea, sin inflación.
        </p>
        <p style=${{ color: 'var(--ink2)', fontSize: 13, margin: '-14px 0 20px' }}>
          <span style=${{ color: '#c00000', fontWeight: 700 }}>*</span>${' '}<span>Estas partidas corresponden a los valores de plena producción.</span>
        </p>
        <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          ${orderedCards.map((g, gi) =>
            !g
              ? html`<div key=${'hueco' + gi} />`
              : html`
              <div key=${g.key} style=${{ ...card, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div
                  style=${{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 18px',
                    background: 'var(--brandL)',
                    color: 'var(--brandD)',
                  }}
                >
                  <div style=${{ fontWeight: 700, fontSize: 13.5 }}>${g.title}</div>
                  <div style=${{ fontSize: 13, fontWeight: 700 }}>
                    ${g.subtotalFmt} · ${g.pct}
                  </div>
                </div>
                <div
                  style=${{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0,1fr) auto 52px 90px',
                    columnGap: 12, // aire entre Partida, cuadros, Unidad y €/Ha
                    padding: '8px 18px',
                    fontSize: 11,
                    color: 'var(--ink2)',
                    fontWeight: 600,
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  <div>Partida</div>
                  <div style=${{ display: 'flex', justifyContent: 'flex-end', gap: 17 }}>
                    <div style=${{ width: 58, display: 'flex', justifyContent: 'flex-end', whiteSpace: 'nowrap', fontSize: 10 }}><span>Cantidad</span></div>
                    <div style=${{ width: 58, display: 'flex', justifyContent: 'flex-end', whiteSpace: 'nowrap', fontSize: 10 }}><span>Coste unitario</span></div>
                  </div>
                  <div style=${{ textAlign: 'center' }}>Unidad</div>
                  <div style=${{ textAlign: 'right', whiteSpace: 'nowrap' }}>€/Ha Plena Prod.</div>
                </div>
                ${g.items.map(
                  (it, ii) => html`
                    <div
                      key=${it.key}
                      style=${{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0,1fr) auto 52px 90px',
                    columnGap: 12, // aire entre Partida, cuadros, Unidad y €/Ha
                        alignItems: 'center',
                        padding: '8px 18px',
                        // línea gris entre sub-partidas; la de la última la pone el relleno de abajo
                        borderBottom: ii < g.items.length - 1 ? '1px solid var(--line)' : 'none',
                      }}
                    >
                      <div lang=${state.lang === "en" ? "en" : "es"} style=${{ fontSize: 13.5, whiteSpace: 'pre-line', hyphens: 'auto', overflowWrap: 'anywhere' }}>${splitLabel(it.label, it.catKey)}${fullProdOnly(it) && html`<span style=${{ color: "#c00000", fontWeight: 700 }}>*</span>`}</div>
                      <div style=${{ display: 'flex', justifyContent: 'flex-end', gap: 17 }}>
                        <${NumberField}
                          id=${'op:cant:' + it.catKey + '.' + it.key}
                          value=${it.cant}
                          width=${61}
                          style=${{ fontSize: 13.5 }}
                          onChangeRaw=${(raw) => onOpexField(it.catKey, it.key, 'cant', raw)}
                        />
                        <${NumberField}
                          id=${'op:coste:' + it.catKey + '.' + it.key}
                          value=${it.coste}
                          width=${61}
                          style=${{ fontSize: 13.5 }}
                          onChangeRaw=${(raw) => onOpexField(it.catKey, it.key, 'coste', raw)}
                        />
                      </div>
                      <div style=${{ textAlign: 'center', fontSize: 12, color: 'var(--ink2)', whiteSpace: 'pre-line' }}>${unitLabel(it.unidad)}</div>
                      <div style=${{ textAlign: 'right', fontFamily: 'var(--num)', fontSize: 14 }}>${it.plenaFmt}</div>
                    </div>
                  `,
                )}
                <!-- relleno hasta el borde: su sombra interior dibuja la línea bajo la última
                     sub-partida solo si queda espacio en blanco claro -->
                <${FillLine} />
              </div>
            `,
          )}
          <div
            style=${{
              gridColumn: '1 / -1',
              ...card,
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
            <div style=${{ fontFamily: 'var(--num)', fontSize: 14 }}>
              ${nf(r.opexHa)} € · ${nf((r.opexHa * a.superficie) / 1000, 0)} k€ total
            </div>
          </div>
        </div>
      </div>
      ${photo &&
      html`
        <img
          src=${photo}
          alt=${photoAlt}
          style=${{
            gridColumn: '4 / 5',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: photoObjectPosition,
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow)',
          }}
        />
      `}
    </div>

    <div>
      <div style=${{ display: 'flex', alignItems: 'flex-end', gap: 12, margin: '26px 0 8px', flexWrap: 'wrap' }}>
        <div>
          <h3 style=${{ fontSize: 15, fontWeight: 800, margin: 0 }}>${'Proyección OPEX a ' + horizon + ' años'}</h3>
          <div style=${{ fontSize: 11, color: 'var(--ink2)', marginTop: 3 }}>
            ${editProj ? '€/Ha por año · sin inflación · la inflación empieza en el 2º año igual' : '€/Ha por año · con inflación'}
          </div>
        </div>
        ${canEdit &&
        html`
          <button
            className="lift"
            onClick=${() => setEditProj(!editProj)}
            style=${{
              marginLeft: 12,
              padding: '6px 14px',
              borderRadius: 999,
              border: '1px solid ' + (editProj ? 'var(--brandD)' : 'var(--editableLine)'),
              background: editProj ? 'var(--brandD)' : 'var(--surface)',
              color: editProj ? '#fff' : 'var(--brandD)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ${editProj ? 'Listo' : 'Editar'}
          </button>
        `}
        <div
          style=${{
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
          <span style=${{ fontSize: 12, color: 'var(--ink2)', fontWeight: 600 }}>Hectáreas</span>
          <${NumberField} id="ui:projHa" value=${state.projHa} width=${72} onChangeRaw=${onProjHaField} />
          <span style=${{ fontSize: 12, color: 'var(--ink2)' }}>Ha</span>
        </div>
      </div>
      <div style=${{ ...card, overflow: 'auto' }}>
        <table style=${{ borderCollapse: 'collapse', width: '100%', fontSize: 12, tableLayout: editProj ? 'fixed' : undefined }}>
          <thead>
            <tr>
              <th
                style=${{
                  textAlign: 'left',
                  padding: '9px 12px',
                  position: 'sticky',
                  left: 0,
                  background: 'var(--brandL)',
                  color: 'var(--brandD)',
                  fontSize: 11,
                  zIndex: 2,
                  // en Editar: Partida a ancho fijo; los años 1–5 y una columna vacía al final se
                  // reparten el resto por igual (así el hueco de la derecha mide lo mismo que el resto)
                  width: editProj ? 320 : undefined,
                }}
              >
                Partida
              </th>
              ${colYears.map(
                (y) => html`
                  <th
                    key=${y}
                    style=${{
                      textAlign: 'right',
                      padding: '9px 8px',
                      background: 'var(--brandL)',
                      color: 'var(--brandD)',
                      fontFamily: 'var(--num)',
                      fontSize: 11,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ${editProj && y === 5 ? 'Constante 5–' + horizon : y}
                  </th>
                `,
              )}
            ${editProj && html`<th style=${{ background: 'var(--brandL)' }}></th>`}
            </tr>
          </thead>
          ${editProj
            ? html`<tbody>
                ${editRows.map(
                  (cat) => html`
                    <tr key=${'c:' + cat.key} style=${{ background: 'var(--brandL)' }}>
                      <td style=${projLabel(true)}>${cat.label}</td>
                      ${colYears.map((y) => html`<td key=${y} style=${projCell(true)}></td>`)}
                      <td></td>
                    </tr>
                    ${cat.items.map(
                      (it) => html`
                        <tr key=${cat.key + '.' + it.key}>
                          <td style=${{ ...projLabel(false), paddingLeft: 22 }}>${it.label}</td>
                          ${colYears.map((y) => {
                            const v = opexItemYear(it, y, a);
                            if (y > it.editUpTo) return html`<td key=${y} style=${{ ...projCell(false), paddingRight: 8 }}>${v > 0 ? nf(v) : '·'}</td>`;
                            return html`
                              <td key=${y} style=${{ ...projCell(false), padding: '3px 4px', paddingRight: 8 }}>
                                <${NumberField}
                                  id=${'os:' + cat.key + '.' + it.key + ':' + (y - 1)}
                                  value=${v}
                                  width=${64}
                                  style=${{ fontSize: 12, padding: '3px 5px' }}
                                  onChangeRaw=${(raw) => onOpexSched(cat.key, it.key, y - 1, raw)}
                                />
                              </td>
                            `;
                          })}
                          <td style=${{ borderTop: "1px solid var(--line)" }}></td>
                        </tr>
                      `,
                    )}
                  `,
                )}
              </tbody>`
            : html`<tbody>
            ${opexProjRows.map(
              (row) => html`
                <tr key=${row.label}>
                  <td style=${row.labelStyle}>${row.label}</td>
                  ${row.cells.map((c, i) => html`<td key=${i} style=${c.style}>${c.v}</td>`)}
                </tr>
              `,
            )}
            <tr style=${{ background: 'var(--brandL)' }}>
              <td style=${projLabel(true)}>Total OPEX</td>
              ${opexTotalCells.map((c, i) => html`<td key=${i} style=${c.style}>${c.v}</td>`)}
            </tr>
          </tbody>`}
        </table>
      </div>
    </div>
  `;
}
