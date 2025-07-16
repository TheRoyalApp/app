import { getDatabase } from "../db/connection.js";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { appointments, users, services } from "../db/schema.js";
import { sendWhatsappReminder, generateConfirmationMessage, generateReminderMessage } from "../helpers/whatsapp.helper.js";
import winstonLogger from "../helpers/logger.js";
import { successResponse, errorResponse } from '../helpers/response.helper.js';

/**
 * Send confirmation message when appointment is confirmed
 */
export async function sendAppointmentConfirmation(appointmentId: string): Promise<{
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

    // Format date for display
    const appointmentDate = new Date(appointment.appointmentDate);
    const formattedDate = appointmentDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Generate confirmation message
    const message = generateConfirmationMessage({
      customerName: appointment.customerName || 'Cliente',
      serviceName: appointment.serviceName || 'Servicio',
      appointmentDate: formattedDate,
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

    // Generate reminder message
    const message = generateReminderMessage({
      customerName: appointment.customerName || 'Cliente',
      serviceName: appointment.serviceName || 'Servicio',
      appointmentDate: new Date(appointment.appointmentDate).toLocaleDateString('es-ES'),
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