// Impostazioni globali delle bolle (costo chiamata, tariffe orarie per settore,
// IVA di default). Caricate dal BE a inizio sessione e tenute in una cache in
// memoria qui, così model.ts/FoglioRapporto le leggono in modo sincrono senza
// import circolari (questo modulo non importa nulla).

export interface Impostazioni {
  // bolle
  costoChiamata: number;        // € diritto di chiamata
  costoChiamataDefault: number; // 0/1: spuntato di default nelle nuove bolle
  tariffaElettrico: number;     // €/h reparto elettrico
  tariffaIdraulico: number;     // €/h reparto idraulico
  ivaDefault: number;           // % IVA preselezionata
  // dati azienda (foglio di stampa)
  azRagioneSociale: string;
  azTel: string;
  azCel: string;
  azEmail: string;
  azIndirizzo: string;
  azCapCitta: string;
  azPiva: string;
  azCertificazione: string;
  azNcert: string;
  // foglio
  bollaDichiarazione: string;   // testo in fondo al foglio sopra le firme
}

export const IMPOST_DEFAULT: Impostazioni = {
  costoChiamata: 30,
  costoChiamataDefault: 0,
  tariffaElettrico: 30,
  tariffaIdraulico: 30,
  ivaDefault: 0,
  azRagioneSociale: 'MAIOLI IDROTERMICA',
  azTel: '0541 1735714',
  azCel: '320 1736940',
  azEmail: 'office@maioli-idrotermicasrl.it',
  azIndirizzo: 'Via Flaminia Conca, 77/b',
  azCapCitta: '47923 Rimini',
  azPiva: '04351490406',
  azCertificazione: 'Azienda Certificata UNI EN ISO 9001:2015',
  azNcert: '3147',
  bollaDichiarazione: 'Si prende atto che i lavori effettuati sono regolarmente funzionanti e che non sono stati causati danni di qualsiasi natura',
};

let current: Impostazioni = { ...IMPOST_DEFAULT };

export const impostazioni = (): Impostazioni => current;
export const setImpostazioniLocal = (v: Partial<Impostazioni>): void => {
  current = { ...current, ...v };
};

// tariffa oraria di default in base al settore dell'operaio
export const tariffaPerSettore = (settore?: string): number =>
  settore === 'idraulico' ? current.tariffaIdraulico : current.tariffaElettrico;
