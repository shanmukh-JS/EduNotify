import * as templateService from '../services/templateService.js';

export const listTemplates = async (req, res) => {
  const schoolId = req.user.school_id;
  try {
    const templates = await templateService.getAllTemplates(schoolId);
    return res.json(templates);
  } catch (err) {
    console.error('List templates error:', err);
    return res.status(500).json({ error: 'Failed to retrieve templates.' });
  }
};

export const getTemplate = async (req, res) => {
  const schoolId = req.user.school_id;
  const { id } = req.params;
  try {
    const template = await templateService.getTemplateById(schoolId, id);
    return res.json(template);
  } catch (err) {
    console.error('Get template error:', err);
    return res.status(404).json({ error: err.message });
  }
};

export const createTemplate = async (req, res) => {
  const schoolId = req.user.school_id;
  const userId = req.user.id;
  try {
    const template = await templateService.createTemplate(schoolId, req.body, userId);
    return res.status(201).json(template);
  } catch (err) {
    console.error('Create template error:', err);
    return res.status(400).json({ error: err.message });
  }
};

export const updateTemplate = async (req, res) => {
  const schoolId = req.user.school_id;
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const template = await templateService.updateTemplate(schoolId, id, req.body, userId);
    return res.json(template);
  } catch (err) {
    console.error('Update template error:', err);
    return res.status(400).json({ error: err.message });
  }
};

export const deleteTemplate = async (req, res) => {
  const schoolId = req.user.school_id;
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const success = await templateService.deleteTemplate(schoolId, id, userId);
    if (!success) {
      return res.status(400).json({ error: 'Failed to delete template.' });
    }
    return res.json({ message: 'Template deleted successfully.' });
  } catch (err) {
    console.error('Delete template error:', err);
    return res.status(404).json({ error: err.message });
  }
};
