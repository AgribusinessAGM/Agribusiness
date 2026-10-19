import { html } from '../lib/html.js';
import { useApp } from '../state/store.js';

// Celda numérica editable (azul si el usuario puede editar, transparente si no).
// Props: id, value, onChangeRaw(raw), width (por defecto 98), style.
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
      onChange=${(e) => canEdit && onChangeRaw(e.target.value)}
      style=${{
        width,
        textAlign: 'right',
        fontFamily: 'var(--num)',
        fontSize: 14,
        padding: '6px 8px',
        border: canEdit ? '1px solid var(--editableLine)' : '1px solid var(--line)',
        background: canEdit ? '#dceaf7' : 'transparent',
        borderRadius: 6,
        color: canEdit ? '#0000ff' : 'var(--ink)',
        cursor: canEdit ? 'text' : 'default',
        ...style,
      }}
    />
  `;
}
