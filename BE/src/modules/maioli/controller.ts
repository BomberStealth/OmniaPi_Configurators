import type { Request, Response } from 'express';
import { verifyToken } from '../../config/jwt';
import * as s from './service';

const err = (res: Response) => res.status(500).json({ message: 'Errore del server' });
const parseId = (v: string | string[] | undefined): number | null => {
  const str = Array.isArray(v) ? v[0] : v;
  const n = parseInt(String(str ?? ''), 10);
  return Number.isNaN(n) ? null : n;
};
// email dell'utente che compie l'azione (per l'audit log)
const who = (req: Request): string | undefined => (req as { user?: { email?: string } }).user?.email;

// ── Clienti ──
export async function clientiList(req: Request, res: Response): Promise<void> {
  try { res.json(await s.searchClienti(String(req.query.q ?? ''))); } catch { err(res); }
}
export async function clientiGet(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  try { const c = await s.getCliente(id); if (!c) { res.status(404).json({ message: 'Non trovato' }); return; } res.json(c); } catch { err(res); }
}
export async function clientiCreate(req: Request, res: Response): Promise<void> {
  if (!req.body?.nome?.trim()) { res.status(400).json({ message: 'Nome obbligatorio' }); return; }
  try { const r = await s.createCliente(req.body); await s.logAudit(who(req), 'crea', 'cliente', r.id, req.body?.nome); res.status(201).json(r); } catch { err(res); }
}
export async function clientiUpdate(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  try { const ok = await s.updateCliente(id, req.body); if (!ok) { res.status(404).json({ message: 'Non trovato' }); return; } await s.logAudit(who(req), 'modifica', 'cliente', id, req.body?.nome); res.json({ ok: true }); } catch { err(res); }
}
export async function clientiDelete(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  try { const ok = await s.deleteCliente(id); if (!ok) { res.status(404).json({ message: 'Non trovato' }); return; } await s.logAudit(who(req), 'elimina', 'cliente', id); res.status(204).end(); } catch { err(res); }
}

export async function riferimentiList(req: Request, res: Response): Promise<void> {
  const cid = parseId(req.query.cliente_id as string | string[] | undefined);
  if (cid === null) { res.json([]); return; }
  try { res.json(await s.listRiferimenti(cid, String(req.query.q ?? ''))); } catch { err(res); }
}

// ── Bolle ──
export async function bolleList(req: Request, res: Response): Promise<void> {
  const raw = String(req.query.stato ?? 'sospeso');
  const stato = raw === 'consegnate' ? 'consegnate' : raw === 'sopralluoghi' ? 'sopralluoghi' : 'sospeso';
  const settore = String(req.query.settore ?? '') || undefined; // filtro ⚡/💧
  try { res.json(await s.listBolle(String(req.query.q ?? ''), stato, settore)); } catch { err(res); }
}
export async function bolleGet(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  try { const b = await s.getBolla(id); if (!b) { res.status(404).json({ message: 'Non trovato' }); return; } res.json(b); } catch { err(res); }
}
export async function bolleCreate(req: Request, res: Response): Promise<void> {
  if (!req.body?.cliente?.trim()) { res.status(400).json({ message: 'Cliente obbligatorio' }); return; }
  const settore = (req as WithAcc).account?.settore; // reparto del creatore
  try { const r = await s.createBolla(req.body, settore); await s.logAudit(who(req), 'crea', 'bolla', r.numero || r.id, req.body?.cliente); res.status(201).json(r); } catch { err(res); }
}
export async function bolleUpdate(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  if (!req.body?.cliente?.trim()) { res.status(400).json({ message: 'Cliente obbligatorio' }); return; }
  const acc = (req as WithAcc).account;
  try {
    // permesso di modifica per reparto: solo stesso settore + entrambi/admin
    const sett = await s.bollaSettore(id);
    if (sett && acc && acc.role !== 'admin' && acc.settore !== 'entrambi' && sett !== 'entrambi' && sett !== acc.settore) {
      res.status(403).json({ message: `Bolla del reparto ${sett}: non puoi modificarla` }); return;
    }
    const ok = await s.updateBolla(id, req.body); if (!ok) { res.status(404).json({ message: 'Non trovato' }); return; } await s.logAudit(who(req), 'modifica', 'bolla', id, req.body?.cliente); res.json({ ok: true });
  } catch { err(res); }
}
export async function bolleDelete(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  try { const ok = await s.deleteBolla(id); if (!ok) { res.status(404).json({ message: 'Non trovato' }); return; } await s.logAudit(who(req), 'sposta', 'bolla', id, 'Nel cestino'); res.status(204).end(); } catch { err(res); }
}
export async function bolleCancellate(req: Request, res: Response): Promise<void> {
  try { res.json(await s.listBolleCancellate(String(req.query.q ?? ''))); } catch { err(res); }
}
export async function bolleRestore(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  try { const ok = await s.restoreBolla(id); if (!ok) { res.status(404).json({ message: 'Non trovato' }); return; } await s.logAudit(who(req), 'sposta', 'bolla', id, 'Dal cestino → In sospeso'); res.json({ ok: true }); } catch { err(res); }
}
export async function bollePurge(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  try { const ok = await s.purgeBolla(id); if (!ok) { res.status(404).json({ message: 'Non trovato' }); return; } await s.logAudit(who(req), 'elimina definitiva', 'bolla', id); res.status(204).end(); } catch { err(res); }
}
export async function bolleConsegna(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  const consegnata = req.body?.consegnata !== false;
  try {
    const ok = await s.setConsegnata(id, consegnata); if (!ok) { res.status(404).json({ message: 'Non trovato' }); return; }
    await s.logAudit(who(req), 'sposta', 'bolla', id, consegnata ? 'Da «In sospeso» → «Da fatturare»' : 'Da «Da fatturare» → «In sospeso»');
    res.json({ ok: true });
  } catch { err(res); }
}

// ── Segnalazioni (prezzi mancanti / cambiati) ──
export async function segnalazioniList(req: Request, res: Response): Promise<void> {
  try { res.json(await s.listSegnalazioni(String(req.query.q ?? ''))); } catch { err(res); }
}

// ── Lock bolla (modifica contemporanea) ──
export async function bolleLock(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  const user = (req as { user?: { email?: string } }).user?.email || 'utente';
  try { const r = await s.lockBolla(id, user); if (r.ok) res.json({ ok: true }); else res.status(409).json({ lockedBy: r.lockedBy }); } catch { err(res); }
}
export async function bolleUnlock(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  const user = (req as { user?: { email?: string } }).user?.email || 'utente';
  try { await s.unlockBolla(id, user); res.json({ ok: true }); } catch { err(res); }
}

// ── Listino ──
export async function listinoList(req: Request, res: Response): Promise<void> {
  const r = req as WithAcc & { account?: { settore?: string; permessi?: Record<string, boolean> } };
  const canManage = r.account?.role === 'admin' || !!r.account?.permessi?.listino;
  const all = String(req.query.all ?? '') === '1' && canManage;           // pagina Listino: tutto
  const userSett = r.account?.settore || 'entrambi';
  // autocomplete materiali: filtra per settore utente (admin/entrambi vedono tutto)
  const settore = (all || r.account?.role === 'admin' || userSett === 'entrambi') ? undefined : userSett;
  try { res.json(await s.listListino(String(req.query.q ?? ''), String(req.query.marca ?? ''), settore)); } catch { err(res); }
}
export async function listinoCreate(req: Request, res: Response): Promise<void> {
  if (!req.body?.descrizione?.trim()) { res.status(400).json({ message: 'Descrizione obbligatoria' }); return; }
  try { const r = await s.createListino(req.body); await s.logAudit(who(req), 'crea', 'listino', r.id, req.body?.descrizione); res.status(201).json(r); } catch { err(res); }
}
export async function listinoUpdate(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  try { const ok = await s.updateListino(id, req.body); if (!ok) { res.status(404).json({ message: 'Non trovato' }); return; } await s.logAudit(who(req), 'modifica', 'listino', id, req.body?.descrizione); res.json({ ok: true }); } catch { err(res); }
}
export async function listinoMarcaSettore(req: Request, res: Response): Promise<void> {
  const raw = req.params.marca;
  const marca = (Array.isArray(raw) ? raw[0] : raw) ?? '';
  if (!marca.trim()) { res.status(400).json({ message: 'Marca non valida' }); return; }
  try { const n = await s.setMarcaSettore(marca, String(req.body?.settore ?? '')); await s.logAudit(who(req), 'reparto marca', 'listino', marca, `${req.body?.settore} (${n} articoli)`); res.json({ ok: true, updated: n }); } catch { err(res); }
}
export async function listinoDelete(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  try { const ok = await s.deleteListino(id); if (!ok) { res.status(404).json({ message: 'Non trovato' }); return; } await s.logAudit(who(req), 'elimina', 'listino', id); res.status(204).end(); } catch { err(res); }
}
// ── Marche (sconto installatore / ricarico azienda) ──
export async function marcheList(_req: Request, res: Response): Promise<void> {
  try { res.json(await s.listMarche()); } catch { err(res); }
}
export async function marcaUpdate(req: Request, res: Response): Promise<void> {
  const raw = req.params.marca;
  const marca = (Array.isArray(raw) ? raw[0] : raw) ?? '';
  if (!marca.trim()) { res.status(400).json({ message: 'Marca non valida' }); return; }
  const sconto = Number(req.body?.sconto) || 0;
  const ricarico = Number(req.body?.ricarico) || 0;
  try { await s.upsertMarca(marca, sconto, ricarico); res.json({ ok: true }); } catch { err(res); }
}

export async function listinoImport(req: Request, res: Response): Promise<void> {
  const { marca, items } = req.body ?? {};
  if (!Array.isArray(items)) { res.status(400).json({ message: 'items mancanti' }); return; }
  try { res.json(await s.importListino(String(marca ?? 'Generico'), items)); } catch { err(res); }
}

// ── Account / permessi ──
type WithAcc = Request & { account?: { role: string; attivo: number; settore: string; permessi: Record<string, boolean> }; user?: { email?: string } };

export async function me(req: Request, res: Response): Promise<void> {
  const r = req as WithAcc;
  res.json({ email: r.user?.email, role: r.account?.role, attivo: r.account?.attivo, settore: r.account?.settore, permessi: r.account?.permessi });
}

// ── Operai (manodopera) ──
export async function operaiList(req: Request, res: Response): Promise<void> {
  const r = req as WithAcc;
  const manage = String(req.query.manage ?? '') === '1';
  if (manage) {
    if (r.account?.role !== 'admin') { res.status(403).json({ message: 'Solo amministratore' }); return; }
    try { res.json(await s.listOperai(undefined, false)); } catch { err(res); }
    return;
  }
  const settore = r.account?.role === 'admin' ? undefined : r.account?.settore;
  try { res.json(await s.listOperai(settore, true)); } catch { err(res); }
}
export async function operaiCreate(req: Request, res: Response): Promise<void> {
  if (!req.body?.nome?.trim()) { res.status(400).json({ message: 'Nome obbligatorio' }); return; }
  try { const r = await s.createOperaio(req.body); await s.logAudit(who(req), 'crea', 'operaio', r.id, `${req.body?.nome ?? ''} ${req.body?.cognome ?? ''}`.trim()); res.status(201).json(r); } catch { err(res); }
}
export async function operaiUpdate(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  try { const ok = await s.updateOperaio(id, req.body || {}); if (!ok) { res.status(404).json({ message: 'Non trovato' }); return; } await s.logAudit(who(req), 'modifica', 'operaio', id, `${req.body?.nome ?? ''} ${req.body?.cognome ?? ''}`.trim()); res.json({ ok: true }); } catch { err(res); }
}
export async function operaiDelete(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  try { await s.deleteOperaio(id); await s.logAudit(who(req), 'elimina', 'operaio', id); res.status(204).end(); } catch { err(res); }
}
export async function accountsList(_req: Request, res: Response): Promise<void> {
  try { res.json(await s.listAccounts()); } catch { err(res); }
}
export async function accountCreate(req: Request, res: Response): Promise<void> {
  const { email, password, permessi, role, settore } = req.body ?? {};
  if (!email || !password || String(password).length < 6) { res.status(400).json({ message: 'Email e password (min 6 caratteri) obbligatorie' }); return; }
  try { const r = await s.createAccount(String(email), String(password), permessi || {}, role, settore); await s.logAudit(who(req), 'crea', 'account', r.id, String(email)); res.status(201).json(r); }
  catch { res.status(409).json({ message: 'Email già esistente o dati non validi' }); }
}
export async function accountUpdate(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  try { const ok = await s.updateAccount(id, req.body || {}); if (!ok) { res.status(404).json({ message: 'Non trovato' }); return; } await s.logAudit(who(req), req.body?.password ? 'cambio password' : 'modifica', 'account', id, await s.accountEmail(id)); res.json({ ok: true }); } catch { err(res); }
}
export async function accountDelete(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  try {
    const email = await s.accountEmail(id);
    if (!email) { res.status(404).json({ message: 'Non trovato' }); return; }
    const me = ((req as WithAcc).user?.email || '').toLowerCase();
    if (email.toLowerCase() === me) { res.status(400).json({ message: 'Non puoi eliminare il tuo account' }); return; }
    await s.deleteAccount(id); await s.logAudit(who(req), 'elimina', 'account', id, email); res.status(204).end();
  } catch { err(res); }
}

// ── Impostazioni globali bolle (admin) ──
export async function impostazioniGet(_req: Request, res: Response): Promise<void> {
  try { res.json(await s.getImpostazioni()); } catch { err(res); }
}
export async function impostazioniUpdate(req: Request, res: Response): Promise<void> {
  try { await s.setImpostazioni(req.body || {}); await s.logAudit(who(req), 'modifica', 'impostazioni', null, Object.keys(req.body || {}).join(', ')); res.json(await s.getImpostazioni()); } catch { err(res); }
}

// ── Audit log (storico azioni, admin) ──
export async function auditList(req: Request, res: Response): Promise<void> {
  try { res.json(await s.listAudit(300, String(req.query.q ?? ''))); } catch { err(res); }
}

// ── Foto (file su SSD) ──
// upload: riceve { dataUrl } (JPEG compresso dalla FE), salva su disco e
// ritorna { url } da memorizzare nella bolla.
export async function fotoUpload(req: Request, res: Response): Promise<void> {
  const dataUrl = req.body?.dataUrl;
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    res.status(400).json({ message: 'Immagine mancante' }); return;
  }
  try { res.status(201).json({ url: s.saveFotoFile(dataUrl) }); }
  catch (e) { res.status(400).json({ message: e instanceof Error ? e.message : 'Upload non riuscito' }); }
}

// serve il file foto. Le <img> del browser non mandano l'header Authorization,
// quindi qui accettiamo il token anche come query param ?t=... (oltre al Bearer).
export function fotoServe(req: Request, res: Response): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : String(req.query.t ?? '');
  if (!token) { res.status(401).json({ message: 'Token mancante' }); return; }
  try { verifyToken(token); } catch { res.status(401).json({ message: 'Token non valido' }); return; }
  const year = Array.isArray(req.params.year) ? req.params.year[0] : req.params.year;
  const name = Array.isArray(req.params.name) ? req.params.name[0] : req.params.name;
  const p = s.resolveFotoPath(String(year ?? ''), String(name ?? ''));
  if (!p) { res.status(404).json({ message: 'Foto non trovata' }); return; }
  res.sendFile(p);
}
