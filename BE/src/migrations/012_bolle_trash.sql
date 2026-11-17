-- Cestino bolle: soft-delete. deleted_at valorizzato = bolla nel cestino.
ALTER TABLE maioli_bolle ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL AFTER updated_at;
