// Formato de números según el idioma de la interfaz: en español "1.234,5" y en
// inglés "1,234.5". El idioma lo fija el store con setNumLang() antes de pintar.
let lang = 'es';

export function setNumLang(l) {
  lang = l === 'en' ? 'en' : 'es';
}

const loc = () => (lang === 'en' ? 'en-US' : 'es-ES');
const decSep = () => (lang === 'en' ? '.' : ',');

export function parseNum(str) {
  const t = String(str).replace(/\s/g, '');
  const c = lang === 'en' ? t.replace(/,/g, '') : t.replace(/\./g, '').replace(',', '.');
  const v = parseFloat(c);
  return isNaN(v) ? 0 : v;
}

// Quita los separadores de miles de un número ya formateado (al empezar a editarlo).
export function stripGrouping(str) {
  return String(str).replace(lang === 'en' ? /,/g : /\./g, '');
}

export function fmt2(n) {
  if (n == null || isNaN(n)) return '';
  return Number(n).toLocaleString(loc(), {
    useGrouping: 'always',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function nf(n, d = 0) {
  if (n == null || !isFinite(n)) return '—';
  return Number(n).toLocaleString(loc(), {
    useGrouping: 'always',
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

export function pct(n, d = 2) {
  if (n == null || !isFinite(n)) return '—';
  return (n * 100).toFixed(d).replace('.', decSep()) + '%';
}

// Diferencia en puntos porcentuales con signo (comparación de escenarios).
export function pp(d) {
  return (d * 100 >= 0 ? '+' : '') + (d * 100).toFixed(1).replace('.', decSep()) + ' pp';
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
