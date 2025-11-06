# OpenTelemetry - Guia de Uso

## 📦 Dependências Necessárias

Para instalar todas as dependências do OpenTelemetry, execute:

```bash
pnpm add @opentelemetry/sdk-node \
         @opentelemetry/sdk-trace-base \
         @opentelemetry/api \
         @opentelemetry/instrumentation \
         @opentelemetry/instrumentation-http \
         @opentelemetry/instrumentation-express \
         @opentelemetry/instrumentation-nestjs-core \
         @opentelemetry/exporter-trace-otlp-http \
         @opentelemetry/exporter-metrics-otlp-http \
         @opentelemetry/resources \
         @opentelemetry/semantic-conventions \
         @opentelemetry/sdk-metrics \
         @prisma/instrumentation
```

## 🏗️ Estrutura de Arquivos

```
src/
├── common/
│   └── tracing/
│       ├── index.ts              # Exports
│       ├── instrumentations.ts   # Lista de instrumentações
│       └── tracing.ts            # Configuração principal do SDK
└── main.ts                        # Inicialização do OTEL
```

## 🚀 Como Funciona

### 1. Instrumentações Automáticas

O OpenTelemetry captura automaticamente:

- ✅ **HTTP Requests** - Todas as requisições HTTP
- ✅ **Express Routes** - Rotas e middlewares
- ✅ **NestJS Controllers** - Controllers, Guards, Pipes, Interceptors
- ✅ **Prisma Queries** - Queries SQL executadas

### 2. Configuração

As configurações são feitas via variáveis de ambiente (`.env`):

```env
OTEL_SERVICE_NAME=api-todolist-sndt
OTEL_SERVICE_VERSION=1.0.0
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces
OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://localhost:4318/v1/metrics
```

### 3. Exporters

Os dados são enviados via **OTLP HTTP** para um collector (Jaeger, SigNoz, etc).

## 🔄 Fluxo de Dados

```
Aplicação NestJS
    ↓
Instrumentações OTEL
    ↓
OTLP Exporter (HTTP)
    ↓
Collector (OTEL, Jaeger, SigNoz)
    ↓
Backend de Observabilidade
```

## 📊 Backends Suportados

| Backend | Tipo | Use quando |
|---------|------|------------|
| **Jaeger** | Open Source | Desenvolvimento local |
| **SigNoz** | Open Source | Produção self-hosted |
| **Honeycomb** | SaaS | Produção cloud |
| **Datadog** | SaaS | Enterprise |

## 🐳 Docker Compose (Exemplo com OTEL Collector)

Crie um arquivo `otel-collector-config.yaml`:

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024

exporters:
  logging:
    loglevel: debug
  
  # Configure aqui o backend (Jaeger, SigNoz, etc)
  jaeger:
    endpoint: jaeger:14250
    tls:
      insecure: true

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [logging, jaeger]
    
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [logging]
```

E adicione ao `docker-compose.yml`:

```yaml
services:
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    command: ["--config=/etc/otel-collector-config.yaml"]
    volumes:
      - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml
    ports:
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
```

## 🧪 Testando

1. **Inicie o collector**:
   ```bash
   docker-compose up -d otel-collector
   ```

2. **Rode a aplicação**:
   ```bash
   pnpm run start:dev
   ```

3. **Faça uma requisição**:
   ```bash
   curl http://localhost:3000/tasks
   ```

4. **Veja os traces** no backend configurado (ex: http://localhost:16686 para Jaeger)

## 📝 Customizações

### Adicionar Spans Customizados

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('meu-servico');
const span = tracer.startSpan('operacao-customizada');

try {
  // seu código aqui
  span.setAttribute('custom.attribute', 'valor');
} finally {
  span.end();
}
```

### Ignorar Endpoints

Em `instrumentations.ts`:

```typescript
ignoreIncomingRequestHook: (request) => {
  const url = request.url || '';
  return url.includes('/health') || url.includes('/metrics');
},
```

## 🔧 Troubleshooting

### Traces não aparecem no backend

1. Verifique se o collector está rodando: `docker ps`
2. Verifique as variáveis de ambiente
3. Confira os logs do collector: `docker logs otel-collector`

### Performance

- **Desenvolvimento**: Usa `SimpleSpanProcessor` (imediato)
- **Produção**: Usa `BatchSpanProcessor` (melhor performance)

## 📚 Documentação Oficial

- [OpenTelemetry JS](https://opentelemetry.io/docs/languages/js/)
- [OTLP Specification](https://opentelemetry.io/docs/specs/otlp/)
- [Instrumentações](https://opentelemetry.io/registry/?language=js&component=instrumentation)
