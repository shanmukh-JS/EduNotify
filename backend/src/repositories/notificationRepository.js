import { query } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new notification instance.
 */
export const create = async (schoolId, { studentId, attendanceId, broadcastId, parentName, parentContact, channel, messageBody, status }) => {
  const id = uuidv4();
  const sql = `
    INSERT INTO notifications (
      id, school_id, student_id, attendance_id, broadcast_id, 
      parent_name, parent_contact, channel, message_body, status, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
    RETURNING *
  `;
  const res = await query(sql, [
    id,
    schoolId,
    studentId,
    attendanceId || null,
    broadcastId || null,
    parentName,
    parentContact,
    channel,
    messageBody,
    status || 'PENDING'
  ]);
  return res.rows[0];
};

/**
 * Create a notification with a pre-generated ID (used for acknowledgement URL tracking).
 */
export const createWithId = async (id, schoolId, { studentId, attendanceId, broadcastId, parentName, parentContact, channel, messageBody, status }) => {
  const sql = `
    INSERT INTO notifications (
      id, school_id, student_id, attendance_id, broadcast_id, 
      parent_name, parent_contact, channel, message_body, status, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
    RETURNING *
  `;
  const res = await query(sql, [
    id,
    schoolId,
    studentId,
    attendanceId || null,
    broadcastId || null,
    parentName,
    parentContact,
    channel,
    messageBody,
    status || 'PENDING'
  ]);
  return res.rows[0];
};

/**
 * Update the state of a notification.
 */
export const updateStatus = async (id, status) => {
  const sql = `
    UPDATE notifications
    SET status = $2, processed_at = CASE WHEN $2 IN ('SENT', 'DELIVERED', 'FAILED') THEN CURRENT_TIMESTAMP ELSE processed_at END
    WHERE id = $1
    RETURNING *
  `;
  const res = await query(sql, [id, status]);
  return res.rows[0];
};

/**
 * Add a notification to the processing queue.
 */
export const enqueue = async (notificationId, nextRetryAt = null) => {
  const id = uuidv4();
  const sql = `
    INSERT INTO notification_queue (id, notification_id, status, retry_count, next_retry_at)
    VALUES ($1, $2, 'PENDING', 0, $3)
    RETURNING *
  `;
  const res = await query(sql, [id, notificationId, nextRetryAt]);
  return res.rows[0];
};

/**
 * Retrieve pending items from the queue ready for execution.
 */
export const getPendingQueueItems = async () => {
  const sql = `
    SELECT 
      q.id as queue_item_id,
      q.retry_count,
      q.next_retry_at,
      n.id as notification_id,
      n.school_id,
      n.student_id,
      n.channel,
      n.message_body,
      n.parent_name,
      n.parent_contact,
      s.first_name as student_first_name,
      s.last_name as student_last_name,
      s.grade_class,
      s.section,
      s.roll_number
    FROM notification_queue q
    JOIN notifications n ON q.notification_id = n.id
    JOIN students s ON n.student_id = s.id
    WHERE q.status = 'PENDING' 
      AND (q.next_retry_at IS NULL OR q.next_retry_at <= CURRENT_TIMESTAMP)
    ORDER BY q.created_at ASC
  `;
  const res = await query(sql);
  return res.rows;
};

/**
 * Update queue status, retry count, and errors.
 */
export const updateQueueItem = async (queueItemId, { status, retryCount, nextRetryAt, errorMessage }) => {
  const sql = `
    UPDATE notification_queue
    SET 
      status = $2, 
      retry_count = $3, 
      next_retry_at = $4,
      error_message = $5
    WHERE id = $1
    RETURNING *
  `;
  const res = await query(sql, [queueItemId, status, retryCount, nextRetryAt, errorMessage || null]);
  return res.rows[0];
};

/**
 * Delete a processed queue item.
 */
export const removeQueueItem = async (queueItemId) => {
  const sql = `DELETE FROM notification_queue WHERE id = $1`;
  const res = await query(sql, [queueItemId]);
  return res.rowCount > 0;
};

/**
 * Create call log metadata records.
 */
export const createCallLog = async ({ notificationId, providerName, status, durationSeconds, errorCode, remarks }) => {
  const id = uuidv4();
  const sql = `
    INSERT INTO communication_logs (id, notification_id, provider_name, status, duration_seconds, error_code, remarks)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const res = await query(sql, [
    id,
    notificationId,
    providerName,
    status,
    durationSeconds || null,
    errorCode || null,
    remarks || null
  ]);
  return res.rows[0];
};

/**
 * Retrieve communication/call logs lists.
 */
export const getCallLogs = async (schoolId, filters = {}) => {
  const { limit = 100, offset = 0 } = filters;
  const sql = `
    SELECT 
      cl.*,
      n.parent_name,
      n.parent_contact as parent_number,
      n.created_at as call_date,
      s.first_name as student_first_name,
      s.last_name as student_last_name
    FROM communication_logs cl
    JOIN notifications n ON cl.notification_id = n.id
    JOIN students s ON n.student_id = s.id
    WHERE n.school_id = $1
    ORDER BY cl.timestamp DESC
    LIMIT $2 OFFSET $3
  `;
  const res = await query(sql, [schoolId, limit, offset]);
  return res.rows;
};

/**
 * Find notifications for today's absentees view.
 */
export const getTodaysAbsenteesList = async (schoolId, date) => {
  const sql = `
    SELECT 
      s.first_name,
      s.last_name,
      s.grade_class,
      s.section,
      s.roll_number,
      s.parent_name,
      s.parent_phone,
      a.status as attendance_status,
      n.id as notification_id,
      n.channel,
      n.status as notification_status,
      n.created_at as notification_sent_at,
      ack.status as acknowledgement_status,
      ack.acknowledged_at
    FROM students s
    JOIN attendance a ON s.id = a.student_id AND a.date = $2
    LEFT JOIN notifications n ON a.id = n.attendance_id
    LEFT JOIN parent_acknowledgements ack ON n.id = ack.notification_id
    WHERE s.school_id = $1 AND a.status = 'ABSENT'
    ORDER BY s.grade_class ASC, s.section ASC, s.roll_number ASC
  `;
  const res = await query(sql, [schoolId, date]);
  return res.rows;
};

/**
 * Get notification summary stats for the administrator dashboard.
 */
export const getTelemetryStats = async (schoolId) => {
  const totalSql = `SELECT COUNT(*) as count FROM notifications WHERE school_id = $1`;
  const pendingSql = `SELECT COUNT(*) as count FROM notifications WHERE school_id = $1 AND status IN ('PENDING', 'PROCESSING')`;
  const sentSql = `SELECT COUNT(*) as count FROM notifications WHERE school_id = $1 AND status IN ('SENT', 'DELIVERED')`;
  const failedSql = `SELECT COUNT(*) as count FROM notifications WHERE school_id = $1 AND status = 'FAILED'`;

  const channelsSql = `
    SELECT channel, COUNT(*) as count 
    FROM notifications 
    WHERE school_id = $1 
    GROUP BY channel
  `;

  const totalRes = await query(totalSql, [schoolId]);
  const pendingRes = await query(pendingSql, [schoolId]);
  const sentRes = await query(sentSql, [schoolId]);
  const failedRes = await query(failedSql, [schoolId]);
  const channelsRes = await query(channelsSql, [schoolId]);

  const channelData = {};
  channelsRes.rows.forEach(r => {
    channelData[r.channel] = parseInt(r.count);
  });

  return {
    total: parseInt(totalRes.rows[0].count || 0),
    pending: parseInt(pendingRes.rows[0].count || 0),
    success: parseInt(sentRes.rows[0].count || 0),
    failed: parseInt(failedRes.rows[0].count || 0),
    channels: {
      CALL: channelData.CALL || 0,
      SMS: channelData.SMS || 0,
      WHATSAPP: channelData.WHATSAPP || 0,
      EMAIL: channelData.EMAIL || 0
    }
  };
};
