-- Dati azienda + testo dichiarazione del foglio, modificabili da Impostazioni
-- (admin). Prima erano hardcoded nel codice FE (azienda.ts). Key-value su
-- maioli_settings, seminati con i valori attuali. INSERT IGNORE = non
-- sovrascrive se già presenti.
INSERT IGNORE INTO maioli_settings (k, v) VALUES
  ('az_ragione_sociale', 'MAIOLI IDROTERMICA'),
  ('az_tel',             '0541 1735714'),
  ('az_cel',             '320 1736940'),
  ('az_email',           'office@maioli-idrotermicasrl.it'),
  ('az_indirizzo',       'Via Flaminia Conca, 77/b'),
  ('az_cap_citta',       '47923 Rimini'),
  ('az_piva',            '04351490406'),
  ('az_certificazione',  'Azienda Certificata UNI EN ISO 9001:2015'),
  ('az_ncert',           '3147'),
  ('bolla_dichiarazione','Si prende atto che i lavori effettuati sono regolarmente funzionanti e che non sono stati causati danni di qualsiasi natura');
