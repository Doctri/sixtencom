# AI Agent Guidance for `sixtencom`

## Purpose
Help AI coding agents quickly understand the repo layout, build commands, runtime conventions, and authentication behavior.

## Technology stack
- Next.js 15 App Router + TypeScript
- PostgreSQL + Prisma
- JWT-based authentication stored in an httpOnly cookie
- `zod` for validation, `bcryptjs` for password hashing, `jose` for JWT verification

## Run / build commands
- `npm install`
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run db:generate`
- `npm run db:push`
- `npm run db:studio`
- `npm run db:seed`

## Environment
- Copy `.env.example` to `.env`
- Required values:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `NEXT_PUBLIC_APP_URL`
- Do not commit secrets to version control.

## Important conventions
- `src/app/` contains App Router routes and page components.
- `src/app/api/` contains Route Handlers (`route.ts`) for backend APIs.
- `src/middleware.ts` protects authenticated routes and API access.
- Public pages: `/`, `/login`, `/register`.
- Protected pages: `/dashboard`, `/products`.
- Protected API routes: `/api/:path*` when no valid JWT cookie exists.
- Cookie name: `sixtencom_session`.
- JWT secret is read from `process.env.JWT_SECRET`.

## Key files to inspect first
- `README.md` — project overview, installation, environment requirements
- `prisma/schema.prisma` — database models, enums, and relationships
- `src/middleware.ts` — auth guard behavior and route matching
- `src/lib/prisma.ts` — Prisma client singleton setup
- `src/lib/api.ts` — shared API error responses
- `src/lib/auth.ts` — auth helper utilities
- `src/app/api/auth/*.route.ts` — login/register/logout/me endpoints
- `src/app/api/products/route.ts` — product API logic
- `src/components/logout-button.tsx` — client-side API call pattern

## Authoring guidance
- Preserve existing auth flow and redirect behavior when updating protected routes.
- Keep database shape aligned with `prisma/schema.prisma`.
- If changing API responses, match existing Spanish error messages and status handling.
- Prefer using the existing `src/lib` helpers rather than adding duplicate API utility code.

## Notes
- No dedicated test suite is present in this repository as of now.
- This repo is a single-app sales system targeting Colombia with DIAN invoicing planned in later phases.
