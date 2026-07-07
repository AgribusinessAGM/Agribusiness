import { useEffect, useState } from 'react';
import { acceptInvite, getInvite } from '../api';
import { useApp } from '../state/store';

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  fontSize: 15,
  marginBottom: 16,
  background: 'var(--surface)',
  color: 'var(--ink)',
} as const;

export function SetPassword({ token, onDone }: { token: string; onDone: (email: string) => void }) {
  const { setLoginEmail } = useApp();
  const [status, setStatus] = useState<'loading' | 'ready' | 'invalid' | 'success'>('loading');
  const [invalidReason, setInvalidReason] = useState('');
  const [invite, setInvite] = useState<{ name: string; email: string } | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getInvite(token)
      .then((data) => {
        setInvite(data);
        setStatus('ready');
      })
      .catch((e: Error) => {
        setInvalidReason(e.message);
        setStatus('invalid');
      });
  }, [token]);

  const submit = () => {
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (password !== confirm) return setError('Las contraseñas no coinciden.');
    setError(null);
    setSubmitting(true);
    acceptInvite(token, password)
      .then(() => {
        setSubmitting(false);
        setStatus('success');
        if (invite) setLoginEmail(invite.email);
      })
      .catch((e: Error) => {
        setSubmitting(false);
        setError(e.message);
      });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <img src="/assets/agromillora-logo.png" alt="Agromillora" style={{ height: 30, marginBottom: 28 }} />

        {status === 'loading' && (
          <p style={{ color: 'var(--ink2)', fontSize: 14 }}>Comprobando tu enlace…</p>
        )}

        {status === 'invalid' && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Enlace no disponible</h1>
            <p style={{ color: 'var(--ink2)', fontSize: 14, lineHeight: 1.55, margin: '0 0 20px' }}>
              {invalidReason || 'Este enlace de invitación no es válido.'} Pide a quien te invitó
              que te envíe una nueva invitación.
            </p>
            <button
              onClick={() => onDone('')}
              style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '11px 18px', fontWeight: 700, cursor: 'pointer' }}
            >
              Ir a iniciar sesión
            </button>
          </>
        )}

        {status === 'ready' && invite && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Hola, {invite.name}</h1>
            <p style={{ color: 'var(--ink2)', fontSize: 14, lineHeight: 1.55, margin: '0 0 22px' }}>
              Crea una contraseña para <strong>{invite.email}</strong> y accede a la plataforma de
              modelos financieros.
            </p>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              style={inputStyle}
            />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Confirmar contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              style={{ ...inputStyle, marginBottom: error ? 8 : 24 }}
            />
            {error && <div style={{ color: '#c0392b', fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <button
              onClick={submit}
              disabled={submitting}
              className="lift"
              style={{
                width: '100%',
                background: 'var(--brand)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius)',
                padding: 13,
                fontSize: 15,
                fontWeight: 700,
                cursor: submitting ? 'default' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                boxShadow: 'var(--shadow)',
              }}
            >
              {submitting ? 'Creando…' : 'Crear contraseña'}
            </button>
          </>
        )}

        {status === 'success' && invite && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Contraseña creada</h1>
            <p style={{ color: 'var(--ink2)', fontSize: 14, lineHeight: 1.55, margin: '0 0 20px' }}>
              Ya puedes entrar con <strong>{invite.email}</strong> y tu nueva contraseña.
            </p>
            <button
              onClick={() => onDone(invite.email)}
              style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '11px 18px', fontWeight: 700, cursor: 'pointer' }}
            >
              Ir a iniciar sesión
            </button>
          </>
        )}
      </div>
    </div>
  );
}
