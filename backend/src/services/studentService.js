import * as studentRepository from '../repositories/studentRepository.js';
import * as auditRepository from '../repositories/auditRepository.js';

export const createStudent = async (schoolId, studentData, userId) => {
  if (!studentData.admission_number || !studentData.first_name || !studentData.last_name) {
    throw new Error('Missing required student details (admission number, first and last name).');
  }

  const student = await studentRepository.create(schoolId, studentData);

  // Log to Audit Trail
  await auditRepository.create({
    schoolId,
    userId,
    action: 'CREATE_STUDENT',
    tableName: 'students',
    recordId: student.id,
    newValues: student
  });

  return student;
};

export const getAllStudents = async (schoolId, filters) => {
  return studentRepository.findAll(schoolId, filters);
};

export const getStudentById = async (schoolId, id) => {
  const student = await studentRepository.findById(schoolId, id);
  if (!student) {
    throw new Error('Student not found.');
  }
  return student;
};

export const updateStudent = async (schoolId, id, studentData, userId) => {
  const oldStudent = await studentRepository.findById(schoolId, id);
  if (!oldStudent) {
    throw new Error('Student not found.');
  }

  const updatedStudent = await studentRepository.update(schoolId, id, studentData);

  // Log to Audit Trail
  await auditRepository.create({
    schoolId,
    userId,
    action: 'UPDATE_STUDENT',
    tableName: 'students',
    recordId: id,
    oldValues: oldStudent,
    newValues: updatedStudent
  });

  return updatedStudent;
};

export const deleteStudent = async (schoolId, id, userId) => {
  const oldStudent = await studentRepository.findById(schoolId, id);
  if (!oldStudent) {
    throw new Error('Student not found.');
  }

  const success = await studentRepository.remove(schoolId, id);
  if (success) {
    // Log to Audit Trail
    await auditRepository.create({
      schoolId,
      userId,
      action: 'DELETE_STUDENT',
      tableName: 'students',
      recordId: id,
      oldValues: oldStudent
    });
  }

  return success;
};
