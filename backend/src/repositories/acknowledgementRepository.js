import { query } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export const createOrUpdate = async ({ notificationId, status, remarks }) => {
  // First, find the notification to check when it was sent, so we can calculate response time
  const notifSql = `SELECT created_at FROM notifications WHERE id = $1`;
  const notifRes = await query(notifSql, [notificationId]);
  const notif = notifRes.rows[0];

  let responseTimeSeconds = null;
  if (notif) {
    const sentTime = new Date(notif.created_at).getTime();
    const ackTime = Date.now();
    responseTimeSeconds = Math.floor((ackTime - sentTime) / 1000);
    // Prevent negative numbers on local clock mismatches
    if (responseTimeSeconds < 0) responseTimeSeconds = 0;
  }

  const id = uuidv4();
  const sql = `
    INSERT INTO parent_acknowledgements (id, notification_id, status, acknowledged_at, response_time_seconds, remarks)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5)
    ON CONFLICT (notification_id)
    DO UPDATE SET 
      status = EXCLUDED.status,
      acknowledged_at = CURRENT_TIMESTAMP,
      response_time_seconds = EXCLUDED.response_time_seconds,
      remarks = EXCLUDED.remarks
    RETURNING *
  `;
  const params = [id, notificationId, status, responseTimeSeconds, remarks || null];
  const res = await query(sql, params);
  
  // Also update the related notification status to 'DELIVERED' or 'SENT' if it wasn't already,
  // to ensure state consistency.
  await query(
    `UPDATE notifications SET status = 'DELIVERED' WHERE id = $1 AND status NOT IN ('DELIVERED', 'SENT')`,
    [notificationId]
  );

  return res.rows[0];
};

export const findByNotificationId = async (notificationId) => {
  const sql = `
    SELECT ack.*, n.parent_name, n.message_body, s.first_name, s.last_name
    FROM parent_acknowledgements ack
    JOIN notifications n ON ack.notification_id = n.id
    JOIN students s ON n.student_id = s.id
    WHERE ack.notification_id = $1
  `;
  const res = await query(sql, [notificationId]);
  return res.rows[0];
};

export const getStats = async (schoolId) => {
  const sql = `
    SELECT 
      SUM(CASE WHEN ack.status = 'ACKNOWLEDGED' THEN 1 ELSE 0 END) as acknowledged,
      SUM(CASE WHEN ack.status = 'NEEDS_FOLLOW_UP' THEN 1 ELSE 0 END) as needs_follow_up,
      AVG(ack.response_time_seconds) as avg_response_time
    FROM parent_acknowledgements ack
    JOIN notifications n ON ack.notification_id = n.id
    WHERE n.school_id = $1
  `;
  const res = await query(sql, [schoolId]);
  const row = res.rows[0] || {};
  return {
    acknowledged: parseInt(row.acknowledged || 0),
    needsFollowUp: parseInt(row.needs_follow_up || 0),
    avgResponseTimeSeconds: Math.round(parseFloat(row.avg_response_time || 0))
  };
};
