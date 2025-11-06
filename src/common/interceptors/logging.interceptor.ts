import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, body } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    // Sanitize body if present
    let sanitizedBody: Record<string, any> | null = null;
    if (body && Object.keys(body).length > 0) {
      sanitizedBody = { ...body };
      if (sanitizedBody && 'password' in sanitizedBody) {
        sanitizedBody.password = '***';
      }
    }

    const requestLogData: Record<string, any> = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      context: 'HTTP',
      type: 'request',
      method,
      url,
      ip,
      userAgent: userAgent.substring(0, 100),
    };

    if (sanitizedBody) {
      requestLogData.body = sanitizedBody;
    }

    const requestLog = JSON.stringify(requestLogData);
    console.log(requestLog);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const duration = Date.now() - startTime;
          
          const responseLog = JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            context: 'HTTP',
            type: 'response',
            method,
            url,
            statusCode,
            duration,
          });
          console.log(responseLog);
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;
          
          const errorLogData: Record<string, any> = {
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            context: 'HTTP',
            type: 'error',
            method,
            url,
            statusCode,
            duration,
            message: error.message,
          };

          if (error.stack) {
            errorLogData.stack = error.stack;
          }

          const errorLog = JSON.stringify(errorLogData);
          console.error(errorLog);
        },
      }),
    );
  }
}

