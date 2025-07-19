/**
 * Logger interface
 */
export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void;
}

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Console logger implementation
 */
export class ConsoleLogger implements Logger {
  constructor(
    private level: LogLevel = LogLevel.INFO,
    private options: LoggerOptions = {}
  ) {}

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.level <= LogLevel.DEBUG) {
      const formatted = this.format('DEBUG', message, context);
      console.debug(formatted);
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.level <= LogLevel.INFO) {
      const formatted = this.format('INFO', message, context);
      console.info(formatted);
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.level <= LogLevel.WARN) {
      const formatted = this.format('WARN', message, context);
      console.warn(formatted);
    }
  }

  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    if (this.level <= LogLevel.ERROR) {
      const formatted = this.format('ERROR', message, context);
      console.error(formatted);

      if (error && this.options.includeStackTrace) {
        console.error(error.stack);
      }
    }
  }

  private format(
    level: string,
    message: string,
    context?: Record<string, unknown>
  ): string {
    const timestamp = new Date().toISOString();
    let formatted = `[${timestamp}] [${level}] ${message}`;

    if (context && Object.keys(context).length > 0) {
      formatted += ` ${JSON.stringify(context)}`;
    }

    return formatted;
  }
}

/**
 * Logger options
 */
export interface LoggerOptions {
  includeTimestamp?: boolean;
  includeStackTrace?: boolean;
  colorize?: boolean;
}

/**
 * No-op logger for testing
 */
export class NoOpLogger implements Logger {
  debug(message: string, context?: Record<string, unknown>): void {
    // No-op implementation - format but don't output
    this.format('DEBUG', message, context);
  }
  info(message: string, context?: Record<string, unknown>): void {
    // No-op implementation - format but don't output
    this.format('INFO', message, context);
  }
  warn(message: string, context?: Record<string, unknown>): void {
    // No-op implementation - format but don't output
    this.format('WARN', message, context);
  }
  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    // No-op implementation - format but don't output
    this.format('ERROR', message, context);
    // Also format error if provided
    if (error) {
      this.format('ERROR', error.message, { stack: error.stack });
    }
  }

  private format(
    level: string,
    message: string,
    context?: Record<string, unknown>
  ): string {
    // Same formatting logic as ConsoleLogger but return instead of output
    const timestamp = new Date().toISOString();
    let formatted = `[${timestamp}] [${level}] ${message}`;

    if (context && Object.keys(context).length > 0) {
      formatted += ` ${JSON.stringify(context)}`;
    }

    return formatted;
  }
}

/**
 * Logger factory
 */
export class LoggerFactory {
  private static instance: Logger;

  static create(config: LoggerConfig): Logger {
    if (!this.instance) {
      const level = this.parseLogLevel(config.level);
      this.instance = new ConsoleLogger(level, config.options);
    }
    return this.instance;
  }

  static getLogger(): Logger {
    if (!this.instance) {
      this.instance = new ConsoleLogger();
    }
    return this.instance;
  }

  private static parseLogLevel(level?: string): LogLevel {
    switch (level?.toUpperCase()) {
      case 'DEBUG':
        return LogLevel.DEBUG;
      case 'INFO':
        return LogLevel.INFO;
      case 'WARN':
        return LogLevel.WARN;
      case 'ERROR':
        return LogLevel.ERROR;
      default:
        return LogLevel.INFO;
    }
  }
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level?: string;
  options?: LoggerOptions;
}
