-- Firme (tecnico e cliente) allegate alla bolla, come dataURL PNG.
-- Sono piccole (pochi KB) e vengono stampate in fondo al foglio.
ALTER TABLE maioli_bolle ADD COLUMN IF NOT EXISTS firma_tecnico MEDIUMTEXT NULL;
ALTER TABLE maioli_bolle ADD COLUMN IF NOT EXISTS firma_cliente MEDIUMTEXT NULL;
