/**
 * Interface definition for Voice Call Providers (e.g. Twilio, Exotel)
 */
export class CallProvider {
  /**
   * Place an automated voice call.
   * @param {string} toNumber - Recipient phone number
   * @param {string} messageBody - Text to speak
   * @returns {Promise<{ status: string, durationSeconds: number, remarks: string, errorCode?: string }>}
   */
  async placeCall(toNumber, messageBody) {
    throw new Error('Method placeCall() must be implemented.');
  }
}

/**
 * Interface definition for SMS Providers (e.g. Twilio, SMS Gateways)
 */
export class SMSProvider {
  /**
   * Send a text message.
   * @param {string} toNumber - Recipient phone number
   * @param {string} messageBody - SMS text body
   * @returns {Promise<{ status: string, messageId: string, remarks: string }>}
   */
  async sendSMS(toNumber, messageBody) {
    throw new Error('Method sendSMS() must be implemented.');
  }
}

/**
 * Interface definition for WhatsApp Business API Providers
 */
export class WhatsAppProvider {
  /**
   * Send a WhatsApp message.
   * @param {string} toNumber - Recipient phone number (WhatsApp enabled)
   * @param {string} messageBody - Template message content
   * @returns {Promise<{ status: string, messageId: string, remarks: string }>}
   */
  async sendWhatsApp(toNumber, messageBody) {
    throw new Error('Method sendWhatsApp() must be implemented.');
  }
}

/**
 * Interface definition for Email Providers (e.g. SMTP, SendGrid, Amazon SES)
 */
export class EmailProvider {
  /**
   * Send an email message.
   * @param {string} toEmail - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} htmlBody - HTML email body content
   * @returns {Promise<{ status: string, messageId: string, remarks: string }>}
   */
  async sendEmail(toEmail, subject, htmlBody) {
    throw new Error('Method sendEmail() must be implemented.');
  }
}
