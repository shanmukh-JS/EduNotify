import { query } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export const create = async (schoolId, { senderId, subject, messageBody, channels }) => {
  const id = uuidv4();
  
  // Format channels array for SQLite vs PG
  const channelsVal = process.env.DB_DIALECT === 'sqlite' 
    ? JSON.stringify(channels) 
    : channels; // PostgreSQL supports arrays natively

  const isPg = process.env.DB_DIALECT === 'postgres';
  const channelsPlaceholder = isPg ? '$5::VARCHAR(50)[]' : '$5';

  const sql = `
    INSERT INTO emergency_broadcasts (id, school_id, sender_id, subject, message_body, channels, status)
    VALUES ($1, $2, $3, $4, $5, ${channelsPlaceholder}, $7)
    RETURNING *
  `;
  
  const params = [id, schoolId, senderId, subject, messageBody, channelsVal, 'PENDING'];
  const res = await query(sql, params);
  return res.rows[0];
};

export const findAll = async (schoolId, limit = 50, offset = 0) => {
  const sql = `
    SELECT eb.*, u.full_name as sender_name
    FROM emergency_broadcasts eb
    JOIN users u ON eb.sender_id = u.id
    WHERE eb.school_id = $1
    ORDER BY eb.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const res = await query(sql, [schoolId, limit, offset]);
  
  return res.rows.map(row => ({
    ...row,
    channels: typeof row.channels === 'string' ? JSON.parse(row.channels) : row.channels
  }));
};

export const findById = async (schoolId, id) => {
  const sql = `
    SELECT eb.*, u.full_name as sender_name
    FROM emergency_broadcasts eb
    JOIN users u ON eb.sender_id = u.id
    WHERE eb.school_id = $1 AND eb.id = $2
  `;
  const res = await query(sql, [schoolId, id]);
  const row = res.rows[0];
  if (!row) return null;

  return {
    ...row,
    channels: typeof row.channels === 'string' ? JSON.parse(row.channels) : row.channels
  };
};

export const updateStatus = async (id, status) => {
  const sql = `
    UPDATE emergency_broadcasts
    SET status = $2
    WHERE id = $1
    RETURNING *
  `;
  const res = await query(sql, [id, status]);
  return res.rows[0];
};
