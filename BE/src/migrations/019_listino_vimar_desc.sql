-- Pulizia descrizioni listino: toglie le note di prezzo tra parentesi
-- (es. "Copriforo 1M bianco (prezzo unitario da conf. 100 pz)" -> "Copriforo 1M bianco").
-- Idempotente: dopo il primo giro nessuna riga contiene più "(prezzo".
UPDATE maioli_listino
SET descrizione = TRIM(REGEXP_REPLACE(descrizione, '[[:space:]]*\\(prezzo[^)]*\\)', ''))
WHERE descrizione LIKE '%(prezzo%';
