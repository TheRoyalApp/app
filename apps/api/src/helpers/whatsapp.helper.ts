import twilio from 'twilio';
import winstonLogger from './logger.js';
import { formatPhoneForTwilio } from './phone.helper.js';
import { formatAppointmentDateTime, formatTimeForMexico, formatDateForMexico, isToday } from './date.helper.js';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !phoneNumber) {
  winstonLogger.error('Missing Twilio environment variables', {
    accountSid: !!accountSid,
    authToken: !!authToken,
    phoneNumber: !!phoneNumber
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

    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'DEV' || process.env.NODE_ENV === 'DEVELOPMENT' || process.env.NODE_ENV === 'dev';
    
    if (isDevelopment) {
      // Development mode - log to console
      console.log('\n📱 [TWILIO_WHATSAPP] ======================================');
      console.log('📞 TO:', formattedPhone);
      console.log('📞 FROM:', phoneNumber);
      console.log('💬 MESSAGE:');
      console.log('─'.repeat(50));
      console.log(message);
      console.log('─'.repeat(50));
      console.log('📊 STATUS: LOGGED (DEV MODE)');
      console.log('📋 MESSAGE ID: DEV_' + Date.now());
      console.log('⏰ TIMESTAMP:', new Date().toISOString());
      console.log('📱 [TWILIO_WHATSAPP] ======================================\n');
      
      return { 
        success: true, 
        messageId: 'DEV_' + Date.now() 
      };
    }

    // Production mode - actually send WhatsApp message
    const whatsappTo = `whatsapp:${formattedPhone}`;
    const whatsappFrom = `whatsapp:${phoneNumber}`;

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
  
  const formattedDateTime = formatAppointmentDateTime(appointmentDate, timeSlot);
  
  return `¡Hola ${customerName}! 🎉

Tu cita ha sido confirmada exitosamente.

📅 *Detalles de tu cita:*
• Servicio: ${serviceName}
• Fecha y Hora: ${formattedDateTime}
• Barber: ${barberName}

📍 *Ubicación:* The Royal Barber

⏰ Te recordaremos 15 minutos antes de tu cita.

¡Gracias por elegirnos! ✂️✨

_The Royal Barber_
_WhatsApp: ${phoneNumber}`;
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
  
  const formattedTime = formatTimeForMexico(timeSlot);
  const isAppointmentToday = isToday(appointmentDate);
  const dateText = isAppointmentToday ? 'hoy' : formatDateForMexico(appointmentDate);
  
  return `⏰ *Recordatorio de cita*

¡Hola ${customerName}! 

Tu cita está programada para *${dateText}* en 15 minutos.

📅 *Detalles:*
• Servicio: ${serviceName}
• Hora: ${formattedTime}
• Barber: ${barberName}

📍 *Ubicación:* The Royal Barber

¡Te esperamos! ✂️✨

_The Royal Barber_
_WhatsApp: ${phoneNumber}`;
}

/**
 * Generate barber notification message for new appointment
 */
export function generateBarberNotificationMessage(appointmentData: {
  customerName: string;
  customerLastName: string;
  serviceName: string;
  appointmentDate: string;
  timeSlot: string;
  customerPhone: string;
  paymentAmount?: string;
}): string {
  const { customerName, customerLastName, serviceName, appointmentDate, timeSlot, customerPhone, paymentAmount } = appointmentData;
  
  const formattedDateTime = formatAppointmentDateTime(appointmentDate, timeSlot);
  const customerFullName = `${customerName} ${customerLastName}`.trim();
  
  // Format payment amount - if it's a number, format it properly
  let paymentInfo = '';
  if (paymentAmount && paymentAmount !== 'N/A') {
    const amount = parseFloat(paymentAmount);
    if (!isNaN(amount)) {
      paymentInfo = `💰 *Pago:* $${amount.toFixed(2)} MXN`;
    } else {
      paymentInfo = `💰 *Pago:* $${paymentAmount} MXN`;
    }
  }
  
  return `🎉 *Nueva Cita Reservada*

¡Hola! Se ha reservado una nueva cita.

👤 *Cliente:* ${customerFullName}
📞 *Teléfono:* ${customerPhone}
✂️ *Servicio:* ${serviceName}
📅 *Fecha y Hora:* ${formattedDateTime}
${paymentInfo}

¡Prepárate para dar un excelente servicio! ✂️✨

_The Royal Barber_`;
}

/**
 * Test function to verify WhatsApp integration
 */
export async function testWhatsAppConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!accountSid || !authToken || !phoneNumber) {
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