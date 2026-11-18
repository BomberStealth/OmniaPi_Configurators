/**
 * Gestione account (login configuratori) — da lanciare a mano sul server.
 *
 *   npm run user:list
 *   npm run user:add  -- email@esempio.it 'password' [admin|user]
 *   npm run user:passwd -- email@esempio.it 'nuovapassword'
 *   npm run user:role -- email@esempio.it [admin|user]
 *   npm run user:del  -- email@esempio.it
 *
 * Gli account NON si creano dal sito: solo da qui. Le password sono salvate
 * come hash bcrypt, mai in chiaro.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database';

type Role = 'admin' | 'user';

function usage(): void {
  console.log(`Uso:
  npm run user:list
  npm run user:add    -- <email> <password> [admin|user]
  npm run user:passwd -- <email> <password>
  npm run user:role   -- <email> <admin|user>
  npm run user:del    -- <email>`);
}

async function list(): Promise<void> {
  const [rows] = (await pool.execute(
    'SELECT id, email, role, created_at FROM users ORDER BY id ASC',
  )) as [{ id: number; email: string; role: string; created_at: string }[], unknown];
  if (!rows.length) { console.log('Nessun account.'); return; }
  console.log('Account registrati:');
  for (const u of rows) console.log(`  #${u.id}  ${u.email}  [${u.role}]`);
}

async function add(email: string, password: string, role: Role): Promise<void> {
  if (!email || !password) { usage(); process.exitCode = 1; return; }
  if (password.length < 6) { console.error('La password deve avere almeno 6 caratteri.'); process.exitCode = 1; return; }
  const hash = await bcrypt.hash(password, 10);
  await pool.execute(
    `INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role)`,
    [email.toLowerCase().trim(), hash, role],
  );
  console.log(`OK — account "${email}" [${role}] creato/aggiornato.`);
}

async function passwd(email: string, password: string): Promise<void> {
  if (!email || !password) { usage(); process.exitCode = 1; return; }
  if (password.length < 6) { console.error('La password deve avere almeno 6 caratteri.'); process.exitCode = 1; return; }
  const hash = await bcrypt.hash(password, 10);
  const [r] = (await pool.execute(
    'UPDATE users SET password_hash = ? WHERE email = ?', [hash, email.toLowerCase().trim()],
  )) as [{ affectedRows: number }, unknown];
  if (r.affectedRows === 0) { console.error(`Account "${email}" non trovato.`); process.exitCode = 1; return; }
  console.log(`OK — password aggiornata per "${email}".`);
}

async function setRole(email: string, role: Role): Promise<void> {
  const [r] = (await pool.execute(
    'UPDATE users SET role = ? WHERE email = ?', [role, email.toLowerCase().trim()],
  )) as [{ affectedRows: number }, unknown];
  if (r.affectedRows === 0) { console.error(`Account "${email}" non trovato.`); process.exitCode = 1; return; }
  console.log(`OK — ruolo di "${email}" impostato a [${role}].`);
}

async function del(email: string): Promise<void> {
  const [r] = (await pool.execute(
    'DELETE FROM users WHERE email = ?', [email.toLowerCase().trim()],
  )) as [{ affectedRows: number }, unknown];
  if (r.affectedRows === 0) { console.error(`Account "${email}" non trovato.`); process.exitCode = 1; return; }
  console.log(`OK — account "${email}" eliminato.`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const asRole = (v: string | undefined): Role => (v === 'admin' ? 'admin' : 'user');
  switch (cmd) {
    case 'list': await list(); break;
    case 'add': await add(args[1], args[2], asRole(args[3])); break;
    case 'passwd': await passwd(args[1], args[2]); break;
    case 'role': await setRole(args[1], asRole(args[2])); break;
    case 'del': await del(args[1]); break;
    default: usage(); process.exitCode = 1;
  }
}

main()
  .catch((e) => { console.error('Errore:', e instanceof Error ? e.message : e); process.exitCode = 1; })
  .finally(() => pool.end());
