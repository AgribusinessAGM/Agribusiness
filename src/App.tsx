import type { CSSProperties } from 'react';
import { AppProvider, useApp } from './state/store';
import { Login } from './components/Login';
import { TopBar } from './components/TopBar';
import { Dashboard } from './components/Dashboard';
import { EditorLayout } from './components/editor/EditorLayout';
import { Results } from './components/Results';
import { Admin } from './components/Admin';
import { NewModelModal } from './components/NewModelModal';
import { Toast } from './components/Toast';

function AppShell() {
  const { state, active } = useApp();
  const model = active();

  const cropOverride: CSSProperties =
    model.crop === 'almendro'
      ? ({
          '--brand': '#997300',
          '--brandD': '#6b5000',
          '--brandL': '#f4eeda',
          '--accent': '#8a5a1e',
        } as CSSProperties)
      : {};

  return (
    <div style={{ ...cropOverride, background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh' }}>
      {state.screen === 'login' ? (
        <Login />
      ) : (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <TopBar />
          {state.screen === 'dashboard' && <Dashboard />}
          {state.screen === 'editor' && <EditorLayout />}
          {state.screen === 'results' && <Results />}
          {state.screen === 'admin' && <Admin />}
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
