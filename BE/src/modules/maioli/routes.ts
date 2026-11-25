import { Router } from 'express';
import * as c from './controller';
import { requireAuth } from '../../middleware/auth';
import { loadAccount, requirePerm, requireAdminRole } from '../../middleware/maioliPerm';

const router = Router();

// Serve-foto: PRIMA dell'auth globale (le <img> non mandano header; valida ?t=).
router.get('/foto/:year/:name', c.fotoServe);

// Da qui tutto richiede login + account attivo (permessi freschi dal DB).
router.use(requireAuth);
router.use(loadAccount);

// Profilo dell'utente corrente (ruolo + permessi) — serve alla FE per i tab.
router.get('/me', c.me as never);

// Riferimenti + lettura clienti/listino: servono per compilare le bolle, quindi
// a qualsiasi account attivo. La SCRITTURA è protetta per sezione.
router.get('/riferimenti', c.riferimentiList as never);
router.get('/clienti', c.clientiList as never);
router.get('/clienti/:id', c.clientiGet as never);
router.post('/clienti', requirePerm('clienti'), c.clientiCreate as never);
router.put('/clienti/:id', requirePerm('clienti'), c.clientiUpdate as never);
router.delete('/clienti/:id', requirePerm('clienti'), c.clientiDelete as never);

// Bolle: lettura/stato = "storico"; creazione/modifica = "nuova".
router.get('/bolle', requirePerm('storico'), c.bolleList as never);
router.get('/bolle/cancellate', requirePerm('storico'), c.bolleCancellate as never);
router.get('/segnalazioni', c.segnalazioniList as never); // la vedono tutti gli account attivi
router.get('/bolle/:id', requirePerm('storico'), c.bolleGet as never);
router.post('/bolle', requirePerm('nuova'), c.bolleCreate as never);
router.put('/bolle/:id', requirePerm('nuova'), c.bolleUpdate as never);
router.post('/bolle/:id/restore', requirePerm('storico'), c.bolleRestore as never);
router.post('/bolle/:id/consegna', requirePerm('storico'), c.bolleConsegna as never);
router.post('/bolle/:id/lock', requirePerm('storico'), c.bolleLock as never);
router.post('/bolle/:id/unlock', requirePerm('storico'), c.bolleUnlock as never);
router.delete('/bolle/:id/permanent', requirePerm('storico'), c.bollePurge as never);
router.delete('/bolle/:id', requirePerm('storico'), c.bolleDelete as never);

// Foto upload = compilare una bolla → "nuova".
router.post('/foto', requirePerm('nuova'), c.fotoUpload as never);

// Listino: lettura libera (serve ai materiali); scrittura = "listino".
router.get('/listino', c.listinoList as never);
router.post('/listino', requirePerm('listino'), c.listinoCreate as never);
router.put('/listino/:id', requirePerm('listino'), c.listinoUpdate as never);
router.put('/listino/marca/:marca/settore', requirePerm('listino'), c.listinoMarcaSettore as never);
router.delete('/listino/:id', requirePerm('listino'), c.listinoDelete as never);
router.post('/listino/import', requirePerm('listino'), c.listinoImport as never);
router.get('/marche', c.marcheList as never);
router.put('/marche/:marca', requirePerm('listino'), c.marcaUpdate as never);

// Operai (manodopera): lettura a qualsiasi account (serve per le bolle);
// gestione (crea/modifica/elimina) SOLO admin.
router.get('/operai', c.operaiList as never);
router.post('/operai', requireAdminRole, c.operaiCreate as never);
router.put('/operai/:id', requireAdminRole, c.operaiUpdate as never);
router.delete('/operai/:id', requireAdminRole, c.operaiDelete as never);

// Impostazioni globali bolle: lettura a qualsiasi account attivo (servono per
// compilare le bolle); modifica SOLO admin.
router.get('/impostazioni', c.impostazioniGet as never);
router.put('/impostazioni', requireAdminRole, c.impostazioniUpdate as never);

// Audit log (storico azioni): SOLO admin.
router.get('/audit', requireAdminRole, c.auditList as never);

// Account (gestione permessi): SOLO admin.
router.get('/accounts', requireAdminRole, c.accountsList as never);
router.post('/accounts', requireAdminRole, c.accountCreate as never);
router.put('/accounts/:id', requireAdminRole, c.accountUpdate as never);
router.delete('/accounts/:id', requireAdminRole, c.accountDelete as never);

export default router;
