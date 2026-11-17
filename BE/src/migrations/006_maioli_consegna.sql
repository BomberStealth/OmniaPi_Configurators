-- Aggiunge "data_consegna" alle bolle gia' esistenti (idempotente, MariaDB).
ALTER TABLE maioli_bolle ADD COLUMN IF NOT EXISTS data_consegna DATE NULL AFTER data_intervento;
