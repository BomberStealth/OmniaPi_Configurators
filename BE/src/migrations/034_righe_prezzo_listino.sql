-- Prezzo "preimpostato" (dal listino) al momento in cui l'articolo è stato
-- aggiunto in bolla. Serve alle Segnalazioni: se il prezzo in bolla è diverso da
-- questo → prezzo cambiato (🟡). NULL per le righe scritte a mano / bolle vecchie.
ALTER TABLE maioli_bolle_righe ADD COLUMN IF NOT EXISTS prezzo_listino DECIMAL(10,2) NULL AFTER prezzo;
