-- Settore sugli articoli di listino (per filtrare l'autocomplete materiali).
-- Default 'elettrico' perché il listino attuale è tutto elettrico: le righe
-- esistenti prendono 'elettrico', e l'admin ricategorizza (tubi/cavi → entrambi,
-- articoli idraulici → idraulico) dalla pagina Listino.
ALTER TABLE maioli_listino ADD COLUMN IF NOT EXISTS settore VARCHAR(20) NOT NULL DEFAULT 'elettrico';
ALTER TABLE maioli_listino ADD INDEX IF NOT EXISTS idx_listino_settore (settore);
