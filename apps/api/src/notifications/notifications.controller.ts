import { getDatabase } from "../db/connection.js";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { appointments, users, services, payments } from "../db/schema.js";
import { sendWhatsappReminder, generateConfirmationMessage, generateReminderMessage, generateBarberNotificationMessage } from "../helpers/whatsapp.helper.js";
import winstonLogger from "../helpers/logger.js";
import { successResponse, errorResponse } from '../helpers/response.helper.js';
import { formatAppointmentDateTime } from '../helpers/date.helper.js';

/**
 * Send confirmation message when appointment is confirmed
 */
export async function sendAppointmentConfirmation(appointmentId: string, db?: any): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const database = db || await getDatabase();

    // Get appointment with user and service details
    const appointmentData = await database
      .select({
        id: appointments.id,
        userId: appointments.userId,
        barberId: appointments.barberId,
        serviceId: appointments.serviceId,
        appointmentDate: appointments.appointmentDate,
        timeSlot: appointments.timeSlot,
        status: appointments.status,
        customerPhone: users.phone,
        customerName: users.firstName,
        customerLastName: users.lastName,
        barberName: users.firstName,
        barberLastName: users.lastName,
        serviceName: services.name
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.userId, users.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (appointmentData.length === 0) {
      return {
        success: false,
        error: 'Appointment not found'
      };
    }

    const appointment = appointmentData[0];
    
    if (!appointment) {
      return {
        success: false,
        error: 'Appointment not found'
      };
    }

    if (!appointment.customerPhone) {
      return {
        success: false,
        error: 'Customer phone number not found'
      };
    }

    // Generate confirmation message with proper date formatting
    const message = generateConfirmationMessage({
      customerName: appointment.customerName || 'Cliente',
      serviceName: appointment.serviceName || 'Servicio',
      appointmentDate: appointment.appointmentDate.toISOString(),
      timeSlot: appointment.timeSlot,
      barberName: appointment.barberName || 'Barbero'
    });

    // Send WhatsApp message
    const result = await sendWhatsappReminder(appointment.customerPhone, message);

    if (result.success) {
      winstonLogger.info('Appointment confirmation sent successfully', {
        appointmentId,
        messageId: result.messageId
      });
    }

    return result;

  } catch (error) {
    winstonLogger.error('Error sending appointment confirmation', {
      error: error instanceof Error ? error.message : 'Unknown error',
      appointmentId
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send reminder message 15 minutes before appointment
 */
export async function sendAppointmentReminder(appointmentId: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const db = await getDatabase();

    // Get appointment with user and service details
    const appointmentData = await db
      .select({
        id: appointments.id,
        userId: appointments.userId,
        barberId: appointments.barberId,
        serviceId: appointments.serviceId,
        appointmentDate: appointments.appointmentDate,
        timeSlot: appointments.timeSlot,
        status: appointments.status,
        customerPhone: users.phone,
        customerName: users.firstName,
        customerLastName: users.lastName,
        barberName: users.firstName,
        barberLastName: users.lastName,
        serviceName: services.name
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.userId, users.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (appointmentData.length === 0) {
      return {
        success: false,
        error: 'Appointment not found'
      };
    }

    const appointment = appointmentData[0];
    
    if (!appointment) {
      return {
        success: false,
        error: 'Appointment not found'
      };
    }

    if (!appointment.customerPhone) {
      return {
        success: false,
        error: 'Customer phone number not found'
      };
    }

    // Generate reminder message with proper date formatting
    const message = generateReminderMessage({
      customerName: appointment.customerName || 'Cliente',
      serviceName: appointment.serviceName || 'Servicio',
      appointmentDate: appointment.appointmentDate.toISOString(),
      timeSlot: appointment.timeSlot,
      barberName: appointment.barberName || 'Barbero'
    });

    // Send WhatsApp message
    const result = await sendWhatsappReminder(appointment.customerPhone, message);

    if (result.success) {
      winstonLogger.info('Appointment reminder sent successfully', {
        appointmentId,
        messageId: result.messageId
      });
    }

    return result;

  } catch (error) {
    winstonLogger.error('Error sending appointment reminder', {
      error: error instanceof Error ? error.message : 'Unknown error',
      appointmentId
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check for upcoming appointments and send reminders
 * This function should be called by a cron job every minute
 */
export async function checkAndSendReminders(): Promise<{
  success: boolean;
  remindersSent: number;
  errors: string[];
}> {
  try {
    const db = await getDatabase();
    const now = new Date();
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

    winstonLogger.info('Checking for appointments in next 15 minutes', {
      now: now.toISOString(),
      fifteenMinutesFromNow: fifteenMinutesFromNow.toISOString()
    });

    // Get appointments that are confirmed and scheduled in the next 15 minutes
    const upcomingAppointments = await db
      .select({
        id: appointments.id,
        userId: appointments.userId,
        barberId: appointments.barberId,
        serviceId: appointments.serviceId,
        appointmentDate: appointments.appointmentDate,
        timeSlot: appointments.timeSlot,
        status: appointments.status,
        customerPhone: users.phone,
        customerName: users.firstName,
        customerLastName: users.lastName,
        barberName: users.firstName,
        barberLastName: users.lastName,
        serviceName: services.name
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.userId, users.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(
        and(
          eq(appointments.status, 'confirmed'),
          gte(appointments.appointmentDate, now),
          lte(appointments.appointmentDate, fifteenMinutesFromNow)
        )
      );

    winstonLogger.info(`Found ${upcomingAppointments.length} appointments in next 15 minutes`);

    let remindersSent = 0;
    const errors: string[] = [];

    // Send reminders for each appointment
    for (const appointment of upcomingAppointments) {
      if (!appointment.customerPhone) {
        errors.push(`Appointment ${appointment.id}: No phone number found`);
        continue;
      }

      const result = await sendAppointmentReminder(appointment.id);
      
      if (result.success) {
        remindersSent++;
        winstonLogger.info(`Reminder sent for appointment ${appointment.id}`);
      } else {
        errors.push(`Appointment ${appointment.id}: ${result.error}`);
      }
    }

    winstonLogger.info('Reminder check completed', {
      totalAppointments: upcomingAppointments.length,
      remindersSent,
      errors: errors.length
    });

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

/**
 * Test function to send a WhatsApp message immediately
 */
export async function testWhatsAppMessage(phoneNumber: string, message: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    if (!phoneNumber.startsWith('+')) {
      return {
        success: false,
        error: 'Phone number must start with +'
      };
    }

    const result = await sendWhatsappReminder(phoneNumber, message);

    winstonLogger.info('Test WhatsApp message result', {
      success: result.success,
      messageId: result.messageId,
      error: result.error
    });

    return result;

  } catch (error) {
    winstonLogger.error('Error sending test WhatsApp message', {
      error: error instanceof Error ? error.message : 'Unknown error',
      phoneNumber
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 

/**
 * Send barber notification when appointment is booked
 */
export async function sendBarberNotification(appointmentId: string, db?: any): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const database = db || await getDatabase();

    // Get appointment with user and service details
    const appointmentData = await database
      .select({
        id: appointments.id,
        userId: appointments.userId,
        barberId: appointments.barberId,
        serviceId: appointments.serviceId,
        appointmentDate: appointments.appointmentDate,
        timeSlot: appointments.timeSlot,
        status: appointments.status,
        customerPhone: users.phone,
        customerName: users.firstName,
        customerLastName: users.lastName,
        barberPhone: users.phone,
        barberName: users.firstName,
        barberLastName: users.lastName,
        serviceName: services.name,
        paymentAmount: payments.amount
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.userId, users.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .leftJoin(payments, eq(appointments.id, payments.appointmentId))
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (appointmentData.length === 0) {
      return {
        success: false,
        error: 'Appointment not found'
      };
    }

    const appointment = appointmentData[0];
    
    if (!appointment) {
      return {
        success: false,
        error: 'Appointment not found'
      };
    }

    // Get barber information
    const barberData = await database
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone
      })
      .from(users)
      .where(eq(users.id, appointment.barberId))
      .limit(1);

    if (barberData.length === 0 || !barberData[0].phone) {
      return {
        success: false,
        error: 'Barber not found or no phone number available'
      };
    }

    const barber = barberData[0];

    // Generate barber notification message
    const message = generateBarberNotificationMessage({
      customerName: appointment.customerName || 'Cliente',
      customerLastName: appointment.customerLastName || '',
      serviceName: appointment.serviceName || 'Servicio',
      appointmentDate: appointment.appointmentDate.toISOString(),
      timeSlot: appointment.timeSlot,
      customerPhone: appointment.customerPhone || 'N/A',
      paymentAmount: appointment.paymentAmount || 'N/A'
    });

    // Send WhatsApp message to barber
    const result = await sendWhatsappReminder(barber.phone, message);

    if (result.success) {
      winstonLogger.info('Barber notification sent successfully', {
        appointmentId,
        barberId: barber.id,
        barberPhone: barber.phone,
        messageId: result.messageId
      });
    }

    return result;

  } catch (error) {
    winstonLogger.error('Error sending barber notification', {
      error: error instanceof Error ? error.message : 'Unknown error',
      appointmentId
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 