// Punto de entrada: index.html carga este módulo. No hace falta compilar nada:
// el navegador lee estos .js directamente (React y htm están en assets/vendor/).
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { html } from './lib/html.js';
import App from './App.js';

createRoot(document.getElementById('root')).render(html`
  <${StrictMode}>
    <${App} />
  <//>
`);
