import type { Context, Next } from 'hono';
import { generateCorrelationId, ContextLogger } from '../helpers/logger.js';

/**
 * Middleware to add correlation ID to requests for better request tracing
 */
export async function correlationMiddleware(c: Context, next: Next) {
  // Generate correlation ID for this request
  const correlationId = generateCorrelationId();
  
  // Store correlation ID in context
  c.set('correlationId', correlationId);
  
  // Create a context-aware logger for this request
  const contextLogger = new ContextLogger(correlationId);
  c.set('logger', contextLogger);
  
  // Add correlation ID to response headers for debugging
  c.header('X-Correlation-ID', correlationId);
  
  await next();
}

/**
 * Enhanced HTTP request logging middleware with correlation ID
 */
export async function requestLoggingMiddleware(c: Context, next: Next) {
  const start = Date.now();
  const correlationId = c.get('correlationId') || 'unknown';
  const logger = c.get('logger') as ContextLogger;
  
  // Log incoming request
  logger.http('Incoming request', {
    method: c.req.method,
    path: c.req.path,
    userAgent: c.req.header('User-Agent'),
    ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
    timestamp: new Date().toISOString()
  });
  
  await next();
  
  // Log response
  const duration = Date.now() - start;
  const status = c.res.status;
  
  logger.http('Request completed', {
    method: c.req.method,
    path: c.req.path,
    status,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  });
  
  // Log slow requests
  if (duration > 1000) {
    logger.warn('Slow request detected', {
      method: c.req.method,
      path: c.req.path,
      duration: `${duration}ms`
    });
  }
}