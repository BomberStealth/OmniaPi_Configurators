-- Campo "Riferimento" sulla bolla (es. "Via delle Prove", "Capannone"):
-- è la chiave di ricerca principale con cui si lavora. Indicizzato.
ALTER TABLE maioli_bolle ADD COLUMN IF NOT EXISTS riferimento VARCHAR(255) NOT NULL DEFAULT '' AFTER cliente;
ALTER TABLE maioli_bolle ADD INDEX IF NOT EXISTS idx_riferimento (riferimento);
