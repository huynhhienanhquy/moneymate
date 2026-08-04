# MoneyMate architecture

MoneyMate is an npm workspace containing independently deployable `frontend` and
`backend` applications. Each application owns its own dependencies and runtime
configuration; the root package only provides repository-wide commands.

## Frontend

`frontend/src` follows a feature-first structure:

- `app/`: application bootstrap, providers, and routing.
- `features/<feature>/pages/`: route-level UI, grouped by business capability.
- `shared/api/`: HTTP client and transport concerns.
- `shared/components/`: reusable UI composed across features.
- `shared/stores/`: cross-feature client state.

Imports from outside a feature use the `@/` alias. Route-level pages are loaded
lazily so a user only downloads the feature they open.

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
