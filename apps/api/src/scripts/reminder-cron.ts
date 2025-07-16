#!/usr/bin/env bun

import { checkAndSendReminders } from '../notifications/notifications.controller.js';
import winstonLogger from '../helpers/logger.js';

async function runReminderCheck() {
  try {
    winstonLogger.info('Starting reminder check cron job', {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });

    const result = await checkAndSendReminders();

    if (result.success) {
      winstonLogger.info('Reminder check completed successfully', {
        remindersSent: result.remindersSent,
        errors: result.errors.length,
        timestamp: new Date().toISOString()
      });

      // Exit with success code
      process.exit(0);
    } else {
      winstonLogger.error('Reminder check failed', {
        errors: result.errors,
        timestamp: new Date().toISOString()
      });

      // Exit with error code
      process.exit(1);
    }

  } catch (error) {
    winstonLogger.error('Unexpected error in reminder cron job', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    // Exit with error code
    process.exit(1);
  }
}

// Run the reminder check
runReminderCheck(); 