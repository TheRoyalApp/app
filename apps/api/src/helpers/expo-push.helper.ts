import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import winstonLogger from './logger.js';

// Create a new Expo SDK client
const expo = new Expo();

export interface PushNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  ticketId?: string;
}

export interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

/**
 * Send push notification to a single Expo push token
 */
export async function sendPushNotification(
  expoPushToken: string,
  notification: PushNotificationData
): Promise<PushNotificationResult> {
  try {
    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(expoPushToken)) {
      return {
        success: false,
        error: `Push token ${expoPushToken} is not a valid Expo push token`
      };
    }

    // Construct the message
    const message: ExpoPushMessage = {
      to: expoPushToken,
      sound: notification.sound || 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      badge: notification.badge,
      channelId: notification.channelId || 'default'
    };

    winstonLogger.info('Sending push notification', {
      to: expoPushToken,
      title: notification.title,
      body: notification.body
    });

    // Send the push notification
    const ticket = await expo.sendPushNotificationsAsync([message]);
    
    if (ticket && ticket.length > 0) {
      const pushTicket = ticket[0];
      
      if (pushTicket && pushTicket.status === 'ok') {
        const ticketId = 'id' in pushTicket ? pushTicket.id : 'unknown';
        winstonLogger.info('Push notification sent successfully', {
          ticketId,
          to: expoPushToken
        });
        
        return {
          success: true,
          messageId: ticketId,
          ticketId: ticketId
        };
      } else if (pushTicket && pushTicket.status === 'error') {
        const error = `Push notification failed: ${'message' in pushTicket ? pushTicket.message : 'Unknown error'}`;
        const ticketId = 'id' in pushTicket ? pushTicket.id : 'unknown';
        winstonLogger.error('Push notification failed', {
          error,
          to: expoPushToken,
          ticketId
        });
        
        return {
          success: false,
          error,
          ticketId: ticketId as string
        };
      } else {
        const error = 'Unknown ticket status';
        winstonLogger.error('Push notification failed', { error, to: expoPushToken });
        
        return {
          success: false,
          error
        };
      }
    } else {
      const error = 'No ticket returned from Expo push service';
      winstonLogger.error('Push notification failed', { error, to: expoPushToken });
      
      return {
        success: false,
        error
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    winstonLogger.error('Error sending push notification', {
      error: errorMessage,
      to: expoPushToken
    });
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Send push notification to multiple Expo push tokens
 */
export async function sendPushNotificationToMultiple(
  expoPushTokens: string[],
  notification: PushNotificationData
): Promise<{
  success: boolean;
  results: PushNotificationResult[];
  totalSent: number;
  totalFailed: number;
}> {
  try {
    // Filter out invalid tokens
    const validTokens = expoPushTokens.filter(token => Expo.isExpoPushToken(token));
    const invalidTokens = expoPushTokens.filter(token => !Expo.isExpoPushToken(token));
    
    if (invalidTokens.length > 0) {
      winstonLogger.warn('Some push tokens are invalid', { invalidTokens });
    }
    
    if (validTokens.length === 0) {
      return {
        success: false,
        results: [],
        totalSent: 0,
        totalFailed: expoPushTokens.length
      };
    }

    // Create messages for all valid tokens
    const messages: ExpoPushMessage[] = validTokens.map(token => ({
      to: token,
      sound: notification.sound || 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      badge: notification.badge,
      channelId: notification.channelId || 'default'
    }));

    winstonLogger.info('Sending push notifications to multiple devices', {
      totalTokens: expoPushTokens.length,
      validTokens: validTokens.length,
      invalidTokens: invalidTokens.length,
      title: notification.title
    });

    // Send the push notifications
    const tickets = await expo.sendPushNotificationsAsync(messages);
    
    const results: PushNotificationResult[] = [];
    let totalSent = 0;
    let totalFailed = invalidTokens.length; // Count invalid tokens as failed

    // Process results
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const token = validTokens[i];
      
      if (ticket && ticket.status === 'ok') {
        const ticketId = 'id' in ticket ? ticket.id : 'unknown';
        results.push({
          success: true,
          messageId: ticketId,
          ticketId: ticketId
        });
        totalSent++;
      } else if (ticket && ticket.status === 'error') {
        const error = `Push notification failed: ${'message' in ticket ? ticket.message : 'Unknown error'}`;
        const ticketId = 'id' in ticket ? ticket.id : 'unknown';
        results.push({
          success: false,
          error,
          ticketId: ticketId as string
        });
        totalFailed++;
      } else {
        results.push({
          success: false,
          error: 'Unknown ticket status',
          ticketId: 'unknown'
        });
        totalFailed++;
      }
    }

    winstonLogger.info('Bulk push notification completed', {
      totalSent,
      totalFailed,
      totalTokens: expoPushTokens.length
    });

    return {
      success: totalSent > 0,
      results,
      totalSent,
      totalFailed
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    winstonLogger.error('Error sending bulk push notifications', {
      error: errorMessage,
      totalTokens: expoPushTokens.length
    });
    
    return {
      success: false,
      results: [],
      totalSent: 0,
      totalFailed: expoPushTokens.length
    };
  }
}

/**
 * Generate appointment confirmation push notification data
 */
export function generateAppointmentConfirmationNotification(appointmentData: {
  serviceName: string;
  appointmentDate: string;
  timeSlot: string;
  barberName: string;
  customerName: string;
}): PushNotificationData {
  return {
    title: '¡Cita Confirmada! 🎉',
    body: `Tu cita para ${appointmentData.serviceName} está confirmada para ${appointmentData.appointmentDate} con ${appointmentData.barberName}. ¡Te esperamos!`,
    data: {
      type: 'appointment_confirmation',
      appointmentId: appointmentData.serviceName, // This should be the actual appointment ID
      serviceName: appointmentData.serviceName,
      appointmentDate: appointmentData.appointmentDate,
      timeSlot: appointmentData.timeSlot,
      barberName: appointmentData.barberName,
      timestamp: Date.now(), // Add timestamp for cache busting
    },
    sound: 'default',
    badge: 1,
    channelId: 'appointments'
  };
}

/**
 * Generate appointment reminder push notification data
 */
export function generateAppointmentReminderNotification(appointmentData: {
  serviceName: string;
  appointmentDate: string;
  timeSlot: string;
  barberName: string;
  customerName: string;
}): PushNotificationData {
  return {
    title: 'Recordatorio de Cita ⏰',
    body: `Tu cita para ${appointmentData.serviceName} es mañana a las ${appointmentData.timeSlot} con ${appointmentData.barberName}. ¡No olvides venir!`,
    data: {
      type: 'appointment_reminder',
      appointmentId: appointmentData.serviceName, // This should be the actual appointment ID
      serviceName: appointmentData.serviceName,
      appointmentDate: appointmentData.appointmentDate,
      timeSlot: appointmentData.timeSlot,
      barberName: appointmentData.barberName
    },
    sound: 'default',
    badge: 1,
    channelId: 'appointments'
  };
}

/**
 * Generate barber notification push notification data
 */
export function generateBarberNotificationPushNotification(appointmentData: {
  customerName: string;
  customerLastName: string;
  serviceName: string;
  appointmentDate: string;
  timeSlot: string;
  customerPhone: string;
  paymentAmount?: string;
}): PushNotificationData {
  const customerFullName = `${appointmentData.customerName} ${appointmentData.customerLastName}`.trim();
  
  return {
    title: '🎉 Nueva Cita Reservada',
    body: `${customerFullName} ha reservado una cita para ${appointmentData.serviceName} ${appointmentData.appointmentDate}`,
    data: {
      type: 'barber_appointment_created',
      customerName: customerFullName,
      serviceName: appointmentData.serviceName,
      appointmentDate: appointmentData.appointmentDate,
      timeSlot: appointmentData.timeSlot,
      customerPhone: appointmentData.customerPhone,
      paymentAmount: appointmentData.paymentAmount
    },
    sound: 'default',
    badge: 1,
    channelId: 'barber_notifications'
  };
}

/**
 * Generate customer notification for rescheduled appointment
 */
export function generateAppointmentRescheduleConfirmationNotification(appointmentData: {
  serviceName: string;
  appointmentDate: string;
  timeSlot: string;
  barberName: string;
  customerName: string;
}): PushNotificationData {
  return {
    title: '📅 Cita Reprogramada',
    body: `Tu cita para ${appointmentData.serviceName} ha sido reprogramada para ${appointmentData.appointmentDate} con ${appointmentData.barberName}. ¡Te esperamos!`,
    data: {
      type: 'appointment_rescheduled',
      serviceName: appointmentData.serviceName,
      appointmentDate: appointmentData.appointmentDate,
      timeSlot: appointmentData.timeSlot,
      barberName: appointmentData.barberName,
      timestamp: Date.now(),
    },
    sound: 'default',
    badge: 1,
    channelId: 'appointments'
  };
}

/**
 * Generate barber notification for rescheduled appointment
 */
export function generateBarberRescheduleNotificationPushNotification(appointmentData: {
  customerName: string;
  customerLastName: string;
  serviceName: string;
  appointmentDate: string;
  timeSlot: string;
  customerPhone: string;
  paymentAmount?: string;
  originalDate?: string;
  originalTimeSlot?: string;
}): PushNotificationData {
  const customerFullName = `${appointmentData.customerName} ${appointmentData.customerLastName}`.trim();
  
  return {
    title: '📅 Cita Reprogramada',
    body: `${customerFullName} ha reprogramado su cita para ${appointmentData.serviceName} ${appointmentData.appointmentDate}`,
    data: {
      type: 'barber_appointment_rescheduled',
      customerName: customerFullName,
      serviceName: appointmentData.serviceName,
      appointmentDate: appointmentData.appointmentDate,
      timeSlot: appointmentData.timeSlot,
      customerPhone: appointmentData.customerPhone,
      paymentAmount: appointmentData.paymentAmount,
      originalDate: appointmentData.originalDate,
      originalTimeSlot: appointmentData.originalTimeSlot
    },
    sound: 'default',
    badge: 1,
    channelId: 'barber_notifications'
  };
}

/**
 * Test function to send a push notification immediately
 */
export async function testPushNotification(expoPushToken: string, message: string): Promise<PushNotificationResult> {
  const notification: PushNotificationData = {
    title: 'Test Notification',
    body: message,
    data: {
      type: 'test',
      timestamp: new Date().toISOString()
    },
    sound: 'default'
  };

  return await sendPushNotification(expoPushToken, notification);
}
