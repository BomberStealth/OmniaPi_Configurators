-- OPERAI gestibili (manodopera): sostituiscono i 3 operai fissi nel codice.
-- Ogni operaio ha un settore (elettrico/idraulico/entrambi) + foto facoltativa.
CREATE TABLE IF NOT EXISTS maioli_operai (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nome       VARCHAR(100) NOT NULL,
  cognome    VARCHAR(100) NOT NULL DEFAULT '',
  settore    VARCHAR(20)  NOT NULL DEFAULT 'entrambi',
  foto       VARCHAR(255) NULL,
  attivo     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_operai_settore (settore)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- seed dei 3 operai storici (idempotente, per nome)
INSERT INTO maioli_operai (nome, cognome, settore)
  SELECT 'Edoardo','','entrambi' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM maioli_operai WHERE nome='Edoardo');
INSERT INTO maioli_operai (nome, cognome, settore)
  SELECT 'Daniele','','entrambi' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM maioli_operai WHERE nome='Daniele');
INSERT INTO maioli_operai (nome, cognome, settore)
  SELECT 'Sandro','','entrambi'  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM maioli_operai WHERE nome='Sandro');

-- le vecchie manodopera salvavano l'id ('edoardo'...) → converto al nome
UPDATE maioli_bolle_manodopera SET operaio='Edoardo' WHERE operaio='edoardo';
UPDATE maioli_bolle_manodopera SET operaio='Daniele' WHERE operaio='daniele';
UPDATE maioli_bolle_manodopera SET operaio='Sandro'  WHERE operaio='sandro';

-- settore sugli account (elettrico/idraulico/entrambi). entrambi = amministrazione.
ALTER TABLE users ADD COLUMN IF NOT EXISTS settore VARCHAR(20) NOT NULL DEFAULT 'entrambi';
