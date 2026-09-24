# MoneyMate

MoneyMate is a personal finance platform for tracking income and expenses, managing wallets and budgets, setting savings goals, automating recurring transactions, scanning receipts, and receiving AI-assisted financial insights.

The repository is an npm workspace containing a web application, an API, an Expo mobile application, and shared TypeScript packages.

## Features

- JWT-based registration, authentication, session refresh, and user/admin authorization.
- Wallet, category, transaction, transfer, budget, savings-goal, and recurring-transaction management.
- Dashboard summaries, monthly reports, trend charts, and Excel/PDF exports.
- In-app notifications, transaction attachments, receipt OCR, budget forecasting, and AI advice.
- A Vietnamese financial Copilot that reads user-scoped aggregate data, prepares expenses for explicit confirmation, switches light/dark mode, and navigates to supported application pages.
- OpenAPI documentation through Swagger UI.
- Web, iOS, and Android clients backed by shared contracts, validation, domain utilities, and design tokens.

## Technology stack

| Area | Technology |
| --- | --- |
| Web | React 18.3, Vite 8, TypeScript, Tailwind CSS |
| Mobile | React 19.2, React Native 0.86, Expo SDK 57, Expo Router, SQLite |
| Client state and data | Zustand, TanStack Query, Axios |
| API | Node.js, Express, TypeScript, Zod |
| Database | MySQL 8, Prisma ORM |
| AI and OCR | OpenAI API, CopilotKit v2, Tesseract.js |
| Testing | Jest, ts-jest, Supertest, Vitest 5 |
| Deployment | Docker, Docker Compose, Nginx |

## Repository layout

```text
moneymate/
├── backend/                    # Express API, Prisma, AI, and Copilot runtime
├── frontend/                   # React/Vite web application
├── apps/mobile/                # Expo application for iOS and Android
├── packages/
│   ├── api-core/               # Shared API helpers
│   ├── contracts/              # Cross-platform DTOs and contracts
│   ├── design-tokens/          # Shared visual tokens
│   ├── domain/                 # Shared domain logic
│   └── validation/             # Shared validation schemas
├── docs/                       # Architecture and product documentation
├── docker-compose.yml
└── package.json                # Workspace scripts
```

Workspace-specific documentation:

- [Backend](./backend/README.md)
- [Web frontend](./frontend/README.md)
- [Mobile app](./apps/mobile/README.md)
- [Web theme](./frontend/src/theme/README.md)

## Requirements

- Node.js 22.13 or later. The recommended version is recorded in `.nvmrc`.
- npm.
- MySQL 8 for local development, or Docker with Docker Compose.

## Quick start with Docker

Create the root environment file and provide strong, independent secrets:

```powershell
Copy-Item .env.example .env
```

```bash
cp .env.example .env
```

At minimum, set `MYSQL_ROOT_PASSWORD`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`, then run:

```bash
docker compose up --build
```

The backend container applies pending Prisma migrations before starting.

- Web: <http://localhost>
- API: <http://localhost:5000/api>
- Health check: <http://localhost:5000/health>
- Swagger UI: <http://localhost:5000/api-docs>

The defaults in `docker-compose.yml` are intended for development. Use strong secrets, HTTPS, production storage, and an explicit frontend origin in deployed environments.

## Local development

### 1. Install dependencies

Run installation from the repository root. The root `package-lock.json` is the source of truth for local development, CI, and Docker builds.

```bash
npm ci
```

### 2. Configure the applications

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
Copy-Item apps/mobile/.env.example apps/mobile/.env
```

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Update `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` in `backend/.env`. `OPENAI_API_KEY` is optional unless AI or CopilotKit features are enabled.

### 3. Prepare the database

Create a MySQL database named `moneymate`, then run:

```bash
npm run prisma:generate --workspace=moneymate-backend
npm run prisma:migrate --workspace=moneymate-backend
npm run prisma:seed --workspace=moneymate-backend
```

The seed command creates system categories only. It does not create demo or administrator credentials.

### 4. Start the API and web application

Run these commands in separate terminals:

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

The web application runs at <http://localhost:5173> and proxies local `/api` requests to the backend at <http://localhost:5000>.

To start Expo:

```bash
npm run dev:mobile
```

See the [mobile README](./apps/mobile/README.md) for device networking and native-feature requirements.

## CopilotKit

CopilotKit is disabled by default. For local end-to-end testing, configure an OpenAI API key with available credit and enable both sides:

```dotenv
# backend/.env
OPENAI_API_KEY=...
COPILOTKIT_ENABLED=true

# frontend/.env
VITE_COPILOTKIT_ENABLED=true
```

Restart the backend and Vite after changing the flags. The authenticated single endpoint is `POST /api/copilotkit`.

The server exposes five read-only, user-scoped financial tools. The browser exposes three UI tools:

- `recordExpense` prepares an expense and requires the user to confirm before any API write.
- `setAppTheme` switches the application to light or dark mode.
- `navigateToPage` opens an allowlisted MoneyMate route.

Example prompts include `open the reports page`, `turn on dark mode`, and `I spent VND 12 on food today`. Expense cancellation never writes a transaction, and the Copilot cannot edit or delete transactions.

Run the optional live model/schema check with:

```bash
npm run test:copilot-live --workspace=moneymate-backend
```

This command calls the configured paid API but does not save a transaction or send real financial records.

## Workspace scripts

| Command | Purpose |
| --- | --- |
| `npm run dev:frontend` | Start the Vite development server |
| `npm run dev:backend` | Start the API with Nodemon |
| `npm run dev:mobile` | Start the Expo development server |
| `npm run build` | Build shared packages, backend, web, and the mobile Android export |
| `npm run lint` | Lint the web and mobile applications |
| `npm test` | Run backend unit tests and frontend tests |
| `npm run test:integration` | Run backend integration tests |
| `npm run build:packages` | Build all shared workspace packages |

## Testing and release checks

```bash
npm test
npm run build
```

Backend integration tests use the isolated configuration in `backend/.env.test`. Never point the test suite at a production database. CI requires the MySQL integration database and also verifies the Docker Compose stack.

For mobile releases, follow [docs/mobile_release.md](./docs/mobile_release.md). An Expo bundle export does not replace testing biometrics, camera, push notifications, deep links, and offline behavior on physical devices.

## Documentation

- Start with the [documentation index](./docs/README.md) for ownership and maintenance guidance.
- System design: [architecture](./docs/architecture.md), [authentication sessions](./docs/auth_sessions.md), [ERD](./docs/erd.md), and [system diagrams](./docs/diagrams.md).
- Product requirements: [SRS](./docs/srs.md), [requirements](./docs/requirements.md), [business rules](./docs/business_rules.md), and [user stories](./docs/user_stories.md).
- Operations and policy: [mobile release runbook](./docs/mobile_release.md) and [privacy policy draft](./docs/privacy_policy.md).

When the backend is running, Swagger UI at <http://localhost:5000/api-docs> is the current source for endpoint, request, and response schemas.
