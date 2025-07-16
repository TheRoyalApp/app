import twilio from 'twilio';
import winstonLogger from './logger.js';
import { formatPhoneForTwilio } from './phone.helper.js';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

if (!accountSid || !authToken || !whatsappNumber) {
  winstonLogger.error('Missing Twilio environment variables', {
    accountSid: !!accountSid,
    authToken: !!authToken,
    whatsappNumber: !!whatsappNumber
  });
}

const client = twilio(accountSid, authToken);

export interface WhatsAppMessage {
  to: string;
  message: string;
}

/**
 * Send WhatsApp message using Twilio
 * @param to - Phone number in format: +1234567890
 * @param message - Message content
 * @returns Promise with success status and message ID
 */
export async function sendWhatsappReminder(to: string, message: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // Format phone number for Twilio compatibility
    const phoneResult = formatPhoneForTwilio(to);
    if (!phoneResult.isValid) {
      return {
        success: false,
        error: phoneResult.error || 'Invalid phone number format'
      };
    }
    
    const formattedPhone = phoneResult.formatted;

    // Format the "to" number for WhatsApp
    const whatsappTo = `whatsapp:${formattedPhone}`;
    const whatsappFrom = `whatsapp:${whatsappNumber}`;

    winstonLogger.info('Sending WhatsApp message', {
      to: whatsappTo,
      from: whatsappFrom,
      messageLength: message.length,
      originalPhone: to,
      formattedPhone: formattedPhone
    });

    const twilioMessage = await client.messages.create({
      body: message,
      from: whatsappFrom,
      to: whatsappTo
    });

    winstonLogger.info('WhatsApp message sent successfully', {
      messageId: twilioMessage.sid,
      status: twilioMessage.status
    });

    return {
      success: true,
      messageId: twilioMessage.sid
    };

  } catch (error) {
    winstonLogger.error('Failed to send WhatsApp message', {
      error: error instanceof Error ? error.message : 'Unknown error',
      to,
      messageLength: message.length
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate confirmation message for appointment
 */
export function generateConfirmationMessage(appointmentData: {
  customerName: string;
  serviceName: string;
  appointmentDate: string;
  timeSlot: string;
  barberName: string;
}): string {
  const { customerName, serviceName, appointmentDate, timeSlot, barberName } = appointmentData;
  
  return `¡Hola ${customerName}! 🎉

Tu cita ha sido confirmada exitosamente.

📅 *Detalles de tu cita:*
• Servicio: ${serviceName}
• Fecha: ${appointmentDate}
• Hora: ${timeSlot}
• Barber: ${barberName}

📍 *Ubicación:* The Royal Barber

⏰ Te recordaremos 15 minutos antes de tu cita.

¡Gracias por elegirnos! ✂️✨

_The Royal Barber_
_WhatsApp: ${whatsappNumber}`;
}

/**
 * Generate reminder message for appointment (15 minutes before)
 */
export function generateReminderMessage(appointmentData: {
  customerName: string;
  serviceName: string;
  appointmentDate: string;
  timeSlot: string;
  barberName: string;
}): string {
  const { customerName, serviceName, appointmentDate, timeSlot, barberName } = appointmentData;
  
  return `⏰ *Recordatorio de cita*

¡Hola ${customerName}! 

Tu cita está programada para *hoy* en 15 minutos.

📅 *Detalles:*
• Servicio: ${serviceName}
• Hora: ${timeSlot}
• Barber: ${barberName}

📍 *Ubicación:* The Royal Barber

¡Te esperamos! ✂️✨

_The Royal Barber_
_WhatsApp: ${whatsappNumber}`;
}

/**
 * Test function to verify WhatsApp integration
 */
export async function testWhatsAppConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!accountSid || !authToken || !whatsappNumber) {
      return {
        success: false,
        error: 'Missing Twilio environment variables'
      };
    }

    // Test the Twilio client by getting account info
    const account = await client.api.accounts(accountSid).fetch();
    
    winstonLogger.info('WhatsApp connection test successful', {
      accountSid: account.sid,
      accountName: account.friendlyName
    });

    return { success: true };

  } catch (error) {
    winstonLogger.error('WhatsApp connection test failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 