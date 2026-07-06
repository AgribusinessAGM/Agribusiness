import { useApp } from '../state/store';

export function TopBar() {
  const { state, gotoDash, gotoAdmin, logout } = useApp();

  const navStyle = (on: boolean) => ({
    background: on ? 'var(--brandL)' : 'none',
    color: on ? 'var(--brandD)' : 'var(--ink2)',
    border: 'none',
    borderRadius: 'var(--radius)',
    padding: '8px 14px',
    fontWeight: on ? 700 : 600,
    fontSize: 14,
    cursor: 'pointer',
  } as const);

  return (
    <header
      style={{
        height: 60,
        flex: 'none',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--line)',
        display: 'flex',
        alignItems: 'center',
        gap: 22,
        padding: '0 22px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <img
        src="/assets/agromillora-logo.png"
        alt="Agromillora"
        style={{ height: 24, cursor: 'pointer' }}
        onClick={gotoDash}
      />
      <nav style={{ display: 'flex', gap: 4 }}>
        <button onClick={gotoDash} style={navStyle(state.screen === 'dashboard')}>
          Modelos
        </button>
        <button onClick={gotoAdmin} style={navStyle(state.screen === 'admin')}>
          Usuarios y permisos
        </button>
      </nav>
      <div style={{ flex: 1 }} />
      <div style={{ width: 1, height: 26, background: 'var(--line)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--brand)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          MF
        </div>
        <button
          onClick={logout}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink2)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Salir
        </button>
      </div>
    </header>
  );
}
