import { describe, it, expect, beforeAll } from "bun:test";
import { TwilioHelper } from "../src/helpers/twilio.helper.js";

describe("SMS Logging in Development Mode", () => {
  beforeAll(() => {
    // Ensure we're in development mode for testing
    process.env.NODE_ENV = 'development';
    process.env.DISABLE_SMS = 'true';
  });

  it("should log SMS codes in development mode", async () => {
    const phoneNumber = "+1234567890";
    const code = "123456";
    
    // Capture console output
    const originalLog = console.log;
    let loggedOutput = '';
    
    console.log = (...args: any[]) => {
      loggedOutput += args.join(' ') + '\n';
    };
    
    try {
      const result = await TwilioHelper.sendVerificationCode(phoneNumber, code);
      
      expect(result.success).toBe(true);
      expect(loggedOutput).toContain('📱 SMS VERIFICATION CODE (DEV MODE)');
      expect(loggedOutput).toContain(`📞 Phone: ${phoneNumber}`);
      expect(loggedOutput).toContain(`🔢 Code: ${code}`);
    } finally {
      console.log = originalLog;
    }
  });

  it("should detect development mode correctly", () => {
    const mode = TwilioHelper.getSmsMode();
    expect(['DEVELOPMENT', 'DISABLED', 'NO_CONFIG']).toContain(mode);
  });

  it("should handle missing Twilio config gracefully", async () => {
    // Temporarily clear Twilio config
    const originalSid = process.env.TWILIO_ACCOUNT_SID;
    const originalToken = process.env.TWILIO_AUTH_TOKEN;
    const originalNumber = process.env.TWILIO_PHONE_NUMBER;
    
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;
    
    try {
      const phoneNumber = "+1234567890";
      const code = "123456";
      
      const result = await TwilioHelper.sendVerificationCode(phoneNumber, code);
      
      expect(result.success).toBe(true);
    } finally {
      // Restore original config
      if (originalSid) process.env.TWILIO_ACCOUNT_SID = originalSid;
      if (originalToken) process.env.TWILIO_AUTH_TOKEN = originalToken;
      if (originalNumber) process.env.TWILIO_PHONE_NUMBER = originalNumber;
    }
  });
}); 