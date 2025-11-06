import { LoggerService } from '@nestjs/common';

export class JsonLoggerService implements LoggerService {
  private formatLog(level: string, message: string, context?: string, trace?: string) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      context: context || 'Application',
      message,
      ...(trace && { trace }),
    };

    return JSON.stringify(logEntry);
  }

  log(message: string, context?: string) {
    console.log(this.formatLog('log', message, context));
  }

  error(message: string, trace?: string, context?: string) {
    console.error(this.formatLog('error', message, context, trace));
  }

  warn(message: string, context?: string) {
    console.warn(this.formatLog('warn', message, context));
  }

  debug(message: string, context?: string) {
    console.debug(this.formatLog('debug', message, context));
  }

  verbose(message: string, context?: string) {
    console.log(this.formatLog('verbose', message, context));
  }
}

