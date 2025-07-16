import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { timing } from 'hono/timing';
import { rateLimits } from './middleware/rate-limit.middleware.js';
import winstonLogger from './helpers/logger.js';
import { errorResponse } from './helpers/response.helper.js';
import { getDatabase } from './db/connection.js';

// Import routes
import authRoutes from './auth/auth.route.js';
import userRoutes from './users/users.route.js';
import serviceRoutes from './services/services.routes.js';
import scheduleRoutes from './schedules/schedules.routes.js';
import appointmentRoutes from './appoinments/appoinments.route.js';
import { paymentsRoute } from './payments/payments.route.js';

const app = new Hono();

// Production middleware stack
app.use('*', timing()); // Request timing
app.use('*', secureHeaders()); // Security headers
app.use('*', logger((str) => winstonLogger.http(str))); // HTTP request logging

// CORS configuration for mobile app
app.use('*', cors({
  origin: [
    'exp://localhost:8081',
    'exp://localhost:19000',
    'exp://192.168.1.*:8081',
    'exp://192.168.1.*:19000',
    'exp://192.168.1.198:8081',
    'exp://192.168.1.198:19000',
    'http://localhost:3000',
    'http://localhost:8081',
    'http://192.168.1.198:8081'
  ],
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

// Global error handler
app.onError((err, c) => {
  winstonLogger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
    userAgent: c.req.header('User-Agent'),
    ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip')
  });

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const message = isDevelopment ? err.message : 'Internal server error';
  const details = isDevelopment ? { stack: err.stack } : undefined;

  return c.json(errorResponse(500, message, details), 500);
});

// 404 handler
app.notFound((c) => {
  winstonLogger.warn('Route not found', {
    path: c.req.path,
    method: c.req.method,
    userAgent: c.req.header('User-Agent'),
    ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip')
  });

  return c.json(errorResponse(404, 'Route not found'), 404);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  winstonLogger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  winstonLogger.info('SIGINT received, shutting down gracefully');
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
    // Connect to database
    await getDatabase();
    winstonLogger.info('✅ Database connection established successfully');

    // Get port from environment or default
    const port = parseInt(process.env.PORT || '8080', 10);
    
    // Start server
    const server = Bun.serve({
      port,
      fetch: app.fetch,
      development: process.env.NODE_ENV !== 'production'
    });

    winstonLogger.info(`🚀 Server starting on port ${port}`);
    winstonLogger.info(`📱 API ready for mobile app integration`);
    winstonLogger.info(`🔒 Production features enabled: Rate limiting, CORS, Validation, Logging`);
    
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`📚 API info: http://localhost:${port}/`);

  } catch (error) {
    winstonLogger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer(); 