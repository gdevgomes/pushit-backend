# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev               # Start server with hot reload (ts-node-dev)

# Database
npm run migrate           # Run pending migrations
npm run migrate:rollback  # Rollback last migration batch
npm run seed              # Run seeders

# Knex CLI (direct access)
npm run knex -- <command>
```

There is no build step for production — the project currently runs via ts-node-dev.

## Preferences

- **Validation:** run `npm test` to validate changes, not curl
- **Seeds:** keep seeds simple and usable for frontend development; admin user is id=1, email `admin@admin.com`, password `admin123`
- **Errors:** always use `AppError(Errors.*)` for all throws — never use `throw new Error()` directly

## Always do when changing routes or data shapes

- **Postman collection:** keep `postman-group-collection.json` up to date whenever routes are added, removed, or their request/response shape changes.
- **Tests:** keep the test files in `tests/` up to date whenever business logic, services, or repositories change.

## Architecture

Layered architecture with strict separation:

```
Controllers → Services → Repositories → Database (Knex)
```

- **Controllers** handle HTTP request/response and call services
- **Services** contain all business logic and authorization checks (e.g. only group owner can edit)
- **Repositories** contain all SQL queries via Knex — no logic, just data access
- **Routes** wire controllers to Express Router; `src/routes/index.ts` mounts all sub-routers

### Error handling

Throw `AppError(message, statusCode)` from anywhere in the stack — the global `errorHandler` middleware in `src/middlewares/errorHandler.ts` catches it and returns the appropriate JSON response. Knex errors are also caught globally.

### Authentication

JWT-based. The `authMiddleware` (`src/middlewares/authMiddleware.ts`) validates the `Authorization: Bearer <token>` header and attaches the decoded payload to `req.user`. All protected routes use this middleware.

### Database

- **Development:** SQLite3 at `./database/dev.sqlite`
- **Production:** PostgreSQL (configured in `knexfile.ts` under `prod`, currently empty)
- Migrations live in `database/migrations/` and use TypeScript
- The `knexfile.ts` exports a typed config object keyed by environment name

### Group codes

Groups have a unique 6-character code generated in `src/utils/generateGroupCode.ts` using base62 encoding of the group's ID (with an offset to avoid short codes).
