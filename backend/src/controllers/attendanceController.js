import * as attendanceService from '../services/attendanceService.js';
import * as attendanceRepository from '../repositories/attendanceRepository.js';

export const getRoster = async (req, res) => {
  const schoolId = req.user.school_id;
  const { date, gradeClass, section } = req.query;

  if (!date || !gradeClass || !section) {
    return res.status(400).json({ error: 'Missing parameters (date, gradeClass, and section are required).' });
  }

  try {
    const roster = await attendanceService.getAttendanceRoster(schoolId, date, gradeClass, section);
    return res.json(roster);
  } catch (err) {
    console.error('Get roster error:', err);
    return res.status(500).json({ error: 'Failed to fetch attendance roster.' });
  }
};

export const markRoster = async (req, res) => {
  const schoolId = req.user.school_id;
  const userId = req.user.id;
  const { records } = req.body; // Array of { studentId, date, status, remarks }

  if (!records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Records array is required in request body.' });
  }

  try {
    const marked = await attendanceService.markAttendance(schoolId, records, userId);
    return res.json({ message: 'Attendance records saved successfully.', records: marked });
  } catch (err) {
    console.error('Mark attendance error:', err);
    return res.status(500).json({ error: 'Failed to save attendance logs.' });
  }
};

export const finalizeRoster = async (req, res) => {
  const schoolId = req.user.school_id;
  const userId = req.user.id;
  const { date, gradeClass, section } = req.body;

  if (!date || !gradeClass || !section) {
    return res.status(400).json({ error: 'Date, gradeClass, and section are required in request body.' });
  }

  try {
    const finalized = await attendanceService.finalizeAttendance(schoolId, date, gradeClass, section, userId);
    return res.json({ 
      message: 'Attendance finalized successfully. Notifications have been queued.', 
      count: finalized.length 
    });
  } catch (err) {
    console.error('Finalize roster error:', err);
    return res.status(400).json({ error: err.message });
  }
};

export const getStudentHistory = async (req, res) => {
  const { studentId } = req.params;
  
  try {
    const history = await attendanceRepository.getStudentHistory(studentId);
    return res.json(history);
  } catch (err) {
    console.error('Get student history error:', err);
    return res.status(500).json({ error: 'Failed to fetch student attendance logs.' });
  }
};
