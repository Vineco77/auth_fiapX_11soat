# 🔐 Auth Service - FIAP X 11SOAT

> Serviço de autenticação JWT com **Layered Architecture**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.1-red)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-blue)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Tecnologias](#-tecnologias)
- [Instalação](#-instalação)
- [Endpoints](#-endpoints)
- [Documentação](#-documentação)

---

## 🎯 Visão Geral

Serviço de autenticação JWT para o sistema de processamento de vídeos. Responsável por:

- ✅ Registro de usuários
- ✅ Login (autenticação)
- ✅ Validação de tokens JWT
- ✅ Auditoria de ações

---

## 🏗️ Arquitetura

### Layered Architecture (4 Camadas)

```
src/
├── domain/              # Entidades e Exceções de Negócio
├── application/         # Lógica de Negócio + Interfaces
├── infrastructure/      # Implementações Técnicas
└── presentation/        # HTTP Layer (Controllers, DTOs)
```

### Princípios Aplicados

- ✅ **SOLID**
- ✅ **DRY** (Don't Repeat Yourself)
- ✅ **KISS** (Keep It Simple)
- ✅ **Dependency Inversion** (Application depende de interfaces)

---

## 🛠️ Tecnologias

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Node.js | 25.0.8 | Runtime |
| TypeScript | 5.9 | Linguagem |
| NestJS | 11.1 | Framework |
| Prisma | 6.19 | ORM |
| PostgreSQL | 16 | Banco de Dados |
| Bcrypt | 3.0 | Hash de Senhas |
| JWT | 9.0 | Autenticação |

---

## 🚀 Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/Vineco77/auth_fiapX_11soat.git
cd auth_fiapX_11soat
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure Variáveis de Ambiente

```bash
cp .env.example .env
```

**Edite o `.env`:**
```env
JWT_SECRET=sua_chave_secreta_super_segura_aqui
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://auth_user:password@localhost:5432/auth_db
```

### 4. Suba o PostgreSQL (Docker)

```bash
npm run docker:up
```

### 5. Execute as Migrations

```bash
npm run prisma:migrate
```

### 6. Inicie a Aplicação

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

**Aplicação rodando em:** `http://localhost:3000`

---

## 📡 Endpoints

### 1. POST /auth/register - Criar Conta

**Request:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "Senha@123"
  }'
```

**Response (201):**
```json
{
  "clientId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "usuario@exemplo.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7d",
  "exp": 1738012800
}
```

---

### 2. POST /auth/login - Autenticar

**Request:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "Senha@123"
  }'
```

**Response (200):**
```json
{
  "clientId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "usuario@exemplo.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7d",
  "exp": 1738012800
}
```

---

### 3. POST /auth/validate - Validar Token

**Request:**
```bash
curl -X POST http://localhost:3000/auth/validate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200):**
```json
{
  "valid": true,
  "user": {
    "email": "usuario@exemplo.com",
    "clientId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## 📚 Documentação

- [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md) - Detalhes da refatoração
- [VALIDATION_GUIDE.md](VALIDATION_GUIDE.md) - Guia de validação
- [.copilot-context-auth-fiapX.md](.copilot-context-auth-fiapX.md) - Contexto completo

---

## 📜 Scripts Disponíveis

```bash
# Desenvolvimento
npm run start:dev          # Iniciar em modo watch
npm run build              # Compilar TypeScript
npm run start:prod         # Iniciar em produção

# Prisma
npm run prisma:generate    # Gerar Prisma Client
npm run prisma:migrate     # Executar migrations
npm run prisma:studio      # Abrir Prisma Studio

# Docker
npm run docker:up          # Subir PostgreSQL + Elasticsearch + Kibana
npm run docker:down        # Parar todos os containers
npm run docker:logs        # Ver logs

# Elasticsearch & Monitoramento
npm run elasticsearch:setup  # Configurar ILM Policies (executar 1x)
```

---

## 📊 Monitoramento & Logs

### Stack de Observabilidade

O Auth Service utiliza **Pino + Elasticsearch + Kibana** para monitoramento e análise de logs:

- **Pino:** Logger de alta performance (JSON estruturado)
- **Elasticsearch:** Armazenamento e indexação de logs
- **Kibana:** Visualização e análise de logs

### Features

✅ **TraceId UUID v4** em todas as requests (rastreabilidade end-to-end)  
✅ **Logs estruturados JSON** (fácil pesquisa e análise)  
✅ **ILM Policies** (retenção de 7 dias, rotação automática)  
✅ **Níveis apropriados:** `info` (2xx/3xx), `warn` (4xx), `error` (5xx)  
✅ **Auditoria completa:** Todas as ações logadas (REGISTER, LOGIN, VALIDATE, etc.)  
✅ **Health Check:** Postgres + Elasticsearch

### Setup Inicial

1. **Subir stack completa (PostgreSQL + Elasticsearch + Kibana):**
   ```bash
   npm run docker:up
   ```

2. **Configurar Elasticsearch (ILM Policies):**
   ```bash
   npm run elasticsearch:setup
   ```

3. **Acessar Kibana:**
   ```
   http://localhost:5601
   ```

4. **Criar Index Pattern no Kibana:**
   - Ir em **Management → Stack Management → Index Patterns**
   - Criar pattern: `auth-service-logs-*`
   - Time field: `@timestamp`

### Visualizar Logs no Kibana

1. **Discover:**
   ```
   http://localhost:5601/app/discover
   ```

2. **Filtros úteis:**
   ```
   # Logs de auditoria
   category: "AUDIT"

   # Logs de uma ação específica
   action: "LOGIN_SUCCESS"

   # Logs de um usuário
   email: "usuario@exemplo.com"

   # Logs de erros
   level: "error"

   # Rastrear request completo (traceId)
   traceId: "550e8400-e29b-41d4-a716-446655440000"
   ```

3. **Campos disponíveis:**
   - `@timestamp` - Data/hora do log
   - `level` - Nível (info, warn, error)
   - `message` - Mensagem do log
   - `traceId` - UUID da request
   - `context` - Origem (AuthService, HTTP, etc.)
   - `action` - Ação de auditoria (REGISTER, LOGIN, etc.)
   - `email` - Email do usuário
   - `clientId` - ID do cliente
   - `method` - Método HTTP
   - `url` - URL da request
   - `statusCode` - Status HTTP
   - `responseTime` - Tempo de resposta (ms)

### Health Check

**Verificar saúde do serviço (incluindo Elasticsearch):**

```bash
curl http://localhost:3000/health/detailed
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-07T...",
  "services": {
    "postgres": {
      "status": "ok",
      "responseTime": 2
    },
    "elasticsearch": {
      "status": "ok",
      "responseTime": 5
    }
  },
  "uptime": 163.29
}
```

### Troubleshooting

**Elasticsearch não conecta:**
```bash
# Verificar se Elasticsearch está rodando
docker ps | grep elasticsearch

# Ver logs do Elasticsearch
docker logs auth_elasticsearch

# Testar conexão manual
curl http://localhost:9200/_cluster/health
```

**Logs não aparecem no Kibana:**
1. Verificar se index pattern foi criado (`auth-service-logs-*`)
2. Verificar se aplicação está enviando logs:
   ```bash
   curl http://localhost:9200/auth-service-logs-*/_search?size=1
   ```
3. Verificar ILM policy:
   ```bash
   curl http://localhost:9200/_ilm/policy/auth-service-ilm-policy
   ```

---

## 🧪 Testes

```bash
npm test              # Executar testes unitários
npm run test:watch    # Testes em modo watch
npm run test:cov      # Cobertura de código
```

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

## 📄 Licença

ISC

---

## 👥 Autores

- **Vinícius Ribeiro** - [@Vineco77](https://github.com/Vineco77)

---

## 🔗 Repositórios Relacionados

- [API Service](https://github.com/Vineco77/api_fiapX_11soat)
- [Worker Service](https://github.com/Luckmenez/worker_fiapX_11soat)

---

**🚀 Auth Service - Pronto para produção!**