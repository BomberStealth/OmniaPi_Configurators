# OmniaPi Configuratori — note per Claude

## ⚠️ DEPLOY: il backend va fatto a MANO
L'auto-deploy sul server (`omniapi-deploy`) aggiorna **solo la FE**. Ogni volta
che si tocca il **BE** (service o nuove migrazioni), Edoardo deve ricompilarlo e
riavviarlo a mano, altrimenti FE e BE vanno fuori sync.

**Scorciatoia:** c'è `scripts/deploy.sh` che fa TUTTO (pull + build BE + restart
pm2 + build FE + rsync). Sul server basta:
```bash
cd /home/omniapi/configuratori && git pull && bash scripts/deploy.sh
```
A mano, i passi singoli:
```bash
cd /home/omniapi/configuratori && git pull
# BACKEND (migrazioni auto-eseguite all'avvio; --update-env rilegge il .env)
cd BE && npm install && npm run build && pm2 restart configuratori-be --update-env && pm2 logs configuratori-be --lines 20 --nostream
# FRONTEND (di solito la fa l'auto-deploy; a mano:)
cd ../FE && npm run build && rsync -a --delete dist/ /var/www/staging/configuratori/
```
- Repo sul server: `/home/omniapi/configuratori`. BE: pm2 `configuratori-be` (:3001).
  FE webroot staging: `/var/www/staging/configuratori`. DB MariaDB `configuratori_db`.
- Nginx inoltra `/api/configuratori` → BE `:3001`. Limite upload body BE = 30mb.
- **Avviso FE/BE fuori sync**: la FE legge `beVersion` da `/api/health` e, se è più
  bassa di `REQUIRED_BE_VERSION` (in `version.ts`), mostra un banner "Backend da
  aggiornare". Quando una modifica FE dipende da nuove rotte/funzioni BE: alzare
  `BE_VERSION` in `BE/src/version.ts` **e** `REQUIRED_BE_VERSION` in
  `FE/src/pages/maioli/version.ts` allo stesso numero.
- A inizio sessione: se ci sono commit BE non ancora deployati, ricordarlo a Edoardo.

## 🔐 Login / account (obbligatorio per entrare)
- L'accesso è protetto da login vero: la FE chiama `/api/auth/login`, il BE
  verifica email+password (hash bcrypt, tabella `users`) e rilascia un **JWT**.
  Il token è salvato nel browser e inviato come `Authorization: Bearer …` su
  tutte le rotte `/api/maioli/*` (ora protette con `requireAuth`). Niente più
  password nel bundle del sito.
- Al 401 (token scaduto/assente) la FE torna da sola al login. `Layout` blocca
  l'accesso a chi non ha sessione.
- **Gli account si creano SOLO a mano sul server** (non dal sito). Dopo il build
  del BE:
  ```bash
  cd /home/omniapi/configuratori/BE
  npm run user:list                               # elenco account
  npm run user:add    -- email@esempio.it 'password' admin   # crea/aggiorna
  npm run user:passwd -- email@esempio.it 'nuovapass'        # cambia password
  npm run user:role   -- email@esempio.it user               # admin|user
  npm run user:del    -- email@esempio.it                    # elimina
  ```
- Account di default seminato dalla migrazione 001: `admin@omniapi.com` /
  `admin123`. **Cambiarlo subito** (`user:passwd`) o eliminarlo dopo aver creato
  l'account vero. Impostare anche un `JWT_SECRET` lungo e casuale nel `BE/.env`.

## 📷 Foto bolle = file su SSD (non più base64 nel DB)
- La FE comprime la foto (JPEG) e la **carica** su `POST /api/maioli/foto`; il BE
  la salva come file e nel DB (`maioli_bolle_foto.img`) mette solo l'URL. Le foto
  si servono da `GET /api/maioli/foto/:anno/:file` (token passato in `?t=` perché
  le `<img>` non mandano header). Helper FE: `fotoSrc()` e `uploadFoto()` in
  `store.ts`.
- Cartella configurabile con `MAIOLI_UPLOAD_DIR` nel `BE/.env` → puntarla
  all'**SSD** (es. `/mnt/ssd/maioli-foto`). Default: `BE/uploads/maioli`.
- Le foto base64 vecchie già nel DB continuano a funzionare (compatibilità). I
  file orfani (foto rimosse / bolle svuotate dal cestino) vengono ripuliti.
- Fallback: se il BE è vecchio/irraggiungibile, la foto resta inline (base64) e
  il salvataggio funziona comunque.

## 💾 Backup database
- `scripts/backup-db.sh` → `mysqldump` gzippato, tiene gli ultimi 14 giorni,
  legge le credenziali da `BE/.env`. Mettere i backup su SSD (`BACKUP_DIR`).
- Cron consigliato (ogni notte 2:30), `crontab -e`:
  ```
  30 2 * * * /home/omniapi/configuratori/scripts/backup-db.sh >> /var/log/configuratori-backup.log 2>&1
  ```
- Ripristino: `gunzip -c <file>.sql.gz | mysql -u omniapi -p configuratori_db`.

## Struttura progetto
- `FE/` — React + Vite + TS, `base: '/configuratori/'`, pagine in `FE/src/pages/*`.
  - `FE/src/pages/maioli/` — sezione **Maioli Idrotermica** (`/configuratori/maioli`):
    tab Nuova Bolla / Bolle già fatte (con cestino) / Listino prezzi. Store con
    fallback localStorage (`store.ts`): se il BE non risponde lavora in "Demo locale".
  - `FE/src/auth.ts` — login reale (JWT), token, `authHeaders()`, `onAuthExpired()`.
- `BE/` — Express + TS + MariaDB, moduli in `BE/src/modules/*`.
  - Modulo `maioli`: rotte `/api/maioli/*` (clienti, bolle, foto, listino, marche),
    **protette da `requireAuth`** (tranne il serve-foto che valida il token da sé).
  - Auth condivisa in `BE/src/shared/*`, middleware in `BE/src/middleware/auth.ts`,
    JWT in `BE/src/config/jwt.ts`. CLI account: `BE/src/scripts/users.ts`.
  - Migrazioni `BE/src/migrations/*.sql`, **auto-eseguite all'avvio** (`migrate.ts`),
    idempotenti e NON distruttive (le UPDATE guardano su valori di default, perché
    rigirano ad ogni boot). Nuove migrazioni = file numerati successivi.

## Funzioni Maioli già fatte e deployate
Bolle (form + anteprima + Salva / Salva e Stampa, nome PDF "cliente - data"),
clienti con anagrafica/riuso, archivio a card con **swipe** (destra=cestina,
sinistra=consegnata) + **cestino 30gg** con conferme, IVA 10/22, manodopera a 3
operai con foto (tariffa default 30€), **foto su SSD** allegate (non in stampa),
listino **Vimar/BTicino/Hager/Cavi/Tubi e Corrugati** con ricerca a parole
(es. "dpn 10"), **sigle marca 3 lettere** nella tendina ("SIGLA · Codice ·
Descrizione") e nel listino, **sotto-gruppi per categoria** nel listino,
**sconto installatore + ricarico azienda per marca** (Listino → Scontato → Finale),
**login JWT** con account creati a mano, **firme a dito** (Tecnico + Cliente,
pad canvas) stampate in fondo al foglio.

## Versione Maioli
Ad OGNI modifica Maioli che verrà deployata, incrementare `MAIOLI_VERSION` in
`FE/src/pages/maioli/version.ts` (chip in alto nell'header). Patch per
correzioni/piccole aggiunte, minor per funzioni nuove. Attuale: **v1.9.0**.
Quando una modifica FE richiede nuove funzioni BE, alzare anche `BE_VERSION`
(BE) e `REQUIRED_BE_VERSION` (FE) allo stesso numero. Attuale BE: **18**.

## In sospeso / idee
- `schema_migrations` table: far girare ogni migrazione una sola volta (ora
  rigirano tutte ad ogni boot; funziona ma è fragile per le UPDATE).
- Riepiloghi/totali mensili (bolle del mese, incassato).
- Articoli recenti/preferiti in cima alla ricerca materiali.
