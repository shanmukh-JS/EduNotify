import { query } from '../config/db.js';
import * as attendanceRepository from '../repositories/attendanceRepository.js';
import * as notificationRepository from '../repositories/notificationRepository.js';
import * as acknowledgementRepository from '../repositories/acknowledgementRepository.js';

export const getDashboardStats = async (req, res) => {
  const schoolId = req.user.school_id;
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    // 1. Total student count
    const studentCountSql = `SELECT COUNT(*) as count FROM students WHERE school_id = $1 AND is_active = true`;
    const studentCountRes = await query(studentCountSql, [schoolId]);
    const totalStudents = parseInt(studentCountRes.rows[0]?.count || 0);

    // 2. Today's attendance summary
    const todayAttSql = `
      SELECT 
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN status = 'EXCUSED' THEN 1 ELSE 0 END) as excused
      FROM attendance
      WHERE school_id = $1 AND date = $2
    `;
    const todayAttRes = await query(todayAttSql, [schoolId, todayStr]);
    const todayStats = todayAttRes.rows[0] || {};
    
    const presentToday = parseInt(todayStats.present || 0);
    const absentToday = parseInt(todayStats.absent || 0);
    const lateToday = parseInt(todayStats.late || 0);
    const excusedToday = parseInt(todayStats.excused || 0);
    const markedTodayTotal = presentToday + absentToday + lateToday + excusedToday;
    
    // Fallback if attendance hasn't been marked today yet
    const attendancePercentage = markedTodayTotal > 0 
      ? Math.round(((presentToday + lateToday) / markedTodayTotal) * 100) 
      : 100;

    // 3. Notification summary
    const telemetry = await notificationRepository.getTelemetryStats(schoolId);

    // 4. Acknowledgement summary
    const acks = await acknowledgementRepository.getStats(schoolId);

    // 5. Today's absentees detailed list (Top 10 for dashboard preview)
    const todaysAbsentees = await notificationRepository.getTodaysAbsenteesList(schoolId, todayStr);

    // 6. Historical trend data (Last 7 days)
    const historyStats = await attendanceRepository.getStats(
      schoolId, 
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      todayStr
    );

    // 7. Top Absent Classes (Rank classes by absence count in current month)
    const topAbsentClassesSql = `
      SELECT s.grade_class, s.section, COUNT(a.id) as absence_count
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.school_id = $1 AND a.status = 'ABSENT'
        AND a.date >= $2
      GROUP BY s.grade_class, s.section
      ORDER BY absence_count DESC
      LIMIT 5
    `;
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const topAbsentRes = await query(topAbsentClassesSql, [schoolId, currentMonthStart]);

    // Return compiled analytics object
    return res.json({
      attendanceSummary: {
        totalStudents,
        presentToday,
        absentToday,
        lateToday,
        excusedToday,
        markedTodayTotal,
        attendancePercentage
      },
      notificationSummary: telemetry,
      acknowledgementSummary: acks,
      todaysAbsentees: todaysAbsentees.slice(0, 15), // Detailed preview list
      historicalTrends: historyStats,
      topAbsentClasses: topAbsentRes.rows.map(r => ({
        class: `${r.grade_class} ${r.section}`,
        absences: parseInt(r.absence_count || 0)
      }))
    });
  } catch (err) {
    console.error('Fetch dashboard metrics error:', err);
    return res.status(500).json({ error: 'Failed to aggregate dashboard analytics.' });
  }
};
