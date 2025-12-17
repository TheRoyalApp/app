import { getDatabase } from './db/connection.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { appointments, users, services } from './db/schema.js';
import { 
  sendPushNotification, 
  generateAppointmentReminderNotification 
} from './helpers/expo-push.helper.js';
import winstonLogger from './helpers/logger.js';
import { formatAppointmentDateTime } from './helpers/date.helper.js';

/**
 * Check for upcoming appointments and send reminders to both barbers and clients
 * This function should be called by a cron job every 15 minutes
 */
export async function checkAndSendReminders(): Promise<{
  success: boolean;
  remindersSent: number;
  errors: string[];
}> {
  try {
    const db = await getDatabase();
    const now = new Date();
    
    // Define the window we are looking for: 15 minutes from now
    // We'll check if the appointment time is between 14 and 16 minutes from now
    // to allow for slight cron delays/drifts.
    const targetTimeStart = new Date(now.getTime() + 14 * 60 * 1000);
    const targetTimeEnd = new Date(now.getTime() + 16 * 60 * 1000);

    winstonLogger.info('Checking for appointments in next 15 minutes', {
      now: now.toISOString(),
      targetWindowStart: targetTimeStart.toISOString(),
      targetWindowEnd: targetTimeEnd.toISOString()
    });

    // Strategy: 
    // 1. Fetch confirmed appointments where appointmentDate is roughly today (next 24h to be safe)
    // 2. In JS, combine appointmentDate + timeSlot to get the actual Date object
    // 3. Check if that Date is in our target window

    // Broad filter: appointmentDate >= Today - 1 day (to handle timezone overlaps)
    const broadStart = new Date(now);
    broadStart.setDate(broadStart.getDate() - 1);
    broadStart.setHours(0, 0, 0, 0);
    
    const broadEnd = new Date(now);
    broadEnd.setDate(broadEnd.getDate() + 2); // Look ahead a couple days just in case
    broadEnd.setHours(23, 59, 59, 999);

    const potentialAppointments = await db
      .select({
        id: appointments.id,
        userId: appointments.userId,
        barberId: appointments.barberId,
        serviceId: appointments.serviceId,
        appointmentDate: appointments.appointmentDate,
        timeSlot: appointments.timeSlot,
        status: appointments.status,
        
        // Customer details
        customerName: users.firstName,
        customerLastName: users.lastName,
        customerExpoPushToken: users.expoPushToken,
        customerPushNotificationsEnabled: users.pushNotificationsEnabled,
        
        // Service details
        serviceName: services.name
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.userId, users.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(
        and(
          eq(appointments.status, 'confirmed'),
          gte(appointments.appointmentDate, broadStart),
          lte(appointments.appointmentDate, broadEnd)
        )
      );

    const upcomingAppointments = potentialAppointments.filter(app => {
      // Parse timeSlot "HH:MM"
      const [hours, minutes] = app.timeSlot.split(':').map(Number);
      if (hours === undefined || minutes === undefined) return false;

      // Construct full appointment date
      // app.appointmentDate is assumed to be the date at midnight
      const appointmentDateTime = new Date(app.appointmentDate);
      appointmentDateTime.setHours(hours, minutes, 0, 0);

      // Check if it's in the window
      return appointmentDateTime >= targetTimeStart && appointmentDateTime <= targetTimeEnd;
    });

    winstonLogger.info(`Found ${upcomingAppointments.length} appointments for reminders (from ${potentialAppointments.length} candidates)`);

    let remindersSent = 0;
    const errors: string[] = [];

    // Process each appointment
    for (const appointment of upcomingAppointments) {
      try {
        // Fetch barber details
        const barberData = await db
          .select({
            firstName: users.firstName,
            lastName: users.lastName,
            expoPushToken: users.expoPushToken,
            pushNotificationsEnabled: users.pushNotificationsEnabled
          })
          .from(users)
          .where(eq(users.id, appointment.barberId))
          .limit(1);

        const barber = barberData[0];
        const barberName = barber ? `${barber.firstName} ${barber.lastName}`.trim() : 'Tu Barbero';
        const customerName = `${appointment.customerName} ${appointment.customerLastName}`.trim();

        const commonNotificationData = {
          serviceName: appointment.serviceName || 'Servicio',
          appointmentDate: formatAppointmentDateTime(appointment.appointmentDate, appointment.timeSlot),
          timeSlot: appointment.timeSlot,
          barberName,
          customerName
        };

        // 1. Send Client Notification
        if (
          appointment.customerExpoPushToken && 
          appointment.customerPushNotificationsEnabled
        ) {
          const clientNotification = generateAppointmentReminderNotification(commonNotificationData);
          
          const clientResult = await sendPushNotification(
            appointment.customerExpoPushToken, 
            clientNotification
          );

          if (clientResult.success) {
            remindersSent++;
            winstonLogger.info(`Client reminder sent for appointment ${appointment.id}`);
          } else {
            winstonLogger.warn(`Failed to send client reminder for appointment ${appointment.id}`, {
              error: clientResult.error
            });
          }
        } else {
          winstonLogger.debug(`Skipping client reminder for appointment ${appointment.id}: No token or disabled`);
        }

        // 2. Send Barber Notification
        if (
          barber && 
          barber.expoPushToken && 
          barber.pushNotificationsEnabled
        ) {
          const barberNotification = {
            title: '⏰ Próxima Cita',
            body: `Tienes una cita en 15 min con ${customerName} para ${appointment.serviceName || 'servicio'} a las ${appointment.timeSlot}.`,
            data: {
              type: 'barber_appointment_reminder',
              appointmentId: appointment.id,
              timeSlot: appointment.timeSlot
            },
            sound: 'default' as const
          };

          const barberResult = await sendPushNotification(
            barber.expoPushToken, 
            barberNotification
          );

          if (barberResult.success) {
            remindersSent++;
            winstonLogger.info(`Barber reminder sent for appointment ${appointment.id}`);
          } else {
            winstonLogger.warn(`Failed to send barber reminder for appointment ${appointment.id}`, {
              error: barberResult.error
            });
          }
        } else {
          winstonLogger.debug(`Skipping barber reminder for appointment ${appointment.id}: No token or disabled`);
        }

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Error processing appointment ${appointment.id}: ${errorMsg}`);
        winstonLogger.error(`Error processing reminder for appointment ${appointment.id}`, { error: errorMsg });
      }
    }

    return {
      success: true,
      remindersSent,
      errors
    };

  } catch (error) {
    winstonLogger.error('Error checking and sending reminders', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      success: false,
      remindersSent: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}
