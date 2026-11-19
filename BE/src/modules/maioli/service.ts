import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pool } from '../../config/database';
import type { PoolConnection } from 'mysql2/promise';

// ─────────────────────── Foto su disco (SSD) ───────────────────────
// Le foto delle bolle vengono salvate come file (JPEG) su una cartella
// configurabile (idealmente l'SSD collegato al Raspberry) invece che come
// base64 nel DB. Nel DB (colonna maioli_bolle_foto.img) salviamo solo il
// percorso relativo servito dalla API.
export const UPLOAD_DIR = process.env.MAIOLI_UPLOAD_DIR
  || path.resolve(process.cwd(), 'uploads/maioli');
// Prefisso con cui la FE richiede le foto (passa per nginx → /api/maioli/foto)
const FOTO_URL_PREFIX = '/api/configuratori/maioli/foto';

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Salva una dataURL/base64 come file e ritorna l'URL relativo da salvare in DB.
export function saveFotoFile(dataUrl: string): string {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s.exec(dataUrl.trim());
  if (!m) throw new Error('Formato immagine non valido');
  const mime = m[1];
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 25 * 1024 * 1024) throw new Error('Immagine troppo grande');
  const year = String(new Date().getFullYear());
  const dir = path.join(UPLOAD_DIR, year);
  ensureDir(dir);
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(5).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(dir, name), buf);
  return `${FOTO_URL_PREFIX}/${year}/${name}`;
}

// Risolve un URL foto (come salvato in DB) nel path su disco, in sicurezza.
export function resolveFotoPath(year: string, name: string): string | null {
  if (!/^\d{4}$/.test(year)) return null;
  if (!/^[a-zA-Z0-9._-]+$/.test(name) || name.includes('..')) return null;
  const root = path.resolve(UPLOAD_DIR);
  const abs = path.resolve(root, year, name);
  // difesa anti path-traversal: deve restare dentro UPLOAD_DIR
  if (abs !== root && !abs.startsWith(root + path.sep)) return null;
  return fs.existsSync(abs) ? abs : null;
}

// Cancella i file foto non più referenziati da nessuna bolla (best-effort).
async function deleteOrphanFotoFiles(urls: string[]): Promise<void> {
  for (const url of urls) {
    if (!url || !url.startsWith(FOTO_URL_PREFIX)) continue; // ignora base64 legacy
    try {
      const [rows] = (await pool.execute(
        'SELECT COUNT(*) AS n FROM maioli_bolle_foto WHERE img = ?', [url],
      )) as [{ n: number }[], unknown];
      if (Number(rows[0]?.n ?? 0) > 0) continue; // ancora usata
      const rel = url.slice(FOTO_URL_PREFIX.length).replace(/^\/+/, '');
      const [year, name] = rel.split('/');
      const p = resolveFotoPath(year ?? '', name ?? '');
      if (p) fs.unlinkSync(p);
    } catch { /* best-effort, ignora */ }
  }
}

// LIMIT come intero validato (mysql2 execute non lega bene LIMIT ?)
const lim = (n: number): number => {
  const v = Math.floor(Number(n));
  return Number.isFinite(v) && v > 0 && v <= 5000 ? v : 50;
};

// ─────────────────────────── Tipi ───────────────────────────
export interface Cliente {
  id: number;
  nome: string;
  telefono: string;
  email: string;
  indirizzo: string;
  condominio: string;
  amministratore: string;
  note: string | null;
}

export interface ListinoItem {
  id: number;
  marca: string;
  codice: string;
  descrizione: string;
  um: string;
  prezzo: number;
  ricarico: number;   // ricarico azienda % (livello marca, da JOIN)
  sconto: number;     // sconto installatore % (livello marca, da JOIN)
  categoria: string;
  moduli: number;
  attivo: number;
}

export interface Marca {
  marca: string;
  sconto: number;
  ricarico: number;
}

export interface RigaInput {
  qta: number;
  codice: string;
  marca?: string | null;
  descrizione: string;
  prezzo: number;
  listino_id?: number | null;
}

export interface ManoInput {
  operaio: string;
  ore: number;
  tariffa: number;
}

export interface BollaInput {
  cliente_id?: number | null;
  cliente: string;
  riferimento?: string;
  telefono?: string;
  email?: string;
  indirizzo?: string;
  condominio?: string;
  amministratore?: string;
  preventivo?: string;
  data_chiamata?: string | null;
  data_intervento?: string | null;
  data_consegna?: string | null;
  richiesta?: string;
  difetti?: string;
  iva?: number;
  imponibile?: number;
  totale?: number;
  materiali?: RigaInput[];
  manodopera?: ManoInput[];
  foto?: string[];
  firma_tecnico?: string | null;
  firma_cliente?: string | null;
  lavoro_incompleto?: number;
  da_completare?: string | null;
  costo_chiamata?: number;
  // se true, aggiorna anche l'anagrafica cliente con questi dati
  salvaCliente?: boolean;
}

// ─────────────────────────── Clienti ───────────────────────────
export async function searchClienti(q: string, limit = 20): Promise<Cliente[]> {
  if (q && q.trim()) {
    const like = `%${q.trim()}%`;
    const [rows] = await pool.execute(
      `SELECT * FROM maioli_clienti
       WHERE nome LIKE ? OR indirizzo LIKE ? OR telefono LIKE ?
       ORDER BY nome ASC LIMIT ${lim(limit)}`,
      [like, like, like],
    );
    return rows as Cliente[];
  }
  const [rows] = await pool.execute(
    `SELECT * FROM maioli_clienti ORDER BY updated_at DESC LIMIT ${lim(limit)}`,
  );
  return rows as Cliente[];
}

export async function getCliente(id: number): Promise<Cliente | null> {
  const [rows] = (await pool.execute(
    'SELECT * FROM maioli_clienti WHERE id = ? LIMIT 1',
    [id],
  )) as [Cliente[], unknown];
  return rows[0] ?? null;
}

export async function createCliente(d: Partial<Cliente>): Promise<{ id: number }> {
  const [r] = (await pool.execute(
    `INSERT INTO maioli_clienti (nome, telefono, email, indirizzo, condominio, amministratore, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [d.nome ?? '', d.telefono ?? '', d.email ?? '', d.indirizzo ?? '', d.condominio ?? '', d.amministratore ?? '', d.note ?? null],
  )) as [{ insertId: number }, unknown];
  return { id: r.insertId };
}

export async function updateCliente(id: number, d: Partial<Cliente>): Promise<boolean> {
  const [r] = (await pool.execute(
    `UPDATE maioli_clienti SET nome=?, telefono=?, email=?, indirizzo=?, condominio=?, amministratore=?, note=?
     WHERE id=?`,
    [d.nome ?? '', d.telefono ?? '', d.email ?? '', d.indirizzo ?? '', d.condominio ?? '', d.amministratore ?? '', d.note ?? null, id],
  )) as [{ affectedRows: number }, unknown];
  return r.affectedRows > 0;
}

export async function deleteCliente(id: number): Promise<boolean> {
  const [r] = (await pool.execute('DELETE FROM maioli_clienti WHERE id=?', [id])) as [{ affectedRows: number }, unknown];
  return r.affectedRows > 0;
}

// Upsert cliente dentro una transazione; ritorna l'id del cliente (o null)
async function upsertClienteTx(conn: PoolConnection, b: BollaInput): Promise<number | null> {
  const dati = {
    nome: b.cliente,
    telefono: b.telefono ?? '',
    email: b.email ?? '',
    indirizzo: b.indirizzo ?? '',
    condominio: b.condominio ?? '',
    amministratore: b.amministratore ?? '',
  };
  if (b.cliente_id) {
    await conn.execute(
      `UPDATE maioli_clienti SET nome=?, telefono=?, email=?, indirizzo=?, condominio=?, amministratore=? WHERE id=?`,
      [dati.nome, dati.telefono, dati.email, dati.indirizzo, dati.condominio, dati.amministratore, b.cliente_id],
    );
    return b.cliente_id;
  }
  if (!dati.nome.trim()) return null;
  // anti-duplicati: se esiste già un cliente con lo stesso nome (anche se non è
  // stato selezionato dalla lista), riusalo e aggiornane i dati invece di crearne
  // un altro uguale.
  const [found] = (await conn.execute(
    'SELECT id FROM maioli_clienti WHERE TRIM(nome) = TRIM(?) ORDER BY id ASC LIMIT 1',
    [dati.nome],
  )) as [{ id: number }[], unknown];
  if (found[0]) {
    await conn.execute(
      `UPDATE maioli_clienti SET nome=?, telefono=?, email=?, indirizzo=?, condominio=?, amministratore=? WHERE id=?`,
      [dati.nome.trim(), dati.telefono, dati.email, dati.indirizzo, dati.condominio, dati.amministratore, found[0].id],
    );
    return found[0].id;
  }
  const [r] = (await conn.execute(
    `INSERT INTO maioli_clienti (nome, telefono, email, indirizzo, condominio, amministratore)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [dati.nome.trim(), dati.telefono, dati.email, dati.indirizzo, dati.condominio, dati.amministratore],
  )) as [{ insertId: number }, unknown];
  return r.insertId;
}

// ─────────────────────────── Bolle ───────────────────────────
export interface BollaSummary {
  id: number;
  numero: string | null;
  cliente: string;
  riferimento?: string | null;
  indirizzo: string;
  data_intervento: string | null;
  totale: number;
  updated_at: string;
  deleted_at?: string | null;
  consegnata_at?: string | null;
  n_foto?: number;
  lavoro_incompleto?: number;
}

const SUMMARY_COLS = 'id, numero, cliente, riferimento, indirizzo, data_intervento, totale, updated_at, deleted_at, consegnata_at, lavoro_incompleto, (SELECT COUNT(*) FROM maioli_bolle_foto f WHERE f.bolla_id = maioli_bolle.id) AS n_foto';

export async function listBolle(q: string, stato = 'sospeso', limit = 50): Promise<BollaSummary[]> {
  const cond: string[] = ['deleted_at IS NULL'];
  const params: string[] = [];
  // sospeso = non ancora consegnata; consegnate = contrassegnate consegnate
  cond.push(stato === 'consegnate' ? 'consegnata_at IS NOT NULL' : 'consegnata_at IS NULL');
  if (q && q.trim()) {
    const like = `%${q.trim()}%`;
    cond.push('(cliente LIKE ? OR riferimento LIKE ? OR numero LIKE ? OR indirizzo LIKE ?)');
    params.push(like, like, like, like);
  }
  const order = stato === 'consegnate' ? 'consegnata_at DESC, id DESC' : 'anno ASC, progressivo ASC, id ASC';
  const [rows] = await pool.execute(
    `SELECT ${SUMMARY_COLS} FROM maioli_bolle WHERE ${cond.join(' AND ')} ORDER BY ${order} LIMIT ${lim(limit)}`,
    params,
  );
  return rows as BollaSummary[];
}

// bolle nel cestino (soft-deleted); purga prima quelle oltre i 30 giorni
export async function listBolleCancellate(q: string, limit = 100): Promise<BollaSummary[]> {
  // auto-purge oltre i 30 giorni: raccogli le foto da ripulire su disco, poi elimina
  const [expiredFoto] = (await pool.execute(
    `SELECT f.img FROM maioli_bolle_foto f
     JOIN maioli_bolle b ON b.id = f.bolla_id
     WHERE b.deleted_at IS NOT NULL AND b.deleted_at < (NOW() - INTERVAL 30 DAY)`,
  )) as [{ img: string }[], unknown];
  await pool.execute('DELETE FROM maioli_bolle WHERE deleted_at IS NOT NULL AND deleted_at < (NOW() - INTERVAL 30 DAY)');
  if (expiredFoto.length) await deleteOrphanFotoFiles(expiredFoto.map(f => f.img));
  const cond: string[] = ['deleted_at IS NOT NULL'];
  const params: string[] = [];
  if (q && q.trim()) {
    const like = `%${q.trim()}%`;
    cond.push('(cliente LIKE ? OR numero LIKE ? OR indirizzo LIKE ?)');
    params.push(like, like, like);
  }
  const [rows] = await pool.execute(
    `SELECT ${SUMMARY_COLS} FROM maioli_bolle WHERE ${cond.join(' AND ')} ORDER BY deleted_at DESC LIMIT ${lim(limit)}`,
    params,
  );
  return rows as BollaSummary[];
}

export async function getBolla(id: number): Promise<Record<string, unknown> | null> {
  const [rows] = (await pool.execute('SELECT * FROM maioli_bolle WHERE id=? LIMIT 1', [id])) as [Record<string, unknown>[], unknown];
  const bolla = rows[0];
  if (!bolla) return null;
  const [righe] = await pool.execute('SELECT * FROM maioli_bolle_righe WHERE bolla_id=? ORDER BY ordine ASC, id ASC', [id]);
  const [mano] = await pool.execute('SELECT * FROM maioli_bolle_manodopera WHERE bolla_id=? ORDER BY id ASC', [id]);
  const [foto] = (await pool.execute('SELECT img FROM maioli_bolle_foto WHERE bolla_id=? ORDER BY ordine ASC, id ASC', [id])) as [{ img: string }[], unknown];
  return { ...bolla, materiali: righe, manodopera: mano, foto: foto.map(f => f.img) };
}

async function nextNumero(conn: PoolConnection): Promise<{ numero: string; anno: number; progressivo: number }> {
  const anno = new Date().getFullYear();
  const [rows] = (await conn.execute(
    'SELECT COALESCE(MAX(progressivo),0) AS maxp FROM maioli_bolle WHERE anno=?',
    [anno],
  )) as [{ maxp: number }[], unknown];
  const progressivo = Number(rows[0].maxp) + 1;
  const numero = `${anno}/${String(progressivo).padStart(4, '0')}`;
  return { numero, anno, progressivo };
}

async function writeRighe(conn: PoolConnection, bollaId: number, b: BollaInput): Promise<void> {
  await conn.execute('DELETE FROM maioli_bolle_righe WHERE bolla_id=?', [bollaId]);
  await conn.execute('DELETE FROM maioli_bolle_manodopera WHERE bolla_id=?', [bollaId]);
  await conn.execute('DELETE FROM maioli_bolle_foto WHERE bolla_id=?', [bollaId]);
  const mats = (b.materiali ?? []).filter(m => (m.descrizione && m.descrizione.trim()) || m.qta || m.prezzo);
  let ord = 0;
  for (const m of mats) {
    await conn.execute(
      `INSERT INTO maioli_bolle_righe (bolla_id, ordine, qta, codice, marca, descrizione, prezzo, listino_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [bollaId, ord++, m.qta || 0, m.codice ?? '', m.marca ?? '', m.descrizione ?? '', m.prezzo || 0, m.listino_id ?? null],
    );
  }
  const mano = (b.manodopera ?? []).filter(x => x.operaio && (x.ore || x.tariffa));
  for (const x of mano) {
    await conn.execute(
      `INSERT INTO maioli_bolle_manodopera (bolla_id, operaio, ore, tariffa) VALUES (?, ?, ?, ?)`,
      [bollaId, x.operaio, x.ore || 0, x.tariffa || 0],
    );
  }
  const foto = (b.foto ?? []).filter(Boolean);
  let fo = 0;
  for (const img of foto) {
    await conn.execute(
      `INSERT INTO maioli_bolle_foto (bolla_id, ordine, img) VALUES (?, ?, ?)`,
      [bollaId, fo++, img],
    );
  }
}

export async function createBolla(b: BollaInput): Promise<{ id: number; numero: string }> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const clienteId = await upsertClienteTx(conn, b);
    const { numero, anno, progressivo } = await nextNumero(conn);
    const [r] = (await conn.execute(
      `INSERT INTO maioli_bolle
       (numero, anno, progressivo, cliente_id, cliente, riferimento, telefono, email, indirizzo, condominio, amministratore, preventivo, data_chiamata, data_intervento, data_consegna, richiesta, difetti, iva, imponibile, totale, firma_tecnico, firma_cliente, lavoro_incompleto, da_completare, costo_chiamata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [numero, anno, progressivo, clienteId, b.cliente, b.riferimento ?? '', b.telefono ?? '', b.email ?? '', b.indirizzo ?? '',
       b.condominio ?? '', b.amministratore ?? '', b.preventivo ?? '', b.data_chiamata || null, b.data_intervento || null,
       b.data_consegna || null, b.richiesta ?? '', b.difetti ?? '', b.iva ?? 0, b.imponibile ?? 0, b.totale ?? 0,
       b.firma_tecnico ?? null, b.firma_cliente ?? null, b.lavoro_incompleto ? 1 : 0, b.da_completare ?? null, b.costo_chiamata ? 1 : 0],
    )) as [{ insertId: number }, unknown];
    await writeRighe(conn, r.insertId, b);
    await conn.commit();
    return { id: r.insertId, numero };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function updateBolla(id: number, b: BollaInput): Promise<boolean> {
  const conn = await pool.getConnection();
  let oldFoto: string[] = [];
  try {
    await conn.beginTransaction();
    const [exist] = (await conn.execute('SELECT id FROM maioli_bolle WHERE id=? LIMIT 1', [id])) as [{ id: number }[], unknown];
    if (!exist[0]) { await conn.rollback(); return false; }
    const [prevFoto] = (await conn.execute('SELECT img FROM maioli_bolle_foto WHERE bolla_id=?', [id])) as [{ img: string }[], unknown];
    oldFoto = prevFoto.map(f => f.img);
    const clienteId = await upsertClienteTx(conn, b);
    await conn.execute(
      `UPDATE maioli_bolle SET cliente_id=?, cliente=?, riferimento=?, telefono=?, email=?, indirizzo=?, condominio=?, amministratore=?, preventivo=?, data_chiamata=?, data_intervento=?, data_consegna=?, richiesta=?, difetti=?, iva=?, imponibile=?, totale=?, firma_tecnico=?, firma_cliente=?, lavoro_incompleto=?, da_completare=?, costo_chiamata=? WHERE id=?`,
      [clienteId, b.cliente, b.riferimento ?? '', b.telefono ?? '', b.email ?? '', b.indirizzo ?? '', b.condominio ?? '', b.amministratore ?? '',
       b.preventivo ?? '', b.data_chiamata || null, b.data_intervento || null, b.data_consegna || null, b.richiesta ?? '', b.difetti ?? '', b.iva ?? 0, b.imponibile ?? 0, b.totale ?? 0,
       b.firma_tecnico ?? null, b.firma_cliente ?? null, b.lavoro_incompleto ? 1 : 0, b.da_completare ?? null, b.costo_chiamata ? 1 : 0, id],
    );
    await writeRighe(conn, id, b);
    await conn.commit();
    // pulizia file foto non più referenziati (dopo il commit)
    const newFoto = new Set((b.foto ?? []).filter(Boolean));
    await deleteOrphanFotoFiles(oldFoto.filter(u => !newFoto.has(u)));
    return true;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// soft-delete: sposta nel cestino
export async function deleteBolla(id: number): Promise<boolean> {
  const [r] = (await pool.execute('UPDATE maioli_bolle SET deleted_at = NOW() WHERE id=? AND deleted_at IS NULL', [id])) as [{ affectedRows: number }, unknown];
  return r.affectedRows > 0;
}
export async function restoreBolla(id: number): Promise<boolean> {
  const [r] = (await pool.execute('UPDATE maioli_bolle SET deleted_at = NULL WHERE id=? AND deleted_at IS NOT NULL', [id])) as [{ affectedRows: number }, unknown];
  return r.affectedRows > 0;
}
export async function purgeBolla(id: number): Promise<boolean> {
  const [foto] = (await pool.execute('SELECT img FROM maioli_bolle_foto WHERE bolla_id=?', [id])) as [{ img: string }[], unknown];
  const [r] = (await pool.execute('DELETE FROM maioli_bolle WHERE id=? AND deleted_at IS NOT NULL', [id])) as [{ affectedRows: number }, unknown];
  if (r.affectedRows > 0) await deleteOrphanFotoFiles(foto.map(f => f.img));
  return r.affectedRows > 0;
}
// contrassegna/annulla "consegnata"
export async function setConsegnata(id: number, consegnata: boolean): Promise<boolean> {
  const [r] = (await pool.execute(
    `UPDATE maioli_bolle SET consegnata_at = ${consegnata ? 'NOW()' : 'NULL'} WHERE id=?`, [id],
  )) as [{ affectedRows: number }, unknown];
  return r.affectedRows > 0;
}

// ─────────────────────────── Listino ───────────────────────────
export async function listListino(q: string, marca: string, limit = 500): Promise<ListinoItem[]> {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (q && q.trim()) {
    // ricerca a parole: ogni token deve comparire in codice/descrizione/categoria (AND)
    const tokens = q.trim().split(/\s+/).slice(0, 6);
    for (const tok of tokens) {
      const like = `%${tok}%`;
      where.push('(l.codice LIKE ? OR l.descrizione LIKE ? OR l.categoria LIKE ?)');
      params.push(like, like, like);
    }
  }
  if (marca && marca.trim()) {
    where.push('l.marca = ?');
    params.push(marca.trim());
  }
  const sql = `SELECT l.id, l.marca, l.codice, l.descrizione, l.um, l.prezzo, l.categoria, l.moduli, l.attivo,
      COALESCE(m.sconto, 0) AS sconto, COALESCE(m.ricarico, 0) AS ricarico
    FROM maioli_listino l
    LEFT JOIN maioli_marche m ON m.marca = l.marca
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY l.marca ASC, l.descrizione ASC LIMIT ${lim(limit)}`;
  const [rows] = await pool.execute(sql, params);
  return rows as ListinoItem[];
}

// ─────────────── Marche (sconto installatore / ricarico azienda) ───────────────
export async function listMarche(): Promise<Marca[]> {
  const [rows] = await pool.execute('SELECT marca, sconto, ricarico FROM maioli_marche');
  return rows as Marca[];
}

export async function upsertMarca(marca: string, sconto: number, ricarico: number): Promise<void> {
  await pool.execute(
    `INSERT INTO maioli_marche (marca, sconto, ricarico) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE sconto = VALUES(sconto), ricarico = VALUES(ricarico)`,
    [marca, sconto, ricarico],
  );
}

export async function createListino(d: Partial<ListinoItem>): Promise<{ id: number }> {
  const [r] = (await pool.execute(
    `INSERT INTO maioli_listino (marca, codice, descrizione, um, prezzo, ricarico, attivo)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [d.marca ?? 'Generico', d.codice ?? '', d.descrizione ?? '', d.um ?? '', d.prezzo ?? 0, d.ricarico ?? 0, d.attivo === 0 ? 0 : 1],
  )) as [{ insertId: number }, unknown];
  return { id: r.insertId };
}

export async function updateListino(id: number, d: Partial<ListinoItem>): Promise<boolean> {
  const [r] = (await pool.execute(
    `UPDATE maioli_listino SET marca=?, codice=?, descrizione=?, um=?, prezzo=?, ricarico=?, attivo=? WHERE id=?`,
    [d.marca ?? 'Generico', d.codice ?? '', d.descrizione ?? '', d.um ?? '', d.prezzo ?? 0, d.ricarico ?? 0, d.attivo === 0 ? 0 : 1, id],
  )) as [{ affectedRows: number }, unknown];
  return r.affectedRows > 0;
}

export async function deleteListino(id: number): Promise<boolean> {
  const [r] = (await pool.execute('DELETE FROM maioli_listino WHERE id=?', [id])) as [{ affectedRows: number }, unknown];
  return r.affectedRows > 0;
}

export async function importListino(marca: string, items: Partial<ListinoItem>[]): Promise<{ inserted: number }> {
  if (!items.length) return { inserted: 0 };
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let inserted = 0;
    for (const it of items) {
      await conn.execute(
        `INSERT INTO maioli_listino (marca, codice, descrizione, um, prezzo, ricarico, attivo)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [it.marca ?? marca ?? 'Generico', it.codice ?? '', it.descrizione ?? '', it.um ?? '', it.prezzo ?? 0, it.ricarico ?? 0],
      );
      inserted++;
    }
    await conn.commit();
    return { inserted };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
