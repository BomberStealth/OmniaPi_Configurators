import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth';
import * as s from '../modules/maioli/service';

export interface MaioliRequest extends AuthRequest {
  account?: { attivo: number; role: string; permessi: s.Permessi };
}

// Carica l'account dal DB (stato attivo + permessi freschi) ad ogni richiesta
// maioli: così disattivazioni e modifiche permessi hanno effetto IMMEDIATO.
export async function loadAccount(req: MaioliRequest, res: Response, next: NextFunction): Promise<void> {
  const uid = req.user?.userId;
  if (!uid) { res.status(401).json({ message: 'Non autenticato' }); return; }
  try {
    const row = await s.getUserRow(uid);
    if (!row) { res.status(401).json({ message: 'Account non trovato' }); return; }
    if (!row.attivo) { res.status(403).json({ message: 'Account disattivato' }); return; }
    req.account = row;
    next();
  } catch { res.status(500).json({ message: 'Errore del server' }); }
}

// L'admin (role=admin) passa sempre; gli altri servono il permesso richiesto.
export function requirePerm(cap: string) {
  return (req: MaioliRequest, res: Response, next: NextFunction): void => {
    const acc = req.account;
    if (acc && (acc.role === 'admin' || acc.permessi[cap])) { next(); return; }
    res.status(403).json({ message: 'Permesso negato' });
  };
}

export function requireAdminRole(req: MaioliRequest, res: Response, next: NextFunction): void {
  if (req.account?.role === 'admin') { next(); return; }
  res.status(403).json({ message: 'Solo amministratore' });
}
