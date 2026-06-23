import * as acknowledgementRepository from '../repositories/acknowledgementRepository.js';
import * as auditRepository from '../repositories/auditRepository.js';
import { query } from '../config/db.js';

export const submitAcknowledgement = async ({ notificationId, status, remarks }) => {
  if (!notificationId || !status) {
    throw new Error('Notification ID and acknowledgement status are required.');
  }

  const acknowledgement = await acknowledgementRepository.createOrUpdate({
    notificationId,
    status,
    remarks
  });

  // Find school ID for audit logging
  const notifSql = `SELECT school_id, student_id FROM notifications WHERE id = $1`;
  const notifRes = await query(notifSql, [notificationId]);
  const notif = notifRes.rows[0];

  if (notif) {
    await auditRepository.create({
      schoolId: notif.school_id,
      userId: null, // Done by parent directly (no admin session token)
      action: 'PARENT_ACKNOWLEDGEMENT',
      tableName: 'parent_acknowledgements',
      recordId: acknowledgement.id,
      newValues: {
        notificationId,
        status,
        remarks,
        studentId: notif.student_id
      }
    });
  }

  return acknowledgement;
};

export const getAcknowledgementDetails = async (notificationId) => {
  return acknowledgementRepository.findByNotificationId(notificationId);
};

export const getAcknowledgementStats = async (schoolId) => {
  return acknowledgementRepository.getStats(schoolId);
};
