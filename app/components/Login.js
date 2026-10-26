import { useState } from 'react';
import { html } from '../lib/html.js';
import { useApp } from '../state/store.js';
import { PasswordInput } from './PasswordInput.js';
import { forgotPassword } from '../api.js';

// "He olvidado mi contraseña": pide el correo y el servidor envía un enlace de un solo uso
// (1 h). El mensaje es el mismo exista o no la cuenta, para no revelar quién está dado de alta.
function ForgotPassword({ initialEmail, onBack }) {
  const [email, setEmail] = useState(initialEmail || '');
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const submit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setPending(true);
    setError(null);
    forgotPassword(email.trim())
      .then(() => setSent(true))
      .catch((err) => setError(err.message))
      .finally(() => setPending(false));
  };
  const back = html`
    <div style=${{ textAlign: 'center', marginTop: 14 }}>
      <button type="button" onClick=${onBack} style=${{ background: 'none', border: 'none', color: 'var(--brand)', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0 }}>
        ← Volver a iniciar sesión
      </button>
    </div>
  `;
  if (sent)
    return html`
      <div style=${{ background: 'var(--brandL)', border: '1px solid var(--editableLine)', borderRadius: 'var(--radius)', padding: 16, fontSize: 14, lineHeight: 1.55 }}>
        Si el correo está dado de alta, en unos minutos recibirás un enlace para elegir una nueva contraseña. El enlace caduca en 1 hora.
      </div>
      ${back}
    `;
  return html`
    <form onSubmit=${submit}>
      <p style=${{ color: 'var(--ink2)', fontSize: 14, margin: '0 0 16px', lineHeight: 1.55 }}>
        Escribe tu correo y te enviaremos un enlace para elegir una nueva contraseña.
      </p>
      <label style=${{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Correo electrónico</label>
      <input
        type="email"
        value=${email}
        onInput=${(e) => setEmail(e.target.value)}
        autoComplete="email"
        style=${{ width: '100%', padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 'var(--radius)', fontSize: 15, marginBottom: error ? 8 : 24, background: 'var(--surface)', color: 'var(--ink)' }}
      />
      ${error && html`<div style=${{ color: '#c0392b', fontSize: 13, marginBottom: 16 }}>${error}</div>`}
      <button
        type="submit"
        disabled=${pending}
        className="lift"
        style=${{ width: '100%', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: 13, fontSize: 15, fontWeight: 700, cursor: pending ? 'default' : 'pointer', opacity: pending ? 0.7 : 1, boxShadow: 'var(--shadow)' }}
      >
        ${pending ? 'Enviando…' : 'Enviar enlace'}
      </button>
      ${back}
    </form>
  `;
}

export function Login() {
  const { state, setLoginEmail, setLoginPassword, login } = useApp();
  const [forgot, setForgot] = useState(false);
  const onSubmit = (e) => {
    e.preventDefault();
    if (!state.loginPending) login();
  };
  return html`
    <div style=${{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.05fr 0.95fr' }}>
      <div style=${{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style=${{ width: '100%', maxWidth: 380 }}>
          <img
            src="assets/agromillora-logo.png"
            alt="Agromillora"
            style=${{ height: 34, marginBottom: 40 }}
          />
          <div
            style=${{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'var(--brand)',
            }}
          >
            Plataforma AGRIBUSINESS
          </div>
          <h1
            style=${{
              fontSize: 30,
              lineHeight: 1.15,
              margin: '10px 0 8px',
              fontWeight: 800,
              letterSpacing: '-.02em',
            }}
          >
            Modelos financieros agrícolas
          </h1>
          <p style=${{ color: 'var(--ink2)', margin: '0 0 30px', fontSize: 15, lineHeight: 1.55 }}>
            Accede a tu modelo, ajusta las variables de tu proyecto y consulta la rentabilidad en tiempo real.
          </p>
          ${forgot
            ? html`<${ForgotPassword} initialEmail=${state.loginEmail} onBack=${() => setForgot(false)} />`
            : html`<form onSubmit=${onSubmit}>
            <label style=${{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Correo electrónico
            </label>
            <input
              type="email"
              value=${state.loginEmail}
              onChange=${(e) => setLoginEmail(e.target.value)}
              autoComplete="email"
              style=${{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                fontSize: 15,
                marginBottom: 16,
                background: 'var(--surface)',
                color: 'var(--ink)',
              }}
            />
            <label style=${{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Contraseña
            </label>
            <${PasswordInput}
              value=${state.loginPassword}
              onChange=${(e) => setLoginPassword(e.target.value)}
              autoComplete="current-password"
              style=${{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                fontSize: 15,
                marginBottom: state.loginError ? 8 : 24,
                background: 'var(--surface)',
                color: 'var(--ink)',
              }}
            />
            ${state.loginError &&
            html`<div style=${{ color: '#c0392b', fontSize: 13, marginBottom: 16 }}>${state.loginError}</div>`}
            <button
              type="submit"
              disabled=${state.loginPending}
              className="lift"
              style=${{
                width: '100%',
                background: 'var(--brand)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius)',
                padding: 13,
                fontSize: 15,
                fontWeight: 700,
                cursor: state.loginPending ? 'default' : 'pointer',
                opacity: state.loginPending ? 0.7 : 1,
                boxShadow: 'var(--shadow)',
              }}
            >
              ${state.loginPending ? 'Entrando…' : 'Entrar'}
            </button>
            <div style=${{ textAlign: 'center', marginTop: 14 }}>
              <button
                type="button"
                onClick=${() => setForgot(true)}
                style=${{ background: 'none', border: 'none', color: 'var(--brand)', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0 }}
              >
                He olvidado mi contraseña
              </button>
            </div>
          </form>`}
          <div style=${{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--ink2)' }}>
            ¿Problemas para acceder?${' '}<span style=${{ color: 'var(--brand)', fontWeight: 600 }}>Contacta con tu gestor</span>
          </div>
          <div style=${{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'var(--ink2)' }}>
            Demo: usa m.ferrer@iberocrops.com con la contraseña agromillora2026
          </div>
          <div style=${{ textAlign: 'center', marginTop: 18, fontSize: 15, fontWeight: 700, color: 'var(--brand)' }}>
            Hola Marc!
          </div>
        </div>
      </div>
      <div
        style=${{
          background: 'var(--brandD)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
          padding: 48,
        }}
      >
        <div
          style=${{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 70% 20%, rgba(255,255,255,.10), transparent 55%)',
          }}
        />
        <div style=${{ position: 'relative', color: '#fff', display: 'flex', flexDirection: 'column' }}>
          <div
            style=${{
              alignSelf: 'flex-start',
              position: 'relative',
              width: 460,
              maxWidth: '100%',
              marginBottom: 25,
            }}
          >
            <img
              src="assets/portada-olivar.png"
              alt="Olivar en cosecha"
              style=${{
                display: 'block',
                width: '100%',
                aspectRatio: '460/220',
                objectFit: 'cover',
                borderRadius: 12,
                boxShadow: '0 18px 40px -18px rgba(0,0,0,.55)',
              }}
            />
          </div>
          <div
            style=${{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              opacity: 0.7,
            }}
          >
            It's in our nature
          </div>
          <div style=${{ fontSize: 26, fontWeight: 700, lineHeight: 1.25, marginTop: 12, maxWidth: 420 }}>
            Del olivar al modelo financiero, en una sola plataforma.
          </div>
        </div>
      </div>
    </div>
  `;
}
