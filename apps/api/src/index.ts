import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { timing } from 'hono/timing';
import { rateLimits } from './middleware/rate-limit.middleware.js';
import winstonLogger from './helpers/logger.js';
import { errorResponse } from './helpers/response.helper.js';
import { getDatabase } from './db/connection.js';
import cronService from './services/cron.service.js';
import { validateEnvironment, env } from './helpers/env.helper.js';
import { correlationMiddleware, requestLoggingMiddleware } from './middleware/logging.middleware.js';
import { handleError, HTTP_STATUS } from './helpers/error.helper.js';
import { ContextLogger } from './helpers/logger.js';

// Import routes
import authRoutes from './auth/auth.route.js';
import userRoutes from './users/users.route.js';
import serviceRoutes from './services/services.routes.js';
import scheduleRoutes from './schedules/schedules.routes.js';
import appointmentRoutes from './appoinments/appoinments.route.js';
import { paymentsRoute } from './payments/payments.route.js';
import notificationsRoute from './notifications/notifications.route.js';

const app = new Hono();

// Production middleware stack
app.use('*', timing()); // Request timing
app.use('*', secureHeaders()); // Security headers
app.use('*', correlationMiddleware); // Add correlation ID to requests
app.use('*', requestLoggingMiddleware); // Enhanced request logging

// CORS configuration for mobile app
app.use('*', cors({
  origin: (origin) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return true;
    
    const allowedOrigins = [
      // Development URLs
      'exp://localhost:8081',
      'exp://localhost:19000',
      'http://localhost:3000',
      'http://localhost:8081',
      // Production URLs
      'https://theroyalbarber.com',
      'https://api.theroyalbarber.com',
      'https://app.theroyalbarber.com'
    ];
    
    // Allow development patterns with specific IP ranges
    const devPatterns = [
      /^exp:\/\/192\.168\.\d+\.\d+:(?:8081|19000)$/,
      /^http:\/\/192\.168\.\d+\.\d+:8081$/,
      /^https:\/\/.*\.expo\.dev$/,
      /^https:\/\/.*\.exp\.direct$/
    ];
    
    // Check exact matches first
    if (allowedOrigins.includes(origin)) return true;
    
    // Check development patterns only in development
    if (env.isDevelopment()) {
      return devPatterns.some(pattern => pattern.test(origin));
    }
    
    return false;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Refresh-Token', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Global rate limiting
app.use('*', rateLimits.api);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API info endpoint
app.get('/', (c) => {
  return c.json({
    name: 'The Royal Barber API',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: '/docs',
    health: '/health'
  });
});

// Apply specific rate limits to routes
app.use('/auth/*', rateLimits.auth);
app.use('/appointments/*', rateLimits.appointments);

// Mount routes with authentication where needed
app.route('/auth', authRoutes);
app.route('/users', userRoutes);
app.route('/services', serviceRoutes);
app.route('/schedules', scheduleRoutes);
app.route('/appointments', appointmentRoutes);
app.route('/payments', paymentsRoute);
app.route('/notifications', notificationsRoute);

// Global error handler with enhanced logging and monitoring
app.onError((err, c) => {
  const logger = c.get('logger') as ContextLogger;
  const correlationId = c.get('correlationId');
  
  // Enhanced error logging with context
  logger?.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
    userAgent: c.req.header('User-Agent'),
    ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
    correlationId
  });

  // Use enhanced error handling
  const errorDetails = handleError(err, logger);
  
  return c.json({
    success: false,
    error: errorDetails.message,
    code: errorDetails.code,
    correlationId: errorDetails.correlationId,
    timestamp: errorDetails.timestamp,
    ...(errorDetails.details && { details: errorDetails.details })
  }, errorDetails.statusCode);
});

// 404 handler with enhanced logging
app.notFound((c) => {
  const logger = c.get('logger') as ContextLogger;
  const correlationId = c.get('correlationId');
  
  logger?.warn('404 - Route not found', {
    path: c.req.path,
    method: c.req.method,
    userAgent: c.req.header('User-Agent'),
    ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip')
  });
  
  return c.json({
    success: false,
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    correlationId,
    timestamp: new Date().toISOString(),
    details: {
      path: c.req.path,
      method: c.req.method,
      availableRoutes: [
        'GET /health',
        'POST /auth/signup',
        'POST /auth/signin',
        'GET /services',
        'POST /appointments',
        'GET /schedules'
      ]
    }
  }, HTTP_STATUS.NOT_FOUND);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  winstonLogger.info('SIGTERM received, shutting down gracefully');
  cronService.stopReminderJob();
  process.exit(0);
});

process.on('SIGINT', () => {
  winstonLogger.info('SIGINT received, shutting down gracefully');
  cronService.stopReminderJob();
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  winstonLogger.error('Unhandled Rejection at:', {
    promise,
    reason,
    stack: reason instanceof Error ? reason.stack : undefined
  });
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  winstonLogger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Database connection and server startup
const startServer = async () => {
  try {
    // Validate environment variables first
    validateEnvironment();
    winstonLogger.info('✅ Environment validation completed successfully');
    
    // Connect to database
    await getDatabase();
    winstonLogger.info('✅ Database connection established successfully');

    // Start the reminder cron job
    cronService.startReminderJob();
    winstonLogger.info('⏰ Reminder cron job started successfully');

    // Get port from validated environment
    const port = parseInt(env.PORT, 10);
    
    // Start server
    const server = Bun.serve({
      port,
      fetch: app.fetch,
      development: env.isDevelopment()
    });

    winstonLogger.info(`🚀 Server starting on port ${port}`);
    winstonLogger.info(`🔔 Stripe webhook listening on port ${port}`);
    winstonLogger.info(`📱 API ready for mobile app integration`);
    winstonLogger.info(`🔒 Production features enabled: Rate limiting, CORS, Validation, Logging`);
    winstonLogger.info(`⏰ Automated reminders enabled - checking every minute`);
    
    // Only log to console in development
    if (env.isDevelopment()) {
      console.log(`🚀 Server running at http://localhost:${port}`);
      console.log(`🔔 Stripe webhook endpoint: http://localhost:${port}/payments/webhook`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`📚 API info: http://localhost:${port}/`);
      console.log(`⏰ Reminder system: http://localhost:${port}/notifications/health`);
    }

  } catch (error) {
    winstonLogger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer(); 