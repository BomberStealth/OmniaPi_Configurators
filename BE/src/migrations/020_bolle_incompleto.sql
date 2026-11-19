-- "Lavoro non completato": flag + nota di cosa manca da fare (solo interno,
-- non stampato sul foglio). In archivio la card diventa gialla.
ALTER TABLE maioli_bolle ADD COLUMN IF NOT EXISTS lavoro_incompleto TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE maioli_bolle ADD COLUMN IF NOT EXISTS da_completare TEXT NULL;
