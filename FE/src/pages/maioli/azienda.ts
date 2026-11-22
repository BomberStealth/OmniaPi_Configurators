import logoMaioli from './assets/logo-maioli.png';

// NB: i dati azienda (tel, indirizzo, P.IVA, dichiarazione del foglio…) NON sono
// più hardcoded qui — si modificano da Impostazioni (tabella maioli_settings) e
// arrivano via settings.ts / store.getImpostazioni(). I default sono in
// settings.ts (IMPOST_DEFAULT) e nelle migrazioni 031/032.

export const LOGO = logoMaioli; // logo ufficiale intero (M! + wordmark)

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
