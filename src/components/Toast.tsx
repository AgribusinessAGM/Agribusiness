import { useApp } from '../state/store';

export function Toast() {
  const { state } = useApp();
  if (!state.toast) return null;
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--brandD)',
        color: '#fff',
        padding: '12px 22px',
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 600,
        zIndex: 80,
        boxShadow: '0 12px 30px -8px rgba(0,0,0,.4)',
        animation: 'toastIn .25s ease both',
      }}
    >
      {state.toast}
    </div>
  );
}
