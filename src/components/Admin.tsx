import { useApp } from '../state/store';
import { InviteModal } from './InviteModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import type { AccessLevel } from '../types';

const roleMap: Record<AccessLevel, { label: string; bg: string; fg: string }> = {
  edit: { label: 'Editar', bg: 'var(--brand)', fg: '#fff' },
  view: { label: 'Ver', bg: 'var(--muted)', fg: '#fff' },
  none: { label: '—', bg: 'var(--line)', fg: 'var(--ink2)' },
};

export function Admin() {
  const { state, cyclePerm, openInvite, openResetPassword } = useApp();

  return (
    <main style={{ maxWidth: 1120, width: '100%', margin: '0 auto', padding: '30px 26px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14, marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Usuarios y permisos</h1>
          <p style={{ color: 'var(--ink2)', margin: 0, fontSize: 14 }}>
            Asigna a cada persona el acceso a cada modelo. Haz clic en una celda para cambiar el permiso.
          </p>
        </div>
        <button
          onClick={openInvite}
          className="lift"
          style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '11px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
        >
          + Añadir persona
        </button>
      </div>
      <div style={{ display: 'flex', gap: 16, margin: '16px 0 20px', fontSize: 12, color: 'var(--ink2)' }}>
        <span>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'var(--brand)', verticalAlign: 'middle', marginRight: 5 }} />
          Editar
        </span>
        <span>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'var(--muted)', verticalAlign: 'middle', marginRight: 5 }} />
          Ver
        </span>
        <span>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'var(--line)', verticalAlign: 'middle', marginRight: 5 }} />
          Sin acceso
        </span>
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 18px', background: 'var(--brandL)', color: 'var(--brandD)', fontSize: 12 }}>Persona</th>
              {state.models.map((m) => (
                <th key={m.id} style={{ textAlign: 'center', padding: '12px 14px', background: 'var(--brandL)', color: 'var(--brandD)', fontSize: 12, minWidth: 130 }}>
                  {m.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.users.map((u) => (
              <tr key={u.id} style={{ borderTop: '1px solid var(--line)' }}>
                <td style={{ padding: '12px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                    {u.status === 'invited' && (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: 'var(--accent)',
                          background: 'var(--brandL)',
                          border: '1px solid var(--editableLine)',
                          padding: '1px 7px',
                          borderRadius: 999,
                        }}
                      >
                        invitación pendiente
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink2)' }}>{u.email}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink2)', marginTop: 2 }}>{u.org}</div>
                  <button
                    onClick={() => openResetPassword(u.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--brand)', fontWeight: 600, fontSize: 11, cursor: 'pointer', padding: 0, marginTop: 4 }}
                  >
                    {u.status === 'invited' ? 'Definir contraseña' : 'Cambiar contraseña'}
                  </button>
                </td>
                {state.models.map((m) => {
                  const role = u.access[m.id] || 'none';
                  const rm = roleMap[role];
                  return (
                    <td key={m.id} style={{ textAlign: 'center', padding: '10px 14px' }}>
                      <button
                        onClick={() => cyclePerm(u.id, m.id)}
                        className="lift"
                        style={{ background: rm.bg, color: rm.fg, border: 'none', borderRadius: 999, padding: '6px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer', minWidth: 70 }}
                      >
                        {rm.label}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <InviteModal />
      <ResetPasswordModal />
    </main>
  );
}
