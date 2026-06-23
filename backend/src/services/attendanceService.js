import * as attendanceRepository from '../repositories/attendanceRepository.js';
import * as templateRepository from '../repositories/templateRepository.js';
import * as settingsRepository from '../repositories/settingsRepository.js';
import * as notificationRepository from '../repositories/notificationRepository.js';
import * as auditRepository from '../repositories/auditRepository.js';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';

/**
 * Mark student attendance records in bulk.
 */
export const markAttendance = async (schoolId, records = [], userId) => {
  const markedRecords = [];
  for (const rec of records) {
    const record = await attendanceRepository.mark(schoolId, {
      studentId: rec.studentId,
      date: rec.date,
      status: rec.status,
      remarks: rec.remarks || '',
      markedBy: userId
    });
    markedRecords.push(record);
  }

  // Create an audit entry for logging
  if (records.length > 0) {
    await auditRepository.create({
      schoolId,
      userId,
      action: 'MARK_ATTENDANCE',
      tableName: 'attendance',
      recordId: records[0].date,
      newValues: { count: records.length, date: records[0].date }
    });
  }

  return markedRecords;
};

/**
 * Get attendance grid.
 */
export const getAttendanceRoster = async (schoolId, date, gradeClass, section) => {
  return attendanceRepository.findByDateAndClass(schoolId, date, gradeClass, section);
};

/**
 * Finalize attendance. This flags records and enqueues notifications for any absentees.
 */
export const finalizeAttendance = async (schoolId, date, gradeClass, section, userId) => {
  // 1. Mark finalized in Database
  const finalizedRecords = await attendanceRepository.finalize(schoolId, date, gradeClass, section, userId);
  
  if (finalizedRecords.length === 0) {
    throw new Error('No attendance records found to finalize for the selected filters.');
  }

  // 2. Load school notification settings
  let settings = await settingsRepository.findBySchool(schoolId);
  if (!settings) {
    settings = {
      max_retries: 3,
      active_channels: ['SMS', 'EMAIL']
    };
  }

  const activeChannels = settings.active_channels || ['SMS', 'EMAIL'];

  // 3. Find all students in class that are absent
  const roster = await attendanceRepository.findByDateAndClass(schoolId, date, gradeClass, section);
  const absentees = roster.filter(student => student.status === 'ABSENT');

  console.log(`Finalizing attendance for ${gradeClass} ${section} on ${date}. Found ${absentees.length} absentees. Channels:`, activeChannels);

  // 4. Generate notification entries for each channel
  for (const student of absentees) {
    for (const channel of activeChannels) {
      // Find template for this school, type (ABSENT_NOTIFICATION), and channel
      let template = await templateRepository.findByNameAndChannel(schoolId, 'ABSENT_NOTIFICATION', channel);
      let subject = 'Student Absent Alert';
      let body = '';

      if (template) {
        subject = template.subject || subject;
        body = template.body;
      } else {
        // Fallback default message template if not configured
        if (channel === 'CALL') {
          body = `Hello, this is a call regarding your child ${student.first_name} ${student.last_name}. They have been marked absent today.`;
        } else if (channel === 'EMAIL') {
          body = `<p>Dear ${student.parent_name},</p><p>Your child ${student.first_name} is marked absent today. Please click the link to acknowledge: <a href="{{ack_link}}">Acknowledge Here</a></p>`;
        } else {
          body = `EduNotify Alert: Dear ${student.parent_name}, your child ${student.first_name} is marked absent today (${date}). Please acknowledge: {{ack_link}}`;
        }
      }

      // Generate a unique ID for the notification to include in the acknowledgement URL
      const notificationId = uuidv4();
      const ackLink = `http://localhost:5173/acknowledge/${notificationId}`;

      // Perform Variable Substitution
      const messageSubject = subject
        .replace(/{{parent_name}}/g, student.parent_name)
        .replace(/{{student_name}}/g, `${student.first_name} ${student.last_name}`)
        .replace(/{{class}}/g, `${student.grade_class} ${student.section}`)
        .replace(/{{date}}/g, date)
        .replace(/{{roll_number}}/g, student.roll_number)
        .replace(/{{ack_link}}/g, ackLink);

      const messageBody = body
        .replace(/{{parent_name}}/g, student.parent_name)
        .replace(/{{student_name}}/g, `${student.first_name} ${student.last_name}`)
        .replace(/{{class}}/g, `${student.grade_class} ${student.section}`)
        .replace(/{{date}}/g, date)
        .replace(/{{roll_number}}/g, student.roll_number)
        .replace(/{{ack_link}}/g, ackLink);

      // Create notification
      const parentContact = channel === 'EMAIL' ? (roster.find(r => r.student_id === student.student_id)?.parent_email || `${student.parent_name}@example.com`) : student.parent_phone;

      // Create notification via repository (with custom ID for acknowledgement URL)
      const notification = await notificationRepository.createWithId(notificationId, schoolId, {
        studentId: student.student_id,
        attendanceId: student.attendance_id,
        parentName: student.parent_name,
        parentContact: parentContact,
        channel,
        messageBody: messageBody,
        status: 'PENDING'
      });

      // Enqueue notification in queue table
      await notificationRepository.enqueue(notification.id);
    }
  }

  // Write audit trail entry
  await auditRepository.create({
    schoolId,
    userId,
    action: 'FINALIZE_ATTENDANCE',
    tableName: 'attendance',
    recordId: `${gradeClass}-${section}-${date}`,
    newValues: {
      date,
      gradeClass,
      section,
      absenteesCount: absentees.length,
      notificationsGenerated: absentees.length * activeChannels.length
    }
  });

  return finalizedRecords;
};

/**
 * Fetch stats for telemetry graphs.
 */
export const getRosterHistoryStats = async (schoolId, days = 7) => {
  const today = new Date();
  const msInDay = 24 * 60 * 60 * 1000;
  const startDate = new Date(today.getTime() - days * msInDay).toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];

  return attendanceRepository.getStats(schoolId, startDate, endDate);
};
