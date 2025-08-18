import type { Context, Next } from 'hono';
import { errorResponse } from '../helpers/response.helper.js';
import logger from '../helpers/logger.js';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  message?: string;
  keyGenerator?: (c: Context) => string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting
const rateLimitStore: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    const entry = rateLimitStore[key];
    if (entry && entry.resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 5 * 60 * 1000);

export function createRateLimit(config: RateLimitConfig) {
  return async (c: Context, next: Next) => {
    const key = config.keyGenerator ? config.keyGenerator(c) : c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const now = Date.now();
    
    // Get or create rate limit entry
    if (!rateLimitStore[key]) {
      rateLimitStore[key] = {
        count: 0,
        resetTime: now + config.windowMs
      };
    }
    
    const entry = rateLimitStore[key];
    
    // Reset if window has passed
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + config.windowMs;
    }
    
    // Check if limit exceeded
    if (entry.count >= config.max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      
      logger.warn(`Rate limit exceeded for ${key}`, {
        ip: key,
        path: c.req.path,
        method: c.req.method,
        limit: config.max,
        windowMs: config.windowMs,
        retryAfter,
        userAgent: c.req.header('User-Agent'),
        referer: c.req.header('Referer'),
        currentCount: entry.count,
        resetTime: new Date(entry.resetTime).toISOString()
      });
      
      return c.json(errorResponse(429, config.message || 'Too many requests', {
        retryAfter,
        limit: config.max,
        remaining: 0,
        resetTime: new Date(entry.resetTime).toISOString()
      }), 429);
    }
    
    // Increment counter
    entry.count++;
    
    // Add rate limit headers
    c.header('X-RateLimit-Limit', config.max.toString());
    c.header('X-RateLimit-Remaining', (config.max - entry.count).toString());
    c.header('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());
    
    await next();
  };
}

// Define rateLimits as let so we can assign based on environment
let rateLimits: any;

if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev') {
  rateLimits = {
    api: (c: any, next: any) => next(),
    auth: (c: any, next: any) => next(),
    appointments: (c: any, next: any) => next(),
  };
} else {
  // Predefined rate limit configurations - Very flexible for high user interaction
  rateLimits = {
    // Generous limits for authentication endpoints - allow multiple login attempts
    auth: createRateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 300, // 300 requests per minute - permitir múltiples intentos de auth
      message: 'Too many authentication attempts, please try again later'
    }),
    // Very high limits for general API endpoints - app requires lots of interaction
    api: createRateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 5000, // 5000 requests per minute - extremely generous for user interactions
      message: 'Too many requests, please slow down'
    }),
    // Extremely high limits for authenticated users - they need maximum flexibility
    authenticated: createRateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 10000, // 10000 requests per minute para usuarios autenticados
      message: 'Too many requests, please slow down',
      keyGenerator: (c: any) => {
        // Use user ID if authenticated, otherwise use IP
        const user = c.get('user');
        return user ? `user:${user.id}` : (c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown');
      }
    }),
    // Extremely flexible limits for appointment booking - critical user flow
    appointments: createRateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 2000, // 2000 appointment requests per minute - allows heavy exploration
      message: 'Too many appointment requests, please slow down',
      keyGenerator: (c: any) => {
        const user = c.get('user');
        return user ? `appointments:${user.id}` : (c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown');
      }
    }),
    // High limits for admin endpoints
    admin: createRateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 2000, // 2000 requests per minute para admin - very high
      message: 'Too many admin requests, please slow down',
      keyGenerator: (c: any) => {
        const user = c.get('user');
        return user ? `admin:${user.id}` : (c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown');
      }
    })
  };
}

export { rateLimits }; 