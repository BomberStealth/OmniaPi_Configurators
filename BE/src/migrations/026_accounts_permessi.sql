-- Account: stato attivo/disattivo + permessi per sezione (gestiti dalla pagina
-- Account dell'ADMIN). permessi = JSON {nuova,storico,clienti,listino,fatturate}.
ALTER TABLE users ADD COLUMN IF NOT EXISTS attivo   TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS permessi TEXT NULL;

-- Chi non ha ancora i permessi impostati li riceve tutti (non rompe nulla;
-- poi l'admin li restringe dalla pagina Account). Idempotente: tocca solo i NULL.
UPDATE users
  SET permessi = '{"nuova":true,"storico":true,"clienti":true,"listino":true,"fatturate":true}'
  WHERE permessi IS NULL OR permessi = '';
