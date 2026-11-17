-- Modulo Maioli Idrotermica: bolle / rapporti di intervento
-- Tabelle CONDIVISE (strumento interno, 3 operai) — niente scoping per utente.

CREATE TABLE IF NOT EXISTS maioli_clienti (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  nome           VARCHAR(255) NOT NULL,
  telefono       VARCHAR(60)  NOT NULL DEFAULT '',
  email          VARCHAR(255) NOT NULL DEFAULT '',
  indirizzo      VARCHAR(255) NOT NULL DEFAULT '',
  condominio     VARCHAR(255) NOT NULL DEFAULT '',
  amministratore VARCHAR(255) NOT NULL DEFAULT '',
  note           TEXT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS maioli_bolle (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  numero         VARCHAR(20)  NULL,
  anno           SMALLINT UNSIGNED NULL,
  progressivo    INT UNSIGNED NULL,
  cliente_id     INT NULL,
  -- snapshot dati cliente (una bolla stampata non cambia se il cliente cambia dopo)
  cliente        VARCHAR(255) NOT NULL,
  telefono       VARCHAR(60)  NOT NULL DEFAULT '',
  email          VARCHAR(255) NOT NULL DEFAULT '',
  indirizzo      VARCHAR(255) NOT NULL DEFAULT '',
  condominio     VARCHAR(255) NOT NULL DEFAULT '',
  amministratore VARCHAR(255) NOT NULL DEFAULT '',
  preventivo     VARCHAR(100) NOT NULL DEFAULT '',
  data_chiamata  DATE NULL,
  data_intervento DATE NULL,
  data_consegna  DATE NULL,
  richiesta      TEXT NULL,
  difetti        TEXT NULL,
  iva            DECIMAL(5,2)  NOT NULL DEFAULT 0,
  imponibile     DECIMAL(10,2) NOT NULL DEFAULT 0,
  totale         DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bolla_cliente FOREIGN KEY (cliente_id) REFERENCES maioli_clienti(id) ON DELETE SET NULL,
  INDEX idx_cliente (cliente),
  INDEX idx_anno_prog (anno, progressivo),
  INDEX idx_data (data_intervento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS maioli_bolle_righe (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  bolla_id    INT NOT NULL,
  ordine      INT NOT NULL DEFAULT 0,
  qta         DECIMAL(10,2) NOT NULL DEFAULT 0,
  codice      VARCHAR(100) NOT NULL DEFAULT '',
  descrizione VARCHAR(255) NOT NULL DEFAULT '',
  prezzo      DECIMAL(10,2) NOT NULL DEFAULT 0,
  listino_id  INT NULL,
  CONSTRAINT fk_riga_bolla FOREIGN KEY (bolla_id) REFERENCES maioli_bolle(id) ON DELETE CASCADE,
  INDEX idx_bolla (bolla_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS maioli_bolle_manodopera (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  bolla_id  INT NOT NULL,
  operaio   VARCHAR(50) NOT NULL,
  ore       DECIMAL(6,2) NOT NULL DEFAULT 0,
  tariffa   DECIMAL(8,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_mano_bolla FOREIGN KEY (bolla_id) REFERENCES maioli_bolle(id) ON DELETE CASCADE,
  INDEX idx_bolla_mano (bolla_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS maioli_listino (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  marca       VARCHAR(100) NOT NULL DEFAULT 'Generico',
  codice      VARCHAR(100) NOT NULL DEFAULT '',
  descrizione VARCHAR(255) NOT NULL,
  um          VARCHAR(20)  NOT NULL DEFAULT '',
  prezzo      DECIMAL(10,2) NOT NULL DEFAULT 0,
  ricarico    DECIMAL(6,2) NOT NULL DEFAULT 0,
  categoria   VARCHAR(80)  NOT NULL DEFAULT '',
  moduli      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  attivo      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_marca (marca),
  INDEX idx_codice (codice),
  INDEX idx_descr (descrizione)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
