import * as settingsRepository from '../repositories/settingsRepository.js';
import * as auditRepository from '../repositories/auditRepository.js';

export const getSettings = async (schoolId) => {
  let settings = await settingsRepository.findBySchool(schoolId);
  if (!settings) {
    // Return empty defaults if not customized
    settings = await settingsRepository.update(schoolId, {
      notification_time: '12:00:00',
      max_retries: 3,
      active_channels: ['SMS', 'EMAIL'],
      default_templates: {},
      language_preferences: { default: 'en' }
    });
  }
  return settings;
};

export const updateSettings = async (schoolId, settingsData, userId) => {
  const oldSettings = await settingsRepository.findBySchool(schoolId);
  const updatedSettings = await settingsRepository.update(schoolId, settingsData);

  // Log in Audit Trail
  await auditRepository.create({
    schoolId,
    userId,
    action: 'UPDATE_SETTINGS',
    tableName: 'notification_settings',
    recordId: updatedSettings.id || schoolId,
    oldValues: oldSettings,
    newValues: updatedSettings
  });

  return updatedSettings;
};
