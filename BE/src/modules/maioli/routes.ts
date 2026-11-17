import { Router } from 'express';
import * as c from './controller';

// Strumento interno (LAN / Raspberry): rotte senza JWT, coerenti con la FE.
const router = Router();

// Clienti
router.get('/clienti', c.clientiList as never);
router.get('/clienti/:id', c.clientiGet as never);
router.post('/clienti', c.clientiCreate as never);
router.put('/clienti/:id', c.clientiUpdate as never);
router.delete('/clienti/:id', c.clientiDelete as never);

// Bolle
router.get('/bolle', c.bolleList as never);
router.get('/bolle/:id', c.bolleGet as never);
router.post('/bolle', c.bolleCreate as never);
router.put('/bolle/:id', c.bolleUpdate as never);
router.delete('/bolle/:id', c.bolleDelete as never);

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
