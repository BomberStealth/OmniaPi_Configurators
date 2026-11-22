-- Storico azioni (audit log): chi ha fatto cosa e quando. Visibile solo admin.
CREATE TABLE IF NOT EXISTS maioli_audit (
  id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ts         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_email VARCHAR(255) NULL,
  azione     VARCHAR(40)  NOT NULL,   -- crea, modifica, elimina, cestina, ripristina, consegna, sospendi…
  entita     VARCHAR(40)  NOT NULL,   -- bolla, cliente, listino, account, operaio, impostazioni
  entita_id  VARCHAR(40)  NULL,
  dettaglio  VARCHAR(255) NULL,
  INDEX idx_audit_ts (ts)
);
