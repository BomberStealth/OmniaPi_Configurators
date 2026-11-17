-- Stato "consegnata" per le bolle (contrassegnata come consegnata dall'archivio).
ALTER TABLE maioli_bolle ADD COLUMN IF NOT EXISTS consegnata_at DATETIME NULL AFTER deleted_at;
