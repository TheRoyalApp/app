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
      
      if (pushTicket.status === 'ok') {
        winstonLogger.info('Push notification sent successfully', {
          ticketId: pushTicket.id,
          to: expoPushToken
        });
        
        return {
          success: true,
          messageId: pushTicket.id,
          ticketId: pushTicket.id
        };
      } else {
        const error = `Push notification failed: ${pushTicket.message || 'Unknown error'}`;
        winstonLogger.error('Push notification failed', {
          error,
          to: expoPushToken,
          ticketId: pushTicket.id
        });
        
        return {
          success: false,
          error,
          ticketId: pushTicket.id
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
      
      if (ticket.status === 'ok') {
        results.push({
          success: true,
          messageId: ticket.id,
          ticketId: ticket.id
        });
        totalSent++;
      } else {
        const error = `Push notification failed: ${ticket.message || 'Unknown error'}`;
        results.push({
          success: false,
          error,
          ticketId: ticket.id
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
    body: `Tu cita para ${appointmentData.serviceName} está confirmada para ${appointmentData.appointmentDate} a las ${appointmentData.timeSlot} con ${appointmentData.barberName}. ¡Te esperamos!`,
    data: {
      type: 'appointment_confirmation',
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

