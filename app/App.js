import { useEffect, useState } from 'react';
import { html } from './lib/html.js';
import { AppProvider, useApp } from './state/store.js';
import { setLanguage } from './i18n/translate.js';
import { Login } from './components/Login.js';
import { SetPassword } from './components/SetPassword.js';
import { TopBar } from './components/TopBar.js';
import { Dashboard } from './components/Dashboard.js';
import { EditorLayout } from './components/editor/EditorLayout.js';
import { Results } from './components/Results.js';
import { Admin } from './components/Admin.js';
import { NewModelModal } from './components/NewModelModal.js';
import { Toast } from './components/Toast.js';

function getTokenFromUrl() {
  return new URLSearchParams(window.location.search).get('token');
}

function AppShell() {
  const { state, active } = useApp();
  const model = active();
  const [routeToken, setRouteToken] = useState(getTokenFromUrl);

  // Traduce el texto de la página al idioma elegido (y lo que se pinte después).
  useEffect(() => setLanguage(state.lang), [state.lang]);

  // El tema por cultivo solo aplica dentro de la vista de un modelo concreto
  // (editor/resultados) — el dashboard y la administración muestran varios
  // modelos a la vez, así que se quedan siempre en el verde por defecto.
  const isModelScreen = state.screen === 'editor' || state.screen === 'results';
  const cropOverride =
    isModelScreen && model?.crop === 'almendro'
      ? {
          '--brand': '#997300',
          '--brandD': '#6b5000',
          '--brandL': '#f4eeda',
          '--accent': '#8a5a1e',
        }
      : {};

  const closeSetPassword = () => {
    window.history.replaceState(null, '', window.location.pathname.replace(/set-password\/?$/, ''));
    setRouteToken(null);
  };

  if (routeToken) {
    return html`
      <div style=${{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh' }}>
        <${SetPassword} token=${routeToken} onDone=${closeSetPassword} />
      </div>
    `;
  }

  if (state.booting) {
    return html`<div style=${{ background: 'var(--bg)', minHeight: '100vh' }} />`;
  }

  const isAdmin = state.currentUser?.role === 'admin';

  return html`
    <div style=${{ ...cropOverride, background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh' }}>
      ${state.screen === 'login'
        ? html`<${Login} />`
        : html`
            <div style=${{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <${TopBar} />
              ${state.screen === 'dashboard' && html`<${Dashboard} />`}
              ${state.screen === 'editor' && model && html`<${EditorLayout} />`}
              ${state.screen === 'results' && model && html`<${Results} />`}
              ${state.screen === 'admin' && isAdmin && html`<${Admin} />`}
            </div>
          `}
      <${NewModelModal} />
      <${Toast} />
    </div>
  `;
}

export default function App() {
  return html`
    <${AppProvider}>
      <${AppShell} />
    <//>
  `;
}
