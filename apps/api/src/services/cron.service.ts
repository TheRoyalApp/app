import * as cron from 'node-cron';
import { checkAndSendReminders } from '../notifications/notifications.controller.js';
import winstonLogger from '../helpers/logger.js';

class CronService {
  private reminderJob: cron.ScheduledTask | null = null;
  private isRunning = false;

  /**
   * Start the reminder cron job
   * Runs every minute to check for appointments in the next 15 minutes
   */
  startReminderJob(): void {
    if (this.isRunning) {
      winstonLogger.warn('Reminder cron job is already running');
      return;
    }

    // Schedule job to run every minute
    this.reminderJob = cron.schedule('* * * * *', async () => {
      try {
        winstonLogger.info('Running scheduled reminder check', {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development'
        });

        const result = await checkAndSendReminders();

        if (result.success) {
          winstonLogger.info('Scheduled reminder check completed successfully', {
            remindersSent: result.remindersSent,
            errors: result.errors.length,
            timestamp: new Date().toISOString()
          });
        } else {
          winstonLogger.error('Scheduled reminder check failed', {
            errors: result.errors,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        winstonLogger.error('Unexpected error in scheduled reminder job', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
      }
    }, {
      timezone: 'America/Mexico_City' // CDMX timezone
    });

    // Start the job
    this.reminderJob.start();
    this.isRunning = true;

    winstonLogger.info('Reminder cron job started successfully', {
      schedule: 'Every minute (* * * * *)',
      timezone: 'America/Mexico_City',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Stop the reminder cron job
   */
  stopReminderJob(): void {
    if (this.reminderJob) {
      this.reminderJob.stop();
      this.reminderJob.destroy();
      this.reminderJob = null;
      this.isRunning = false;

      winstonLogger.info('Reminder cron job stopped', {
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get the status of the reminder job
   */
  getStatus(): {
    isRunning: boolean;
    schedule: string;
    timezone: string;
  } {
    return {
      isRunning: this.isRunning,
      schedule: 'Every minute (* * * * *)',
      timezone: 'America/Mexico_City'
    };
  }

  /**
   * Manually trigger a reminder check
   */
  async triggerReminderCheck(): Promise<{
    success: boolean;
    remindersSent: number;
    errors: string[];
  }> {
    try {
      winstonLogger.info('Manually triggering reminder check', {
        timestamp: new Date().toISOString()
      });

      const result = await checkAndSendReminders();

      winstonLogger.info('Manual reminder check completed', {
        success: result.success,
        remindersSent: result.remindersSent,
        errors: result.errors.length,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      winstonLogger.error('Error in manual reminder check', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        remindersSent: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}

// Create singleton instance
const cronService = new CronService();

export default cronService; 