import { useApp } from '../state/store';

export function ResetPasswordModal() {
  const { state, closeResetPassword, setResetPassword, submitResetPassword } = useApp();
  if (state.resetUserId == null) return null;
  const user = state.users.find((u) => u.id === state.resetUserId);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20,30,18,.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        padding: 20,
      }}
      onClick={closeResetPassword}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 30px 80px -20px rgba(0,0,0,.4)',
          width: '100%',
          maxWidth: 420,
          padding: 26,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 4px' }}>Cambiar contraseña</h2>
        <p style={{ color: 'var(--ink2)', fontSize: 13, margin: '0 0 20px' }}>
          Define una nueva contraseña para <strong>{user?.name}</strong> ({user?.email}). No se
          envía ningún correo — dísela tú directamente.
        </p>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Nueva contraseña</label>
        <input
          type="text"
          value={state.resetPassword}
          onChange={(e) => setResetPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          style={{
            width: '100%',
            padding: '11px 13px',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            fontSize: 14,
            marginBottom: state.resetError ? 8 : 24,
            background: 'var(--surface)',
            color: 'var(--ink)',
            fontFamily: 'var(--num)',
          }}
        />
        {state.resetError && (
          <div style={{ color: '#c0392b', fontSize: 13, marginBottom: 16 }}>{state.resetError}</div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={closeResetPassword}
            style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '10px 16px', fontWeight: 600, cursor: 'pointer', color: 'var(--ink)' }}
          >
            Cancelar
          </button>
          <button
            onClick={submitResetPassword}
            disabled={state.resetPending}
            style={{
              background: 'var(--brand)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius)',
              padding: '10px 18px',
              fontWeight: 700,
              cursor: state.resetPending ? 'default' : 'pointer',
              opacity: state.resetPending ? 0.7 : 1,
            }}
          >
            {state.resetPending ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </div>
      </div>
    </div>
  );
}
