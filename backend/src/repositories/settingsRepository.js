import { query } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export const findBySchool = async (schoolId) => {
  const sql = `
    SELECT * FROM notification_settings
    WHERE school_id = $1
  `;
  const res = await query(sql, [schoolId]);
  const row = res.rows[0];
  if (!row) return null;

  // Adapt arrays and json fields based on SQLite vs Postgres
  return {
    ...row,
    active_channels: typeof row.active_channels === 'string' ? JSON.parse(row.active_channels) : row.active_channels,
    default_templates: typeof row.default_templates === 'string' ? JSON.parse(row.default_templates) : row.default_templates,
    language_preferences: typeof row.language_preferences === 'string' ? JSON.parse(row.language_preferences) : row.language_preferences
  };
};

export const update = async (schoolId, settingsData) => {
  const existing = await findBySchool(schoolId);

  const activeChannels = settingsData.active_channels || ['SMS', 'EMAIL'];
  const defaultTemplates = settingsData.default_templates || {};
  const languagePreferences = settingsData.language_preferences || { default: 'en' };
  const notificationTime = settingsData.notification_time || '12:00:00';
  const maxRetries = settingsData.max_retries !== undefined ? parseInt(settingsData.max_retries) : 3;

  const activeChannelsVal = process.env.DB_DIALECT === 'sqlite' 
    ? JSON.stringify(activeChannels)
    : activeChannels; // PG natively accepts array arrays, but we can also use strings or array representations
    
  const defaultTemplatesVal = JSON.stringify(defaultTemplates);
  const languagePreferencesVal = JSON.stringify(languagePreferences);

  if (existing) {
    // In PG, active_channels might be actual VARCHAR[] arrays, so we can cast it or use array constructor
    // In our wrapper, we can check if it's PG.
    const isPg = process.env.DB_DIALECT === 'postgres';
    const channelsPlaceholder = isPg ? '$3::VARCHAR(50)[]' : '$3';

    const sql = `
      UPDATE notification_settings
      SET 
        notification_time = $1,
        max_retries = $2,
        active_channels = ${channelsPlaceholder},
        default_templates = $4,
        language_preferences = $5
      WHERE school_id = $6
      RETURNING *
    `;
    const res = await query(sql, [
      notificationTime,
      maxRetries,
      activeChannelsVal,
      defaultTemplatesVal,
      languagePreferencesVal,
      schoolId
    ]);
    return res.rows[0];
  } else {
    const id = uuidv4();
    const isPg = process.env.DB_DIALECT === 'postgres';
    const channelsPlaceholder = isPg ? '$4::VARCHAR(50)[]' : '$4';

    const sql = `
      INSERT INTO notification_settings (
        id, school_id, notification_time, active_channels, max_retries, default_templates, language_preferences
      ) VALUES ($1, $2, $3, ${channelsPlaceholder}, $5, $6, $7)
      RETURNING *
    `;
    const res = await query(sql, [
      id,
      schoolId,
      notificationTime,
      activeChannelsVal,
      maxRetries,
      defaultTemplatesVal,
      languagePreferencesVal
    ]);
    return res.rows[0];
  }
};
