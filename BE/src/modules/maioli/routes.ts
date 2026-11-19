import { Router } from 'express';
import * as c from './controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

// Serve-foto: deve stare PRIMA del requireAuth globale perché le <img> del
// browser non inviano l'header Authorization. Valida il token da sé (anche
// via query param ?t=...).
router.get('/foto/:year/:name', c.fotoServe);

// Da qui in poi tutto richiede login (JWT Bearer).
router.use(requireAuth);

// Riferimenti (autocomplete per cliente)
router.get('/riferimenti', c.riferimentiList as never);

// Clienti
router.get('/clienti', c.clientiList as never);
router.get('/clienti/:id', c.clientiGet as never);
router.post('/clienti', c.clientiCreate as never);
router.put('/clienti/:id', c.clientiUpdate as never);
router.delete('/clienti/:id', c.clientiDelete as never);

// Bolle
router.get('/bolle', c.bolleList as never);
router.get('/bolle/cancellate', c.bolleCancellate as never); // prima di /bolle/:id
router.get('/bolle/:id', c.bolleGet as never);
router.post('/bolle', c.bolleCreate as never);
router.put('/bolle/:id', c.bolleUpdate as never);
router.post('/bolle/:id/restore', c.bolleRestore as never);
router.post('/bolle/:id/consegna', c.bolleConsegna as never);
router.delete('/bolle/:id/permanent', c.bollePurge as never);
router.delete('/bolle/:id', c.bolleDelete as never);

// Foto (upload file su SSD)
router.post('/foto', c.fotoUpload as never);

// Marche (sconto installatore / ricarico azienda)
router.get('/marche', c.marcheList as never);
router.put('/marche/:marca', c.marcaUpdate as never);

// Listino
router.get('/listino', c.listinoList as never);
router.post('/listino', c.listinoCreate as never);
router.put('/listino/:id', c.listinoUpdate as never);
router.delete('/listino/:id', c.listinoDelete as never);
router.post('/listino/import', c.listinoImport as never);

export default router;
