# Maioli Idrotermica — Architettura tecnica (sezione `maioli`)

Documento di sintesi per un programmatore (focus backend). Riguarda **solo** la
sezione *Maioli* dell'app "OmniaPi Configuratori".

---

## 1. Stack e topologia

| Layer | Tecnologia |
|------|------------|
| Frontend | React 18 + Vite + TypeScript (SPA). Base path `/configuratori/`, sezione a `/configuratori/maioli` |
| Backend | Node.js + Express + TypeScript |
| DB | MariaDB, database `configuratori_db`, driver `mysql2/promise` |
| Processo | pm2 `configuratori-be` in ascolto su `:3001` |
| Reverse proxy | Nginx: `/api/configuratori/*` → BE `http://localhost:3001/api/*`; FE statico da `/var/www/staging/configuratori` |
| Hosting | Raspberry Pi, esposto via DDNS `ofwd.asuscomm.com` |

**Flusso richiesta:** browser → Nginx → (statico FE) oppure (`/api/configuratori/...` → BE `:3001`).
Lato BE il prefisso `/api/configuratori` è già "sgrassato" da Nginx: il BE monta le rotte su `/api/...`.

**Deploy:** push su `main` (GitHub) → webhook server (pm2 `omniapi-deploy`) → `deploy-configurators.sh`:
`git reset --hard` + build BE (`tsc`) + `pm2 restart configuratori-be` + build FE (`vite build`) + `rsync` sul webroot. Tutto automatico.

---

## 2. Autenticazione / autorizzazione

- Login reale **JWT**. `POST /api/auth/login` (email + password, hash **bcrypt**) → ritorna `{ token, user:{id,email,role} }`.
- Il token è salvato nel browser (localStorage) e inviato come `Authorization: Bearer <token>` su **tutte** le rotte `/api/maioli/*`, protette dal middleware `requireAuth` (`BE/src/middleware/auth.ts`).
- **Eccezione:** `GET /api/maioli/foto/:anno/:file` è servita prima di `requireAuth` e valida il token da sé, accettandolo anche via query `?t=<token>` (le `<img>` non mandano header).
- Account creati **solo a mano** via CLI (`npm run user:add/list/passwd/role/del`, `BE/src/scripts/users.ts`). Nessuna registrazione dal sito.
- Tabella `users` (condivisa): `id, email (unique), password_hash, role ENUM('admin','user'), timestamps`.
- **Ruoli/permessi granulari: non ancora implementati** (previsti 4 ruoli: Dipendente/Amministrazione/Titolare/Admin — da fare, con enforcement lato BE).

---

## 3. Modello dati (tabelle `maioli_*`)

Tutte le tabelle sono **condivise** (strumento interno, nessuno scoping per utente). Migrazioni in `BE/src/migrations/*.sql`, **eseguite ad ogni avvio** del BE (`migrate.ts`), quindi **idempotenti e non distruttive** (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `INSERT ... WHERE NOT EXISTS`, `UPDATE` guardate).

### `maioli_clienti` — anagrafica
`id, nome, telefono, email, indirizzo, condominio, amministratore, note, created_at, updated_at`
- `nome` sempre salvato in **MAIUSCOLO**.

### `maioli_bolle` — testata bolla / rapporto di intervento
Colonne principali:
`id, numero, anno, progressivo, cliente_id (FK→maioli_clienti ON DELETE SET NULL)`,
**snapshot cliente** (`cliente, telefono, email, indirizzo, condominio, amministratore`),
`riferimento`, `preventivo`, `data_chiamata, data_intervento, data_consegna`,
`richiesta, difetti`, `iva, imponibile, totale`,
`firma_tecnico, firma_cliente` (PNG base64),
`lavoro_incompleto (0/1), da_completare`,
`costo_chiamata (0/1)`,
`consegnata_at` (stato "da fatturare"), `deleted_at` (cestino soft-delete), `created_at, updated_at`.
- **Perché gli snapshot:** una bolla stampata non deve cambiare se poi cambi i dati del cliente. Quindi i dati cliente sono copiati dentro la bolla; `cliente_id` resta come riferimento.
- **Numero:** progressivo per anno `"{anno}/{NNNN}"`, calcolato in transazione con `MAX(progressivo) WHERE anno = ?`.

### `maioli_bolle_righe` — materiali della bolla
`id, bolla_id (FK CASCADE), ordine, qta, codice, marca, descrizione, prezzo, listino_id`

### `maioli_bolle_manodopera` — manodopera della bolla
`id, bolla_id (FK CASCADE), operaio, ore, tariffa` (3 operai fissi lato FE)

### `maioli_bolle_foto` — foto allegate
`id, bolla_id (FK CASCADE), ordine, img`
- `img` = **URL** del file su disco (es. `/api/configuratori/maioli/foto/2026/xxx.jpg`). Le foto vecchie possono ancora contenere **base64** (compatibilità).

### `maioli_listino` — listino articoli
`id, marca, codice, descrizione, um, prezzo, ricarico, categoria, moduli, attivo, timestamps`

### `maioli_marche` — parametri per marca
`marca (PK), sconto, ricarico`
- **sconto installatore %** e **ricarico azienda %** per marca (vedi §6 prezzi).

---

## 4. API (prefisso reale BE `/api/maioli`, dietro `requireAuth`)

**Clienti**
- `GET /clienti?q=` — ricerca; ritorna anche `n_sospeso` e `n_dafatturare` (conteggio bolle per stato, via subquery)
- `GET /clienti/:id` · `POST /clienti` · `PUT /clienti/:id` · `DELETE /clienti/:id`

**Riferimenti** (autocomplete per cliente)
- `GET /riferimenti?cliente_id=&q=` — `DISTINCT riferimento` dalle bolle di quel cliente

**Bolle**
- `GET /bolle?q=&stato=(sospeso|consegnate)` — lista per stato (default `sospeso`)
- `GET /bolle/cancellate?q=` — cestino (auto-purga > 30 giorni)
- `GET /bolle/:id` — testata + righe + manodopera + foto
- `POST /bolle` · `PUT /bolle/:id`
- `POST /bolle/:id/restore` — ripristina dal cestino
- `POST /bolle/:id/consegna` — body `{consegnata:bool}` → setta/azzera `consegnata_at`
- `DELETE /bolle/:id` — soft-delete (cestino) · `DELETE /bolle/:id/permanent`

**Foto**
- `POST /foto` — body `{dataUrl}` → salva il file su `MAIOLI_UPLOAD_DIR` (SSD) → ritorna `{url}`
- `GET /foto/:anno/:file` — serve il file (token via header o `?t=`)

**Listino / Marche**
- `GET /listino?q=&marca=` (JOIN con `maioli_marche` per sconto/ricarico) · `POST` · `PUT /:id` · `DELETE /:id` · `POST /listino/import`
- `GET /marche` · `PUT /marche/:marca`

**Varie**
- `POST /api/auth/login` · `GET /api/auth/me`
- `GET /api/health` → `{ ok, ts, beVersion }` (usato dalla FE per l'avviso FE/BE fuori sync)

---

## 5. Flussi principali

**Salvataggio bolla (`createBolla`/`updateBolla`, in transazione):**
1. **Upsert cliente** (`upsertClienteTx`): se `cliente_id` presente → update; altrimenti cerca per `TRIM(nome)` (case-insensitive) e **riusa** se esiste (anti-duplicati); altrimenti insert. Nome in MAIUSCOLO.
2. Calcolo `numero` progressivo per anno.
3. Insert/Update testata + `writeRighe` (cancella e re-inserisce righe/manodopera/foto).
4. Pulizia file foto orfani su disco (foto rimosse / bolle svuotate dal cestino / auto-purga 30gg).

**Stati bolla (non è un enum, sono campi):**
- `deleted_at` → nel **cestino** (auto-purga dopo 30 giorni).
- `consegnata_at IS NULL` → **In sospeso**; `IS NOT NULL` → **Da fatturare**.
- *Fatturate* (e poi pagata/non pagata): **stato non ancora implementato** (tab placeholder lato FE).

**Foto:** FE comprime in JPEG lato client → `POST /foto` → file su SSD → nel DB solo l'URL. Fallback: se il BE non risponde/è vecchio, la foto resta inline base64.

---

## 6. Logica prezzi (importante)

Per ogni marca (`maioli_marche`): **sconto installatore %** e **ricarico azienda %**.
- **Listino** = prezzo di listino (`maioli_listino.prezzo`)
- **Scontato** = listino − sconto installatore = `listino × (1 − sconto/100)` → quello che paga l'installatore
- **Finale** = scontato + ricarico azienda = `scontato × (1 + ricarico/100)` → quello che va **in bolla**

Nella riga materiale della bolla si salva il **prezzo finale** già calcolato. `qtaEff`: se la quantità è vuota ma la riga ha contenuto, vale 1.

**Totali** (`calcola`, lato FE): `manodopera = (costo_chiamata?30:0) + Σ(ore×tariffa)`; `materiali = Σ(qtaEff×prezzo)`; `imponibile = manodopera + materiali`; `iva = imponibile × aliquota/100` (aliquota 0/10/22); `totale = imponibile + iva`.

---

## 7. Frontend (chi gestisce cosa) — `FE/src/pages/maioli/`

- `MaioliPage.tsx` — shell: tab (Nuova Bolla / Storico bolle / Clienti / Listino), stato condiviso della bolla, guard "modifiche non salvate", `ConfirmProvider`.
- `store.ts` — **unico punto di accesso ai dati**: client API (`fetch` con header auth, gestione 401 → logout) **+ fallback localStorage** ("Demo locale" se il BE non risponde).
- `model.ts` — tipi (`RapportoData`, ...) e helper puri (`calcola`, prezzi, `roundOre`, formattazioni it-IT).
- `FoglioRapporto.tsx` + `foglio.css` — il **foglio A4 stampabile** (CSS `@media print` che mostra solo il foglio; nome PDF "Cliente - data"; height 288mm per non generare 2ª pagina su mobile).
- **views/**: `NuovaBolla` (form + anteprima live + Salva/Salva&Stampa + blocco post-salva), `BolleFatte` (archivio: In sospeso / Da fatturare / Fatturate(vuoto) / Cestino), `Clienti`, `Listino`.
- **components/**: `ClientePicker`, `RiferimentoPicker`, `MaterialeRow` (ricerca listino), `OperaiManodopera`, `FotoSection`, `FirmaField` (firma in finestra), `SwipeCard`, `ConfirmDialog`, `AutoTextarea`.

**Versioning / sync FE↔BE:** `MAIOLI_VERSION` (chip in header). Quando la FE dipende da nuove funzioni BE si alza `BE_VERSION` (BE) **e** `REQUIRED_BE_VERSION` (FE): se il BE deployato ha `beVersion < REQUIRED`, la FE mostra un banner "Backend da aggiornare".

---

## 8. Note operative / vincoli

- Migrazioni: nuove = file numerati successivi (`024_...`), **idempotenti** perché rigirano ad ogni boot.
- Limite upload body BE = **30 MB** (`express.json({limit:'30mb'})`).
- Backup DB: `scripts/backup-db.sh` (mysqldump gzip, 14 giorni) via cron. **Solo locale** per ora (off-site su cloud = da fare).
- `JWT_SECRET`, credenziali DB e `MAIOLI_UPLOAD_DIR` in `BE/.env` (non versionato).
- In sospeso: ruoli/permessi (con enforcement BE), audit log, stati "Fatturate/pagate", impostazioni da UI.
