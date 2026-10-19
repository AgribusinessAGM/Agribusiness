import type { ComputeResult } from '../../engine/compute';
import { chartColors as c } from './theme';

export function FcfChart({ r }: { r: ComputeResult }) {
  const YR = Math.min(r.fcfAcum.length, 26);
  const W = 760;
  const H = 300;
  const pad = 30;
  const d = r.fcfAcum.slice(0, YR);
  const min = Math.min(...d, 0);
  const max = Math.max(...d, 0);
  const sx = (i: number) => pad + i * ((W - pad * 2) / (YR - 1));
  const sy = (v: number) => {
    const t = (v - min) / (max - min || 1);
    return H - pad - t * (H - pad * 2);
  };
  const zero = sy(0);
  const pts = d.map((v, i) => sx(i) + ',' + sy(v)).join(' ');
  const area =
    'M ' + sx(0) + ',' + zero + ' L ' + d.map((v, i) => sx(i) + ',' + sy(v)).join(' L ') + ' L ' + sx(YR - 1) + ',' + zero + ' Z';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: '100%', display: 'block' }}>
      <path d={area} fill={c.brand} opacity={0.1} />
      <line x1={pad} y1={zero} x2={W - pad} y2={zero} stroke={c.line} strokeDasharray="3 3" />
      <polyline points={pts} fill="none" stroke={c.brand} strokeWidth={2.5} />
      {Array.from({ length: YR }, (_, i) => i)
        .filter((i) => i % 3 === 0)
        .map((i) => (
          <text key={i} x={sx(i)} y={H - 8} fill={c.ink2} fontSize={9} textAnchor="middle" fontFamily={c.num}>
            {i}
          </text>
        ))}
      {r.payback != null && r.payback < YR && (
        <circle cx={sx(r.payback)} cy={sy(r.fcfAcum[r.payback])} r={5} fill={c.accent} stroke="#fff" strokeWidth={2} />
      )}
    </svg>
  );
}
