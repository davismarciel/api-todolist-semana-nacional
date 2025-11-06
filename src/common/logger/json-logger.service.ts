import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport';

export class JsonLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'debug',
      format: winston.format.json(),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
        new OpenTelemetryTransportV3(),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context: context || 'Application' });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { context: context || 'Application', trace });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context: context || 'Application' });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context: context || 'Application' });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context: context || 'Application' });
  }
}

