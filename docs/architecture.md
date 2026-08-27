# MoneyMate architecture

MoneyMate is an npm workspace containing independently deployable `frontend` and
`backend` applications. Each application owns its own dependencies and runtime
configuration; the root package only provides repository-wide commands.

## Frontend

`frontend/src` follows the responsibility-based structure defined by the
frontend agent-kit rule:

- `components/`: reusable UI; application-wide primitives live in `common/`.
- `config/route/`: route configuration and access guards.
- `hooks/`: reusable React logic.
- `layouts/`: page shells and application navigation.
- `pages/<PageName>/`: route-level screens and their adjacent tests.
- `services/`: HTTP clients and external integrations.
- `stores/`: cross-page client state.
- `styles/`, `types/`, and `utils/`: global styles, shared declarations, and
  domain-neutral utilities.

`App.tsx`, `main.tsx`, and framework declarations remain at the `src` root.
Cross-folder imports use the `@/` alias, and route-level pages are loaded lazily.

## Backend

The backend keeps its established layered design:

- `routes/` maps HTTP endpoints to controllers.
- `controllers/` handles HTTP input/output only.
- `services/` contains business use cases.
- `repositories/` owns Prisma data access.
- `validators/` owns request validation.
- `middlewares/`, `common/`, and `config/` contain cross-cutting concerns.

Dependencies flow inward from routes/controllers to services and repositories;
repositories must not depend on HTTP concerns.
