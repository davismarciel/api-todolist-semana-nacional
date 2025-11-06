import {
  BatchSpanProcessor,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import {
  LoggerProvider,
  SimpleLogRecordProcessor,
  BatchLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import { logs } from '@opentelemetry/api-logs';
import { getInstrumentations } from './instrumentations';

const serviceName = process.env.OTEL_SERVICE_NAME || 'api-todolist-sndt';
const serviceVersion = process.env.OTEL_SERVICE_VERSION || '1.0.0';
const environment = process.env.NODE_ENV || 'development';

const tracesEndpoint =
  process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4317';
const metricsEndpoint =
  process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT || 'http://localhost:4317';
const logsEndpoint =
  process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT || 'http://localhost:4317';

const traceExporter = new OTLPTraceExporter({
  url: tracesEndpoint,
  timeoutMillis: 10000,
});

const metricExporter = new OTLPMetricExporter({
  url: metricsEndpoint,
  timeoutMillis: 10000,
});

const logExporter = new OTLPLogExporter({
  url: logsEndpoint,
  timeoutMillis: 10000,
});

const spanProcessor =
  environment === 'development'
    ? new SimpleSpanProcessor(traceExporter)
    : new BatchSpanProcessor(traceExporter, {
        maxQueueSize: 1000,
        scheduledDelayMillis: 1000,
        maxExportBatchSize: 512,
      });

const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 60000, // 60 segundos
  exportTimeoutMillis: 30000, // 30 segundos
});

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: serviceName,
  [ATTR_SERVICE_VERSION]: serviceVersion,
  environment: environment,
  'service.namespace': 'todolist',
});

// Configurar LoggerProvider para logs
const logRecordProcessor =
  environment === 'development'
    ? new SimpleLogRecordProcessor(logExporter)
    : new BatchLogRecordProcessor(logExporter, {
        maxQueueSize: 1000,
        scheduledDelayMillis: 1000,
        maxExportBatchSize: 512,
      });

const loggerProvider = new LoggerProvider({
  resource,
  processors: [logRecordProcessor],
});

logs.setGlobalLoggerProvider(loggerProvider);

export const otelSDK = new NodeSDK({
  resource,
  spanProcessor: spanProcessor,
  metricReader: metricReader,
  instrumentations: getInstrumentations(),
});

const shutdown = async () => {
  try {
    await loggerProvider.shutdown();
    await otelSDK.shutdown();
    console.log('[OTEL] SDK desligado com sucesso');
  } catch (err) {
    console.error('[OTEL] Erro ao desligar SDK:', err);
  } finally {
    process.exit(0);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
