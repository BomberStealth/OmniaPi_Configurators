-- Impostazioni prezzo per marca: sconto installatore % e ricarico azienda %.
CREATE TABLE IF NOT EXISTS maioli_marche (
  marca      VARCHAR(100) PRIMARY KEY,
  sconto     DECIMAL(6,2) NOT NULL DEFAULT 0,  -- sconto installatore % (sul listino)
  ricarico   DECIMAL(6,2) NOT NULL DEFAULT 0,  -- ricarico azienda % (sul prezzo scontato)
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
