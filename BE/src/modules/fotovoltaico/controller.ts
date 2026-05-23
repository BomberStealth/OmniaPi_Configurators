import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth';
import * as service from './service';

export async function list(req: AuthRequest, res: Response): Promise<void> {
  try {
    const calcs = await service.listCalcs(req.user!.userId);
    res.json(calcs);
  } catch {
    res.status(500).json({ message: 'Errore del server' });
  }
}

export async function get(req: AuthRequest, res: Response): Promise<void> {
  const id = parseInt(req.params['id'] as string);
  if (isNaN(id)) { res.status(400).json({ message: 'ID non valido' }); return; }
  try {
    const calc = await service.getCalc(id, req.user!.userId);
    if (!calc) { res.status(404).json({ message: 'Non trovato' }); return; }
    res.json(calc);
  } catch {
    res.status(500).json({ message: 'Errore del server' });
  }
}

export async function save(req: AuthRequest, res: Response): Promise<void> {
  const { name, struct_type, orient, grid_rows, grid_cols, grid_state, pan_w, pan_h, controvento, result_json } = req.body;
  if (!name || !struct_type || !orient) {
    res.status(400).json({ message: 'Dati incompleti' });
    return;
  }
  try {
    const result = await service.saveCalc(req.user!.userId, {
      name, struct_type, orient,
      grid_rows: grid_rows ?? 3,
      grid_cols: grid_cols ?? 6,
      grid_state: typeof grid_state === 'string' ? grid_state : JSON.stringify(grid_state),
      pan_w: pan_w ?? 1134,
      pan_h: pan_h ?? 1762,
      controvento: !!controvento,
      result_json: typeof result_json === 'string' ? result_json : JSON.stringify(result_json),
    });
    res.status(201).json(result);
  } catch {
    res.status(500).json({ message: 'Errore del server' });
  }
}

export async function remove(req: AuthRequest, res: Response): Promise<void> {
  const id = parseInt(req.params['id'] as string);
  if (isNaN(id)) { res.status(400).json({ message: 'ID non valido' }); return; }
  try {
    const ok = await service.deleteCalc(id, req.user!.userId);
    if (!ok) { res.status(404).json({ message: 'Non trovato' }); return; }
    res.status(204).end();
  } catch {
    res.status(500).json({ message: 'Errore del server' });
  }
}
