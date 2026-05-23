import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database';
import { signToken } from '../config/jwt';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ message: 'Email e password obbligatorie' });
    return;
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, email, password_hash, role FROM users WHERE email = ? LIMIT 1',
      [email],
    ) as [{ id: number; email: string; password_hash: string; role: string }[], unknown];

    if (!rows.length) {
      res.status(401).json({ message: 'Credenziali non valide' });
      return;
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ message: 'Credenziali non valide' });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Errore del server' });
  }
}

export async function me(req: Request & { user?: { userId: number; email: string; role: string } }, res: Response): Promise<void> {
  res.json({ user: req.user });
}
