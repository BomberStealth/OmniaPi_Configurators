-- Guaine PVC: rinomina a "Guaina PVC Ø.." e imposta prezzo indicativo al metro.
-- Idempotente e non distruttivo: aggiorna SOLO le righe ancora a prezzo 0
-- (così non sovrascrive un prezzo già impostato a mano); crea le righe se mancano.

-- crea se mancano (prezzo indicativo IVA esclusa, €/m)
INSERT INTO maioli_listino (marca,codice,descrizione,um,prezzo,ricarico,categoria,moduli,attivo)
SELECT 'Tubi e Corrugati','GUA-10','Guaina PVC Ø10','m',0.45,0,'Corrugati',0,1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM maioli_listino WHERE marca='Tubi e Corrugati' AND codice='GUA-10');
INSERT INTO maioli_listino (marca,codice,descrizione,um,prezzo,ricarico,categoria,moduli,attivo)
SELECT 'Tubi e Corrugati','GUA-12','Guaina PVC Ø12','m',0.50,0,'Corrugati',0,1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM maioli_listino WHERE marca='Tubi e Corrugati' AND codice='GUA-12');
INSERT INTO maioli_listino (marca,codice,descrizione,um,prezzo,ricarico,categoria,moduli,attivo)
SELECT 'Tubi e Corrugati','GUA-16','Guaina PVC Ø16','m',0.60,0,'Corrugati',0,1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM maioli_listino WHERE marca='Tubi e Corrugati' AND codice='GUA-16');
INSERT INTO maioli_listino (marca,codice,descrizione,um,prezzo,ricarico,categoria,moduli,attivo)
SELECT 'Tubi e Corrugati','GUA-20','Guaina PVC Ø20','m',0.75,0,'Corrugati',0,1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM maioli_listino WHERE marca='Tubi e Corrugati' AND codice='GUA-20');
INSERT INTO maioli_listino (marca,codice,descrizione,um,prezzo,ricarico,categoria,moduli,attivo)
SELECT 'Tubi e Corrugati','GUA-25','Guaina PVC Ø25','m',0.95,0,'Corrugati',0,1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM maioli_listino WHERE marca='Tubi e Corrugati' AND codice='GUA-25');
INSERT INTO maioli_listino (marca,codice,descrizione,um,prezzo,ricarico,categoria,moduli,attivo)
SELECT 'Tubi e Corrugati','GUA-32','Guaina PVC Ø32','m',1.15,0,'Corrugati',0,1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM maioli_listino WHERE marca='Tubi e Corrugati' AND codice='GUA-32');

-- aggiorna descrizione+prezzo delle righe ancora a 0 (run-once di fatto)
UPDATE maioli_listino SET descrizione='Guaina PVC Ø10', prezzo=0.45 WHERE marca='Tubi e Corrugati' AND codice='GUA-10' AND prezzo=0;
UPDATE maioli_listino SET descrizione='Guaina PVC Ø12', prezzo=0.50 WHERE marca='Tubi e Corrugati' AND codice='GUA-12' AND prezzo=0;
UPDATE maioli_listino SET descrizione='Guaina PVC Ø16', prezzo=0.60 WHERE marca='Tubi e Corrugati' AND codice='GUA-16' AND prezzo=0;
UPDATE maioli_listino SET descrizione='Guaina PVC Ø20', prezzo=0.75 WHERE marca='Tubi e Corrugati' AND codice='GUA-20' AND prezzo=0;
UPDATE maioli_listino SET descrizione='Guaina PVC Ø25', prezzo=0.95 WHERE marca='Tubi e Corrugati' AND codice='GUA-25' AND prezzo=0;
UPDATE maioli_listino SET descrizione='Guaina PVC Ø32', prezzo=1.15 WHERE marca='Tubi e Corrugati' AND codice='GUA-32' AND prezzo=0;
