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

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class ConsoleLogger implements Logger {
  constructor(
    private level: LogLevel = LogLevel.INFO,
    private options: LoggerOptions = {}
  ) {}

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.level <= LogLevel.DEBUG) {
      const formatted = this.format('DEBUG', message, context);
      process.stderr.write(formatted + '\n');
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.level <= LogLevel.INFO) {
      const formatted = this.format('INFO', message, context);
      process.stderr.write(formatted + '\n');
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.level <= LogLevel.WARN) {
      const formatted = this.format('WARN', message, context);
      process.stderr.write(formatted + '\n');
    }
  }

  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    if (this.level <= LogLevel.ERROR) {
      const formatted = this.format('ERROR', message, context);
      process.stderr.write(formatted + '\n');

      if (error && this.options.includeStackTrace) {
        process.stderr.write(error.stack + '\n');
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

export interface LoggerOptions {
  includeTimestamp?: boolean;
  includeStackTrace?: boolean;
  colorize?: boolean;
}

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

export class LoggerFactory {
  private static instance: Logger;

  static create(config: LoggerConfig): Logger {
    const level = this.parseLogLevel(config.level);
    return new ConsoleLogger(level, config.options);
  }

  static getLogger(): Logger {
    if (!this.instance) {
      this.instance = new ConsoleLogger();
    }
    return this.instance;
  }

  static createQuietLogger(): Logger {
    return new NoOpLogger();
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

export interface LoggerConfig {
  level?: string;
  options?: LoggerOptions;
}
