# Tilt Tracker API

> Instructions for Codex, GitHub Copilot Workspace, and other agents that read AGENTS.md.

## Overview

NestJS 11 backend for gaming session and tilt tracking. Uses Prisma 7 (PostgreSQL), JWT + Redis auth, and audit logging.

## Architecture

Clean Architecture with: Controller → UseCase/Repository Interface → Prisma Repository.

Each module at `src/modules/<feature>/` has: controller, module, `dto/`, `interfaces/`, `repositories/`.

## Key Rules

1. **No comments** in code — self-documenting only.
2. **No `any`** — strict TypeScript.
3. **Guard clauses** — early returns over nested ifs.
4. **Repositories inject via DI token**: `@Inject('I<Feature>Repository')`.
5. **Controllers** use `@ApiBearerAuth()` and JWT guard is global.
6. **Audit**: Every state-changing route MUST have `@Audit(AuditAction.ACTION, 'Description')`.
7. **Import Prisma types** from `src/generated/prisma/client`, never `@prisma/client`.
8. **Formatting**: Prettier with singleQuote, trailingComma: all, printWidth: 100.

## Redis Key Patterns

- Refresh tokens: `refresh:{userId}` (TTL: 7d)
- Blacklisted access tokens: `bl:{token}` (TTL: 15m)

## Commands

- `npm run start:dev` — Development server
- `npm run build` — Build
- `npm run test` — Run tests
- `npm run lint` — Lint + fix
- `npm run generate` — Prisma generate
- `npm run migrate <name>` — Prisma migrate
