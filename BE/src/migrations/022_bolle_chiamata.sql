-- Diritto di chiamata: se attivo aggiunge 30€ (lato FE) alla manodopera.
ALTER TABLE maioli_bolle ADD COLUMN IF NOT EXISTS costo_chiamata TINYINT(1) NOT NULL DEFAULT 0;
