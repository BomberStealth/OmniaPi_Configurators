-- Contatore atomico del numero bolla per anno: evita numeri DOPPIATI quando più
-- utenti salvano nello stesso istante (prima era MAX(progressivo)+1, soggetto a
-- race condition). Seminato dal massimo già presente. Idempotente (GREATEST non
-- fa mai scendere il contatore, anche ri-eseguendolo ad ogni avvio).
CREATE TABLE IF NOT EXISTS maioli_contatori (
  anno        INT PRIMARY KEY,
  progressivo INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO maioli_contatori (anno, progressivo)
  SELECT anno, MAX(progressivo) FROM maioli_bolle WHERE anno IS NOT NULL GROUP BY anno
  ON DUPLICATE KEY UPDATE progressivo = GREATEST(progressivo, VALUES(progressivo));
