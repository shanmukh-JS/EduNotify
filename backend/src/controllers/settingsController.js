import * as settingsService from '../services/settingsService.js';

export const getSettings = async (req, res) => {
  const schoolId = req.user.school_id;
  try {
    const settings = await settingsService.getSettings(schoolId);
    return res.json(settings);
  } catch (err) {
    console.error('Get settings error:', err);
    return res.status(500).json({ error: 'Failed to retrieve notification settings.' });
  }
};

export const updateSettings = async (req, res) => {
  const schoolId = req.user.school_id;
  const userId = req.user.id;
  try {
    const settings = await settingsService.updateSettings(schoolId, req.body, userId);
    return res.json(settings);
  } catch (err) {
    console.error('Update settings error:', err);
    return res.status(400).json({ error: err.message });
  }
};
