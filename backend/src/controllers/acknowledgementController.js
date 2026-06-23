import * as acknowledgementService from '../services/acknowledgementService.js';

/**
 * Public endpoint to fetch details of a specific notification.
 * Enables the parent web page to render details like student name and reason.
 */
export const getDetails = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const details = await acknowledgementService.getAcknowledgementDetails(notificationId);
    if (!details) {
      // If no details are found in acknowledgement table, query notifications table to see if it exists
      // so we can display details before parent submits.
      const query = (await import('../config/db.js')).query;
      const notifSql = `
        SELECT n.id as notification_id, n.parent_name, n.message_body, s.first_name, s.last_name, a.date
        FROM notifications n
        JOIN students s ON n.student_id = s.id
        LEFT JOIN attendance a ON n.attendance_id = a.id
        WHERE n.id = $1
      `;
      const notifRes = await query(notifSql, [notificationId]);
      const notif = notifRes.rows[0];

      if (!notif) {
        return res.status(404).json({ error: 'Notification code not found or invalid.' });
      }
      return res.json(notif);
    }
    return res.json(details);
  } catch (err) {
    console.error('Get acknowledgement details error:', err);
    return res.status(500).json({ error: 'Failed to retrieve notification details.' });
  }
};

/**
 * Public endpoint for parents to submit their absence acknowledgement response.
 */
export const submitResponse = async (req, res) => {
  const { notificationId } = req.params;
  const { status, remarks } = req.body; // status: 'ACKNOWLEDGED' or 'NEEDS_FOLLOW_UP'

  if (!status || !['ACKNOWLEDGED', 'NEEDS_FOLLOW_UP'].includes(status)) {
    return res.status(400).json({ error: 'Valid status is required (ACKNOWLEDGED or NEEDS_FOLLOW_UP).' });
  }

  try {
    const result = await acknowledgementService.submitAcknowledgement({
      notificationId,
      status,
      remarks
    });
    return res.json({ message: 'Acknowledgement recorded successfully.', acknowledgement: result });
  } catch (err) {
    console.error('Submit acknowledgement error:', err);
    return res.status(400).json({ error: err.message });
  }
};

/**
 * Private endpoint for school administrators to see acknowledgement rates.
 */
export const getStats = async (req, res) => {
  const schoolId = req.user.school_id;

  try {
    const stats = await acknowledgementService.getAcknowledgementStats(schoolId);
    return res.json(stats);
  } catch (err) {
    console.error('Get acknowledgement stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch acknowledgement metrics.' });
  }
};
