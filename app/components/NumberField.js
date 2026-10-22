import { html } from '../lib/html.js';
import { useApp } from '../state/store.js';

// Celda numérica editable (azul si el usuario puede editar, transparente si no).
// Props: id, value, onChangeRaw(raw), width (por defecto 98), style.

// Intro cierra la edición y deja fijado el valor (igual que salir de la casilla)
const blurOnEnter = (e) => {
  if (e.key === 'Enter') e.target.blur();
};

export function NumberField({ id, value, onChangeRaw, width = 98, style }) {
  const { edVal, onNumFocus, onNumBlur, canEdit } = useApp();
  const disp = edVal(id, value);
  return html`
    <input
      type="text"
      inputMode="decimal"
      value=${disp}
      readOnly=${!canEdit}
      onFocus=${(e) => canEdit && onNumFocus(id, e.target.value)}
      onBlur=${onNumBlur}
      onKeyDown=${blurOnEnter}
      onChange=${(e) => canEdit && onChangeRaw(e.target.value)}
      style=${{
        width: width - 3, // todos los campos 3 px más estrechos
        textAlign: 'right',
        fontFamily: 'var(--num)',
        fontSize: 14,
        padding: '6px 8px',
        border: canEdit ? '1px solid var(--editableLine)' : '1px solid var(--line)',
        background: canEdit ? 'rgba(220, 234, 247, 0.75)' : 'transparent', // azul #dceaf7 con un 25 % de transparencia
        borderRadius: 6,
        color: canEdit ? '#0000ff' : 'var(--ink)',
        cursor: canEdit ? 'text' : 'default',
        ...style,
      }}
    />
  `;
}
