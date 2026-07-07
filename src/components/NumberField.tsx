import type { CSSProperties } from 'react';
import { useApp } from '../state/store';

interface NumberFieldProps {
  id: string;
  value: number;
  onChangeRaw: (raw: string) => void;
  width?: number;
  style?: CSSProperties;
}

export function NumberField({ id, value, onChangeRaw, width = 98, style }: NumberFieldProps) {
  const { edVal, onNumFocus, onNumBlur, canEdit } = useApp();
  const disp = edVal(id, value);
  return (
    <input
      type="text"
      inputMode="decimal"
      value={disp}
      readOnly={!canEdit}
      onFocus={(e) => canEdit && onNumFocus(id, e.target.value)}
      onBlur={onNumBlur}
      onChange={(e) => canEdit && onChangeRaw(e.target.value)}
      style={{
        width,
        textAlign: 'right',
        fontFamily: 'var(--num)',
        fontSize: 14,
        padding: '6px 8px',
        border: canEdit ? '1px solid var(--editableLine)' : '1px solid var(--line)',
        background: canEdit ? 'var(--editable)' : 'transparent',
        borderRadius: 6,
        color: 'var(--ink)',
        cursor: canEdit ? 'text' : 'default',
        ...style,
      }}
    />
  );
}
