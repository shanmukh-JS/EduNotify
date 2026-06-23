import * as broadcastRepository from '../repositories/broadcastRepository.js';
import * as studentRepository from '../repositories/studentRepository.js';
import * as notificationRepository from '../repositories/notificationRepository.js';
import * as auditRepository from '../repositories/auditRepository.js';
import { v4 as uuidv4 } from 'uuid';

export const sendBroadcast = async (schoolId, senderId, { subject, messageBody, channels }) => {
  if (!subject || !messageBody || !channels || channels.length === 0) {
    throw new Error('Missing required broadcast fields (subject, body, or channels).');
  }

  // 1. Create broadcast log entry (PENDING state)
  const broadcast = await broadcastRepository.create(schoolId, {
    senderId,
    subject,
    messageBody,
    channels
  });

  // 2. Fetch all active students in the school
  const students = await studentRepository.findAll(schoolId, { limit: 10000 });
  console.log(`Launching emergency broadcast for ${students.length} students across channels:`, channels);

  // 3. Generate notifications for each student and selected channel
  let notificationCount = 0;
  for (const student of students) {
    for (const channel of channels) {
      // Substitute placeholders
      const renderedSubject = subject
        .replace(/{{parent_name}}/g, student.parent_name)
        .replace(/{{student_name}}/g, `${student.first_name} ${student.last_name}`)
        .replace(/{{class}}/g, student.grade_class);

      const renderedBody = messageBody
        .replace(/{{parent_name}}/g, student.parent_name)
        .replace(/{{student_name}}/g, `${student.first_name} ${student.last_name}`)
        .replace(/{{class}}/g, student.grade_class);

      const parentContact = channel === 'EMAIL' ? student.parent_email : student.parent_phone;

      // Create notification record
      const notification = await notificationRepository.create(schoolId, {
        studentId: student.id,
        broadcastId: broadcast.id,
        parentName: student.parent_name,
        parentContact,
        channel,
        messageBody: renderedBody,
        status: 'PENDING'
      });

      // Enqueue notification
      await notificationRepository.enqueue(notification.id);
      notificationCount++;
    }
  }

  // 4. Set broadcast status to SENT
  await broadcastRepository.updateStatus(broadcast.id, 'SENT');

  // 5. Create audit logging entry
  await auditRepository.create({
    schoolId,
    userId: senderId,
    action: 'EMERGENCY_BROADCAST',
    tableName: 'emergency_broadcasts',
    recordId: broadcast.id,
    newValues: {
      subject,
      channels,
      studentsCount: students.length,
      notificationsQueued: notificationCount
    }
  });

  return {
    ...broadcast,
    status: 'SENT',
    notificationsQueued: notificationCount
  };
};

export const getBroadcasts = async (schoolId, limit = 50, offset = 0) => {
  return broadcastRepository.findAll(schoolId, limit, offset);
};

export const getBroadcastById = async (schoolId, id) => {
  const broadcast = await broadcastRepository.findById(schoolId, id);
  if (!broadcast) {
    throw new Error('Broadcast not found.');
  }
  return broadcast;
};
