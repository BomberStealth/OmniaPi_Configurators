-- Impostazioni globali delle bolle (modificabili solo da admin, pagina
-- Impostazioni). Valori comuni a tutte le bolle future: costo chiamata, tariffe
-- orarie per settore, IVA di default. Key-value, così è facile aggiungerne.
CREATE TABLE IF NOT EXISTS maioli_settings (
  k VARCHAR(64)  NOT NULL PRIMARY KEY,
  v VARCHAR(255) NULL
);

INSERT IGNORE INTO maioli_settings (k, v) VALUES
  ('costo_chiamata',         '30'),
  ('costo_chiamata_default', '0'),
  ('tariffa_elettrico',      '30'),
  ('tariffa_idraulico',      '30'),
  ('iva_default',            '0');
