import logoMaioli from './assets/logo-maioli.png';

// Dati fissi azienda — stampati in fondo a ogni foglio.
export const AZIENDA = {
  ragioneSociale: 'MAIOLI IDROTERMICA',
  tel: '0541 1735714',
  cel: '320 1736940',
  email: 'office@maioli-idrotermicasrl.it',
  indirizzo: 'Via Flaminia Conca, 77/b',
  capCitta: '47923 Rimini',
  piva: '04351490406',
  certificazione: 'Azienda Certificata UNI EN ISO 9001:2015',
  nCert: '3147',
};

export const LOGO = logoMaioli; // logo ufficiale intero (M! + wordmark)

export const DEFAULT_TARIFFA_ORARIA = 35;

// ── Operai (siamo solo in 3) ──
export interface Operaio {
  id: string;
  nome: string;
  color: string;
  foto: string | null; // metti qui il path della foto quando disponibile
}

export const OPERAI: Operaio[] = [
  { id: 'edoardo', nome: 'Edoardo', color: '#2563EB', foto: null },
  { id: 'daniele', nome: 'Daniele', color: '#0891B2', foto: null },
  { id: 'sandro',  nome: 'Sandro',  color: '#ea580c', foto: null },
];
