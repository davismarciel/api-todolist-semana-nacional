import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import type { Instrumentation } from '@opentelemetry/instrumentation';

/**
 * Retorna a lista de instrumentações do OpenTelemetry
 * para capturar automaticamente traces da aplicação
 */
export function getInstrumentations(): Instrumentation[] {
  return [
    new HttpInstrumentation({
      requestHook: (span, request) => {
        if ('headers' in request && request.headers) {
          const requestId = request.headers['x-request-id'];
          if (requestId) {
            span.setAttribute('http.request_id', requestId);
          }
        }
      },
      ignoreIncomingRequestHook: (request) => {
        const url = request.url || '';
        return url.includes('/health') || url.includes('/metrics');
      },
    }),

    new ExpressInstrumentation(),

    new NestInstrumentation(),

    new PrismaInstrumentation(), 
  ];
}