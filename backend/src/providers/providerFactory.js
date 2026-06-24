import { 
  MockCallProvider, 
  MockSMSProvider, 
  MockWhatsAppProvider, 
  MockEmailProvider 
} from './mockProviders.js';

import {
  TwilioCallProvider,
  TwilioSMSProvider
} from './twilioProvider.js';

// Singleton instances of providers for mock setup
const mockCallInstance = new MockCallProvider();
const mockSMSInstance = new MockSMSProvider();
const mockWhatsAppInstance = new MockWhatsAppProvider();
const mockEmailInstance = new MockEmailProvider();

// Twilio instances
let twilioCallInstance = null;
let twilioSMSInstance = null;

const hasTwilioCredentials = () => {
  return process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER;
};

/**
 * Returns the active Call Provider.
 */
export const getCallProvider = () => {
  if (hasTwilioCredentials()) {
    if (!twilioCallInstance) {
      twilioCallInstance = new TwilioCallProvider();
    }
    return twilioCallInstance;
  }
  return mockCallInstance;
};

/**
 * Returns the active SMS Provider.
 */
export const getSMSProvider = () => {
  if (hasTwilioCredentials()) {
    if (!twilioSMSInstance) {
      twilioSMSInstance = new TwilioSMSProvider();
    }
    return twilioSMSInstance;
  }
  return mockSMSInstance;
};

/**
 * Returns the active WhatsApp Provider.
 */
export const getWhatsAppProvider = () => {
  return mockWhatsAppInstance;
};

/**
 * Returns the active Email Provider.
 */
export const getEmailProvider = () => {
  return mockEmailInstance;
};
