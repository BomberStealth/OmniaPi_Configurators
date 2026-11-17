import { calcola, n2, oggiISO, rigaHaContenuto, qtaEff } from './model';
import type { RapportoData } from './model';

const API = '/api/configuratori/maioli';
const HEALTH = '/api/configuratori/health';

export interface Cliente {
  id: number;
  nome: string;
  telefono: string;
  email: string;
  indirizzo: string;
  condominio: string;
  amministratore: string;
  note?: string | null;
}
export interface BollaSummary {
  id: number;
  numero: string | null;
  cliente: string;
  indirizzo: string;
  data_intervento: string | null;
  totale: number;
  updated_at: string;
  deleted_at?: string | null;
  n_foto?: number;
}
export interface ListinoItem {
  id: number;
  marca: string;
  codice: string;
  descrizione: string;
  um: string;
  prezzo: number;      // prezzo di listino
  ricarico: number;    // ricarico azienda % (livello marca)
  sconto: number;      // sconto installatore % (livello marca)
  attivo: number;
  categoria?: string;
  moduli?: number;
}

export interface Marca {
  marca: string;
  sconto: number;
  ricarico: number;
}

// ───────── mapping form <-> payload ─────────
function isoDate(v: unknown): string {
  if (!v) return '';
  if (v instanceof Date) return oggiISOfrom(v);
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
}
function oggiISOfrom(n: Date): string {
  const p = (x: number) => String(x).padStart(2, '0');
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
}

export function toPayload(d: RapportoData) {
  const tot = calcola(d);
  return {
    cliente_id: d.cliente_id ?? null,
    cliente: d.cliente.trim(),
    telefono: d.telefono,
    email: d.email,
    indirizzo: d.indirizzo,
    condominio: d.condominio,
    amministratore: d.amministratore,
    preventivo: d.preventivo,
    data_chiamata: d.dataChiamata || null,
    data_intervento: d.dataIntervento || null,
    data_consegna: d.dataConsegna || null,
    richiesta: d.richiesta,
    difetti: d.difetti,
    iva: n2(d.iva),
    imponibile: tot.imponibile,
    totale: tot.totale,
    materiali: d.materiali
      .filter(rigaHaContenuto)
      .map(m => ({ qta: qtaEff(m), codice: m.codice, descrizione: m.descrizione, prezzo: n2(m.prezzo), listino_id: m.listino_id ?? null })),
    manodopera: d.manodopera
      .filter(x => x.operaio)
      .map(x => ({ operaio: x.operaio, ore: n2(x.ore), tariffa: n2(x.tariffa) })),
    foto: (d.foto ?? []).filter(Boolean),
  };
}

export function fromBolla(row: Record<string, any>): RapportoData {
  return {
    id: row.id ?? null,
    numero: row.numero ?? '',
    cliente_id: row.cliente_id ?? null,
    cliente: row.cliente ?? '',
    dataChiamata: isoDate(row.data_chiamata),
    dataIntervento: isoDate(row.data_intervento),
    dataConsegna: isoDate(row.data_consegna),
    condominio: row.condominio ?? '',
    amministratore: row.amministratore ?? '',
    preventivo: row.preventivo ?? '',
    telefono: row.telefono ?? '',
    email: row.email ?? '',
    indirizzo: row.indirizzo ?? '',
    richiesta: row.richiesta ?? '',
    difetti: row.difetti ?? '',
    iva: Number(row.iva ?? 0),
    manodopera: (row.manodopera ?? []).map((m: any) => ({ operaio: m.operaio, ore: String(m.ore ?? ''), tariffa: String(m.tariffa ?? '') })),
    materiali: (row.materiali ?? []).map((r: any) => ({ qta: String(r.qta ?? ''), codice: r.codice ?? '', descrizione: r.descrizione ?? '', prezzo: String(r.prezzo ?? ''), listino_id: r.listino_id ?? null })),
    foto: Array.isArray(row.foto) ? row.foto.filter(Boolean) : [],
  };
}

export function clienteToData(c: Cliente, base: RapportoData): RapportoData {
  return {
    ...base,
    cliente_id: c.id,
    cliente: c.nome,
    telefono: c.telefono ?? '',
    email: c.email ?? '',
    indirizzo: c.indirizzo ?? '',
    condominio: c.condominio ?? '',
    amministratore: c.amministratore ?? '',
  };
}

// ───────── API layer ─────────
async function jfetch(url: string, opts?: RequestInit) {
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

// ───────── localStorage layer (fallback demo) ─────────
const LS = {
  clienti: 'maioli_clienti_v1',
  bolle: 'maioli_bolle_v1',
  listino: 'maioli_listino_v1',
  marche: 'maioli_marche_v1',
  seq: 'maioli_seq_v1',
};
function lsGet<T>(k: string, def: T): T {
  try { const r = localStorage.getItem(k); return r ? (JSON.parse(r) as T) : def; } catch { return def; }
}
function lsSet(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }
function nextId(kind: string): number {
  const seq = lsGet<Record<string, number>>(LS.seq, {});
  const id = (seq[kind] ?? 0) + 1;
  seq[kind] = id; lsSet(LS.seq, seq);
  return id;
}

// ───────── Store unificato ─────────
export type StoreMode = 'api' | 'local';
let MODE: StoreMode | null = null;

export async function initStore(): Promise<StoreMode> {
  if (MODE) return MODE;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(HEALTH, { signal: ctrl.signal });
    clearTimeout(t);
    // api valida solo se il DB risponde: provo una query reale
    if (res.ok) {
      const probe = await fetch(`${API}/clienti?q=`);
      MODE = probe.ok ? 'api' : 'local';
    } else {
      MODE = 'local';
    }
  } catch {
    MODE = 'local';
  }
  return MODE;
}
export function storeMode(): StoreMode { return MODE ?? 'local'; }

// ── Clienti ──
export async function searchClienti(q: string): Promise<Cliente[]> {
  await initStore();
  if (MODE === 'api') return jfetch(`${API}/clienti?q=${encodeURIComponent(q)}`);
  const all = lsGet<Cliente[]>(LS.clienti, []);
  const s = q.trim().toLowerCase();
  const out = s ? all.filter(c => (c.nome + c.indirizzo + c.telefono).toLowerCase().includes(s)) : all;
  return out.sort((a, b) => a.nome.localeCompare(b.nome)).slice(0, 20);
}

function upsertClienteLocal(d: RapportoData): number | null {
  const all = lsGet<Cliente[]>(LS.clienti, []);
  const dati = {
    nome: d.cliente, telefono: d.telefono, email: d.email,
    indirizzo: d.indirizzo, condominio: d.condominio, amministratore: d.amministratore,
  };
  if (d.cliente_id) {
    const i = all.findIndex(c => c.id === d.cliente_id);
    if (i >= 0) { all[i] = { ...all[i], ...dati }; lsSet(LS.clienti, all); return d.cliente_id; }
  }
  if (!dati.nome.trim()) return null;
  const id = nextId('cliente');
  all.push({ id, ...dati });
  lsSet(LS.clienti, all);
  return id;
}

// ── Bolle ──
export async function listBolle(q: string): Promise<BollaSummary[]> {
  await initStore();
  if (MODE === 'api') return jfetch(`${API}/bolle?q=${encodeURIComponent(q)}`);
  const all = lsGet<any[]>(LS.bolle, []).filter(b => !b.deleted_at);
  const s = q.trim().toLowerCase();
  const rows = (s ? all.filter(b => (String(b.cliente) + b.numero + b.indirizzo).toLowerCase().includes(s)) : all)
    .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
  return rows.map(b => ({ id: b.id, numero: b.numero, cliente: b.cliente, indirizzo: b.indirizzo, data_intervento: b.data_intervento, totale: b.totale, updated_at: b.updated_at, n_foto: (b.foto || []).length }));
}

export async function getBolla(id: number): Promise<RapportoData> {
  await initStore();
  if (MODE === 'api') return fromBolla(await jfetch(`${API}/bolle/${id}`));
  const all = lsGet<any[]>(LS.bolle, []);
  const b = all.find(x => x.id === id);
  if (!b) throw new Error('Non trovata');
  return fromBolla(b);
}

export async function saveBolla(d: RapportoData): Promise<{ id: number; numero: string }> {
  await initStore();
  const payload = toPayload(d);
  if (MODE === 'api') {
    if (d.id) { await jfetch(`${API}/bolle/${d.id}`, { method: 'PUT', body: JSON.stringify(payload) }); return { id: d.id, numero: d.numero }; }
    const r = await jfetch(`${API}/bolle`, { method: 'POST', body: JSON.stringify(payload) });
    return { id: r.id, numero: r.numero };
  }
  // local
  const clienteId = upsertClienteLocal(d);
  const all = lsGet<any[]>(LS.bolle, []);
  const now = new Date().toISOString();
  if (d.id) {
    const i = all.findIndex(x => x.id === d.id);
    const numero = i >= 0 ? all[i].numero : newNumeroLocal();
    const rec = { ...payload, id: d.id, cliente_id: clienteId, numero, updated_at: now, created_at: i >= 0 ? all[i].created_at : now };
    if (i >= 0) all[i] = rec; else all.push(rec);
    lsSet(LS.bolle, all);
    return { id: d.id, numero };
  }
  const id = nextId('bolla');
  const numero = newNumeroLocal();
  all.push({ ...payload, id, cliente_id: clienteId, numero, updated_at: now, created_at: now });
  lsSet(LS.bolle, all);
  return { id, numero };
}

function newNumeroLocal(): string {
  const anno = new Date().getFullYear();
  const seq = lsGet<Record<string, number>>(LS.seq, {});
  const key = `num_${anno}`;
  const prog = (seq[key] ?? 0) + 1;
  seq[key] = prog; lsSet(LS.seq, seq);
  return `${anno}/${String(prog).padStart(4, '0')}`;
}

// soft-delete: sposta nel cestino
export async function deleteBolla(id: number): Promise<void> {
  await initStore();
  if (MODE === 'api') { await jfetch(`${API}/bolle/${id}`, { method: 'DELETE' }); return; }
  const all = lsGet<any[]>(LS.bolle, []);
  const i = all.findIndex(x => x.id === id);
  if (i >= 0) { all[i].deleted_at = new Date().toISOString(); lsSet(LS.bolle, all); }
}

export async function listBolleCancellate(q: string): Promise<BollaSummary[]> {
  await initStore();
  if (MODE === 'api') return jfetch(`${API}/bolle/cancellate?q=${encodeURIComponent(q)}`);
  const all = lsGet<any[]>(LS.bolle, []);
  const cutoff = Date.now() - 30 * 86400000;
  const kept = all.filter(b => !b.deleted_at || Date.parse(b.deleted_at) >= cutoff);
  if (kept.length !== all.length) lsSet(LS.bolle, kept);
  const s = q.trim().toLowerCase();
  const trashed = kept.filter(b => b.deleted_at)
    .filter(b => !s || (String(b.cliente) + b.numero + b.indirizzo).toLowerCase().includes(s))
    .sort((a, b) => (b.deleted_at || '').localeCompare(a.deleted_at || ''));
  return trashed.map(b => ({ id: b.id, numero: b.numero, cliente: b.cliente, indirizzo: b.indirizzo, data_intervento: b.data_intervento, totale: b.totale, updated_at: b.updated_at, deleted_at: b.deleted_at, n_foto: (b.foto || []).length }));
}

export async function restoreBolla(id: number): Promise<void> {
  await initStore();
  if (MODE === 'api') { await jfetch(`${API}/bolle/${id}/restore`, { method: 'POST' }); return; }
  const all = lsGet<any[]>(LS.bolle, []);
  const i = all.findIndex(x => x.id === id);
  if (i >= 0) { delete all[i].deleted_at; lsSet(LS.bolle, all); }
}

export async function deleteBollaPermanent(id: number): Promise<void> {
  await initStore();
  if (MODE === 'api') { await jfetch(`${API}/bolle/${id}/permanent`, { method: 'DELETE' }); return; }
  lsSet(LS.bolle, lsGet<any[]>(LS.bolle, []).filter(x => x.id !== id));
}

// ── Listino ──
export async function listListino(q: string, marca = ''): Promise<ListinoItem[]> {
  await initStore();
  if (MODE === 'api') return jfetch(`${API}/listino?q=${encodeURIComponent(q)}&marca=${encodeURIComponent(marca)}`);
  const all = lsGet<ListinoItem[]>(LS.listino, []);
  const marche = lsGet<Record<string, { sconto: number; ricarico: number }>>(LS.marche, {});
  const tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return all
    .filter(it => {
      if (marca && it.marca !== marca) return false;
      if (!tokens.length) return true;
      const hay = `${it.codice} ${it.descrizione} ${it.categoria ?? ''}`.toLowerCase();
      return tokens.every(t => hay.includes(t));
    })
    .map(it => ({ ...it, sconto: marche[it.marca]?.sconto ?? 0, ricarico: marche[it.marca]?.ricarico ?? 0 }))
    .sort((a, b) => (a.marca + a.descrizione).localeCompare(b.marca + b.descrizione));
}

export async function saveListino(item: Partial<ListinoItem>): Promise<{ id: number }> {
  await initStore();
  if (MODE === 'api') {
    if (item.id) { await jfetch(`${API}/listino/${item.id}`, { method: 'PUT', body: JSON.stringify(item) }); return { id: item.id }; }
    return jfetch(`${API}/listino`, { method: 'POST', body: JSON.stringify(item) });
  }
  const all = lsGet<ListinoItem[]>(LS.listino, []);
  if (item.id) {
    const i = all.findIndex(x => x.id === item.id);
    if (i >= 0) { all[i] = { ...all[i], ...item } as ListinoItem; lsSet(LS.listino, all); return { id: item.id }; }
  }
  const id = nextId('listino');
  all.push({ id, marca: item.marca ?? 'Generico', codice: item.codice ?? '', descrizione: item.descrizione ?? '', um: item.um ?? '', prezzo: n2(item.prezzo), ricarico: n2(item.ricarico), sconto: n2(item.sconto), attivo: item.attivo === 0 ? 0 : 1 });
  lsSet(LS.listino, all);
  return { id };
}

export async function deleteListino(id: number): Promise<void> {
  await initStore();
  if (MODE === 'api') { await jfetch(`${API}/listino/${id}`, { method: 'DELETE' }); return; }
  lsSet(LS.listino, lsGet<ListinoItem[]>(LS.listino, []).filter(x => x.id !== id));
}

// ── Marche: sconto installatore / ricarico azienda ──
export async function listMarche(): Promise<Marca[]> {
  await initStore();
  if (MODE === 'api') return jfetch(`${API}/marche`);
  const m = lsGet<Record<string, { sconto: number; ricarico: number }>>(LS.marche, {});
  return Object.entries(m).map(([marca, v]) => ({ marca, sconto: v.sconto, ricarico: v.ricarico }));
}

export async function saveMarca(marca: string, sconto: number, ricarico: number): Promise<void> {
  await initStore();
  if (MODE === 'api') {
    await jfetch(`${API}/marche/${encodeURIComponent(marca)}`, { method: 'PUT', body: JSON.stringify({ sconto, ricarico }) });
    return;
  }
  const m = lsGet<Record<string, { sconto: number; ricarico: number }>>(LS.marche, {});
  m[marca] = { sconto, ricarico };
  lsSet(LS.marche, m);
}
