import * as studentService from '../services/studentService.js';

export const listStudents = async (req, res) => {
  const { gradeClass, section, search, limit, offset } = req.query;
  const schoolId = req.user.school_id;

  try {
    const students = await studentService.getAllStudents(schoolId, {
      gradeClass,
      section,
      search,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0
    });
    return res.json(students);
  } catch (err) {
    console.error('List students error:', err);
    return res.status(500).json({ error: 'Failed to retrieve students list.' });
  }
};

export const getStudent = async (req, res) => {
  const schoolId = req.user.school_id;
  const { id } = req.params;

  try {
    const student = await studentService.getStudentById(schoolId, id);
    return res.json(student);
  } catch (err) {
    console.error('Get student error:', err);
    return res.status(404).json({ error: err.message });
  }
};

export const createStudent = async (req, res) => {
  const schoolId = req.user.school_id;
  const userId = req.user.id;

  try {
    const student = await studentService.createStudent(schoolId, req.body, userId);
    return res.status(201).json(student);
  } catch (err) {
    console.error('Create student error:', err);
    return res.status(400).json({ error: err.message });
  }
};

export const updateStudent = async (req, res) => {
  const schoolId = req.user.school_id;
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const student = await studentService.updateStudent(schoolId, id, req.body, userId);
    return res.json(student);
  } catch (err) {
    console.error('Update student error:', err);
    return res.status(400).json({ error: err.message });
  }
};

export const deleteStudent = async (req, res) => {
  const schoolId = req.user.school_id;
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const success = await studentService.deleteStudent(schoolId, id, userId);
    if (!success) {
      return res.status(400).json({ error: 'Failed to delete student.' });
    }
    return res.json({ message: 'Student record deleted successfully.' });
  } catch (err) {
    console.error('Delete student error:', err);
    return res.status(404).json({ error: err.message });
  }
};
