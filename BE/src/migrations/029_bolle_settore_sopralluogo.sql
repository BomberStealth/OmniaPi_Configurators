-- Settore della bolla (reparto di chi la crea) + flag "sopralluogo".
-- settore 'entrambi' = non legata a un reparto (bolle vecchie / amministrazione):
-- modificabile da tutti. Le altre solo dallo stesso settore + entrambi/admin.
ALTER TABLE maioli_bolle ADD COLUMN IF NOT EXISTS settore     VARCHAR(20) NOT NULL DEFAULT 'entrambi';
ALTER TABLE maioli_bolle ADD COLUMN IF NOT EXISTS sopralluogo TINYINT(1)  NOT NULL DEFAULT 0;
ALTER TABLE maioli_bolle ADD INDEX IF NOT EXISTS idx_bolle_settore (settore);
