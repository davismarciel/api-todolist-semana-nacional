# 📝 To-Do List App

Um aplicativo completo de gerenciamento de tarefas (To-Do List) construído com NestJS, incluindo autenticação JWT, interface moderna e testes unitários.

## ✨ Funcionalidades

### 🔐 Autenticação
- Registro de usuários com hash de senha (bcrypt)
- Login com JWT (JSON Web Tokens)
- Guard de autenticação para proteger rotas

### 📋 Tarefas
- Criar, editar e excluir tarefas
- Marcar tarefas como concluídas/pendentes
- Sistema de prioridades (Alta, Média, Baixa)
- Filtros por status e prioridade
- Estatísticas em tempo real

### 🎨 Interface
- Design moderno e responsivo
- Animações suaves
- Tema escuro elegante
- Cards de estatísticas
- Interface intuitiva e amigável

### 🧪 Testes
- Testes unitários completos para todos os serviços
- Cobertura de casos de sucesso e erro
- Testes de autenticação e autorização

### 📊 Logging
- Sistema de logging completo em todos os endpoints críticos
- Interceptor global para registrar todas as requisições HTTP
- Logs de autenticação, criação de recursos, erros e acessos
- Sanitização de dados sensíveis (senhas)

## 🚀 Como executar

### Pré-requisitos
- Node.js (v18 ou superior)
- pnpm (ou npm/yarn)

### Instalação

```bash
# Instalar dependências
pnpm install

# Executar em modo desenvolvimento
pnpm run start:dev

# Ou executar em modo produção
pnpm run start:prod
```

O aplicativo estará disponível em:
- Frontend: http://localhost:3000
- API: http://localhost:3000

## 📡 Endpoints da API

### Autenticação
- `POST /auth/register` - Registrar novo usuário
- `POST /auth/login` - Fazer login

### Tarefas (requer autenticação)
- `GET /task` - Listar todas as tarefas do usuário
- `GET /task?status=pending` - Filtrar por status
- `GET /task?priority=high` - Filtrar por prioridade
- `GET /task/stats` - Obter estatísticas
- `GET /task/:id` - Obter tarefa específica
- `POST /task` - Criar nova tarefa
- `PATCH /task/:id` - Atualizar tarefa
- `PATCH /task/:id/toggle` - Alternar status da tarefa
- `DELETE /task/:id` - Excluir tarefa

### Exemplo de requisição

```bash
# Registrar usuário
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João","email":"joao@example.com","password":"senha123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@example.com","password":"senha123"}'

# Criar tarefa (usar token do login)
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"title":"Minha tarefa","description":"Descrição","priority":"high"}'
```

## 🧪 Testes

```bash
# Executar todos os testes
pnpm run test

# Executar testes em modo watch
pnpm run test:watch

# Executar testes com cobertura
pnpm run test:cov

# Executar testes e2e
pnpm run test:e2e
```

## 🔄 CI/CD

O projeto possui CI/CD configurado com GitHub Actions para executar testes automaticamente.

### Workflow

O workflow `.github/workflows/ci.yml` executa automaticamente:

- ✅ **Linter**: Verifica a qualidade do código
- ✅ **Testes Unitários**: Executa todos os testes em múltiplas versões do Node.js (20.x, 22.x)
- ✅ **Cobertura de Código**: Gera relatório de cobertura e faz upload para Codecov
- ✅ **Build**: Compila a aplicação para verificar se não há erros de compilação

### Triggers

O CI/CD executa automaticamente quando:
- Faz push para `main`, `develop` ou `master`
- Cria um Pull Request para essas branches
- Execução manual via GitHub Actions

### Status

![CI/CD](https://github.com/USERNAME/REPO/workflows/CI%2FCD%20-%20Tests/badge.svg)

> **Nota**: Substitua `USERNAME` e `REPO` no badge acima pelos valores do seu repositório. O badge será gerado automaticamente após o primeiro workflow executar.

## 📁 Estrutura do Projeto

```
src/
├── core/              # Módulo principal da aplicação
├── modules/
│   ├── auth/          # Módulo de autenticação (JWT)
│   ├── user/          # Módulo de usuários
│   └── task/          # Módulo de tarefas
public/
└── index.html         # Interface frontend
```

## 🛠️ Tecnologias

- **Backend:**
  - NestJS
  - TypeScript
  - JWT (Passport)
  - bcrypt
  - Jest (testes)

- **Frontend:**
  - HTML5
  - CSS3 (com animações)
  - JavaScript (Vanilla)

## 📝 Estrutura de Dados

### Task
```typescript
{
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
  userId: string;
  createdAt: Date;
  completedAt?: Date;
}
```

### User
```typescript
{
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}
```

## 🎯 Funcionalidades de Apresentação

- ✅ Interface visual moderna e atraente
- ✅ Animações suaves e transições
- ✅ Cards de estatísticas em tempo real
- ✅ Sistema de cores baseado em prioridade
- ✅ Design responsivo
- ✅ Feedback visual para ações do usuário
- ✅ Autenticação completa e segura

## 📄 Licença

Este projeto é open source e está disponível sob a licença MIT.
