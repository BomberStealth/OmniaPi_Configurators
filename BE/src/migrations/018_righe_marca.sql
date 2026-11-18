-- Marca dell'articolo sulla riga della bolla (per mostrare Marca · Codice).
ALTER TABLE maioli_bolle_righe ADD COLUMN IF NOT EXISTS marca VARCHAR(80) NOT NULL DEFAULT '' AFTER codice;
