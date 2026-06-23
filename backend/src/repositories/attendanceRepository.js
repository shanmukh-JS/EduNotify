import { query } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upsert daily attendance record for a student.
 */
export const mark = async (schoolId, { studentId, date, status, remarks, markedBy }) => {
  const id = uuidv4();
  const sql = `
    INSERT INTO attendance (id, school_id, student_id, date, status, remarks, marked_by, finalized)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (student_id, date) 
    DO UPDATE SET 
      status = EXCLUDED.status,
      remarks = EXCLUDED.remarks,
      marked_by = EXCLUDED.marked_by
    RETURNING *
  `;
  
  const params = [id, schoolId, studentId, date, status, remarks || null, markedBy, false];
  const res = await query(sql, params);
  return res.rows[0];
};

/**
 * Get class roster joined with attendance records for a specific date.
 */
export const findByDateAndClass = async (schoolId, date, gradeClass, section) => {
  const sql = `
    SELECT 
      s.id as student_id, 
      s.admission_number, 
      s.first_name, 
      s.last_name, 
      s.roll_number,
      s.parent_name,
      s.parent_phone,
      a.id as attendance_id, 
      a.date, 
      a.status, 
      a.remarks, 
      a.finalized, 
      a.finalized_at
    FROM students s
    LEFT JOIN attendance a ON s.id = a.student_id AND a.date = $2
    WHERE s.school_id = $1 
      AND s.grade_class = $3 
      AND s.section = $4 
      AND s.is_active = true
    ORDER BY s.roll_number ASC
  `;
  const res = await query(sql, [schoolId, date, gradeClass, section]);
  return res.rows;
};

/**
 * Finalize attendance for a class/section on a date.
 */
export const finalize = async (schoolId, date, gradeClass, section, finalizedBy) => {
  const sql = `
    UPDATE attendance
    SET 
      finalized = true,
      finalized_at = CURRENT_TIMESTAMP,
      marked_by = $1
    WHERE school_id = $2 
      AND date = $3 
      AND student_id IN (
        SELECT id FROM students 
        WHERE school_id = $2 AND grade_class = $4 AND section = $5
      )
    RETURNING *
  `;
  const res = await query(sql, [finalizedBy, schoolId, date, gradeClass, section]);
  return res.rows;
};

/**
 * Check if attendance is finalized for a class on a date.
 */
export const isClassFinalized = async (schoolId, date, gradeClass, section) => {
  const sql = `
    SELECT COUNT(*) as total, SUM(CASE WHEN finalized = true THEN 1 ELSE 0 END) as finalized_count
    FROM attendance
    WHERE school_id = $1 
      AND date = $2 
      AND student_id IN (
        SELECT id FROM students 
        WHERE school_id = $1 AND grade_class = $3 AND section = $4
      )
  `;
  const res = await query(sql, [schoolId, date, gradeClass, section]);
  const row = res.rows[0];
  const total = parseInt(row.total || 0);
  const finalized = parseInt(row.finalized_count || 0);
  return total > 0 && total === finalized;
};

/**
 * Retrieve absolute attendance logs for dashboard metrics.
 */
export const getStats = async (schoolId, startDate, endDate) => {
  const sql = `
    SELECT 
      date,
      SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present,
      SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent,
      SUM(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END) as late,
      SUM(CASE WHEN status = 'EXCUSED' THEN 1 ELSE 0 END) as excused,
      COUNT(*) as total
    FROM attendance
    WHERE school_id = $1 AND date BETWEEN $2 AND $3
    GROUP BY date
    ORDER BY date ASC
  `;
  const res = await query(sql, [schoolId, startDate, endDate]);
  return res.rows.map(row => ({
    date: row.date,
    present: parseInt(row.present),
    absent: parseInt(row.absent),
    late: parseInt(row.late),
    excused: parseInt(row.excused),
    total: parseInt(row.total)
  }));
};

/**
 * Get historical attendance list of a specific student.
 */
export const getStudentHistory = async (studentId) => {
  const sql = `
    SELECT id, date, status, remarks, finalized, finalized_at
    FROM attendance
    WHERE student_id = $1
    ORDER BY date DESC
  `;
  const res = await query(sql, [studentId]);
  return res.rows;
};
