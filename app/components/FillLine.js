import { useEffect, useRef, useState } from 'react';
import { html } from '../lib/html.js';

// Relleno hasta el borde inferior de una tarjeta. Dibuja la línea gris bajo la última
// fila solo cuando debajo queda un espacio en blanco claro (si el hueco es muy pequeño,
// la línea se juntaría con el borde de la tarjeta).
const MIN_GAP = 20;

export function FillLine() {
  const ref = useRef(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setShow(el.clientHeight >= MIN_GAP);
    fit();
    // tras el primer pintado la tarjeta ya tiene su altura final
    const raf = requestAnimationFrame(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);
  return html`<div ref=${ref} style=${{ flex: 1, boxShadow: show ? 'inset 0 1px 0 var(--line)' : 'none' }} />`;
}
