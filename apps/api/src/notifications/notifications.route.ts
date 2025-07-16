import { Hono } from 'hono';
import { sendAppointmentConfirmation, sendAppointmentReminder, checkAndSendReminders, testWhatsAppMessage } from './notifications.controller.js';
import { successResponse, errorResponse } from '../helpers/response.helper.js';
import { testWhatsAppConnection } from '../helpers/whatsapp.helper.js';
import { formatPhoneForTwilio } from '../helpers/phone.helper.js';

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

// Health check for notifications system
notificationsRoute.get('/health', async (c) => {
  try {
    const connectionTest = await testWhatsAppConnection();
    
    return c.json(successResponse(200, {
      service: 'WhatsApp Notifications',
      status: connectionTest.success ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      twilioConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER)
    }));
  } catch (error) {
    return c.json(errorResponse(500, 'Health check failed', error), 500);
  }
});

export default notificationsRoute; 