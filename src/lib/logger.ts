/**
 * Logger Utility
 * Simple logging wrapper for development
 * Disabled by default to reduce console noise
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG === 'true';

// Only log if explicitly enabled
const shouldLog = isDevelopment && isDebugEnabled;

export const logger = {
  info: (message: string, ...args: any[]) => {
    if (shouldLog) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: any[]) => {
    if (shouldLog) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  },

  error: (message: string, ...args: any[]) => {
    // Always log errors
    console.error(`❌ ${message}`, ...args);
  },

  log: (message: string, ...args: any[]) => {
    if (shouldLog) {
      console.log(message, ...args);
    }
  },

  debug: (message: string, ...args: any[]) => {
    if (shouldLog) {
      console.debug(`🐛 ${message}`, ...args);
    }
  },
};