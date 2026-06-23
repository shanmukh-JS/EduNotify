import { CallProvider, SMSProvider, WhatsAppProvider, EmailProvider } from './contracts.js';
import { v4 as uuidv4 } from 'uuid';

// Helper to simulate network latency
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock Voice Call Provider simulating ring time and parent answers.
 */
export class MockCallProvider extends CallProvider {
  async placeCall(toNumber, messageBody) {
    console.log(`[MockCallProvider] Dialing ${toNumber}...`);
    await delay(1500); // Simulate connection ringing delay

    const roll = Math.random();
    if (roll < 0.80) {
      const duration = Math.floor(Math.random() * 45) + 15; // 15 to 60 seconds
      console.log(`[MockCallProvider] Connected with ${toNumber}. Call completed in ${duration}s.`);
      return {
        status: 'COMPLETED',
        durationSeconds: duration,
        remarks: 'Call answered. Voice alert played to completion.'
      };
    } else if (roll < 0.90) {
      console.warn(`[MockCallProvider] ${toNumber} line is BUSY.`);
      return {
        status: 'BUSY',
        durationSeconds: 0,
        remarks: 'Call failed. Line busy.',
        errorCode: 'ERR_LINE_BUSY'
      };
    } else {
      console.warn(`[MockCallProvider] ${toNumber} did not answer.`);
      return {
        status: 'NO_ANSWER',
        durationSeconds: 0,
        remarks: 'Call failed. Rings timed out.',
        errorCode: 'ERR_NO_ANSWER'
      };
    }
  }
}

/**
 * Mock SMS Provider simulating gateway latency.
 */
export class MockSMSProvider extends SMSProvider {
  async sendSMS(toNumber, messageBody) {
    console.log(`[MockSMSProvider] Dispatching SMS to ${toNumber}...`);
    await delay(800); // Simulate network gateway delay

    const roll = Math.random();
    if (roll < 0.93) {
      const msgId = `sms-${uuidv4().substring(0, 8)}`;
      console.log(`[MockSMSProvider] SMS delivered to ${toNumber}. ID: ${msgId}`);
      return {
        status: 'DELIVERED',
        messageId: msgId,
        remarks: 'SMS successfully sent and gateway receipt returned.'
      };
    } else {
      console.warn(`[MockSMSProvider] SMS to ${toNumber} failed to deliver.`);
      return {
        status: 'FAILED',
        messageId: '',
        remarks: 'SMS delivery failed. Handset unreachable.',
        errorCode: 'ERR_SMS_DELIVERY_FAILED'
      };
    }
  }
}

/**
 * Mock WhatsApp Provider simulating WhatsApp Business API gateway.
 */
export class MockWhatsAppProvider extends WhatsAppProvider {
  async sendWhatsApp(toNumber, messageBody) {
    console.log(`[MockWhatsAppProvider] Sending WhatsApp text to ${toNumber}...`);
    await delay(1000); // Simulate API latency

    const roll = Math.random();
    if (roll < 0.95) {
      const msgId = `wa-${uuidv4().substring(0, 8)}`;
      console.log(`[MockWhatsAppProvider] WhatsApp delivered to ${toNumber}. ID: ${msgId}`);
      return {
        status: 'DELIVERED',
        messageId: msgId,
        remarks: 'WhatsApp template message delivered.'
      };
    } else {
      console.warn(`[MockWhatsAppProvider] WhatsApp to ${toNumber} failed.`);
      return {
        status: 'FAILED',
        messageId: '',
        remarks: 'WhatsApp delivery failed. Recipient not on WhatsApp.',
        errorCode: 'ERR_NOT_ON_WHATSAPP'
      };
    }
  }
}

/**
 * Mock Email Provider simulating SMTP connections.
 */
export class MockEmailProvider extends EmailProvider {
  async sendEmail(toEmail, subject, htmlBody) {
    console.log(`[MockEmailProvider] Sending Email to ${toEmail}... Subject: ${subject}`);
    await delay(1200); // Simulate SMTP handshake latency

    const roll = Math.random();
    if (roll < 0.97) {
      const msgId = `email-${uuidv4().substring(0, 8)}`;
      console.log(`[MockEmailProvider] Email delivered to ${toEmail}. ID: ${msgId}`);
      return {
        status: 'DELIVERED',
        messageId: msgId,
        remarks: 'Email dispatched via Mock SMTP successfully.'
      };
    } else {
      console.warn(`[MockEmailProvider] Email to ${toEmail} bounced.`);
      return {
        status: 'FAILED',
        messageId: '',
        remarks: 'Email bounced. Mailbox storage full or invalid address.',
        errorCode: 'ERR_EMAIL_BOUNCED'
      };
    }
  }
}
