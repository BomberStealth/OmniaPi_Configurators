import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

// Trova la cartella delle migration sia in dev (src) sia dopo il build (dist).
function findMigrationsDir(): string | null {
  const candidates = [
    path.resolve(__dirname, 'migrations'),
    path.resolve(__dirname, '../migrations'),
    path.resolve(__dirname, '../src/migrations'),
    path.resolve(process.cwd(), 'src/migrations'),
    path.resolve(process.cwd(), 'dist/migrations'),
    path.resolve(process.cwd(), 'migrations'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

// Esegue tutte le migration .sql in ordine. I file sono idempotenti
// (CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS / INSERT IGNORE),
// quindi rilanciarli ad ogni avvio è sicuro.
export async function runMigrations(): Promise<void> {
  const dir = findMigrationsDir();
  if (!dir) {
    console.warn('Migrations: cartella non trovata, salto');
    return;
  }
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  if (!files.length) return;

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'configuratori_db',
    user: process.env.DB_USER || 'omniapi',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });
  try {
    for (const f of files) {
      const sql = fs.readFileSync(path.join(dir, f), 'utf8').trim();
      if (!sql) continue;
      await conn.query(sql);
      console.log('Migration applicata:', f);
    }
  } finally {
    await conn.end();
  }
}
