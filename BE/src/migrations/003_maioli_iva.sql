-- Aggiunge IVA/imponibile alle bolle gia' esistenti (idempotente, MariaDB).
ALTER TABLE maioli_bolle ADD COLUMN IF NOT EXISTS iva        DECIMAL(5,2)  NOT NULL DEFAULT 0 AFTER difetti;
ALTER TABLE maioli_bolle ADD COLUMN IF NOT EXISTS imponibile DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER iva;
