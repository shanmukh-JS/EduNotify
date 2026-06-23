import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';
import * as studentController from '../controllers/studentController.js';
import * as attendanceController from '../controllers/attendanceController.js';
import * as templateController from '../controllers/templateController.js';
import * as settingsController from '../controllers/settingsController.js';
import * as broadcastController from '../controllers/broadcastController.js';
import * as acknowledgementController from '../controllers/acknowledgementController.js';
import * as dashboardController from '../controllers/dashboardController.js';
import { getCallLogs, getTodaysAbsenteesList } from '../repositories/notificationRepository.js';
import { getAuditLogs } from '../services/auditService.js';
import { runDailyScheduler } from '../scheduler/attendanceScheduler.js';

const router = Router();

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticate, authController.getMe);

// ==========================================
// 2. DASHBOARD & TELEMETRY
// ==========================================
router.get('/dashboard/stats', authenticate, dashboardController.getDashboardStats);

// ==========================================
// 3. STUDENT DIRECTORY (CRUD)
// ==========================================
router.get('/students', authenticate, studentController.listStudents);
router.get('/students/:id', authenticate, studentController.getStudent);
router.post('/students', authenticate, requireRoles(['SUPER_ADMIN', 'PRINCIPAL', 'COORDINATOR']), studentController.createStudent);
router.put('/students/:id', authenticate, requireRoles(['SUPER_ADMIN', 'PRINCIPAL', 'COORDINATOR']), studentController.updateStudent);
router.delete('/students/:id', authenticate, requireRoles(['SUPER_ADMIN', 'PRINCIPAL', 'COORDINATOR']), studentController.deleteStudent);

// ==========================================
// 4. ATTENDANCE MANAGEMENT
// ==========================================
router.get('/attendance/roster', authenticate, attendanceController.getRoster);
router.post('/attendance/mark', authenticate, requireRoles(['SUPER_ADMIN', 'PRINCIPAL', 'COORDINATOR', 'TEACHER']), attendanceController.markRoster);
router.post('/attendance/finalize', authenticate, requireRoles(['SUPER_ADMIN', 'PRINCIPAL', 'COORDINATOR', 'TEACHER']), attendanceController.finalizeRoster);
router.get('/attendance/student/:studentId', authenticate, attendanceController.getStudentHistory);

// ==========================================
// 5. COMM TEMPLATES (CRUD)
// ==========================================
router.get('/templates', authenticate, templateController.listTemplates);
router.get('/templates/:id', authenticate, templateController.getTemplate);
router.post('/templates', authenticate, requireRoles(['SUPER_ADMIN', 'PRINCIPAL', 'COORDINATOR']), templateController.createTemplate);
router.put('/templates/:id', authenticate, requireRoles(['SUPER_ADMIN', 'PRINCIPAL', 'COORDINATOR']), templateController.updateTemplate);
router.delete('/templates/:id', authenticate, requireRoles(['SUPER_ADMIN', 'PRINCIPAL', 'COORDINATOR']), templateController.deleteTemplate);

// ==========================================
// 6. SETTINGS MANAGEMENT
// ==========================================
router.get('/settings', authenticate, settingsController.getSettings);
router.put('/settings', authenticate, requireRoles(['SUPER_ADMIN', 'PRINCIPAL']), settingsController.updateSettings);

// ==========================================
// 7. EMERGENCY BROADCASTS
// ==========================================
router.post('/broadcasts', authenticate, requireRoles(['SUPER_ADMIN', 'PRINCIPAL']), broadcastController.sendBroadcast);
router.get('/broadcasts', authenticate, broadcastController.listBroadcasts);

// ==========================================
// 8. PARENT ACKNOWLEDGEMENT (PUBLIC & PRIVATE)
// ==========================================
// Admin stats: Private
router.get('/acknowledgements/stats', authenticate, acknowledgementController.getStats);
// Parent Form: Public (No JWT required)
router.get('/public/acknowledgements/:notificationId', acknowledgementController.getDetails);
router.post('/public/acknowledgements/:notificationId', acknowledgementController.submitResponse);

// ==========================================
// 9. SYSTEM LOGS & TELEMETRY REGISTRY
// ==========================================
// Call Logs Registry
router.get('/logs/call-logs', authenticate, async (req, res) => {
  const schoolId = req.user.school_id;
  const { limit, offset } = req.query;
  try {
    const logs = await getCallLogs(schoolId, {
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0
    });
    return res.json(logs);
  } catch (err) {
    console.error('Call logs query error:', err);
    return res.status(500).json({ error: 'Failed to retrieve call logs.' });
  }
});

// Audit Trail Logs Registry
router.get('/logs/audit-logs', authenticate, requireRoles(['SUPER_ADMIN', 'PRINCIPAL']), async (req, res) => {
  const schoolId = req.user.school_id;
  const { limit, offset } = req.query;
  try {
    const logs = await getAuditLogs(schoolId, 
      limit ? parseInt(limit) : 100, 
      offset ? parseInt(offset) : 0
    );
    return res.json(logs);
  } catch (err) {
    console.error('Audit logs query error:', err);
    return res.status(500).json({ error: 'Failed to retrieve security audit logs.' });
  }
});

// Today's absentees board query (contains delivery queues status and response states)
router.get('/logs/absentees-telemetry', authenticate, async (req, res) => {
  const schoolId = req.user.school_id;
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    const telemetry = await getTodaysAbsenteesList(schoolId, targetDate);
    return res.json(telemetry);
  } catch (err) {
    console.error('Absentees telemetry query error:', err);
    return res.status(500).json({ error: 'Failed to retrieve absentee delivery logs.' });
  }
});

// ==========================================
// 10. SYSTEM SCHEDULER TRIGGER (TESTING/VERIFICATION)
// ==========================================
router.post('/scheduler/trigger', authenticate, requireRoles(['SUPER_ADMIN', 'PRINCIPAL']), async (req, res) => {
  try {
    await runDailyScheduler();
    return res.json({ message: 'Daily attendance processing scheduler run completed successfully.' });
  } catch (err) {
    console.error('Manual scheduler trigger error:', err);
    return res.status(500).json({ error: 'Failed to run scheduler pipeline.' });
  }
});

export default router;
