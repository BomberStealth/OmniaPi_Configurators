# OmniaPi Configuratori — note per Claude

## DEPLOY: AUTOMATICO (FE + BE)
A ogni push su `main` il webhook server sul Pi (pm2 `omniapi-deploy`,
`/home/omniapi/omniapi/BE/deploy/webhook-server.js`) lancia
`deploy-configurators.sh`, che ora fa **TUTTO**: git reset, build+restart del BE
e build+pubblicazione della FE. Non serve più fare niente a mano.
- Lo script vive sul server in
  `/home/omniapi/omniapi/BE/deploy/deploy-configurators.sh`; **copia di
  riferimento versionata** in `scripts/deploy-configurators.sh` (se lo cambi,
  aggiorna entrambi copiandolo: `cp scripts/deploy-configurators.sh
  /home/omniapi/omniapi/BE/deploy/deploy-configurators.sh`).
- `.env` del webhook: `OMNIAPI_CONF_DIR=/home/omniapi/configuratori`,
  `OMNIAPI_CONF_BE_PM2=configuratori-be`, webroot
  `/var/www/staging/configuratori`.
- Deploy completo a mano (fallback): `cd /home/omniapi/configuratori && git pull
  && bash scripts/deploy.sh`.
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
    tab Nuova Bolla / Storico bolle / Clienti / Listino. **SOLO ONLINE**:
    `store.ts` è solo-API; se il BE non risponde la pagina mostra "Offline" e si
    blocca (la vecchia "Demo locale" localStorage è stata RIMOSSA).
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
pad canvas) stampate in fondo al foglio, **marca sull'articolo** (Marca · Codice)
e prezzo 0 evidenziato, **stato "lavoro non completato"** (spunta + nota, card
gialla in archivio; verde se consegnata). Archivio diviso in **In sospeso /
Consegnate / Cancellate** con card compatte (Cliente · Riferimento · Data),
tap per aprire e swipe per consegna/cestino. Campo **Riferimento** (in bolla +
foglio + ricerca). **Firma in finestra** grande (no segni per sbaglio). Bolla
**bloccata dopo il salvataggio** (tap → "Vuoi modificare?").

## Versione Maioli
Ad OGNI modifica Maioli che verrà deployata, incrementare `MAIOLI_VERSION` in
`FE/src/pages/maioli/version.ts` (chip in alto nell'header). Patch per
correzioni/piccole aggiunte, minor per funzioni nuove. Attuale: **v1.18.0**.
Quando una modifica FE richiede nuove funzioni BE, alzare anche `BE_VERSION`
(BE) e `REQUIRED_BE_VERSION` (FE) allo stesso numero. Attuale BE: **28**.

## In sospeso / idee
- ✅ **RUOLI/PERMESSI: FATTO (base)**. Non 4 ruoli fissi ma **permessi per
  sezione** gestiti dalla pagina **Account** (solo admin, tab 👤). `users` ha
  ora `attivo` (0/1) + `permessi` (JSON {nuova,storico,clienti,listino,
  fatturate}). ADMIN (role=admin) ha sempre tutto. Login rifiuta account
  disattivati. Enforcement **lato BE**: `loadAccount` (carica attivo+permessi
  freschi ad ogni richiesta) + `requirePerm(cap)` sulle rotte + `requireAdminRole`
  sulle rotte `/accounts`. FE: `can()`/`isAdmin()` in `auth.ts`, tab filtrati.
  Rotte: `GET /me`, `GET/POST /accounts`, `PUT /accounts/:id` (migrazione 026).
  DA FARE ancora: lo spostamento a "Fatturate" (permesso `fatturate`) quando
  esisterà lo stato. Mapping storico (resta per riferimento): **Dipendente**: solo Nuova Bolla + Storico bolle, e dentro Storico
  solo "In sospeso" e "Da fatturare" (no Listino, no Fatturate/Cancellate). Il
  Dipendente può spostare **In sospeso ↔ Da fatturare** (nei due sensi), ma NON
  "Da fatturare → Fatturate" (quello solo **Admin + Amministrazione**).
  **Amministrazione/Titolare/ADMIN**: tutto, e potranno spostare le bolle da "Da
  fatturare" a "Fatturate". Flusso stati ancora in definizione: In sospeso →
  Pronto fattura (= "Da fatturare") → Fatturate → (pagate / non pagate). NB: va
  applicato anche lato BE (route con check `req.user.role`), non solo UI. Tab
  "Fatturate" già creato ma VUOTO (placeholder) in attesa di definire gli stati.
  Dettaglio permessi noto: **Listino prezzi = solo ADMIN e Titolare** (non
  Amministrazione). Sezione Clienti: probabilmente non per Dipendente.
- 🛠 **STORICO AZIONI / AUDIT LOG (richiesto, non ancora fatto)**: tracciare chi
  (account) crea/modifica/elimina bolle, sposta stati, tocca listino/clienti,
  con data/ora. Tabella tipo `maioli_audit` (user, azione, entità, id, quando) +
  log sulle rotte mutanti + una pagina per vederlo (admin). Legato ai ruoli.
- 💡 **QoL / gestionale (idee, da prioritizzare con Edoardo)**: impostazioni da
  UI (tariffa oraria, costo chiamata, IVA default, dati azienda) invece che nel
  codice; filtri/ordinamento nello storico (data, cliente, importo, stato);
  report mensili (incassato, n. bolle, per operaio); export CSV/Excel per il
  commercialista; scadenzario pagamenti (fatturate non pagate + promemoria);
  click sul cliente → suo storico interventi; validazioni/avvisi dati mancanti;
  storico versioni di una bolla; (già fatti: conferme azioni, blocco post-salva,
  avviso modifiche non salvate, backup locale).
- ✅ **DEMO LOCALE: RISOLTO** — Edoardo ha deciso tutti online, niente offline.
  La "Demo locale" è stata rimossa: ora solo-online, se il BE non c'è la pagina
  si blocca con schermata "Offline".
- ✅ **LOCK BOLLA** fatto: aprendo una bolla la si "prende in carico" (campi
  `editing_by`/`editing_at` su maioli_bolle, TTL 15 min + heartbeat FE 5 min);
  da un altro dispositivo → "LA BOLLA È SOTTO MANUTENZIONE da: <email>".
  Endpoint `POST /bolle/:id/lock` (409 se occupata) e `/unlock`.
- `schema_migrations` table: far girare ogni migrazione una sola volta (ora
  rigirano tutte ad ogni boot; funziona ma è fragile per le UPDATE).
- Riepiloghi/totali mensili (bolle del mese, incassato).
- Articoli recenti/preferiti in cima alla ricerca materiali.
