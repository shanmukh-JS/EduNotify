import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query, initDb } from '../config/db.js';

const hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

export const runSeed = async () => {
  try {
    console.log('Starting database seeding...');
    
    // First ensure schema is initialized if running SQLite
    await initDb();

    // 1. Clean existing records (Optional, for fresh seed)
    console.log('Clearing existing data...');
    // In SQLite or PG, disable/enable keys or clear tables in dependency order
    await query('DELETE FROM audit_logs');
    await query('DELETE FROM communication_logs');
    await query('DELETE FROM parent_acknowledgements');
    await query('DELETE FROM notification_queue');
    await query('DELETE FROM notifications');
    await query('DELETE FROM communication_templates');
    await query('DELETE FROM emergency_broadcasts');
    await query('DELETE FROM attendance');
    await query('DELETE FROM students');
    await query('DELETE FROM users');
    await query('DELETE FROM notification_settings');
    await query('DELETE FROM schools');

    console.log('Inserting seed records...');

    // 2. Insert Schools
    const school1Id = uuidv4();
    const school2Id = uuidv4();

    await query(
      'INSERT INTO schools (id, name, code, address) VALUES ($1, $2, $3, $4)',
      [school1Id, 'Springdale High School', 'SDHS', '123 Academic Way, Education District']
    );
    await query(
      'INSERT INTO schools (id, name, code, address) VALUES ($1, $2, $3, $4)',
      [school2Id, 'Greenwood International School', 'GWIS', '456 Pineview Crest, Green Fields']
    );

    console.log('Seeded Schools.');

    // 3. Insert Users (Hashed Passwords)
    const userAdminId = uuidv4();
    const userTeacher1Id = uuidv4();
    const userTeacher2Id = uuidv4();
    const userPrincipalId = uuidv4();

    await query(
      `INSERT INTO users (id, school_id, username, password_hash, full_name, role, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userAdminId, school1Id, 'admin', hashPassword('admin123'), 'System Administrator', 'SUPER_ADMIN', true]
    );
    await query(
      `INSERT INTO users (id, school_id, username, password_hash, full_name, role, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userTeacher1Id, school1Id, 'teacher', hashPassword('teacher123'), 'Sarah Jenkins', 'TEACHER', true]
    );
    await query(
      `INSERT INTO users (id, school_id, username, password_hash, full_name, role, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userPrincipalId, school1Id, 'principal', hashPassword('principal123'), 'Dr. Robert Carter', 'PRINCIPAL', true]
    );
    await query(
      `INSERT INTO users (id, school_id, username, password_hash, full_name, role, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userTeacher2Id, school2Id, 'teacher2', hashPassword('teacher123'), 'James Brooks', 'TEACHER', true]
    );

    console.log('Seeded Users.');

    // 4. Insert Default Settings
    const settings1Id = uuidv4();
    const settings2Id = uuidv4();

    await query(
      `INSERT INTO notification_settings (id, school_id, notification_time, max_retries, active_channels, default_templates, language_preferences) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        settings1Id,
        school1Id,
        '12:00:00',
        3,
        JSON.stringify(['SMS', 'EMAIL', 'WHATSAPP']),
        JSON.stringify({
          absent: 'Dear {{parent_name}}, your child {{student_name}} is absent from {{class}} on {{date}}. Please acknowledge.',
        }),
        JSON.stringify({ default: 'en' }),
      ]
    );
    
    await query(
      `INSERT INTO notification_settings (id, school_id, notification_time, max_retries, active_channels, default_templates, language_preferences) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        settings2Id,
        school2Id,
        '12:15:00',
        3,
        JSON.stringify(['SMS', 'WHATSAPP']),
        JSON.stringify({
          absent: 'Dear {{parent_name}}, {{student_name}} ({{class}}) is absent today ({{date}}).',
        }),
        JSON.stringify({ default: 'en' }),
      ]
    );

    console.log('Seeded Notification Settings.');

    // 5. Insert Students (Springdale High - School 1)
    const studentsData = [
      { id: uuidv4(), roll: 1, first: 'Alexander', last: 'Wright', class: 'Grade 10', sec: 'Section A', parent: 'Thomas Wright', phone: '+15550101', email: 'thomas.w@example.com' },
      { id: uuidv4(), roll: 2, first: 'Sophia', last: 'Martinez', class: 'Grade 10', sec: 'Section A', parent: 'Maria Martinez', phone: '+15550102', email: 'maria.m@example.com' },
      { id: uuidv4(), roll: 3, first: 'Liam', last: 'Johnson', class: 'Grade 10', sec: 'Section A', parent: 'Robert Johnson', phone: '+15550103', email: 'robert.j@example.com' },
      { id: uuidv4(), roll: 4, first: 'Olivia', last: 'Davis', class: 'Grade 10', sec: 'Section A', parent: 'Sarah Davis', phone: '+15550104', email: 'sarah.d@example.com' },
      { id: uuidv4(), roll: 5, first: 'Noah', last: 'Rodriguez', class: 'Grade 10', sec: 'Section B', parent: 'Carlos Rodriguez', phone: '+15550105', email: 'carlos.r@example.com' },
      { id: uuidv4(), roll: 6, first: 'Emma', last: 'Smith', class: 'Grade 10', sec: 'Section B', parent: 'John Smith', phone: '+15550106', email: 'john.s@example.com' },
      { id: uuidv4(), roll: 7, first: 'Jackson', last: 'Garcia', class: 'Grade 9', sec: 'Section A', parent: 'Elena Garcia', phone: '+15550107', email: 'elena.g@example.com' },
      { id: uuidv4(), roll: 8, first: 'Ava', last: 'Wilson', class: 'Grade 9', sec: 'Section A', parent: 'David Wilson', phone: '+15550108', email: 'david.w@example.com' },
      { id: uuidv4(), roll: 9, first: 'Lucas', last: 'Anderson', class: 'Grade 9', sec: 'Section B', parent: 'Karen Anderson', phone: '+15550109', email: 'karen.a@example.com' },
      { id: uuidv4(), roll: 10, first: 'Isabella', last: 'Thomas', class: 'Grade 9', sec: 'Section B', parent: 'Michael Thomas', phone: '+15550110', email: 'michael.t@example.com' },
    ];

    const studentIds = [];
    for (const student of studentsData) {
      studentIds.push(student.id);
      await query(
        `INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade_class, section, roll_number, parent_name, parent_phone, parent_email, preferred_language, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          student.id,
          school1Id,
          `ADM-${1000 + student.roll}`,
          student.first,
          student.last,
          student.class,
          student.sec,
          student.roll,
          student.parent,
          student.phone,
          student.email,
          'en',
          true,
        ]
      );
    }

    console.log('Seeded Students.');

    // 6. Seed Default Templates for School 1
    const templates = [
      { name: 'ABSENT_NOTIFICATION', channel: 'SMS', body: 'EduNotify Alert: Dear {{parent_name}}, your child {{student_name}} in {{class}} is ABSENT today, {{date}}. Please acknowledge: {{ack_link}}' },
      { name: 'ABSENT_NOTIFICATION', channel: 'WHATSAPP', body: 'Hello *{{parent_name}}*,\n\nThis is an official notice from *Springdale High School* that *{{student_name}}* ({{class}}) is marked *ABSENT* on *{{date}}*.\n\nPlease tap below to acknowledge:\n{{ack_link}}' },
      { name: 'ABSENT_NOTIFICATION', channel: 'EMAIL', subject: 'Student Absence Notification: {{student_name}}', body: '<p>Dear {{parent_name}},</p><p>This is to inform you that your child <strong>{{student_name}}</strong> ({{class}}, Roll No. {{roll_number}}) is marked <strong>ABSENT</strong> from school today, {{date}}.</p><p>Please acknowledge this notification by clicking the link below:</p><p><a href="{{ack_link}}">Acknowledge Absence</a></p>' },
      { name: 'ABSENT_NOTIFICATION', channel: 'CALL', body: 'Hello. This is Springdale High School. We are calling to inform you that {{student_name}} of {{class}} is marked absent today. Please check and confirm.' },
      
      { name: 'LATE_NOTIFICATION', channel: 'SMS', body: 'EduNotify Alert: Dear {{parent_name}}, {{student_name}} arrived LATE to school today, {{date}}.' },
      { name: 'LATE_NOTIFICATION', channel: 'WHATSAPP', body: 'Hello *{{parent_name}}*, *{{student_name}}* arrived LATE to school today, *{{date}}*.' },
      
      { name: 'FEE_REMINDER', channel: 'SMS', body: 'Dear {{parent_name}}, this is a reminder that school fees for {{student_name}} are outstanding. Please clear at the earliest.' },
      { name: 'MEETING_REMINDER', channel: 'EMAIL', subject: 'Parent Teacher Meeting Reminder', body: '<p>Dear {{parent_name}},</p><p>A reminder regarding the scheduled parent-teacher meeting for <strong>{{student_name}}</strong> on {{date}}.</p>' },
      { name: 'EMERGENCY_BROADCAST', channel: 'SMS', body: 'IMPORTANT SCHOOL NOTICE: School will remain closed on {{date}} due to heavy weather. Stay safe.' }
    ];

    for (const temp of templates) {
      await query(
        `INSERT INTO communication_templates (id, school_id, name, channel, subject, body) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [uuidv4(), school1Id, temp.name, temp.channel, temp.subject || null, temp.body]
      );
    }

    console.log('Seeded Communication Templates.');

    // 7. Seed Historical Attendance & Notifications for the last 5 days
    const today = new Date();
    const msInDay = 24 * 60 * 60 * 1000;
    
    console.log('Generating 5 days of historical attendance and communication logs...');
    
    // Generate dates: yesterday, 2 days ago, 3 days ago, 4 days ago, 5 days ago
    for (let i = 1; i <= 5; i++) {
      const dateVal = new Date(today.getTime() - i * msInDay);
      const dateStr = dateVal.toISOString().split('T')[0];

      // Mark attendance for all students on that day
      for (const studentId of studentIds) {
        // Randomly select attendance status
        // Alexander (idx 0) is chronically absent (absent 3 times)
        // Others have normal rate (90-95% present)
        const isAlexander = studentId === studentIds[0];
        const isSophia = studentId === studentIds[1];
        
        let status = 'PRESENT';
        if (isAlexander && (i === 1 || i === 3 || i === 5)) {
          status = 'ABSENT';
        } else if (isSophia && i === 2) {
          status = 'ABSENT';
        } else if (Math.random() < 0.08) {
          status = Math.random() > 0.5 ? 'ABSENT' : 'LATE';
        }

        const attId = uuidv4();
        await query(
          `INSERT INTO attendance (id, school_id, student_id, date, status, remarks, marked_by, finalized, finalized_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [attId, school1Id, studentId, dateStr, status, status === 'ABSENT' ? 'Parent not notified' : null, userTeacher1Id, true, new Date(dateVal.getTime() + 4 * 60 * 60 * 1000)]
        );

        // If ABSENT, generate a notification log to look realistic
        if (status === 'ABSENT') {
          const studentObj = studentsData.find(s => s.id === studentId);
          
          // Generate 3 channels: SMS, EMAIL, WHATSAPP
          const channels = ['SMS', 'WHATSAPP', 'EMAIL'];
          for (const channel of channels) {
            const notifId = uuidv4();
            const notifStatus = i === 5 ? 'FAILED' : 'DELIVERED';
            
            await query(
              `INSERT INTO notifications (id, school_id, student_id, attendance_id, parent_name, parent_contact, channel, message_body, status, created_at, processed_at) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [
                notifId,
                school1Id,
                studentId,
                attId,
                studentObj.parent,
                channel === 'EMAIL' ? studentObj.email : studentObj.phone,
                channel,
                `Mock absence message for ${studentObj.first_name} via ${channel}`,
                notifStatus,
                new Date(dateVal.getTime() + 4 * 60 * 60 * 1000), // created at 12 PM
                new Date(dateVal.getTime() + 4 * 60 * 5 * 1000) // processed 5 mins later
              ]
            );

            // Record Call Log if CALL was generated (let's insert call logs for some)
            if (channel === 'SMS' && Math.random() > 0.3) {
              const callNotifId = uuidv4();
              await query(
                `INSERT INTO notifications (id, school_id, student_id, attendance_id, parent_name, parent_contact, channel, message_body, status, created_at, processed_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [
                  callNotifId,
                  school1Id,
                  studentId,
                  attId,
                  studentObj.parent,
                  studentObj.phone,
                  'CALL',
                  `Mock calling voice alert regarding ${studentObj.first_name}`,
                  'DELIVERED',
                  new Date(dateVal.getTime() + 4 * 60 * 60 * 1000),
                  new Date(dateVal.getTime() + 4 * 60 * 6 * 1000)
                ]
              );

              await query(
                `INSERT INTO communication_logs (id, notification_id, provider_name, status, duration_seconds, remarks, timestamp) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                  uuidv4(),
                  callNotifId,
                  'MockCallProvider',
                  'COMPLETED',
                  Math.floor(Math.random() * 45) + 15,
                  'Call answered by parent. Parent confirmed student is sick.',
                  new Date(dateVal.getTime() + 4 * 60 * 6 * 1000)
                ]
              );
            }

            // Create Parent Acknowledgement (most past days are acknowledged)
            if (notifStatus === 'DELIVERED' && Math.random() > 0.4) {
              const ackStatus = Math.random() > 0.2 ? 'ACKNOWLEDGED' : 'NEEDS_FOLLOW_UP';
              await query(
                `INSERT INTO parent_acknowledgements (id, notification_id, status, acknowledged_at, response_time_seconds, remarks) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                  uuidv4(),
                  notifId,
                  ackStatus,
                  new Date(dateVal.getTime() + 4 * 60 * 30 * 1000), // 30 minutes later
                  1800,
                  ackStatus === 'NEEDS_FOLLOW_UP' ? 'Student has a dentist appointment. Will join tomorrow.' : 'Acknowledged. Fever.',
                ]
              );
            }
          }
        }
      }
    }

    console.log('Seeded Historical Attendance and Communication Logs.');
    console.log('Seeding process completed successfully!');
  } catch (err) {
    console.error('Error during seeding database:', err);
    throw err;
  }
};

// If executing directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeed().then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
