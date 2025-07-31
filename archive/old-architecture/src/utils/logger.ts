/**
 * Centralized logging utility for PromptShield
 * Provides consistent logging patterns and levels across the application
 * Uses chalk for error/warn/success only, like ESLint/Snyk
 */

import chalk from 'chalk';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LoggerOptions {
  level?: LogLevel;
  enableColors?: boolean;
  enableTimestamps?: boolean;
}

/**
 * Logger class for consistent logging across the application
 */
export class Logger {
  private level: LogLevel;
  private enableColors: boolean;
  private enableTimestamps: boolean;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? LogLevel.INFO;
    this.enableColors = options.enableColors ?? true;
    this.enableTimestamps = options.enableTimestamps ?? false;
  }

  private formatMessage(level: string, message: string): string {
    let formatted = message;

    if (this.enableTimestamps) {
      const timestamp = new Date().toISOString();
      formatted = `[${timestamp}] ${formatted}`;
    }

    if (this.enableColors) {
      switch (level) {
        case 'ERROR':
          formatted = chalk.red(formatted);
          break;
        case 'WARN':
          formatted = chalk.yellow(formatted);
          break;
        case 'SUCCESS':
          formatted = chalk.green(formatted);
          break;
        case 'INFO':
        case 'DEBUG':
        default:
          // No color for regular info/debug messages
          break;
      }
    }

    return formatted;
  }

  error(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.INFO) {
      console.log(this.formatMessage('INFO', message), ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.DEBUG) {
      console.log(this.formatMessage('DEBUG', message), ...args);
    }
  }

  success(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.INFO) {
      console.log(this.formatMessage('SUCCESS', message), ...args);
    }
  }

  /**
   * Creates a debug logger for performance monitoring
   */
  static createDebugLogger(): Logger {
    return new Logger({ level: LogLevel.DEBUG, enableTimestamps: true });
  }

  /**
   * Creates a quiet logger for CLI output
   */
  static createQuietLogger(): Logger {
    return new Logger({ level: LogLevel.ERROR });
  }
}

// Global logger instance - enable colors for colored output
export const logger = new Logger({ enableColors: true });
