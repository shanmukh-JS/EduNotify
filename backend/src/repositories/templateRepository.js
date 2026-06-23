import { query } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export const create = async (schoolId, { name, channel, subject, body }) => {
  const id = uuidv4();
  const sql = `
    INSERT INTO communication_templates (id, school_id, name, channel, subject, body)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const res = await query(sql, [id, schoolId, name, channel, subject || null, body]);
  return res.rows[0];
};

export const findAll = async (schoolId) => {
  const sql = `
    SELECT * FROM communication_templates
    WHERE school_id = $1
    ORDER BY name ASC, channel ASC
  `;
  const res = await query(sql, [schoolId]);
  return res.rows;
};

export const findById = async (schoolId, id) => {
  const sql = `
    SELECT * FROM communication_templates
    WHERE school_id = $1 AND id = $2
  `;
  const res = await query(sql, [schoolId, id]);
  return res.rows[0];
};

export const update = async (schoolId, id, { name, channel, subject, body }) => {
  const sql = `
    UPDATE communication_templates
    SET name = $3, channel = $4, subject = $5, body = $6, updated_at = CURRENT_TIMESTAMP
    WHERE school_id = $1 AND id = $2
    RETURNING *
  `;
  const res = await query(sql, [schoolId, id, name, channel, subject || null, body]);
  return res.rows[0];
};

export const remove = async (schoolId, id) => {
  const sql = `
    DELETE FROM communication_templates
    WHERE school_id = $1 AND id = $2
  `;
  const res = await query(sql, [schoolId, id]);
  return res.rowCount > 0;
};

export const findByNameAndChannel = async (schoolId, name, channel) => {
  const sql = `
    SELECT * FROM communication_templates
    WHERE school_id = $1 AND name = $2 AND channel = $3
  `;
  const res = await query(sql, [schoolId, name, channel]);
  return res.rows[0];
};
