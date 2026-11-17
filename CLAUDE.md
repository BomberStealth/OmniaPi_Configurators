# OmniaPi Configuratori — note per Claude

## ⚠️ PROMEMORIA DEPLOY (leggere a inizio sessione)
All'inizio della **prossima sessione**, PRIMA di fare o dire qualsiasi altra cosa,
ricordare a Edoardo di eseguire i comandi di deploy qui sotto sul server OmniaPi
(serve per portare in staging/produzione il lavoro già committato su `main`:
sezione **Maioli Idrotermica**, backend `maioli`, migrazioni, listino Vimar).

Chiedere se li ha già eseguiti; se no, ricordarglieli. Poi proseguire.

### Comandi di deploy (sul server OmniaPi)
```bash
# 1) Repo
cd ~/OmniaPi_Configurators        # adattare il percorso se diverso
git checkout main && git pull

# 2) BACKEND — build + riavvio (le migration 001→005 partono da sole all'avvio)
cd BE
npm install
npm run build
pm2 list                          # nome del processo del BE configuratori
pm2 restart <nome-be>             # se non esiste: pm2 start dist/server.js --name configuratori-be
pm2 logs <nome-be> --lines 40     # verificare "Migration applicata: 002..005"

# 3) FRONTEND — build e pubblicazione su /configuratori/
cd ../FE
npm install
npm run build
#   copiare FE/dist nella webroot servita da nginx su /configuratori/
```
- Nginx deve inoltrare `/api/configuratori` → BE `:3001` (come per il Fotovoltaico).
- A deploy fatto: la pagina Maioli passa da "Demo locale" a "● Database" e in
  **Listino prezzi** compaiono i 37 articoli Vimar.

## Struttura progetto
- `FE/` — React + Vite + TS, `base: '/configuratori/'`, pagine in `FE/src/pages/*`.
  - `FE/src/pages/maioli/` — sezione **Maioli Idrotermica** (rotta `/configuratori/maioli`):
    tab Nuova Bolla / Bolle già fatte / Listino prezzi. Store con fallback
    localStorage (`store.ts`): se il BE non risponde lavora in "Demo locale".
- `BE/` — Express + TS + MariaDB (`configuratori_db`), moduli in `BE/src/modules/*`.
  - Modulo `maioli`: rotte `/api/maioli/*` (clienti, bolle, listino), senza JWT.
  - Migrazioni in `BE/src/migrations/*.sql`, **auto-eseguite all'avvio** (`migrate.ts`),
    idempotenti. Aggiungere nuove migrazioni come file numerati successivi.
- Branch di sviluppo per sessioni cloud: `claude/serene-thompson-ezk4p`; il lavoro
  Maioli è stato fatto e pushato su `main`.

## ⚠️ IN SOSPESO — fix salvataggio bolla con FOTO (ricordare a Edoardo)
Salvare una bolla CON foto dà "Salvataggio non riuscito". Cause server-side:
1. Il BACKEND va ricompilato+riavviato con la v1.1.0+ (limite body alzato a
   30mb e tabella `maioli_bolle_foto`): `cd BE && npm run build && pm2 restart
   configuratori-be && pm2 logs configuratori-be --lines 25 --nostream`
   (nei log deve comparire `Migration applicata: 010_bolle_foto.sql`).
2. Se persiste: nginx blocca i body > 1MB → aggiungere `client_max_body_size
   30m;` nel server block del sito (backup prima) e `sudo nginx -t &&
   sudo systemctl reload nginx`.
Scommessa: era solo il BE non aggiornato. Chiedere a Edoardo se l'ha risolto.

## Versione Maioli
Ad OGNI modifica della sezione Maioli che verrà deployata, incrementare
`MAIOLI_VERSION` in `FE/src/pages/maioli/version.ts` (mostrata come chip in alto
nell'header). Patch per correzioni/piccole aggiunte, minor per funzioni nuove.

## In sospeso
- Foto dei 3 operai (Edoardo/Daniele/Sandro) per gli avatar della manodopera
  (ora iniziali colorate): `FE/src/pages/maioli/azienda.ts`, campo `foto`.
