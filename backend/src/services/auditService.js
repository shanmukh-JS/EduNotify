import * as auditRepository from '../repositories/auditRepository.js';

export const getAuditLogs = async (schoolId, limit = 50, offset = 0) => {
  return auditRepository.findBySchool(schoolId, limit, offset);
};
