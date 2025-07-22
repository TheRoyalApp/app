import { Hono } from 'hono';
import { sendAppointmentConfirmation, sendAppointmentReminder, checkAndSendReminders, testWhatsAppMessage, sendBarberNotification } from './notifications.controller.js';
import { sendWhatsappReminder } from '../helpers/whatsapp.helper.js';
import { successResponse, errorResponse } from '../helpers/response.helper.js';
import { testWhatsAppConnection } from '../helpers/whatsapp.helper.js';
import { formatPhoneForTwilio } from '../helpers/phone.helper.js';
import cronService from '../services/cron.service.js';
import { getDatabase } from '../db/connection.js';
import { appointments, users, services } from '../db/schema.js';

const notificationsRoute = new Hono();

// Test WhatsApp connection
notificationsRoute.get('/test-connection', async (c) => {
  try {
    const result = await testWhatsAppConnection();
    
    if (result.success) {
      return c.json(successResponse(200, {
        message: 'WhatsApp connection successful',
        details: 'Twilio credentials are valid and connection is working'
      }));
    } else {
      return c.json(errorResponse(500, 'WhatsApp connection failed', result.error), 500);
    }
  } catch (error) {
    return c.json(errorResponse(500, 'Internal server error', error), 500);
  }
});

// Test sending a WhatsApp message immediately
notificationsRoute.post('/test-message', async (c) => {
  try {
    const body = await c.req.json();
    const { phoneNumber, message } = body;
    
    // Basic validation
    if (!phoneNumber || !message) {
      return c.json(errorResponse(400, 'Missing phoneNumber or message'), 400);
    }
    
    // Format phone number for Twilio compatibility
    const phoneResult = formatPhoneForTwilio(phoneNumber);
    if (!phoneResult.isValid) {
      return c.json(errorResponse(400, phoneResult.error || 'Invalid phone number format'), 400);
    }
    
    const result = await testWhatsAppMessage(phoneResult.formatted, message);
    
    if (result.success) {
      return c.json(successResponse(200, {
        message: 'Test message sent successfully',
        messageId: result.messageId,
        phoneNumber: phoneResult.formatted,
        originalPhone: phoneNumber
      }));
    } else {
      return c.json(errorResponse(400, 'Failed to send test message', result.error), 400);
    }
  } catch (error) {
    return c.json(errorResponse(500, 'Internal server error', error), 500);
  }
});

// Test confirmation message format
notificationsRoute.post('/test-confirmation-format', async (c) => {
  try {
    // Test the confirmation message with sample data
    const testMessage = `¡Hola Test Customer! 🎉

Tu cita ha sido confirmada exitosamente.

📅 *Detalles de tu cita:*
• Servicio: Classic Haircut
• Fecha y Hora: 25 de enero de 2025 a las 10:00 AM
• Barber: Carlos Rodriguez

📍 *Ubicación:* The Royal Barber

⏰ Te recordaremos 15 minutos antes de tu cita.

¡Gracias por elegirnos! ✂️✨

_The Royal Barber_
_WhatsApp: +1234567890`;

    return c.json(successResponse(200, {
      message: 'Confirmation message format test',
      testMessage: testMessage
    }));
  } catch (error) {
    return c.json(errorResponse(500, 'Internal server error', error), 500);
  }
});

// Send confirmation message for a specific appointment
notificationsRoute.post('/confirm/:appointmentId', async (c) => {
  try {
    const appointmentId = c.req.param('appointmentId');
    
    if (!appointmentId) {
      return c.json(errorResponse(400, 'Missing appointment ID'), 400);
    }
    
    const result = await sendAppointmentConfirmation(appointmentId);
    
    if (result.success) {
      return c.json(successResponse(200, {
        message: 'Confirmation message sent successfully',
        messageId: result.messageId,
        appointmentId
      }));
    } else {
      return c.json(errorResponse(400, 'Failed to send confirmation message', result.error), 400);
    }
  } catch (error) {
    return c.json(errorResponse(500, 'Internal server error', error), 500);
  }
});

// Send reminder message for a specific appointment
notificationsRoute.post('/remind/:appointmentId', async (c) => {
  try {
    const appointmentId = c.req.param('appointmentId');
    
    if (!appointmentId) {
      return c.json(errorResponse(400, 'Missing appointment ID'), 400);
    }
    
    const result = await sendAppointmentReminder(appointmentId);
    
    if (result.success) {
      return c.json(successResponse(200, {
        message: 'Reminder message sent successfully',
        messageId: result.messageId,
        appointmentId
      }));
    } else {
      return c.json(errorResponse(400, 'Failed to send reminder message', result.error), 400);
    }
  } catch (error) {
    return c.json(errorResponse(500, 'Internal server error', error), 500);
  }
});

// Check and send reminders for all upcoming appointments (cron job endpoint)
notificationsRoute.post('/check-reminders', async (c) => {
  try {
    const result = await checkAndSendReminders();
    
    if (result.success) {
      return c.json(successResponse(200, {
        message: 'Reminder check completed',
        remindersSent: result.remindersSent,
        errors: result.errors,
        timestamp: new Date().toISOString()
      }));
    } else {
      return c.json(errorResponse(500, 'Failed to check reminders', result.errors), 500);
    }
  } catch (error) {
    return c.json(errorResponse(500, 'Internal server error', error), 500);
  }
});

// Send barber notification for a specific appointment
notificationsRoute.post('/barber/:appointmentId', async (c) => {
  try {
    const appointmentId = c.req.param('appointmentId');
    
    if (!appointmentId) {
      return c.json(errorResponse(400, 'Missing appointment ID'), 400);
    }
    
    const result = await sendBarberNotification(appointmentId);
    
    if (result.success) {
      return c.json(successResponse(200, {
        message: 'Barber notification sent successfully',
        messageId: result.messageId,
        appointmentId
      }));
    } else {
      return c.json(errorResponse(400, 'Failed to send barber notification', result.error), 400);
    }
  } catch (error) {
    return c.json(errorResponse(500, 'Internal server error', error), 500);
  }
});

// Test barber notification with mock data
notificationsRoute.post('/barber-test', async (c) => {
  try {
    const db = await getDatabase();
    
    // Create test user (customer) first
    const testUser = await db.insert(users).values({
      email: 'test@example.com',
      password: 'test',
      firstName: 'Test',
      lastName: 'Customer',
      phone: '+1234567890'
    }).returning().catch(() => []); // Ignore if user already exists

    // Create test barber
    const testBarber = await db.insert(users).values({
      email: 'barber@example.com',
      password: 'test',
      firstName: 'Carlos',
      lastName: 'Rodriguez',
      phone: '+1234567890',
      role: 'staff'
    }).returning().catch(() => []); // Ignore if barber already exists

    // Create test service
    const testService = await db.insert(services).values({
      name: 'Classic Haircut',
      description: 'Test service',
      price: '25.00',
      duration: 30,
      isActive: true
    }).returning().catch(() => []); // Ignore if service already exists

    // Get the created IDs
    const userId = testUser[0]?.id || '00000000-0000-0000-0000-000000000001';
    const barberId = testBarber[0]?.id || '00000000-0000-0000-0000-000000000002';
    const serviceId = testService[0]?.id || '00000000-0000-0000-0000-000000000003';

    // Create a test appointment with mock data
    const testAppointment = await db.insert(appointments).values({
      userId: userId,
      barberId: barberId,
      serviceId: serviceId,
      appointmentDate: new Date('2025-01-25'),
      timeSlot: '10:00',
      status: 'confirmed',
      notes: 'Test appointment for barber notification'
    }).returning();

    if (!testAppointment[0]) {
      return c.json(errorResponse(500, 'Failed to create test appointment'), 500);
    }

    // Test the barber notification
    const result = await sendBarberNotification(testAppointment[0].id);
    
    if (result.success) {
      return c.json(successResponse(200, {
        message: 'Barber notification test completed successfully',
        messageId: result.messageId,
        appointmentId: testAppointment[0].id
      }));
    } else {
      return c.json(errorResponse(400, 'Failed to send barber notification', result.error), 400);
    }
  } catch (error) {
    return c.json(errorResponse(500, 'Internal server error', error), 500);
  }
});

// Simple test barber notification with hardcoded data
notificationsRoute.post('/barber-simple-test', async (c) => {
  try {
    // Test the barber notification with a simple message
    const testMessage = `🎉 *Nueva Cita Reservada*

¡Hola! Se ha reservado una nueva cita.

👤 *Cliente:* Test Customer
📞 *Teléfono:* +1234567890
✂️ *Servicio:* Classic Haircut
📅 *Fecha y Hora:* 25 de enero de 2025 a las 10:00 AM
💰 *Pago:* $25.00 MXN

¡Prepárate para dar un excelente servicio! ✂️✨

_The Royal Barber_`;

    // Send test message directly
    const result = await sendWhatsappReminder('+1234567890', testMessage);
    
    if (result.success) {
      return c.json(successResponse(200, {
        message: 'Barber notification test completed successfully',
        messageId: result.messageId,
        testMessage: testMessage
      }));
    } else {
      return c.json(errorResponse(400, 'Failed to send barber notification', result.error), 400);
    }
  } catch (error) {
    return c.json(errorResponse(500, 'Internal server error', error), 500);
  }
});

// Test barber notification with no payment amount (should use service price)
notificationsRoute.post('/barber-test-no-payment', async (c) => {
  try {
    const db = await getDatabase();
    
    // Create test service first
    const testService = await db.insert(services).values({
      name: 'Premium Haircut',
      description: 'Test service without payment',
      price: '35.00',
      duration: 45,
      isActive: true
    }).returning().catch(() => []); // Ignore if service already exists

    // Create test user (customer)
    const testUser = await db.insert(users).values({
      email: 'test2@example.com',
      password: 'test',
      firstName: 'Test',
      lastName: 'Customer2',
      phone: '+1234567890'
    }).returning().catch(() => []); // Ignore if user already exists

    // Create test barber
    const testBarber = await db.insert(users).values({
      email: 'barber2@example.com',
      password: 'test',
      firstName: 'Miguel',
      lastName: 'Garcia',
      phone: '+1234567890',
      role: 'staff'
    }).returning().catch(() => []); // Ignore if barber already exists

    // Get the created IDs
    const userId = testUser[0]?.id || '00000000-0000-0000-0000-000000000004';
    const barberId = testBarber[0]?.id || '00000000-0000-0000-0000-000000000005';
    const serviceId = testService[0]?.id || '00000000-0000-0000-0000-000000000006';

    // Create a test appointment WITHOUT payment (to test fallback to service price)
    const testAppointment = await db.insert(appointments).values({
      userId: userId,
      barberId: barberId,
      serviceId: serviceId,
      appointmentDate: new Date('2025-01-26'),
      timeSlot: '11:00',
      status: 'confirmed',
      notes: 'Test appointment without payment'
    }).returning();

    if (!testAppointment[0]) {
      return c.json(errorResponse(500, 'Failed to create test appointment'), 500);
    }

    // Test the barber notification (should use service price as fallback)
    const result = await sendBarberNotification(testAppointment[0].id);
    
    if (result.success) {
      return c.json(successResponse(200, {
        message: 'Barber notification test completed successfully (no payment, using service price)',
        messageId: result.messageId,
        appointmentId: testAppointment[0].id
      }));
    } else {
      return c.json(errorResponse(400, 'Failed to send barber notification', result.error), 400);
    }
  } catch (error) {
    return c.json(errorResponse(500, 'Internal server error', error), 500);
  }
});

// Health check for notifications system
notificationsRoute.get('/health', async (c) => {
  try {
    const connectionTest = await testWhatsAppConnection();
    const cronStatus = cronService.getStatus();
    
    return c.json(successResponse(200, {
      service: 'WhatsApp Notifications',
      status: connectionTest.success ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      twilioConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER),
      cronJob: {
        isRunning: cronStatus.isRunning,
        schedule: cronStatus.schedule,
        timezone: cronStatus.timezone
      }
    }));
  } catch (error) {
    return c.json(errorResponse(500, 'Health check failed', error), 500);
  }
});

// Get cron service status
notificationsRoute.get('/cron/status', async (c) => {
  try {
    const status = cronService.getStatus();
    
    return c.json(successResponse(200, {
      message: 'Cron service status retrieved successfully',
      status,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    return c.json(errorResponse(500, 'Failed to get cron status', error), 500);
  }
});

// Manually trigger reminder check
notificationsRoute.post('/cron/trigger', async (c) => {
  try {
    const result = await cronService.triggerReminderCheck();
    
    return c.json(successResponse(200, {
      message: 'Manual reminder check triggered successfully',
      result,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    return c.json(errorResponse(500, 'Failed to trigger reminder check', error), 500);
  }
});

export default notificationsRoute; 