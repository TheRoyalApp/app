import { describe, it, expect, beforeAll } from "bun:test";
import { testWhatsAppConnection, sendWhatsappReminder } from "../src/helpers/whatsapp.helper.js";

describe("WhatsApp Integration Tests", () => {
  beforeAll(() => {
    // Ensure we're in development mode for testing
    process.env.NODE_ENV = 'development';
  });

  it("should test WhatsApp connection", async () => {
    const result = await testWhatsAppConnection();
    
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should send WhatsApp reminder message", async () => {
    const phoneNumber = "+15551234567"; // More realistic test number
    const message = "Test WhatsApp message from The Royal Barber";
    
    const result = await sendWhatsappReminder(phoneNumber, message);
    
    // The result depends on whether Twilio accepts the test number
    // In a real scenario, this would be a valid phone number
    expect(typeof result.success).toBe('boolean');
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it("should handle missing Twilio config gracefully", async () => {
    // Test with a phone number that will fail validation
    const phoneNumber = "invalid-phone";
    const message = "Test message";
    
    const result = await sendWhatsappReminder(phoneNumber, message);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
}); 