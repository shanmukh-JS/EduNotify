import { query } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export const create = async (schoolId, studentData) => {
  const id = uuidv4();
  const sql = `
    INSERT INTO students (
      id, school_id, admission_number, first_name, last_name, 
      grade_class, section, roll_number, parent_name, 
      parent_phone, parent_alt_phone, parent_email, preferred_language, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
  `;
  
  const params = [
    id,
    schoolId,
    studentData.admission_number,
    studentData.first_name,
    studentData.last_name,
    studentData.grade_class,
    studentData.section,
    studentData.roll_number,
    studentData.parent_name,
    studentData.parent_phone,
    studentData.parent_alt_phone || null,
    studentData.parent_email,
    studentData.preferred_language || 'en',
    studentData.is_active !== undefined ? studentData.is_active : true
  ];

  const res = await query(sql, params);
  return res.rows[0];
};

export const findAll = async (schoolId, filters = {}) => {
  const { gradeClass, section, search, limit = 100, offset = 0 } = filters;
  let sql = `
    SELECT * FROM students 
    WHERE school_id = $1
  `;
  const params = [schoolId];
  let paramIndex = 2;

  if (gradeClass) {
    sql += ` AND grade_class = $${paramIndex++}`;
    params.push(gradeClass);
  }

  if (section) {
    sql += ` AND section = $${paramIndex++}`;
    params.push(section);
  }

  if (search) {
    sql += ` AND (first_name LIKE $${paramIndex} OR last_name LIKE $${paramIndex} OR admission_number LIKE $${paramIndex} OR parent_name LIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  sql += ` ORDER BY grade_class ASC, section ASC, roll_number ASC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
  params.push(limit, offset);

  const res = await query(sql, params);
  return res.rows;
};

export const findById = async (schoolId, id) => {
  const sql = `
    SELECT * FROM students 
    WHERE school_id = $1 AND id = $2
  `;
  const res = await query(sql, [schoolId, id]);
  return res.rows[0];
};

export const update = async (schoolId, id, studentData) => {
  const sql = `
    UPDATE students SET 
      admission_number = $3,
      first_name = $4,
      last_name = $5,
      grade_class = $6,
      section = $7,
      roll_number = $8,
      parent_name = $9,
      parent_phone = $10,
      parent_alt_phone = $11,
      parent_email = $12,
      preferred_language = $13,
      is_active = $14
    WHERE school_id = $1 AND id = $2
    RETURNING *
  `;
  const params = [
    schoolId,
    id,
    studentData.admission_number,
    studentData.first_name,
    studentData.last_name,
    studentData.grade_class,
    studentData.section,
    studentData.roll_number,
    studentData.parent_name,
    studentData.parent_phone,
    studentData.parent_alt_phone || null,
    studentData.parent_email,
    studentData.preferred_language || 'en',
    studentData.is_active !== undefined ? studentData.is_active : true
  ];

  const res = await query(sql, params);
  return res.rows[0];
};

export const remove = async (schoolId, id) => {
  const sql = `
    DELETE FROM students 
    WHERE school_id = $1 AND id = $2
  `;
  const res = await query(sql, [schoolId, id]);
  return res.rowCount > 0;
};
