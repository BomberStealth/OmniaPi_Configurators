import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { testConnection } from './config/database';
import authRoutes from './shared/auth.routes';
import ftvRoutes from './modules/fotovoltaico/routes';

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/fotovoltaico', ftvRoutes);

async function start() {
  try {
    await testConnection();
    console.log('DB connesso');
  } catch (err) {
    console.warn('DB non disponibile:', err instanceof Error ? err.message : err);
  }
  app.listen(PORT, () => console.log(`configuratori-be in ascolto su porta ${PORT}`));
}

start();
