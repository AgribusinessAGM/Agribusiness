import { useApp } from '../state/store';

export function InviteModal() {
  const {
    state,
    closeInvite,
    setInviteMode,
    setInviteName,
    setInviteEmail,
    setInviteOrg,
    setInvitePassword,
    setInviteRole,
    submitInvite,
  } = useApp();
  if (!state.showInvite) return null;

  const inputStyle = {
    width: '100%',
    padding: '11px 13px',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    marginBottom: 16,
    background: 'var(--surface)',
    color: 'var(--ink)',
  } as const;

  const tabStyle = (on: boolean) =>
    ({
      flex: 1,
      padding: '9px 6px',
      borderRadius: 'var(--radius)',
      border: `1px solid ${on ? 'var(--brand)' : 'var(--line)'}`,
      background: on ? 'var(--brandL)' : 'var(--surface)',
      color: on ? 'var(--brandD)' : 'var(--ink)',
      fontWeight: on ? 700 : 500,
      fontSize: 13,
      cursor: 'pointer',
    }) as const;

  const isDirect = state.inviteMode === 'direct';

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
      onClick={closeInvite}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 30px 80px -20px rgba(0,0,0,.4)',
          width: '100%',
          maxWidth: 440,
          padding: 26,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 4px' }}>Añadir persona</h2>

        {!state.inviteDevLink && (
          <>
            <p style={{ color: 'var(--ink2)', fontSize: 13, margin: '0 0 16px' }}>
              {isDirect
                ? 'Creas la cuenta y le dices tú la contraseña directamente — no se envía ningún correo.'
                : 'Le enviaremos un correo para que cree su propia contraseña.'}{' '}
              Podrás asignarle acceso a cada modelo después, desde la tabla de permisos.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button style={tabStyle(isDirect)} onClick={() => setInviteMode('direct')}>
                Crear con contraseña
              </button>
              <button style={tabStyle(!isDirect)} onClick={() => setInviteMode('email')}>
                Invitar por correo
              </button>
            </div>
          </>
        )}

        {state.inviteDevLink ? (
          <div>
            <div
              style={{
                background: 'var(--brandL)',
                border: '1px solid var(--editableLine)',
                borderRadius: 'var(--radius)',
                padding: 14,
                marginBottom: 18,
                fontSize: 13,
                color: 'var(--ink)',
              }}
            >
              <strong>No hay proveedor de email configurado.</strong> Copia este enlace y
              compártelo manualmente con la persona invitada — caduca en 7 días.
              <div
                style={{
                  marginTop: 10,
                  wordBreak: 'break-all',
                  fontFamily: 'var(--num)',
                  fontSize: 12,
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  padding: '8px 10px',
                }}
              >
                {state.inviteDevLink}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => navigator.clipboard?.writeText(state.inviteDevLink || '')}
                style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '10px 16px', fontWeight: 600, cursor: 'pointer', color: 'var(--ink)' }}
              >
                Copiar enlace
              </button>
              <button
                onClick={closeInvite}
                style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Nombre</label>
            <input
              value={state.inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Ej. Laura Gómez"
              style={inputStyle}
            />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Correo electrónico</label>
            <input
              type="email"
              value={state.inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="laura@empresa.com"
              style={inputStyle}
            />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Organización</label>
            <input
              value={state.inviteOrg}
              onChange={(e) => setInviteOrg(e.target.value)}
              placeholder="Ej. Iberocrops (Cliente)"
              style={inputStyle}
            />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Rol</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button style={tabStyle(state.inviteRole === 'user')} onClick={() => setInviteRole('user')}>
                Usuario
              </button>
              <button style={tabStyle(state.inviteRole === 'admin')} onClick={() => setInviteRole('admin')}>
                Administrador
              </button>
            </div>
            {isDirect && (
              <>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Contraseña</label>
                <input
                  type="text"
                  value={state.invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  style={{ ...inputStyle, fontFamily: 'var(--num)', marginBottom: state.inviteError ? 8 : 24 }}
                />
              </>
            )}
            {state.inviteError && (
              <div style={{ color: '#c0392b', fontSize: 13, marginBottom: 16 }}>{state.inviteError}</div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={closeInvite}
                style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '10px 16px', fontWeight: 600, cursor: 'pointer', color: 'var(--ink)' }}
              >
                Cancelar
              </button>
              <button
                onClick={submitInvite}
                disabled={state.invitePending}
                style={{
                  background: 'var(--brand)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  padding: '10px 18px',
                  fontWeight: 700,
                  cursor: state.invitePending ? 'default' : 'pointer',
                  opacity: state.invitePending ? 0.7 : 1,
                }}
              >
                {state.invitePending ? 'Guardando…' : isDirect ? 'Crear usuario' : 'Enviar invitación'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
