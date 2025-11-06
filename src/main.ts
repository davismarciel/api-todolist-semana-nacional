import { NestFactory } from '@nestjs/core';
import { AppModule } from './core/app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { JsonLoggerService } from './common/logger/json-logger.service';

async function bootstrap() {
  const logger = new JsonLoggerService();
  
  logger.log('Starting application...', 'Bootstrap');
  
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
