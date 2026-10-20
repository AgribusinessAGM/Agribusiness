import { html } from '../../lib/html.js';
import { pct } from '../../engine/format.js';
import { useApp } from '../../state/store.js';

// Páginas del informe PDF (Report.js); el modelo normal tiene una más: el Fondo.
const PAGES = [
  ['Portada', false],
  ['Resumen ejecutivo', false],
  ['Inversión inicial · CAPEX', false],
  ['Rentabilidad del proyecto', true],
  ['Rentabilidad del SPV', true],
  ['Rentabilidad del Fondo', true],
  ['Estructura financiera', false],
  ['Aviso legal', false],
];

export function InformeTab({ a, r, title }) {
  const { exportPdf } = useApp();
  const isIAG = a.engine === 'iag';
  const pages = PAGES.filter(([name]) => !(isIAG && name === 'Rentabilidad del Fondo'));

  const card = {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    overflow: 'hidden',
  };

  return html`
    <div>
      <h2 style=${{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>${title}</h2>
      <p style=${{ color: 'var(--ink2)', fontSize: 14, margin: '0 0 18px' }}>
        Informe PDF con los resultados del modelo, calculado con los supuestos actuales. Ábrelo para revisarlo e imprimirlo o guardarlo como PDF.
      </p>
      <div style=${{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, alignItems: 'start' }}>
        <div style=${card}>
          <div style=${{ padding: '11px 16px', background: 'var(--brandL)', color: 'var(--brandD)', fontWeight: 800, fontSize: 14 }}>
            ${'Contenido · ' + pages.length + ' páginas'}
          </div>
          <div style=${{ padding: '6px 16px' }}>
            ${pages.map(
              ([name, landscape], i) => html`
                <div
                  key=${name}
                  style=${{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '9px 0',
                    borderBottom: i < pages.length - 1 ? '1px solid var(--line)' : undefined,
                    fontSize: 13.5,
                  }}
                >
                  <span style=${{ width: 22, color: 'var(--ink2)', fontFamily: 'var(--num)' }}>${i + 1}</span>
                  <span style=${{ flex: 1 }}>${name}</span>
                  ${landscape && html`<span style=${{ fontSize: 11, color: 'var(--ink2)' }}>horizontal</span>`}
                </div>
              `,
            )}
          </div>
        </div>
        <div style=${{ ...card, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style=${{ fontSize: 11, color: 'var(--ink2)', textTransform: 'uppercase', fontWeight: 600 }}>TIR agrícola</div>
            <div style=${{ fontFamily: 'var(--num)', fontSize: 20, fontWeight: 600 }}>${pct(r.tirA)}</div>
          </div>
          <div>
            <div style=${{ fontSize: 11, color: 'var(--ink2)', textTransform: 'uppercase', fontWeight: 600 }}>TIR SPV</div>
            <div style=${{ fontFamily: 'var(--num)', fontSize: 20, fontWeight: 600 }}>${pct(r.tirL)}</div>
          </div>
          <button
            onClick=${exportPdf}
            className="lift"
            style=${{
              background: 'var(--brandD)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius)',
              padding: '11px 16px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Abrir informe PDF
          </button>
          <div style=${{ fontSize: 12, color: 'var(--ink2)' }}>
            En el cuadro de impresión elige «Guardar como PDF».
          </div>
        </div>
      </div>
    </div>
  `;
}
