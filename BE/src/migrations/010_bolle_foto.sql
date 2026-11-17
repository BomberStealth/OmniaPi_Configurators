-- Foto allegate alle bolle (dataURL base64). Non vengono stampate nel foglio.
CREATE TABLE IF NOT EXISTS maioli_bolle_foto (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  bolla_id  INT NOT NULL,
  ordine    INT NOT NULL DEFAULT 0,
  img       MEDIUMTEXT NOT NULL,
  CONSTRAINT fk_foto_bolla FOREIGN KEY (bolla_id) REFERENCES maioli_bolle(id) ON DELETE CASCADE,
  INDEX idx_bolla_foto (bolla_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
