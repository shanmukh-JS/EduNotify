import * as broadcastService from '../services/broadcastService.js';

export const sendBroadcast = async (req, res) => {
  const schoolId = req.user.school_id;
  const senderId = req.user.id;
  const { subject, messageBody, channels } = req.body;

  try {
    const result = await broadcastService.sendBroadcast(schoolId, senderId, {
      subject,
      messageBody,
      channels
    });
    return res.status(201).json({
      message: 'Emergency broadcast dispatched successfully.',
      broadcast: result
    });
  } catch (err) {
    console.error('Send broadcast error:', err);
    return res.status(400).json({ error: err.message });
  }
};

export const listBroadcasts = async (req, res) => {
  const schoolId = req.user.school_id;
  const { limit, offset } = req.query;

  try {
    const broadcasts = await broadcastService.getBroadcasts(schoolId, 
      limit ? parseInt(limit) : 50, 
      offset ? parseInt(offset) : 0
    );
    return res.json(broadcasts);
  } catch (err) {
    console.error('List broadcasts error:', err);
    return res.status(500).json({ error: 'Failed to fetch broadcasts.' });
  }
};
