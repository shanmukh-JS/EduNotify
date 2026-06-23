import { query } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export const create = async ({ schoolId, userId, action, tableName, recordId, oldValues, newValues }) => {
  const id = uuidv4();
  const sql = `
    INSERT INTO audit_logs (id, school_id, user_id, action, table_name, record_id, old_values, new_values)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  
  const params = [
    id,
    schoolId,
    userId,
    action,
    tableName,
    recordId,
    oldValues ? JSON.stringify(oldValues) : null,
    newValues ? JSON.stringify(newValues) : null
  ];

  const res = await query(sql, params);
  return res.rows[0];
};

export const findBySchool = async (schoolId, limit = 50, offset = 0) => {
  const sql = `
    SELECT al.*, u.full_name as user_name, u.role as user_role
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.school_id = $1
    ORDER BY al.timestamp DESC
    LIMIT $2 OFFSET $3
  `;
  const res = await query(sql, [schoolId, limit, offset]);
  
  // Parse JSON fields for both PG and SQLite
  return res.rows.map(row => ({
    ...row,
    old_values: typeof row.old_values === 'string' ? JSON.parse(row.old_values) : row.old_values,
    new_values: typeof row.new_values === 'string' ? JSON.parse(row.new_values) : row.new_values,
  }));
};
