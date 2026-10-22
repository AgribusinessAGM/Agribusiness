// TEMPORAL: botón "Edición de texto" para retocar textos directamente en la página.
// Los cambios solo viven en pantalla; "Copiar cambios" copia la lista (antes → después)
// para pasarla a Claude y aplicarla en el código. Quitar este archivo y su <script> al acabar.

const originals = new Map(); // nodo de texto -> texto original
let on = false;

const obs = new MutationObserver((muts) => {
  for (const m of muts) {
    if (m.type === 'characterData' && !originals.has(m.target)) originals.set(m.target, m.oldValue);
  }
});

function changes() {
  const out = [];
  for (const [node, before] of originals) {
    const after = node.nodeValue;
    if (before !== after) out.push(`ANTES: ${before}\nDESPUÉS: ${after}`);
  }
  return out;
}

const box = document.createElement('div');
box.style.cssText =
  'position:fixed;right:16px;bottom:16px;z-index:99999;display:flex;gap:6px;font:600 12px system-ui,sans-serif';
box.setAttribute('contenteditable', 'false');
// al imprimir (informe PDF) los botones no salen
box.className = 'dev-text-edit';
const printCss = document.createElement('style');
printCss.textContent = '@media print { .dev-text-edit { display: none !important; } }';
document.head.appendChild(printCss);
const btn = (label) => {
  const b = document.createElement('button');
  b.textContent = label;
  b.style.cssText =
    'padding:8px 12px;border-radius:999px;border:1px solid #2f5d3a;background:#fff;color:#2f5d3a;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15)';
  box.appendChild(b);
  return b;
};
const toggle = btn('Edición de texto');
const copy = btn('Copiar cambios (0)');
copy.style.display = 'none';

const refresh = () => (copy.textContent = `Copiar cambios (${changes().length})`);
document.addEventListener('input', () => on && refresh());

toggle.onclick = () => {
  on = !on;
  document.designMode = on ? 'on' : 'off';
  toggle.textContent = on ? 'Terminar edición' : 'Edición de texto';
  toggle.style.background = on ? '#2f5d3a' : '#fff';
  toggle.style.color = on ? '#fff' : '#2f5d3a';
  copy.style.display = on || changes().length ? '' : 'none';
  if (on) obs.observe(document.body, { subtree: true, characterData: true, characterDataOldValue: true });
  else obs.disconnect();
  refresh();
};

copy.onclick = async () => {
  const txt = changes().join('\n\n') || '(sin cambios)';
  try {
    await navigator.clipboard.writeText(txt);
    copy.textContent = 'Copiado ✓';
    setTimeout(refresh, 1500);
  } catch {
    window.prompt('Copia los cambios:', txt);
  }
};

document.body.appendChild(box);
