// Versione "capacità" del backend. La FE la legge da /api/health e, se il
// numero è più basso di quello che richiede, mostra un avviso "backend da
// aggiornare". INCREMENTARE quando si aggiungono rotte/funzioni di cui la FE
// ha bisogno (così dopo un deploy della sola FE si capisce subito se manca
// il deploy del BE).
export const BE_VERSION = 17;
