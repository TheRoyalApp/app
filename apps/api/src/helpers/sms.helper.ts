import twilio from 'twilio';
import winstonLogger from './logger.js';

export class SMSHelper {
  private static client: twilio.Twilio | null = null;
  private static accountSid = process.env.TWILIO_ACCOUNT_SID;
  private static authToken = process.env.TWILIO_AUTH_TOKEN;
  private static phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  private static initializeClient() {
    if (!this.client && this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken);
    }
  }

  static getSmsMode(): 'DEVELOPMENT' | 'PRODUCTION' | 'NO_CONFIG' {
    const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'DEV' || process.env.NODE_ENV === 'DEVELOPMENT' || process.env.NODE_ENV === 'dev';
    const hasConfig = !!(this.accountSid && this.authToken && this.phoneNumber);

    if (!hasConfig) return 'NO_CONFIG';
    if (isDevelopment) return 'DEVELOPMENT';
    return 'PRODUCTION';
  }

  static async sendSMS(phoneNumber: string, message: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    const mode = this.getSmsMode();

    // Development mode - log to console
    if (mode === 'DEVELOPMENT') {
      console.log('\n📱 [TWILIO_SMS] ==========================================');
      console.log('📞 TO:', phoneNumber);
      console.log('📞 FROM:', this.phoneNumber);
      console.log('💬 MESSAGE:');
      console.log('─'.repeat(50));
      console.log(message);
      console.log('─'.repeat(50));
      console.log('📊 STATUS: LOGGED (DEV MODE)');
      console.log('📋 MESSAGE ID: DEV_' + Date.now());
      console.log('⏰ TIMESTAMP:', new Date().toISOString());
      console.log('📱 [TWILIO_SMS] ==========================================\n');
      
      return { 
        success: true, 
        messageId: 'DEV_' + Date.now() 
      };
    }

    // No config - return success but don't send
    if (mode === 'NO_CONFIG') {
      winstonLogger.warn('SMS not sent - missing Twilio configuration');
      return { success: true };
    }

    // Production mode - actually send SMS
    try {
      this.initializeClient();
      
      if (!this.client) {
        return {
          success: false,
          error: 'Twilio client not initialized'
        };
      }

      const twilioMessage = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: phoneNumber
      });

      winstonLogger.info('SMS sent successfully', {
        messageId: twilioMessage.sid,
        phoneNumber,
        status: twilioMessage.status
      });

      return {
        success: true,
        messageId: twilioMessage.sid
      };

    } catch (error) {
      winstonLogger.error('Failed to send SMS', {
        error: error instanceof Error ? error.message : 'Unknown error',
        phoneNumber
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async sendVerificationCode(phoneNumber: string, code: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    const message = `Your verification code is: ${code}`;
    return this.sendSMS(phoneNumber, message);
  }
} 