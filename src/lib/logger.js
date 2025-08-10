/**
 * Logger utility for Threadly application
 * 
 * This utility provides logging functions that can be disabled in production
 * to prevent sensitive information from being logged to the console.
 */

// Set to false to disable all logging in production
const LOGGING_ENABLED = process.env.NODE_ENV === 'development';

// Set to true to show minimal logs even in production (for critical errors only)
const ENABLE_CRITICAL_LOGS = true;

/**
 * Safe logging function that only logs in development mode
 * @param {string} message - The message to log
 * @param  {...any} args - Additional arguments to log
 */
export const log = (message, ...args) => {
  if (LOGGING_ENABLED) {
    console.log(message, ...args);
  }
};

/**
 * Log error messages - these will show even in production for critical errors
 * @param {string} message - The error message to log
 * @param  {...any} args - Additional arguments to log
 */
export const error = (message, ...args) => {
  if (LOGGING_ENABLED || ENABLE_CRITICAL_LOGS) {
    console.error(message, ...args);
  }
};

/**
 * Log warning messages - only shown in development
 * @param {string} message - The warning message to log
 * @param  {...any} args - Additional arguments to log
 */
export const warn = (message, ...args) => {
  if (LOGGING_ENABLED) {
    console.warn(message, ...args);
  }
};

/**
 * Log info messages - only shown in development
 * @param {string} message - The info message to log
 * @param  {...any} args - Additional arguments to log
 */
export const info = (message, ...args) => {
  if (LOGGING_ENABLED) {
    console.info(message, ...args);
  }
};

export default {
  log,
  error,
  warn,
  info
};
