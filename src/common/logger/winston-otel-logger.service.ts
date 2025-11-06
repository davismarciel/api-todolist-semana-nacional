import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';

/**
 * Winston Logger integrado com OpenTelemetry
 * - Envia logs para console (stdout/stderr)
 * - Envia logs via OTLP para o Collector
 * - Inclui trace context automaticamente
 */
export class WinstonOtelLoggerService implements LoggerService {
  private winstonLogger: winston.Logger;
  private otelLogger = logs.getLogger('nestjs-winston', '1.0.0');

  constructor() {
    this.winstonLogger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
              const ctx = context ? `[${context}] ` : '';
              const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
              return `${timestamp} ${level}: ${ctx}${message}${metaStr}`;
            })
          ),
        }),
      ],
      defaultMeta: { service: 'api-todolist-sndt' },
    });
  }

  private emitOtelLog(
    severity: SeverityNumber,
    severityText: string,
    message: string,
    context?: string,
    additionalData?: Record<string, any>
  ) {
    this.otelLogger.emit({
      severityNumber: severity,
      severityText: severityText,
      body: message,
      attributes: {
        'log.context': context || 'Application',
        'service.name': 'api-todolist-sndt',
        ...additionalData,
      },
    });
  }

  log(message: string, context?: string) {
    this.winstonLogger.info(message, { context });
    this.emitOtelLog(SeverityNumber.INFO, 'INFO', message, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.winstonLogger.error(message, { context, trace });
    this.emitOtelLog(SeverityNumber.ERROR, 'ERROR', message, context, { trace });
  }

  warn(message: string, context?: string) {
    this.winstonLogger.warn(message, { context });
    this.emitOtelLog(SeverityNumber.WARN, 'WARN', message, context);
  }

  debug(message: string, context?: string) {
    this.winstonLogger.debug(message, { context });
    this.emitOtelLog(SeverityNumber.DEBUG, 'DEBUG', message, context);
  }

  verbose(message: string, context?: string) {
    this.winstonLogger.verbose(message, { context });
    this.emitOtelLog(SeverityNumber.TRACE, 'TRACE', message, context);
  }
}
