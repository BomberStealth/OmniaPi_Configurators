import { pool } from '../../config/database';
import type { PoolConnection } from 'mysql2/promise';

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
  ricarico: number;
  attivo: number;
}

export interface RigaInput {
  qta: number;
  codice: string;
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
  const [r] = (await conn.execute(
    `INSERT INTO maioli_clienti (nome, telefono, email, indirizzo, condominio, amministratore)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [dati.nome, dati.telefono, dati.email, dati.indirizzo, dati.condominio, dati.amministratore],
  )) as [{ insertId: number }, unknown];
  return r.insertId;
}

// ─────────────────────────── Bolle ───────────────────────────
export interface BollaSummary {
  id: number;
  numero: string | null;
  cliente: string;
  indirizzo: string;
  data_intervento: string | null;
  totale: number;
  updated_at: string;
}

export async function listBolle(q: string, limit = 50): Promise<BollaSummary[]> {
  if (q && q.trim()) {
    const like = `%${q.trim()}%`;
    const [rows] = await pool.execute(
      `SELECT id, numero, cliente, indirizzo, data_intervento, totale, updated_at
       FROM maioli_bolle
       WHERE cliente LIKE ? OR numero LIKE ? OR indirizzo LIKE ?
       ORDER BY updated_at DESC LIMIT ${lim(limit)}`,
      [like, like, like],
    );
    return rows as BollaSummary[];
  }
  const [rows] = await pool.execute(
    `SELECT id, numero, cliente, indirizzo, data_intervento, totale, updated_at
     FROM maioli_bolle ORDER BY updated_at DESC LIMIT ${lim(limit)}`,
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
      `INSERT INTO maioli_bolle_righe (bolla_id, ordine, qta, codice, descrizione, prezzo, listino_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [bollaId, ord++, m.qta || 0, m.codice ?? '', m.descrizione ?? '', m.prezzo || 0, m.listino_id ?? null],
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
       (numero, anno, progressivo, cliente_id, cliente, telefono, email, indirizzo, condominio, amministratore, preventivo, data_chiamata, data_intervento, data_consegna, richiesta, difetti, iva, imponibile, totale)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [numero, anno, progressivo, clienteId, b.cliente, b.telefono ?? '', b.email ?? '', b.indirizzo ?? '',
       b.condominio ?? '', b.amministratore ?? '', b.preventivo ?? '', b.data_chiamata || null, b.data_intervento || null,
       b.data_consegna || null, b.richiesta ?? '', b.difetti ?? '', b.iva ?? 0, b.imponibile ?? 0, b.totale ?? 0],
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
  try {
    await conn.beginTransaction();
    const [exist] = (await conn.execute('SELECT id FROM maioli_bolle WHERE id=? LIMIT 1', [id])) as [{ id: number }[], unknown];
    if (!exist[0]) { await conn.rollback(); return false; }
    const clienteId = await upsertClienteTx(conn, b);
    await conn.execute(
      `UPDATE maioli_bolle SET cliente_id=?, cliente=?, telefono=?, email=?, indirizzo=?, condominio=?, amministratore=?, preventivo=?, data_chiamata=?, data_intervento=?, data_consegna=?, richiesta=?, difetti=?, iva=?, imponibile=?, totale=? WHERE id=?`,
      [clienteId, b.cliente, b.telefono ?? '', b.email ?? '', b.indirizzo ?? '', b.condominio ?? '', b.amministratore ?? '',
       b.preventivo ?? '', b.data_chiamata || null, b.data_intervento || null, b.data_consegna || null, b.richiesta ?? '', b.difetti ?? '', b.iva ?? 0, b.imponibile ?? 0, b.totale ?? 0, id],
    );
    await writeRighe(conn, id, b);
    await conn.commit();
    return true;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function deleteBolla(id: number): Promise<boolean> {
  const [r] = (await pool.execute('DELETE FROM maioli_bolle WHERE id=?', [id])) as [{ affectedRows: number }, unknown];
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
      where.push('(codice LIKE ? OR descrizione LIKE ? OR categoria LIKE ?)');
      params.push(like, like, like);
    }
  }
  if (marca && marca.trim()) {
    where.push('marca = ?');
    params.push(marca.trim());
  }
  const sql = `SELECT * FROM maioli_listino ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY marca ASC, descrizione ASC LIMIT ${lim(limit)}`;
  const [rows] = await pool.execute(sql, params);
  return rows as ListinoItem[];
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
