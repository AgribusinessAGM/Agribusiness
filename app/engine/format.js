export function parseNum(str) {
  const c = String(str).replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const v = parseFloat(c);
  return isNaN(v) ? 0 : v;
}

export function fmt2(n) {
  if (n == null || isNaN(n)) return '';
  return Number(n).toLocaleString('es-ES', {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function nf(n, d = 0) {
  if (n == null || !isFinite(n)) return '—';
  return Number(n).toLocaleString('es-ES', {
    useGrouping: true,
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

export function pct(n, d = 2) {
  if (n == null || !isFinite(n)) return '—';
  return (n * 100).toFixed(d).replace('.', ',') + '%';
}

export function k(n) {
  return nf(n) + ' k€';
}

// Porcentaje entero para "% del total" (share dentro de un grupo/categoría)
export function pctShare(n) {
  if (n == null || !isFinite(n)) return '—';
  return Math.round(n * 100) + '%';
}

// Formato contable tipo Excel: negativos entre paréntesis, cero como "-"
export function nfAcc(n, d = 0) {
  if (n == null || !isFinite(n)) return '—';
  if (Math.round(n * Math.pow(10, d)) === 0) return '-';
  const a = nf(Math.abs(n), d);
  return n < 0 ? '(' + a + ')' : a;
}
