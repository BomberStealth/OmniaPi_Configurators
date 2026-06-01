import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

declare const __BUILD_TS__: string;

async function checkVersion() {
  try {
    const res = await fetch('/configuratori/version.json', { cache: 'no-store' });
    if (!res.ok) return;
    const { v } = await res.json();
    if (v !== __BUILD_TS__) {
      // Versione deployata diversa da quella in esecuzione → ricarica una volta
      if (!sessionStorage.getItem('cfg-ver-reloading')) {
        sessionStorage.setItem('cfg-ver-reloading', '1');
        window.location.reload();
      }
    } else {
      sessionStorage.removeItem('cfg-ver-reloading');
    }
  } catch {
    // silenzioso — non blocca l'app se il fetch fallisce (es. dev mode)
  }
}

checkVersion();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
