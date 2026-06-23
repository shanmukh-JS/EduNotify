import cron from 'node-cron';
import { query } from '../config/db.js';
import * as attendanceService from '../services/attendanceService.js';
import * as queueProcessor from '../services/queueProcessor.js';
import * as auditRepository from '../repositories/auditRepository.js';

/**
 * Main execution logic of the daily attendance notification scheduler.
 */
export const runDailyScheduler = async () => {
  console.log('[Scheduler] Executing scheduled daily attendance checks...');
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    // 1. Fetch all schools registered in the platform
    const schoolsRes = await query('SELECT id, name FROM schools');
    const schools = schoolsRes.rows;

    for (const school of schools) {
      console.log(`[Scheduler] Processing school: ${school.name} (${school.id})`);

      // 2. Find a system administrator/principal user to assign as marked_by actor
      const adminRes = await query(
        "SELECT id FROM users WHERE school_id = $1 AND role = 'SUPER_ADMIN' LIMIT 1",
        [school.id]
      );
      const systemActorId = adminRes.rows[0]?.id;

      if (!systemActorId) {
        console.warn(`[Scheduler] No admin user found for school ${school.name}. Skipping auto-finalization.`);
        continue;
      }

      // 3. Find classes/sections that have attendance marked but NOT finalized today
      const unfinalizedClassesSql = `
        SELECT DISTINCT s.grade_class, s.section
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE a.school_id = $1 
          AND a.date = $2 
          AND a.finalized = false
      `;
      const classesRes = await query(unfinalizedClassesSql, [school.id, todayStr]);
      const classesToFinalize = classesRes.rows;

      if (classesToFinalize.length > 0) {
        console.log(`[Scheduler] Found ${classesToFinalize.length} unfinalized classes for school ${school.name}. Finalizing...`);
        
        for (const cls of classesToFinalize) {
          try {
            await attendanceService.finalizeAttendance(
              school.id, 
              todayStr, 
              cls.grade_class, 
              cls.section, 
              systemActorId
            );
            console.log(`[Scheduler] Successfully auto-finalized ${cls.grade_class} ${cls.section} for school ${school.name}.`);
          } catch (finalizeErr) {
            console.error(`[Scheduler] Failed to auto-finalize ${cls.grade_class} ${cls.section}:`, finalizeErr.message);
          }
        }
      } else {
        console.log(`[Scheduler] All active classes are already finalized or unmarked for school ${school.name}.`);
      }

      // 4. Save Scheduler Audit Entry
      await auditRepository.create({
        schoolId: school.id,
        userId: systemActorId,
        action: 'SYSTEM_SCHEDULER_RUN',
        tableName: 'attendance',
        recordId: todayStr,
        newValues: {
          executionTime: new Date().toISOString(),
          autoFinalizedClassesCount: classesToFinalize.length
        }
      });
    }

    // 5. Force process queue immediately
    console.log('[Scheduler] Daily finalizations completed. Triggering immediate queue dispatch iteration...');
    await queueProcessor.processQueue();
    console.log('[Scheduler] Queue processing completed.');
  } catch (err) {
    console.error('[Scheduler] Scheduler run encountered errors:', err);
  }
};

/**
 * Start the 12:00 PM automated cron job.
 */
export const startCronScheduler = () => {
  console.log('[Scheduler] Initializing Daily 12:00 PM Cron Job...');
  
  // Cron pattern for 12:00 PM daily: '0 12 * * *'
  // For easy verification and logs visibility during debug, we print setup.
  cron.schedule('0 12 * * *', async () => {
    await runDailyScheduler();
  });
};
