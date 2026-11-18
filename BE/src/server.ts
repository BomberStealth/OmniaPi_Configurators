import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { testConnection } from './config/database';
import { runMigrations } from './migrate';
import authRoutes from './shared/auth.routes';
import ftvRoutes from './modules/fotovoltaico/routes';
import maioliRoutes from './modules/maioli/routes';
import { BE_VERSION } from './version';

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

app.use(cors());
app.use(express.json({ limit: '30mb' })); // upload foto (base64) e payload bolle

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString(), beVersion: BE_VERSION }));

app.use('/api/auth', authRoutes);
app.use('/api/fotovoltaico', ftvRoutes);
app.use('/api/maioli', maioliRoutes);

async function start() {
  try {
    await testConnection();
    console.log('DB connesso');
    try {
      await runMigrations();
    } catch (err) {
      console.warn('Migrations non eseguite:', err instanceof Error ? err.message : err);
    }
  } catch (err) {
    console.warn('DB non disponibile:', err instanceof Error ? err.message : err);
  }
  app.listen(PORT, () => console.log(`configuratori-be in ascolto su porta ${PORT}`));
}

start();
