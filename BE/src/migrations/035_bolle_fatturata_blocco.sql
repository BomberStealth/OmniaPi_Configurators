-- Stato "Fatturate" (raccoglitore, non sostituisce il gestionale) + blocco
-- fatturazione dell'amministrazione.
-- fatturata_at: quando l'amministrazione la sposta in "Fatturate".
-- bloccata/bloccata_by: l'amministrazione la "prende in mano"; da quel momento
--   solo amministrazione/admin possono modificarla (gli altri in sola lettura).
ALTER TABLE maioli_bolle ADD COLUMN IF NOT EXISTS fatturata_at DATETIME     NULL AFTER consegnata_at;
ALTER TABLE maioli_bolle ADD COLUMN IF NOT EXISTS bloccata     TINYINT(1)   NOT NULL DEFAULT 0 AFTER fatturata_at;
ALTER TABLE maioli_bolle ADD COLUMN IF NOT EXISTS bloccata_by  VARCHAR(255) NULL AFTER bloccata;
