import { pool } from '../../config/database';

export interface SavedCalc {
  id: number;
  user_id: number;
  name: string;
  struct_type: string;
  orient: string;
  grid_rows: number;
  grid_cols: number;
  grid_state: string;
  pan_w: number;
  pan_h: number;
  controvento: boolean;
  result_json: string;
  created_at: string;
  updated_at: string;
}

export async function listCalcs(userId: number): Promise<SavedCalc[]> {
  const [rows] = await pool.execute(
    'SELECT * FROM ftv_calcs WHERE user_id = ? ORDER BY updated_at DESC',
    [userId],
  );
  return rows as SavedCalc[];
}

export async function getCalc(id: number, userId: number): Promise<SavedCalc | null> {
  const [rows] = await pool.execute(
    'SELECT * FROM ftv_calcs WHERE id = ? AND user_id = ? LIMIT 1',
    [id, userId],
  ) as [SavedCalc[], unknown];
  return rows[0] ?? null;
}

export async function saveCalc(userId: number, data: Omit<SavedCalc, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<{ id: number }> {
  const [result] = await pool.execute(
    `INSERT INTO ftv_calcs (user_id, name, struct_type, orient, grid_rows, grid_cols, grid_state, pan_w, pan_h, controvento, result_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, data.name, data.struct_type, data.orient, data.grid_rows, data.grid_cols,
     data.grid_state, data.pan_w, data.pan_h, data.controvento ? 1 : 0, data.result_json],
  ) as [{ insertId: number }, unknown];
  return { id: result.insertId };
}

export async function deleteCalc(id: number, userId: number): Promise<boolean> {
  const [result] = await pool.execute(
    'DELETE FROM ftv_calcs WHERE id = ? AND user_id = ?',
    [id, userId],
  ) as [{ affectedRows: number }, unknown];
  return result.affectedRows > 0;
}
