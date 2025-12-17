import winston from 'winston';
import crypto from 'crypto';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development' || env === 'DEV' || env === 'DEVELOPMENT';
  return isDevelopment ? 'debug' : 'info';
};

// Generate correlation ID for request tracking
export const generateCorrelationId = (): string => {
  return crypto.randomUUID();
};

// Define format for development logs (human readable)
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => {
      const correlationId = info.correlationId ? `[${info.correlationId.slice(0, 8)}]` : '';
      const metaString = info.meta && Object.keys(info.meta).length > 0 
        ? ` | ${JSON.stringify(info.meta)}`
        : '';
      return `${info.timestamp} ${info.level} ${correlationId}: ${info.message}${metaString}`;
    },
  ),
);

// Define format for production logs (structured JSON)
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const logEntry: any = {
      timestamp: info.timestamp,
      level: info.level,
      message: info.message,
      correlationId: info.correlationId,
      service: 'royal-barber-cron',
      environment: process.env.NODE_ENV || 'development',
      ...info.meta
    };
    
    // Add stack trace for errors
    if (info.stack) {
      logEntry.stack = info.stack;
    }
    
    return JSON.stringify(logEntry);
  })
);

// Choose format based on environment
const isDevelopment = (process.env.NODE_ENV === 'development' || 
                      process.env.NODE_ENV === 'DEV' || 
                      process.env.NODE_ENV === 'DEVELOPMENT');
const format = isDevelopment ? developmentFormat : productionFormat;

// Define transports based on environment
const transports: winston.transport[] = [
  // Console transport (always enabled)
  new winston.transports.Console(),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

// Export logger instance
export default logger;

// Helper functions for different log types with correlation ID support
export const logError = (message: string, error?: any, correlationId?: string) => {
  const meta = error ? { error: error.message, stack: error.stack } : {};
  logger.error(message, { meta, correlationId });
};

export const logWarn = (message: string, data?: any, correlationId?: string) => {
  logger.warn(message, { meta: data || {}, correlationId });
};

export const logInfo = (message: string, data?: any, correlationId?: string) => {
  logger.info(message, { meta: data || {}, correlationId });
};

export const logHttp = (message: string, data?: any, correlationId?: string) => {
  logger.http(message, { meta: data || {}, correlationId });
};

export const logDebug = (message: string, data?: any, correlationId?: string) => {
  logger.debug(message, { meta: data || {}, correlationId });
};

