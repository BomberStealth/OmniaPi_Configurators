-- Nomi clienti in MAIUSCOLO (anagrafica + snapshot sulle bolle). Idempotente:
-- UPPER di un nome già maiuscolo resta uguale.
UPDATE maioli_clienti SET nome = UPPER(nome) WHERE nome <> UPPER(nome);
UPDATE maioli_bolle   SET cliente = UPPER(cliente) WHERE cliente <> UPPER(cliente);
