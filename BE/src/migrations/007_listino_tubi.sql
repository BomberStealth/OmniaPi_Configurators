-- Seed listino "Tubi e Corrugati" — guaine corrugate (prezzo da compilare).
-- Idempotente: inserisce solo i codici non ancora presenti.
INSERT INTO maioli_listino (marca,codice,descrizione,um,prezzo,ricarico,categoria,moduli,attivo)
SELECT 'Tubi e Corrugati','GUA-10','Guaina corrugata Ø10 mm','m',0,0,'Corrugati',0,1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM maioli_listino WHERE marca='Tubi e Corrugati' AND codice='GUA-10');
INSERT INTO maioli_listino (marca,codice,descrizione,um,prezzo,ricarico,categoria,moduli,attivo)
SELECT 'Tubi e Corrugati','GUA-12','Guaina corrugata Ø12 mm','m',0,0,'Corrugati',0,1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM maioli_listino WHERE marca='Tubi e Corrugati' AND codice='GUA-12');
INSERT INTO maioli_listino (marca,codice,descrizione,um,prezzo,ricarico,categoria,moduli,attivo)
SELECT 'Tubi e Corrugati','GUA-16','Guaina corrugata Ø16 mm','m',0,0,'Corrugati',0,1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM maioli_listino WHERE marca='Tubi e Corrugati' AND codice='GUA-16');
INSERT INTO maioli_listino (marca,codice,descrizione,um,prezzo,ricarico,categoria,moduli,attivo)
SELECT 'Tubi e Corrugati','GUA-20','Guaina corrugata Ø20 mm','m',0,0,'Corrugati',0,1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM maioli_listino WHERE marca='Tubi e Corrugati' AND codice='GUA-20');
INSERT INTO maioli_listino (marca,codice,descrizione,um,prezzo,ricarico,categoria,moduli,attivo)
SELECT 'Tubi e Corrugati','GUA-25','Guaina corrugata Ø25 mm','m',0,0,'Corrugati',0,1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM maioli_listino WHERE marca='Tubi e Corrugati' AND codice='GUA-25');
INSERT INTO maioli_listino (marca,codice,descrizione,um,prezzo,ricarico,categoria,moduli,attivo)
SELECT 'Tubi e Corrugati','GUA-32','Guaina corrugata Ø32 mm','m',0,0,'Corrugati',0,1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM maioli_listino WHERE marca='Tubi e Corrugati' AND codice='GUA-32');
