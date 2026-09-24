# MoneyMate Architecture

> Implementation reference, verified against the repository on 2026-09-24.

MoneyMate is an npm-workspace monorepo with independently deployable web, API, and mobile applications. Shared packages contain platform-neutral contracts, validation, domain helpers, API utilities, and design tokens.

## Runtime topology

```text
Web (React/Vite) ───────┐
                       ├── HTTPS/JSON ──> Express API ──> MySQL/Prisma
Mobile (Expo) ─────────┘                         │
                                               ├──> local or S3-compatible storage
                                               ├──> OpenAI/CopilotKit (optional)
                                               └──> Expo push service (optional)
```

The API is the trust boundary. Every private request is authenticated and every user-owned record is scoped by the authenticated user ID. Clients never receive database credentials or server API keys.

## Workspace boundaries

| Workspace | Responsibility |
| --- | --- |
| `backend/` | HTTP API, authentication, business rules, persistence, exports, AI/OCR, notifications, and Copilot runtime |
| `frontend/` | Browser UI, routing, query cache, local UI state, receipt workflow, and Copilot UI tools |
| `apps/mobile/` | iOS/Android UI, secure session storage, offline queue/sync, camera, biometrics, notifications, and deep links |
| `packages/contracts` | Shared request/response DTOs |
| `packages/validation` | Platform-neutral validation |
| `packages/domain` | Shared domain helpers |
| `packages/api-core` | Shared API behavior |
| `packages/design-tokens` | Shared visual foundations |

Applications may depend on shared packages. Shared packages must not import application code.

## Web frontend

`frontend/src` is organized by responsibility:

- `components/` contains reusable UI and feature components; primitives live in `components/common/`.
- `config/` owns API, Copilot, and route configuration.
- `contexts/` owns application-level providers.
- `hooks/` contains reusable feature behavior.
- `layouts/` contains the authenticated application shell.
- `pages/` contains lazy-loaded route screens with adjacent tests.
- `services/` contains the Axios API client.
- `stores/` contains Zustand authentication and theme state.
- `styles/` and `theme/` integrate global CSS, design tokens, charts, and CopilotKit.

TanStack Query owns remote server state. Zustand is limited to cross-page client state such as authentication and theme. React Router provides public, authenticated, and administrator route boundaries.

When enabled, `MoneyMateCopilotProvider` supplies safe UI context and registers browser tools. `recordExpense` requires explicit human confirmation; `setAppTheme` and `navigateToPage` perform allowlisted UI actions. The access token is used only in transport headers and is not placed in agent context.

## Backend

The normal dependency flow is:

```text
route -> middleware -> controller -> service -> repository -> Prisma/MySQL
```

- Routes define endpoint composition.
- Middleware handles authentication, authorization, validation, upload limits, idempotency, request IDs, and errors.
- Controllers translate HTTP input/output without owning business rules.
- Services validate ownership and execute business use cases.
- Repositories own Prisma queries and transactions.
- `copilotkit/` owns runtime authentication, security limits, prompt configuration, and read-only financial tools.

Multi-record financial operations use Prisma transactions. Transaction updates and deletes use optimistic versions; wallets and transactions use soft deletion where offline synchronization requires tombstones.

## Mobile application

The Expo Router application reuses the same API and shared contracts. Sensitive refresh credentials are stored with SecureStore. TanStack Query supplies server caching, while SQLite persists the offline outbox and transaction sync state.

Mutations that support replay use idempotency keys. Transaction synchronization uses an opaque cursor based on `(updatedAt, id)` and includes tombstones so deleted records can be removed locally. Native capabilities such as camera, biometrics, push notifications, and deep links require a compatible Expo development build or production binary.

## Key flows

### Authentication

The web receives refresh tokens through an HttpOnly cookie. Mobile clients send platform/device metadata and receive the refresh token in the response body for SecureStore. Access tokens remain in memory. Refresh tokens are one-time values stored only as SHA-256 hashes and rotated atomically.

### Financial mutations

The API validates ownership and cross-entity consistency before writes. Transfers, savings-goal funding, recurring generation, and balance-affecting operations execute atomically. Budget notifications are evaluated after expense commits so notification failures do not roll back valid financial data.

### Recurring transactions

The backend checks due schedules at process startup and every 24 hours. Each schedule is claimed atomically before catch-up generation, preventing duplicate processing across concurrent workers. A single run creates at most 100 missed occurrences per schedule.

### Copilot

The authenticated Copilot endpoint exposes five user-scoped, read-only financial tools. Browser tools handle UI actions. The runtime enforces input/output limits, model timeouts, tool-step limits, rate limits, thread ownership, production origin/HTTPS rules, and client-disconnect cancellation.

## Deployment

Docker Compose starts MySQL, the compiled backend, and the Nginx-served frontend. The backend container runs `prisma migrate deploy` before starting. Nginx serves the SPA and proxies `/api` to the backend.

Production deployments must provide durable attachment storage, exact HTTPS origins, strong JWT secrets, database backups with tested restore procedures, and externally managed OpenAI/push/storage credentials.

## Sources of truth

- Database shape: `backend/prisma/schema.prisma`
- HTTP contracts: Swagger UI and route/validator code
- Workspace setup: root, backend, frontend, and mobile README files
- Business invariants: service and repository tests
