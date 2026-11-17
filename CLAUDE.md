# OmniaPi Configuratori — note per Claude

## ⚠️ DEPLOY: il backend va fatto a MANO
L'auto-deploy sul server (`omniapi-deploy`) aggiorna **solo la FE**. Ogni volta
che si tocca il **BE** (service o nuove migrazioni), Edoardo deve ricompilarlo e
riavviarlo a mano, altrimenti FE e BE vanno fuori sync:

```bash
cd /home/omniapi/configuratori && git pull
# BACKEND (migrazioni auto-eseguite all'avvio)
cd BE && npm run build && pm2 restart configuratori-be && pm2 logs configuratori-be --lines 20 --nostream
# FRONTEND (di solito la fa l'auto-deploy; a mano:)
cd ../FE && npm run build && rsync -a --delete FE/dist/ /var/www/staging/configuratori/
```
- Repo sul server: `/home/omniapi/configuratori`. BE: pm2 `configuratori-be` (:3001).
  FE webroot staging: `/var/www/staging/configuratori`. DB MariaDB `configuratori_db`.
- Nginx inoltra `/api/configuratori` → BE `:3001`. Limite upload body BE = 30mb.
- A inizio sessione: se ci sono commit BE non ancora deployati, ricordarlo a Edoardo.
- **Idea aperta**: rendere l'`omniapi-deploy` capace di build+restart anche del BE.

## Struttura progetto
- `FE/` — React + Vite + TS, `base: '/configuratori/'`, pagine in `FE/src/pages/*`.
  - `FE/src/pages/maioli/` — sezione **Maioli Idrotermica** (`/configuratori/maioli`):
    tab Nuova Bolla / Bolle già fatte (con cestino) / Listino prezzi. Store con
    fallback localStorage (`store.ts`): se il BE non risponde lavora in "Demo locale".
- `BE/` — Express + TS + MariaDB, moduli in `BE/src/modules/*`.
  - Modulo `maioli`: rotte `/api/maioli/*` (clienti, bolle, listino, marche), senza JWT.
  - Migrazioni `BE/src/migrations/*.sql`, **auto-eseguite all'avvio** (`migrate.ts`),
    idempotenti e NON distruttive (le UPDATE guardano su valori di default, perché
    rigirano ad ogni boot). Nuove migrazioni = file numerati successivi.

## Funzioni Maioli già fatte e deployate
Bolle (form + anteprima + Salva / Salva e Stampa, nome PDF "cliente - data"),
clienti con anagrafica/riuso, archivio + **cestino 30gg** con conferme, IVA 10/22,
manodopera a 3 operai con foto (tariffa default 30€), **foto** allegate (non in
stampa), listino **Vimar/Hager/Tubi e Corrugati** con ricerca a parole (es. "dpn 10"),
**sconto installatore + ricarico azienda per marca** (Listino → Scontato → Finale).

## Versione Maioli
Ad OGNI modifica Maioli che verrà deployata, incrementare `MAIOLI_VERSION` in
`FE/src/pages/maioli/version.ts` (chip in alto nell'header). Patch per
correzioni/piccole aggiunte, minor per funzioni nuove. Attuale: v1.3.2.

## In sospeso / idee
- Dare un po' di colore alla pagina (icone colorate ai titoli di sezione, totale
  evidenziato) — proposto, in attesa di scelta.
- Sotto-gruppi per tipo dentro la marca Hager nel Listino (63 articoli).
- Login/ruoli (se mai servisse): in BE c'è già auth JWT non usata dalla FE.
