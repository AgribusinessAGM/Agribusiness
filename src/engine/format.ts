export function parseNum(str: string): number {
  const c = String(str).replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const v = parseFloat(c);
  return isNaN(v) ? 0 : v;
}

export function fmt2(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '';
  return Number(n).toLocaleString('es-ES', {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function nf(n: number | null | undefined, d = 0): string {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('es-ES', {
    useGrouping: true,
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

export function pct(n: number | null | undefined, d = 2): string {
  if (n == null || isNaN(n)) return '—';
  return (n * 100).toFixed(d).replace('.', ',') + '%';
}

export function k(n: number | null | undefined): string {
  return nf(n) + ' k€';
}

// Formato contable tipo Excel: negativos entre paréntesis, cero como "-"
export function nfAcc(n: number | null | undefined, d = 0): string {
  if (n == null || isNaN(n)) return '—';
  if (Math.round(n * Math.pow(10, d)) === 0) return '-';
  const a = nf(Math.abs(n), d);
  return n < 0 ? '(' + a + ')' : a;
}
