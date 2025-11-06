import { otelSDK } from './common/tracing';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './core/app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { WinstonOtelLoggerService } from './common/logger/winston-otel-logger.service';

async function bootstrap() {
  await otelSDK.start();
  
  const logger = new WinstonOtelLoggerService();
  
  logger.log('Starting application...', 'Bootstrap');
  logger.log('OpenTelemetry SDK initialized', 'Bootstrap');
  
  const app = await NestFactory.create(AppModule, {
    logger: logger,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());
  
  app.enableCors();
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  logger.log(`Application is running on: http://localhost:${port}`, 'Bootstrap');
  logger.log(`To-Do List API ready`, 'Bootstrap');
  logger.log(`Logging enabled for all HTTP requests`, 'Bootstrap');
}
bootstrap();
