import { k, nf, pct } from '../engine/format';
import { useApp } from '../state/store';
import { useActiveCompute } from '../state/useActiveCompute';
import { BarsChart } from './charts/BarsChart';
import { FcfChart } from './charts/FcfChart';

export function Results() {
  const { state, gotoEditor, saveScenario, clearScenario, exportPdf } = useApp();
  const { model, a, r } = useActiveCompute();

  const kpiCards = [
    { label: 'TIR Fondo', value: pct(r.tirF), sub: 'resultado final inversor' },
    { label: 'TIR SPV', value: pct(r.tirL), sub: 'con fees y deuda' },
    { label: 'TIR Agrícola', value: pct(r.tirA), sub: 'proyecto sin deuda' },
    { label: 'VAN Fondo (8%)', value: k(r.vanF), sub: 'flujos del fondo' },
    { label: 'Inversión total', value: nf(r.totalCapex / 1000, 2) + ' M€', sub: nf(a.superficie) + ' Ha' },
    { label: 'Payback', value: r.payback != null ? 'Año ' + r.payback : '>35a', sub: 'FCF acumulado > 0' },
  ];

  let compareRows: { label: string; base: string; now: string; delta: string; deltaColor: string }[] = [];
  if (state.scenario) {
    const b = state.scenario;
    const dl = (now: number, base: number, pctpts?: boolean) => {
      const d = now - base;
      const col = d >= 0 ? 'var(--brand)' : '#c0392b';
      const val = pctpts
        ? (d * 100 >= 0 ? '+' : '') + (d * 100).toFixed(1).replace('.', ',') + ' pp'
        : (d >= 0 ? '+' : '') + nf(d);
      return { delta: val, deltaColor: col };
    };
    compareRows = [
      { label: 'TIR Fondo', base: pct(b.tirF), now: pct(r.tirF), ...dl(r.tirF ?? NaN, b.tirF ?? NaN, true) },
      { label: 'TIR SPV', base: pct(b.tirL), now: pct(r.tirL), ...dl(r.tirL ?? NaN, b.tirL ?? NaN, true) },
      { label: 'TIR Agrícola', base: pct(b.tirA), now: pct(r.tirA), ...dl(r.tirA ?? NaN, b.tirA ?? NaN, true) },
      { label: 'VAN Fondo (8%) k€', base: nf(b.van), now: nf(r.vanF), ...dl(r.vanF, b.van) },
    ];
  }

  return (
    <main style={{ maxWidth: 1120, width: '100%', margin: '0 auto', padding: '30px 26px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 14,
          marginBottom: 22,
        }}
      >
        <div>
          <button
            onClick={gotoEditor}
            style={{ background: 'none', border: 'none', color: 'var(--ink2)', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '0 0 6px' }}
          >
            ‹ Volver al editor
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{model.name} · Resultados</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => saveScenario({ tirA: r.tirA, tirL: r.tirL, tirF: r.tirF, van: r.vanF, ebitda: r.ebitda[8] })}
            style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '10px 15px', fontWeight: 600, cursor: 'pointer', fontSize: 13, color: 'var(--ink)' }}
          >
            Guardar escenario actual
          </button>
          <button
            onClick={exportPdf}
            className="lift"
            style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '10px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
          >
            Exportar informe
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 22 }}>
        {kpiCards.map((kc) => (
          <div key={kc.label} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '16px 18px' }}>
            <div style={{ fontSize: 11, color: 'var(--ink2)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>{kc.label}</div>
            <div style={{ fontFamily: 'var(--num)', fontSize: 26, fontWeight: 600, marginTop: 4, color: 'var(--ink)' }}>{kc.value}</div>
            <div style={{ fontSize: 12, color: 'var(--ink2)', marginTop: 2 }}>{kc.sub}</div>
          </div>
        ))}
      </div>

      {state.scenario && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--editableLine)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '16px 18px', marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Comparación de escenarios</div>
            <button onClick={clearScenario} style={{ background: 'none', border: 'none', color: 'var(--ink2)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              Limpiar
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 10, fontSize: 13 }}>
            <div style={{ fontWeight: 700, color: 'var(--ink2)' }} />
            <div style={{ fontWeight: 700, color: 'var(--ink2)', textAlign: 'right' }}>Escenario guardado</div>
            <div style={{ fontWeight: 700, color: 'var(--ink2)', textAlign: 'right' }}>Actual</div>
            <div style={{ fontWeight: 700, color: 'var(--ink2)', textAlign: 'right' }}>Δ</div>
            {compareRows.flatMap((row) => [
              <div key={row.label + 'l'} style={{ borderTop: '1px solid var(--line)', paddingTop: 8 }}>{row.label}</div>,
              <div key={row.label + 'b'} style={{ borderTop: '1px solid var(--line)', paddingTop: 8, textAlign: 'right', fontFamily: 'var(--num)' }}>{row.base}</div>,
              <div key={row.label + 'n'} style={{ borderTop: '1px solid var(--line)', paddingTop: 8, textAlign: 'right', fontFamily: 'var(--num)' }}>{row.now}</div>,
              <div key={row.label + 'd'} style={{ borderTop: '1px solid var(--line)', paddingTop: 8, textAlign: 'right', fontFamily: 'var(--num)', color: row.deltaColor, fontWeight: 600 }}>{row.delta}</div>,
            ])}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Ingresos vs OPEX por año</div>
          <div style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 12 }}>
            <span style={{ color: 'var(--brand)', fontWeight: 700 }}>■</span> Ingresos{' '}
            <span style={{ color: 'var(--muted)', fontWeight: 700 }}>■</span> OPEX &nbsp;·&nbsp; k€
          </div>
          <BarsChart r={r} />
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>FCF acumulado (sin apalancar)</div>
          <div style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 12 }}>El punto marca el año de payback · k€</div>
          <FcfChart r={r} />
        </div>
      </div>
    </main>
  );
}
