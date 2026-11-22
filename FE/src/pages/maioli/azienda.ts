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

export const DEFAULT_TARIFFA_ORARIA = 30;

// Sigle 3 lettere per marca (per la tendina articoli e il listino)
export const MARCA_SIGLE: Record<string, string> = {
  Vimar: 'VIM',
  BTicino: 'BTI',
  Cavi: 'CAV',
  Hager: 'HAG',
  'Tubi e Corrugati': 'TUB',
  Generico: 'GEN',
};
export const siglaMarca = (marca: string): string =>
  MARCA_SIGLE[marca] ?? ((marca || '').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || '—');
// NB: gli operai NON sono più hardcoded qui — si gestiscono da Account → Operai
// (tabella maioli_operai) e arrivano via store.listOperai().
