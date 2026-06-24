import twilio from 'twilio';
import { CallProvider, SMSProvider } from './contracts.js';

let _twilioClient = null;

const getTwilioClient = () => {
  if (!_twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (accountSid && authToken) {
      _twilioClient = twilio(accountSid, authToken);
    }
  }
  return _twilioClient;
};

export class TwilioCallProvider extends CallProvider {
  async placeCall(toNumber, messageBody) {
    const client = getTwilioClient();
    if (!client) {
      throw new Error('Twilio credentials not configured in environment.');
    }
    
    try {
      const call = await client.calls.create({
        twiml: `<Response><Say>${messageBody}</Say></Response>`,
        to: toNumber,
        from: process.env.TWILIO_PHONE_NUMBER
      });
      return {
        status: 'SUCCESS',
        durationSeconds: 0,
        remarks: `Twilio call initiated. SID: ${call.sid}`
      };
    } catch (err) {
      console.error('Twilio Call Error:', err.message);
      return {
        status: 'FAILED',
        durationSeconds: 0,
        remarks: err.message,
        errorCode: String(err.code || 'UNKNOWN')
      };
    }
  }
}

export class TwilioSMSProvider extends SMSProvider {
  async sendSMS(toNumber, messageBody) {
    const client = getTwilioClient();
    if (!client) {
      throw new Error('Twilio credentials not configured in environment.');
    }
    
    try {
      const message = await client.messages.create({
        body: messageBody,
        to: toNumber,
        from: process.env.TWILIO_PHONE_NUMBER
      });
      return {
        status: 'SUCCESS',
        messageId: message.sid,
        remarks: `Twilio SMS sent.`
      };
    } catch (err) {
      console.error('Twilio SMS Error:', err.message);
      return {
        status: 'FAILED',
        messageId: null,
        remarks: err.message
      };
    }
  }
}
