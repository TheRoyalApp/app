import type { Context, Next } from 'hono';
import { z } from 'zod';
import { errorResponse } from '../helpers/response.helper.js';
import logger from '../helpers/logger.js';

export function validateBody(schema: z.ZodSchema) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const validatedData = schema.parse(body);
      
      // Store validated data in context for controllers to use
      c.set('validatedBody', validatedData);
      
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        logger.warn('Validation error', {
          path: c.req.path,
          method: c.req.method,
          errors: errorMessages
        });
        
        return c.json(errorResponse(400, 'Validation failed', {
          errors: errorMessages
        }), 400);
      }
      
      logger.error('Unexpected validation error', error);
      return c.json(errorResponse(400, 'Invalid request body'), 400);
    }
  };
}

export function validateQuery(schema: z.ZodSchema) {
  return async (c: Context, next: Next) => {
    try {
      const query = c.req.query();
      const validatedData = schema.parse(query);
      
      // Store validated data in context
      c.set('validatedQuery', validatedData);
      
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        logger.warn('Query validation error', {
          path: c.req.path,
          method: c.req.method,
          errors: errorMessages
        });
        
        return c.json(errorResponse(400, 'Invalid query parameters', {
          errors: errorMessages
        }), 400);
      }
      
      logger.error('Unexpected query validation error', error);
      return c.json(errorResponse(400, 'Invalid query parameters'), 400);
    }
  };
}

export function validateParams(schema: z.ZodSchema) {
  return async (c: Context, next: Next) => {
    try {
      const params = c.req.param();
      const validatedData = schema.parse(params);
      
      // Store validated data in context
      c.set('validatedParams', validatedData);
      
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        logger.warn('Parameter validation error', {
          path: c.req.path,
          method: c.req.method,
          errors: errorMessages
        });
        
        return c.json(errorResponse(400, 'Invalid URL parameters', {
          errors: errorMessages
        }), 400);
      }
      
      logger.error('Unexpected parameter validation error', error);
      return c.json(errorResponse(400, 'Invalid URL parameters'), 400);
    }
  };
}

// Helper function to get validated data from context
export function getValidatedBody<T>(c: Context): T {
  return c.get('validatedBody') as T;
}

export function getValidatedQuery<T>(c: Context): T {
  return c.get('validatedQuery') as T;
}

export function getValidatedParams<T>(c: Context): T {
  return c.get('validatedParams') as T;
} 