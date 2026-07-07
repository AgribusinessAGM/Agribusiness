import { useState, type CSSProperties } from 'react';
import { AppProvider, useApp } from './state/store';
import { Login } from './components/Login';
import { SetPassword } from './components/SetPassword';
import { TopBar } from './components/TopBar';
import { Dashboard } from './components/Dashboard';
import { EditorLayout } from './components/editor/EditorLayout';
import { Results } from './components/Results';
import { Admin } from './components/Admin';
import { NewModelModal } from './components/NewModelModal';
import { Toast } from './components/Toast';

function getTokenFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('token');
}

function AppShell() {
  const { state, active } = useApp();
  const model = active();
  const [routeToken, setRouteToken] = useState<string | null>(getTokenFromUrl);

  // El tema por cultivo solo aplica dentro de la vista de un modelo concreto
  // (editor/resultados) — el dashboard y la administración muestran varios
  // modelos a la vez, así que se quedan siempre en el verde por defecto.
  const isModelScreen = state.screen === 'editor' || state.screen === 'results';
  const cropOverride: CSSProperties =
    isModelScreen && model?.crop === 'almendro'
      ? ({
          '--brand': '#997300',
          '--brandD': '#6b5000',
          '--brandL': '#f4eeda',
          '--accent': '#8a5a1e',
        } as CSSProperties)
      : {};

  const closeSetPassword = () => {
    window.history.replaceState(null, '', window.location.pathname.replace(/set-password\/?$/, ''));
    setRouteToken(null);
  };

  if (routeToken) {
    return (
      <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh' }}>
        <SetPassword token={routeToken} onDone={closeSetPassword} />
      </div>
    );
  }

  if (state.booting) {
    return <div style={{ background: 'var(--bg)', minHeight: '100vh' }} />;
  }

  const isAdmin = state.currentUser?.role === 'admin';

  return (
    <div style={{ ...cropOverride, background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh' }}>
      {state.screen === 'login' ? (
        <Login />
      ) : (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <TopBar />
          {state.screen === 'dashboard' && <Dashboard />}
          {state.screen === 'editor' && model && <EditorLayout />}
          {state.screen === 'results' && model && <Results />}
          {state.screen === 'admin' && isAdmin && <Admin />}
        </div>
      )}
      <NewModelModal />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
