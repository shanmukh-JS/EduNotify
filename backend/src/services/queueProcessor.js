import * as notificationRepository from '../repositories/notificationRepository.js';
import * as settingsRepository from '../repositories/settingsRepository.js';
import * as providerFactory from '../providers/providerFactory.js';
import { query } from '../config/db.js';

let isProcessing = false;
let workerIntervalId = null;

/**
 * Core processor that reads pending queue items and dispatches them via providers.
 */
export const processQueue = async () => {
  if (isProcessing) return; // Prevent concurrent processing runs
  isProcessing = true;

  try {
    const pendingItems = await notificationRepository.getPendingQueueItems();
    if (pendingItems.length > 0) {
      console.log(`[QueueProcessor] Found ${pendingItems.length} pending notification jobs to process.`);
    }

    for (const item of pendingItems) {
      const { 
        queue_item_id, 
        notification_id, 
        school_id, 
        channel, 
        message_body, 
        parent_name, 
        parent_contact,
        retry_count
      } = item;

      // 1. Mark job as PROCESSING
      await notificationRepository.updateQueueItem(queue_item_id, {
        status: 'PROCESSING',
        retryCount: retry_count,
        nextRetryAt: null,
        errorMessage: null
      });
      await notificationRepository.updateStatus(notification_id, 'PROCESSING');

      // 2. Fetch max retries from settings
      const settings = await settingsRepository.findBySchool(school_id);
      const maxRetries = settings ? settings.max_retries : 3;

      try {
        let result = null;

        // 3. Dispatch to respective provider channel
        if (channel === 'CALL') {
          const provider = providerFactory.getCallProvider();
          result = await provider.placeCall(parent_contact, message_body);

          // Write call logging telemetry
          await notificationRepository.createCallLog({
            notificationId: notification_id,
            providerName: 'MockCallProvider',
            status: result.status,
            durationSeconds: result.durationSeconds,
            errorCode: result.errorCode || null,
            remarks: result.remarks
          });

          if (result.status !== 'COMPLETED') {
            throw new Error(`Call status returned: ${result.status}. ${result.remarks}`);
          }
        } 
        else if (channel === 'SMS') {
          const provider = providerFactory.getSMSProvider();
          result = await provider.sendSMS(parent_contact, message_body);
          if (result.status !== 'DELIVERED') {
            throw new Error(result.remarks);
          }
        } 
        else if (channel === 'WHATSAPP') {
          const provider = providerFactory.getWhatsAppProvider();
          result = await provider.sendWhatsApp(parent_contact, message_body);
          if (result.status !== 'DELIVERED') {
            throw new Error(result.remarks);
          }
        } 
        else if (channel === 'EMAIL') {
          const provider = providerFactory.getEmailProvider();
          // Extract subject or default
          const subject = 'EduNotify School Notification';
          result = await provider.sendEmail(parent_contact, subject, message_body);
          if (result.status !== 'DELIVERED') {
            throw new Error(result.remarks);
          }
        }

        // 4. On Success: Update Notification and delete queue record to save space
        await notificationRepository.updateStatus(notification_id, 'DELIVERED');
        await notificationRepository.removeQueueItem(queue_item_id);
        console.log(`[QueueProcessor] Notification ${notification_id} processed successfully via ${channel}.`);
      } 
      catch (error) {
        // 5. On Failure: Trigger Retry Flow or fail completely
        const nextRetryCount = retry_count + 1;
        console.error(`[QueueProcessor] Error sending notification ${notification_id}:`, error.message);

        if (nextRetryCount < maxRetries) {
          // Calculate exponential backoff (e.g. 1 min, 2 min, 3 min...)
          const backoffMinutes = nextRetryCount * 2;
          const nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

          console.log(`[QueueProcessor] Enqueuing retry #${nextRetryCount} for notification ${notification_id} at ${nextRetryAt.toISOString()}`);

          await notificationRepository.updateQueueItem(queue_item_id, {
            status: 'PENDING',
            retryCount: nextRetryCount,
            nextRetryAt,
            errorMessage: error.message
          });
          await notificationRepository.updateStatus(notification_id, 'PENDING');
        } 
        else {
          // Exceeded Max Retries: Mark as permanently FAILED
          console.error(`[QueueProcessor] Notification ${notification_id} exceeded max retries (${maxRetries}). Marking as FAILED.`);
          
          await notificationRepository.updateQueueItem(queue_item_id, {
            status: 'FAILED',
            retryCount: nextRetryCount,
            nextRetryAt: null,
            errorMessage: `Exceeded max retries. Last error: ${error.message}`
          });
          await notificationRepository.updateStatus(notification_id, 'FAILED');
        }
      }
    }
  } catch (err) {
    console.error('[QueueProcessor] Queue processing iteration failed:', err);
  } finally {
    isProcessing = false;
  }
};

/**
 * Starts the background processing loop.
 */
export const startQueueWorker = (pollIntervalMs = 5000) => {
  if (workerIntervalId) {
    console.warn('[QueueProcessor] Worker is already running.');
    return;
  }

  console.log(`[QueueProcessor] Starting background worker loop (polling every ${pollIntervalMs}ms).`);
  workerIntervalId = setInterval(async () => {
    await processQueue();
  }, pollIntervalMs);
};

/**
 * Stops the background processing loop.
 */
export const stopQueueWorker = () => {
  if (workerIntervalId) {
    clearInterval(workerIntervalId);
    workerIntervalId = null;
    console.log('[QueueProcessor] Background worker loop stopped.');
  }
};
