-- Aggiunge categoria/moduli al listino gia' esistente (idempotente, MariaDB).
ALTER TABLE maioli_listino ADD COLUMN IF NOT EXISTS categoria VARCHAR(80)      NOT NULL DEFAULT '' AFTER ricarico;
ALTER TABLE maioli_listino ADD COLUMN IF NOT EXISTS moduli    TINYINT UNSIGNED NOT NULL DEFAULT 0  AFTER categoria;
