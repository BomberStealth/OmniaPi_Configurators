-- Lock "bolla in modifica" (evita l'editing contemporaneo da più dispositivi).
-- editing_by = email dell'account che la sta modificando; editing_at = ultimo
-- heartbeat. Un lock scade dopo 15 minuti di inattività (gestito in query).
ALTER TABLE maioli_bolle ADD COLUMN IF NOT EXISTS editing_by VARCHAR(255) NULL;
ALTER TABLE maioli_bolle ADD COLUMN IF NOT EXISTS editing_at DATETIME NULL;
