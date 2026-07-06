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
  const { edVal, onNumFocus, onNumBlur } = useApp();
  const disp = edVal(id, value);
  return (
    <input
      type="text"
      inputMode="decimal"
      value={disp}
      onFocus={(e) => onNumFocus(id, e.target.value)}
      onBlur={onNumBlur}
      onChange={(e) => onChangeRaw(e.target.value)}
      style={{
        width,
        textAlign: 'right',
        fontFamily: 'var(--num)',
        fontSize: 14,
        padding: '6px 8px',
        border: '1px solid var(--editableLine)',
        background: 'var(--editable)',
        borderRadius: 6,
        color: 'var(--ink)',
        ...style,
      }}
    />
  );
}
