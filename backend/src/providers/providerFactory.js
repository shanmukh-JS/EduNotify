import { 
  MockCallProvider, 
  MockSMSProvider, 
  MockWhatsAppProvider, 
  MockEmailProvider 
} from './mockProviders.js';

// Singleton instances of providers for mock setup
const mockCallInstance = new MockCallProvider();
const mockSMSInstance = new MockSMSProvider();
const mockWhatsAppInstance = new MockWhatsAppProvider();
const mockEmailInstance = new MockEmailProvider();

/**
 * Returns the active Call Provider.
 */
export const getCallProvider = () => {
  // Can expand to read configuration from environment variables / DB settings
  // and switch to TwilioProvider or ExotelProvider dynamically.
  return mockCallInstance;
};

/**
 * Returns the active SMS Provider.
 */
export const getSMSProvider = () => {
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
