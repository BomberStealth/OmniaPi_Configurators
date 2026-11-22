// Versione della sezione Maioli. INCREMENTARE ad ogni modifica + deploy.
export const MAIOLI_VERSION = 'v1.22.1';

// Versione minima del backend richiesta da questa FE. Se il BE deployato
// riporta un numero più basso (health → beVersion), la pagina mostra un
// avviso "backend da aggiornare". Alzare quando la FE inizia a dipendere da
// una nuova funzione/rotta del BE.
export const REQUIRED_BE_VERSION = 32;
