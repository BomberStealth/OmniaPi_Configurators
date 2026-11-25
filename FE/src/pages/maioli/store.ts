import { calcola, n2, numStr, oggiISO, rigaHaContenuto, qtaEff } from './model';
import type { RapportoData } from './model';
import { authHeaders, getToken, onAuthExpired } from '../../auth';
import { REQUIRED_BE_VERSION } from './version';
import { setImpostazioniLocal } from './settings';
import type { Impostazioni } from './settings';

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
  n_sospeso?: number;
  n_dafatturare?: number;
  n_sopralluoghi?: number;
}
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
  settore?: string;
  sopralluogo?: number;
  fatturata_at?: string | null;
  bloccata?: number;
  bloccata_by?: string | null;
  n_senza_prezzo?: number;  // righe con articolo ma prezzo 0/vuoto (🔴)
  n_prezzo_mod?: number;    // righe col prezzo cambiato dal listino (🟡)
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
  settore?: string;
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
    riferimento: d.riferimento ?? '',
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
      .map(m => ({ qta: qtaEff(m), codice: m.codice, marca: m.marca ?? null, descrizione: m.descrizione, prezzo: n2(m.prezzo), prezzo_listino: m.prezzo_listino ?? null, listino_id: m.listino_id ?? null })),
    manodopera: d.manodopera
      .filter(x => x.operaio)
      .map(x => ({ operaio: x.operaio, ore: n2(x.ore), tariffa: n2(x.tariffa) })),
    foto: (d.foto ?? []).filter(Boolean),
    firma_tecnico: d.firmaTecnico || null,
    firma_cliente: d.firmaCliente || null,
    lavoro_incompleto: d.lavoroIncompleto ? 1 : 0,
    da_completare: d.daCompletare || null,
    costo_chiamata: d.costoChiamata ? 1 : 0,
    sopralluogo: d.sopralluogo ? 1 : 0,
  };
}

export function fromBolla(row: Record<string, any>): RapportoData {
  return {
    id: row.id ?? null,
    numero: row.numero ?? '',
    cliente_id: row.cliente_id ?? null,
    cliente: row.cliente ?? '',
    riferimento: row.riferimento ?? '',
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
    manodopera: (row.manodopera ?? []).map((m: any) => ({ operaio: m.operaio, ore: numStr(m.ore), tariffa: numStr(m.tariffa) })),
    bloccata: !!Number(row.bloccata),
    fatturata: row.fatturata_at != null,
    materiali: (row.materiali ?? []).map((r: any) => ({ qta: String(r.qta ?? ''), codice: r.codice ?? '', marca: r.marca ?? '', descrizione: r.descrizione ?? '', prezzo: String(r.prezzo ?? ''), prezzo_listino: r.prezzo_listino != null ? Number(r.prezzo_listino) : null, listino_id: r.listino_id ?? null })),
    foto: Array.isArray(row.foto) ? row.foto.filter(Boolean) : [],
    firmaTecnico: row.firma_tecnico ?? '',
    firmaCliente: row.firma_cliente ?? '',
    lavoroIncompleto: !!row.lavoro_incompleto,
    daCompletare: row.da_completare ?? '',
    costoChiamata: !!row.costo_chiamata,
    sopralluogo: !!row.sopralluogo,
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

// ───────── API layer (SOLO online: niente fallback demo locale) ─────────
export type StoreMode = 'api' | 'offline';
let MODE: StoreMode | null = null;

export async function initStore(): Promise<StoreMode> {
  if (MODE) return MODE;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(HEALTH, { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const probe = await fetch(`${API}/clienti?q=`, { headers: authHeaders() });
      if (probe.ok) {
        MODE = 'api';
        // carica le impostazioni globali nella cache (se il BE è vecchio resta sui default)
        try { setImpostazioniLocal(await (await fetch(`${API}/impostazioni`, { headers: authHeaders() })).json()); } catch { /* default */ }
      }
      else if (probe.status === 401) { onAuthExpired(); MODE = 'offline'; }
      else MODE = 'offline';
    } else {
      MODE = 'offline';
    }
  } catch {
    MODE = 'offline';
  }
  return MODE;
}
export function storeMode(): StoreMode { return MODE ?? 'offline'; }
// forza un nuovo controllo della connessione (bottone "Riprova")
export function resetStore(): void { MODE = null; }

class OfflineError extends Error { constructor() { super('Server non raggiungibile'); this.name = 'OfflineError'; } }

async function requireApi(): Promise<void> {
  await initStore();
  if (MODE !== 'api') throw new OfflineError();
}

async function jfetch(url: string, opts?: RequestInit) {
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(opts?.headers ?? {}) },
  });
  if (res.status === 401) { onAuthExpired(); throw new Error('HTTP 401'); }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

// ───────── Foto ─────────
export async function uploadFoto(dataUrl: string): Promise<string> {
  await requireApi();
  try {
    const r = await jfetch(`${API}/foto`, { method: 'POST', body: JSON.stringify({ dataUrl }) });
    return (r && typeof r.url === 'string') ? r.url : dataUrl;
  } catch {
    return dataUrl; // fallback inline se l'endpoint foto ha un intoppo (la bolla si salva comunque)
  }
}

// Sorgente per <img>: le foto-file sono protette, token in query (?t=).
export function fotoSrc(v: string): string {
  if (!v) return v;
  if (v.startsWith('data:')) return v;
  if (v.startsWith('/api/')) {
    const t = getToken();
    return t ? `${v}${v.includes('?') ? '&' : '?'}t=${encodeURIComponent(t)}` : v;
  }
  return v;
}

// Stato del backend: reachable + se è più vecchio di quanto richiede la FE.
export async function beVersionStatus(): Promise<{ reachable: boolean; outdated: boolean }> {
  try {
    const res = await fetch(HEALTH);
    if (!res.ok) return { reachable: false, outdated: false };
    const j = await res.json();
    const v = Number(j?.beVersion ?? 0);
    return { reachable: true, outdated: v < REQUIRED_BE_VERSION };
  } catch {
    return { reachable: false, outdated: false };
  }
}

// ── Clienti ──
export async function searchClienti(q: string): Promise<Cliente[]> {
  await requireApi();
  return jfetch(`${API}/clienti?q=${encodeURIComponent(q)}`);
}

export async function saveCliente(c: Partial<Cliente>): Promise<{ id: number }> {
  await requireApi();
  if (c.id) { await jfetch(`${API}/clienti/${c.id}`, { method: 'PUT', body: JSON.stringify(c) }); return { id: c.id }; }
  const r = await jfetch(`${API}/clienti`, { method: 'POST', body: JSON.stringify(c) });
  return { id: r.id };
}

export async function removeCliente(id: number): Promise<void> {
  await requireApi();
  await jfetch(`${API}/clienti/${id}`, { method: 'DELETE' });
}

// riferimenti già usati per quel cliente (autocomplete)
export async function listRiferimenti(clienteId: number | null, q: string): Promise<string[]> {
  if (!clienteId) return [];
  await requireApi();
  return jfetch(`${API}/riferimenti?cliente_id=${clienteId}&q=${encodeURIComponent(q)}`);
}

// ── Bolle ──
export type StatoBolla = 'sospeso' | 'consegnate' | 'fatturate' | 'sopralluoghi';

export async function listBolle(q: string, stato: StatoBolla = 'sospeso', settore = ''): Promise<BollaSummary[]> {
  await requireApi();
  return jfetch(`${API}/bolle?q=${encodeURIComponent(q)}&stato=${stato}${settore ? `&settore=${encodeURIComponent(settore)}` : ''}`);
}

export async function getBolla(id: number): Promise<RapportoData> {
  await requireApi();
  return fromBolla(await jfetch(`${API}/bolle/${id}`));
}

// Segnalazioni: bolle con prezzi mancanti o cambiati dal listino
export async function listSegnalazioni(q = ''): Promise<BollaSummary[]> {
  await requireApi();
  return jfetch(`${API}/segnalazioni?q=${encodeURIComponent(q)}`);
}

export async function saveBolla(d: RapportoData): Promise<{ id: number; numero: string }> {
  await requireApi();
  const payload = toPayload(d);
  if (d.id) { await jfetch(`${API}/bolle/${d.id}`, { method: 'PUT', body: JSON.stringify(payload) }); return { id: d.id, numero: d.numero }; }
  const r = await jfetch(`${API}/bolle`, { method: 'POST', body: JSON.stringify(payload) });
  return { id: r.id, numero: r.numero };
}

export async function deleteBolla(id: number): Promise<void> {
  await requireApi();
  await jfetch(`${API}/bolle/${id}`, { method: 'DELETE' });
}

export async function listBolleCancellate(q: string): Promise<BollaSummary[]> {
  await requireApi();
  return jfetch(`${API}/bolle/cancellate?q=${encodeURIComponent(q)}`);
}

export async function restoreBolla(id: number): Promise<void> {
  await requireApi();
  await jfetch(`${API}/bolle/${id}/restore`, { method: 'POST' });
}

export async function deleteBollaPermanent(id: number): Promise<void> {
  await requireApi();
  await jfetch(`${API}/bolle/${id}/permanent`, { method: 'DELETE' });
}

export async function markConsegnata(id: number, consegnata: boolean): Promise<void> {
  await requireApi();
  await jfetch(`${API}/bolle/${id}/consegna`, { method: 'POST', body: JSON.stringify({ consegnata }) });
}
// sposta in "Fatturate" / indietro (amministrazione/admin o permesso 'fatturate')
export async function fatturaBolla(id: number, fatturata: boolean): Promise<void> {
  await requireApi();
  await jfetch(`${API}/bolle/${id}/fattura`, { method: 'POST', body: JSON.stringify({ fatturata }) });
}
// blocco fatturazione (amministrazione/admin)
export async function bloccaBolla(id: number, bloccata: boolean): Promise<void> {
  await requireApi();
  await jfetch(`${API}/bolle/${id}/blocca`, { method: 'POST', body: JSON.stringify({ bloccata }) });
}

// ── Lock bolla (modifica contemporanea) ──
export async function lockBolla(id: number): Promise<{ ok: boolean; lockedBy?: string }> {
  await requireApi();
  const res = await fetch(`${API}/bolle/${id}/lock`, { method: 'POST', headers: { ...authHeaders() } });
  if (res.status === 401) { onAuthExpired(); throw new Error('HTTP 401'); }
  if (res.status === 409) {
    const j = await res.json().catch(() => ({} as any));
    return { ok: false, lockedBy: j.lockedBy || 'un altro utente' };
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { ok: true };
}
export async function unlockBolla(id: number): Promise<void> {
  try { await fetch(`${API}/bolle/${id}/unlock`, { method: 'POST', headers: { ...authHeaders() } }); }
  catch { /* best-effort */ }
}

// ── Listino ──
// all=true → tutto il listino (pagina Listino / gestione); default → filtrato per
// settore dell'utente lato BE (autocomplete materiali in bolla)
export async function listListino(q: string, marca = '', all = false): Promise<ListinoItem[]> {
  await requireApi();
  return jfetch(`${API}/listino?q=${encodeURIComponent(q)}&marca=${encodeURIComponent(marca)}${all ? '&all=1' : ''}`);
}

export async function saveListino(item: Partial<ListinoItem>): Promise<{ id: number }> {
  await requireApi();
  if (item.id) { await jfetch(`${API}/listino/${item.id}`, { method: 'PUT', body: JSON.stringify(item) }); return { id: item.id }; }
  return jfetch(`${API}/listino`, { method: 'POST', body: JSON.stringify(item) });
}

export async function deleteListino(id: number): Promise<void> {
  await requireApi();
  await jfetch(`${API}/listino/${id}`, { method: 'DELETE' });
}

// imposta il reparto (settore) di TUTTI gli articoli di una marca in un colpo
export async function setMarcaSettore(marca: string, settore: string): Promise<void> {
  await requireApi();
  await jfetch(`${API}/listino/marca/${encodeURIComponent(marca)}/settore`, { method: 'PUT', body: JSON.stringify({ settore }) });
}

// ── Marche ──
export async function listMarche(): Promise<Marca[]> {
  await requireApi();
  return jfetch(`${API}/marche`);
}

export async function saveMarca(marca: string, sconto: number, ricarico: number): Promise<void> {
  await requireApi();
  await jfetch(`${API}/marche/${encodeURIComponent(marca)}`, { method: 'PUT', body: JSON.stringify({ sconto, ricarico }) });
}

// ── Account / permessi (pagina admin) ──
export interface Account {
  id: number;
  email: string;
  role: string;
  attivo: number;
  settore: string;
  permessi: Record<string, boolean>;
}

export async function listAccounts(): Promise<Account[]> {
  await requireApi();
  return jfetch(`${API}/accounts`);
}
export async function createAccount(email: string, password: string, permessi: Record<string, boolean>, role: string, settore?: string): Promise<{ id: number }> {
  await requireApi();
  return jfetch(`${API}/accounts`, { method: 'POST', body: JSON.stringify({ email, password, permessi, role, settore }) });
}
export async function updateAccount(id: number, d: { attivo?: number; permessi?: Record<string, boolean>; role?: string; settore?: string; password?: string }): Promise<void> {
  await requireApi();
  await jfetch(`${API}/accounts/${id}`, { method: 'PUT', body: JSON.stringify(d) });
}
export async function deleteAccount(id: number): Promise<void> {
  await requireApi();
  await jfetch(`${API}/accounts/${id}`, { method: 'DELETE' });
}

// ── Audit log (storico azioni, admin) ──
export interface AuditRow {
  id: number; ts: string; user_email: string | null;
  azione: string; entita: string; entita_id: string | null; dettaglio: string | null;
}
export async function listAudit(q = ''): Promise<AuditRow[]> {
  await requireApi();
  return jfetch(`${API}/audit?q=${encodeURIComponent(q)}`);
}

// ── Impostazioni globali bolle ──
export async function getImpostazioni(): Promise<Impostazioni> {
  await requireApi();
  const imp = await jfetch(`${API}/impostazioni`);
  setImpostazioniLocal(imp);
  return imp;
}
export async function saveImpostazioni(d: Partial<Impostazioni>): Promise<Impostazioni> {
  await requireApi();
  const imp = await jfetch(`${API}/impostazioni`, { method: 'PUT', body: JSON.stringify(d) });
  setImpostazioniLocal(imp);
  return imp;
}

// ── Operai (manodopera) ──
export interface Operaio {
  id: number;
  nome: string;
  cognome: string;
  settore: string;
  foto: string | null;
  attivo: number;
}

// manage=true → tutti (pagina admin); altrimenti solo attivi filtrati per settore
export async function listOperai(manage = false): Promise<Operaio[]> {
  await requireApi();
  return jfetch(`${API}/operai${manage ? '?manage=1' : ''}`);
}
export async function saveOperaio(o: Partial<Operaio>): Promise<{ id: number }> {
  await requireApi();
  if (o.id) { await jfetch(`${API}/operai/${o.id}`, { method: 'PUT', body: JSON.stringify(o) }); return { id: o.id }; }
  return jfetch(`${API}/operai`, { method: 'POST', body: JSON.stringify(o) });
}
export async function removeOperaio(id: number): Promise<void> {
  await requireApi();
  await jfetch(`${API}/operai/${id}`, { method: 'DELETE' });
}
