import type { ComputeResult } from '../../engine/compute';
import { chartColors as c } from './theme';

export function BarsChart({ r }: { r: ComputeResult }) {
  const YR = 16;
  const W = 760;
  const H = 300;
  const pad = 30;
  const ing = r.ingresos.slice(1, YR + 1);
  const op = r.opex.slice(1, YR + 1);
  const max = Math.max(...ing, ...op, 1);
  const bw = (W - pad * 2) / YR;
  const base = H - pad;
  const y = (v: number) => base - (v / max) * (H - pad * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: '100%', display: 'block' }}>
      <line x1={pad} y1={base} x2={W - pad} y2={base} stroke={c.line} />
      {Array.from({ length: YR }, (_, i) => {
        const x = pad + i * bw;
        return (
          <g key={i}>
            <rect x={x + bw * 0.16} y={y(ing[i])} width={bw * 0.32} height={base - y(ing[i])} fill={c.brand} rx={2} />
            <rect x={x + bw * 0.52} y={y(op[i])} width={bw * 0.32} height={base - y(op[i])} fill={c.muted} rx={2} />
            {i % 2 === 0 && (
              <text x={x + bw * 0.5} y={base + 14} fill={c.ink2} fontSize={9} textAnchor="middle" fontFamily={c.num}>
                {i + 1}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
