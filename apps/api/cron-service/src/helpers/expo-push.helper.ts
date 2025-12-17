import { Expo, ExpoPushMessage } from 'expo-server-sdk';
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

