-- Le bolle esistenti (create prima dei reparti) erano tutte 'entrambi' per via
-- del DEFAULT della migrazione 029. Edoardo le vuole tutte nel settore
-- 'elettrico'. La conversione va fatta UNA SOLA VOLTA: le migrazioni rigirano
-- ad ogni avvio, quindi un flag impedisce di ritoccare le bolle future (es. le
-- bolle 'entrambi' create dall'amministrazione dopo questa migrazione).
CREATE TABLE IF NOT EXISTS maioli_flags (
  k          VARCHAR(64)  NOT NULL PRIMARY KEY,
  v          VARCHAR(255) NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

UPDATE maioli_bolle SET settore = 'elettrico'
  WHERE settore = 'entrambi'
    AND NOT EXISTS (SELECT 1 FROM maioli_flags WHERE k = 'bolle_settore_init_elettrico');

INSERT IGNORE INTO maioli_flags (k, v) VALUES ('bolle_settore_init_elettrico', 'done');
