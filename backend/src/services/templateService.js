import * as templateRepository from '../repositories/templateRepository.js';
import * as auditRepository from '../repositories/auditRepository.js';

export const createTemplate = async (schoolId, templateData, userId) => {
  const template = await templateRepository.create(schoolId, templateData);
  
  await auditRepository.create({
    schoolId,
    userId,
    action: 'CREATE_TEMPLATE',
    tableName: 'communication_templates',
    recordId: template.id,
    newValues: template
  });

  return template;
};

export const getAllTemplates = async (schoolId) => {
  return templateRepository.findAll(schoolId);
};

export const getTemplateById = async (schoolId, id) => {
  const template = await templateRepository.findById(schoolId, id);
  if (!template) {
    throw new Error('Template not found.');
  }
  return template;
};

export const updateTemplate = async (schoolId, id, templateData, userId) => {
  const oldTemplate = await templateRepository.findById(schoolId, id);
  if (!oldTemplate) {
    throw new Error('Template not found.');
  }

  const updatedTemplate = await templateRepository.update(schoolId, id, templateData);

  await auditRepository.create({
    schoolId,
    userId,
    action: 'UPDATE_TEMPLATE',
    tableName: 'communication_templates',
    recordId: id,
    oldValues: oldTemplate,
    newValues: updatedTemplate
  });

  return updatedTemplate;
};

export const deleteTemplate = async (schoolId, id, userId) => {
  const oldTemplate = await templateRepository.findById(schoolId, id);
  if (!oldTemplate) {
    throw new Error('Template not found.');
  }

  const success = await templateRepository.remove(schoolId, id);
  if (success) {
    await auditRepository.create({
      schoolId,
      userId,
      action: 'DELETE_TEMPLATE',
      tableName: 'communication_templates',
      recordId: id,
      oldValues: oldTemplate
    });
  }

  return success;
};
