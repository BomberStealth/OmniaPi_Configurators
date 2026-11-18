import type { Request, Response } from 'express';
import { verifyToken } from '../../config/jwt';
import * as s from './service';

const err = (res: Response) => res.status(500).json({ message: 'Errore del server' });
const parseId = (v: string | string[] | undefined): number | null => {
  const str = Array.isArray(v) ? v[0] : v;
  const n = parseInt(String(str ?? ''), 10);
  return Number.isNaN(n) ? null : n;
};

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
  try { res.status(201).json(await s.createCliente(req.body)); } catch { err(res); }
}
export async function clientiUpdate(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  try { const ok = await s.updateCliente(id, req.body); if (!ok) { res.status(404).json({ message: 'Non trovato' }); return; } res.json({ ok: true }); } catch { err(res); }
}
export async function clientiDelete(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  try { const ok = await s.deleteCliente(id); if (!ok) { res.status(404).json({ message: 'Non trovato' }); return; } res.status(204).end(); } catch { err(res); }
}

// ── Bolle ──
export async function bolleList(req: Request, res: Response): Promise<void> {
  try { res.json(await s.listBolle(String(req.query.q ?? ''))); } catch { err(res); }
}
export async function bolleGet(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  try { const b = await s.getBolla(id); if (!b) { res.status(404).json({ message: 'Non trovato' }); return; } res.json(b); } catch { err(res); }
}
export async function bolleCreate(req: Request, res: Response): Promise<void> {
  if (!req.body?.cliente?.trim()) { res.status(400).json({ message: 'Cliente obbligatorio' }); return; }
  try { res.status(201).json(await s.createBolla(req.body)); } catch { err(res); }
}
export async function bolleUpdate(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  if (!req.body?.cliente?.trim()) { res.status(400).json({ message: 'Cliente obbligatorio' }); return; }
  try { const ok = await s.updateBolla(id, req.body); if (!ok) { res.status(404).json({ message: 'Non trovato' }); return; } res.json({ ok: true }); } catch { err(res); }
}
export async function bolleDelete(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  try { const ok = await s.deleteBolla(id); if (!ok) { res.status(404).json({ message: 'Non trovato' }); return; } res.status(204).end(); } catch { err(res); }
}
export async function bolleCancellate(req: Request, res: Response): Promise<void> {
  try { res.json(await s.listBolleCancellate(String(req.query.q ?? ''))); } catch { err(res); }
}
export async function bolleRestore(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  try { const ok = await s.restoreBolla(id); if (!ok) { res.status(404).json({ message: 'Non trovato' }); return; } res.json({ ok: true }); } catch { err(res); }
}
export async function bollePurge(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  try { const ok = await s.purgeBolla(id); if (!ok) { res.status(404).json({ message: 'Non trovato' }); return; } res.status(204).end(); } catch { err(res); }
}
export async function bolleConsegna(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  const consegnata = req.body?.consegnata !== false;
  try { const ok = await s.setConsegnata(id, consegnata); if (!ok) { res.status(404).json({ message: 'Non trovato' }); return; } res.json({ ok: true }); } catch { err(res); }
}

// ── Listino ──
export async function listinoList(req: Request, res: Response): Promise<void> {
  try { res.json(await s.listListino(String(req.query.q ?? ''), String(req.query.marca ?? ''))); } catch { err(res); }
}
export async function listinoCreate(req: Request, res: Response): Promise<void> {
  if (!req.body?.descrizione?.trim()) { res.status(400).json({ message: 'Descrizione obbligatoria' }); return; }
  try { res.status(201).json(await s.createListino(req.body)); } catch { err(res); }
}
export async function listinoUpdate(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  try { const ok = await s.updateListino(id, req.body); if (!ok) { res.status(404).json({ message: 'Non trovato' }); return; } res.json({ ok: true }); } catch { err(res); }
}
export async function listinoDelete(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id); if (id === null) { res.status(400).json({ message: 'ID non valido' }); return; }
  try { const ok = await s.deleteListino(id); if (!ok) { res.status(404).json({ message: 'Non trovato' }); return; } res.status(204).end(); } catch { err(res); }
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
