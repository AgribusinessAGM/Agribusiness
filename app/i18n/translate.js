import { PAIRS, PATTERNS } from './dict.js';

// Traducción ES <-> EN de todo el texto visible, igual que el diseño de Claude Design:
// los componentes se escriben en un idioma (casi siempre español; el modelo IAG trae
// sus partidas en inglés) y este módulo reescribe los nodos de texto del DOM según
// el idioma elegido. Un MutationObserver traduce también lo que React vaya pintando.
// Lo que esté dentro de un elemento con data-i18n-skip no se toca.

let current = 'es';
let maps = null;
let cache = null;
const originals = new WeakMap(); // nodo de texto -> { orig, tr }
let observer = null;

function build() {
  const mk = (dir) => {
    const exact = new Map();
    for (const p of PAIRS) {
      const a = dir === 'en' ? p[0] : p[1];
      const b = dir === 'en' ? p[1] : p[0];
      if (a && a.trim() !== b.trim()) exact.set(a.trim(), b.trim());
    }
    const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const keys = [...exact.keys()]
      .filter((k) => k.length >= 3 && /[A-Za-zÀ-ÿ]/.test(k))
      .sort((x, y) => y.length - x.length);
    const alt = keys
      .map(
        (k) =>
          (/^[\p{L}\p{N}]/u.test(k) ? '(?<![\\p{L}\\p{N}])' : '') +
          esc(k) +
          (/[\p{L}\p{N}]$/u.test(k) ? '(?![\\p{L}\\p{N}])' : ''),
      )
      .join('|');
    // Hacia el español solo se traducen textos completos (las partidas en inglés del
    // Excel IAG): los textos de la app ya están en español y sustituir palabras sueltas
    // los estropearía (p. ej. "Precio EVOO" pasaría a "Precio AOVE").
    return { exact, pat: PATTERNS[dir] || [], rx: alt && dir === 'en' ? new RegExp(alt, 'gu') : null };
  };
  maps = { en: mk('en'), es: mk('es') };
  cache = { en: new Map(), es: new Map() };
}

// Traduce una cadena: primero coincidencia exacta, luego patrones (p. ej. "Año 3"),
// y si no, sustituye las frases conocidas que aparezcan dentro del texto.
export function tr(str, lang = current) {
  if (!maps) build();
  const c = cache[lang];
  if (c.has(str)) return c.get(str);
  let out = str;
  const core = str.trim();
  if (core && /[A-Za-zÀ-ÿ]/.test(core)) {
    const m = maps[lang];
    let r;
    if (m.exact.has(core)) r = m.exact.get(core);
    else {
      for (const [re, rep] of m.pat) {
        if (re.test(core)) {
          r = core.replace(re, rep);
          break;
        }
      }
      if (r == null) r = m.rx ? core.replace(m.rx, (x) => m.exact.get(x) || x) : core;
    }
    const i = str.indexOf(core);
    out = str.slice(0, i) + r + str.slice(i + core.length);
  }
  c.set(str, out);
  return out;
}

function textNode(n) {
  const p = n.parentElement;
  if (!p || p.closest('[data-i18n-skip],script,style')) return;
  const t = originals.get(n);
  const cur = n.data;
  const base = t && cur === t.tr ? t.orig : cur;
  const out = tr(base, current);
  if (out !== cur) n.data = out;
  if (out !== base || t) originals.set(n, { orig: base, tr: out });
}

function attrs(el) {
  if (el.closest('[data-i18n-skip]')) return;
  for (const a of ['placeholder', 'title', 'alt']) {
    if (!el.hasAttribute(a)) continue;
    const st = el.__i18n || (el.__i18n = {});
    const cur = el.getAttribute(a);
    const t = st[a];
    const base = t && cur === t.tr ? t.orig : cur;
    const out = tr(base, current);
    if (out !== cur) el.setAttribute(a, out);
    st[a] = { orig: base, tr: out };
  }
}

function node(n) {
  if (!n || !n.isConnected) return;
  if (n.nodeType === 3) {
    textNode(n);
    return;
  }
  if (n.nodeType !== 1) return;
  const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT);
  let x;
  while ((x = w.nextNode())) textNode(x);
  if (n.matches('[placeholder],[title],[alt]')) attrs(n);
  n.querySelectorAll('[placeholder],[title],[alt]').forEach(attrs);
}

// Mientras traducimos, el observador se desconecta para no traducir nuestros propios cambios.
function run(fn) {
  if (observer) observer.disconnect();
  try {
    fn();
  } finally {
    if (observer) observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'alt'] });
  }
}

// Traduce ya (sin esperar al observador) un trozo recién pintado; p. ej. las páginas
// que se copian a <body> justo antes de imprimir, que si no saldrían sin traducir.
export function translateNow(el) {
  run(() => node(el));
}

export function setLanguage(lang) {
  current = lang === 'en' ? 'en' : 'es';
  document.documentElement.lang = current;
  if (!observer) {
    observer = new MutationObserver((recs) => {
      const nodes = new Set();
      for (const r of recs) {
        if (r.type === 'childList') r.addedNodes.forEach((a) => nodes.add(a));
        else nodes.add(r.target);
      }
      run(() => nodes.forEach(node));
    });
  }
  run(() => node(document.body));
}
