# Notifications Service

API REST para gerenciamento de grupos e notificações de aniversário.

## Stack

- **Node.js** + **TypeScript**
- **Express.js** 5
- **Knex.js** — query builder e migrations
- **SQLite** (desenvolvimento) / **PostgreSQL** (produção)
- **JWT** — autenticação
- **Jest** + **Supertest** — testes

## Requisitos

- Node.js 18+
- npm

## Instalação

```bash
npm install
cp .env.example .env   # preencha JWT_SECRET
npm run migrate
npm run seed           # opcional: 100 usuários + 3 grupos de exemplo
```

## Desenvolvimento

```bash
npm run dev
```

Servidor disponível em `http://localhost:3000`.

## Testes

```bash
npm test
```

## Migrations

```bash
npm run migrate           # aplica pendentes
npm run migrate:rollback  # reverte o último batch
```

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `JWT_SECRET` | Segredo para assinar tokens JWT |
| `PORT` | Porta do servidor (padrão: `3000`) |

## Rotas

### Auth

| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| POST | `/auth/register` | — | Registrar usuário |
| POST | `/auth/login` | — | Login — retorna JWT |
| PATCH | `/auth/edit-name` | ✓ | Editar nome |

**Registro aceita `timezone`** (IANA, ex: `"America/Sao_Paulo"`). Default: `UTC`.

### Grupos

| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| POST | `/group` | ✓ | Criar grupo |
| PUT | `/group/:id` | ✓ | Editar grupo (dono) |
| POST | `/group/join` | ✓ | Entrar em grupo |
| POST | `/group/leave` | ✓ | Sair do grupo |
| GET | `/group/user` | ✓ | Listar meus grupos |
| GET | `/group/:id/users` | ✓ | Listar membros (membro) |
| DELETE | `/group/:id/users/:userId` | ✓ | Remover membro (dono) |
| GET | `/group/:id/subscription` | ✓ | Ver assinatura (dono) |

### Notificações

| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| POST | `/group/:id/notifications` | ✓ | Criar notificação |
| GET | `/group/:id/notifications` | ✓ | Listar notificações |

## Regras de negócio

**Grupos**
- Limite de **30 membros** por grupo.
- Um usuário não pode criar um novo grupo enquanto possui outro em **trial**.

**Notificações**
- São do tipo aniversário: recebem `month` e `day`.
- O `scheduled_at` é calculado automaticamente para às **06:00** do timezone do usuário criador.
- Membros comuns: **1 notificação** por grupo. Dono: **10 notificações** por grupo.

**Assinatura**
- Todo grupo criado ganha **3 meses de trial** automaticamente.
- Após o trial: **R$ 30,00/mês**.

## Testando com Postman

Importe o arquivo `postman-group-collection.json`.  
O token JWT é salvo automaticamente após o **Login**, e o `groupId` após **Criar grupo**.
