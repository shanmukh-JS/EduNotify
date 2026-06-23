import { query } from '../config/db.js';

export const findByUsername = async (username) => {
  const sql = `
    SELECT u.*, s.name as school_name, s.code as school_code
    FROM users u
    JOIN schools s ON u.school_id = s.id
    WHERE u.username = $1
  `;
  const res = await query(sql, [username]);
  return res.rows[0];
};

export const findById = async (id) => {
  const sql = `
    SELECT u.id, u.school_id, u.username, u.full_name, u.role, u.is_active, s.name as school_name
    FROM users u
    JOIN schools s ON u.school_id = s.id
    WHERE u.id = $1
  `;
  const res = await query(sql, [id]);
  return res.rows[0];
};
