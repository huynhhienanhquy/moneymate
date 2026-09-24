# MoneyMate Backend

The backend is a TypeScript/Express API for MoneyMate. It owns authentication, financial business rules, persistence, attachments, exports, AI services, and the authenticated CopilotKit runtime.

## Stack

- Node.js and Express
- TypeScript and Zod
- MySQL 8 and Prisma ORM
- JWT access/refresh sessions
- OpenAI, CopilotKit v2, and Tesseract.js
- Local or S3-compatible attachment storage
- Jest, ts-jest, and Supertest

## Architecture

```text
backend/
├── prisma/                 # Schema, migrations, and system-category seed
├── scripts/                # Startup, integration, and live Copilot checks
└── src/
    ├── common/             # Errors, responses, recurrence, and utilities
    ├── config/             # Database, CORS, Swagger, AI, and Copilot config
    ├── controllers/        # HTTP request/response handling
    ├── copilotkit/         # Runtime, prompt, auth, security, and tools
    ├── middlewares/        # Auth, rate limits, validation, upload, and errors
    ├── repositories/       # Prisma data access
    ├── routes/             # Express route registration
    ├── services/           # Business logic, exports, OCR, AI, and storage
    ├── validators/         # Request schemas
    └── __tests__/          # Unit and integration tests
```

The normal request flow is route → middleware → controller → service → repository → Prisma. Business rules belong in services; database access belongs in repositories.

## Setup

Install all workspace dependencies from the repository root:

```bash
npm ci
```

Create the backend environment file:

```powershell
Copy-Item backend/.env.example backend/.env
```

```bash
cp backend/.env.example backend/.env
```

Create the `moneymate` MySQL database, update `DATABASE_URL`, and use independent JWT secrets. Then prepare Prisma:

```bash
npm run prisma:generate --workspace=moneymate-backend
npm run prisma:migrate --workspace=moneymate-backend
npm run prisma:seed --workspace=moneymate-backend
```

Start the API:

```bash
npm run dev:backend
```

- API base: <http://localhost:5000/api>
- Health check: <http://localhost:5000/health>
- Swagger UI: <http://localhost:5000/api-docs>

## API groups

| Prefix | Responsibility |
| --- | --- |
| `/api/auth` | Registration, login, refresh, logout, and device sessions |
| `/api/users` | Profile and account operations |
| `/api/wallets` | Wallet lifecycle and balances |
| `/api/categories` | System and user categories |
| `/api/transactions` | Income, expenses, transfers, reports, and exports |
| `/api/budgets` | Monthly budgets and utilization |
| `/api/saving-goals` | Savings goals and contributions |
| `/api/recurring-transactions` | Recurring schedules and execution |
| `/api/notifications` | Notification inbox and device registration |
| `/api/attachments` | Transaction attachment upload and access |
| `/api/ai` | AI analysis, advice, forecasting, chat, and OCR |
| `/api/admin` | Administrator-only operations |
| `/api/copilotkit` | Authenticated CopilotKit v2 runtime when enabled |

Use Swagger UI for the complete and current endpoint schemas.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | API port; defaults to `5000` |
| `DATABASE_URL` | Yes | MySQL connection URL used by Prisma |
| `JWT_ACCESS_SECRET` | Yes | Access-token signing secret |
| `JWT_REFRESH_SECRET` | Yes | Refresh-token signing secret |
| `NODE_ENV` | No | `development`, `test`, or `production` |
| `FRONTEND_URL` | Yes in production | Comma-separated browser origins allowed by CORS |
| `STORAGE_DRIVER` | No | `local` by default, or `s3` |
| `S3_BUCKET` | For S3 | Attachment bucket |
| `S3_REGION` | For S3 | Bucket region |
| `S3_PUBLIC_URL` | For S3 | Public attachment base URL |
| `S3_ENDPOINT` | No | Custom S3-compatible endpoint |
| `S3_FORCE_PATH_STYLE` | No | Enable path-style S3 requests |
| `OPENAI_API_KEY` | For AI/Copilot | Enables OpenAI-backed features |
| `AI_MODEL` | No | Legacy AI model; defaults to `gpt-4o-mini` |
| `AI_MAX_TOKENS` | No | Legacy AI response limit; defaults to `1500` |
| `COPILOTKIT_ENABLED` | No | Enables the Copilot runtime; defaults to `false` |
| `COPILOT_MODEL` | When Copilot is enabled | OpenAI provider/model; defaults to `openai/gpt-4o-mini` |
| `COPILOT_MAX_STEPS` | No | Agent step limit from `1` to `8` |
| `COPILOT_MAX_OUTPUT_TOKENS` | No | Output-token limit from `256` to `4096` |
| `COPILOT_MAX_MESSAGE_CHARS` | No | Maximum characters per user message |
| `COPILOT_MODEL_TIMEOUT_MS` | No | Timeout for a model run |
| `COPILOT_RATE_LIMIT_MAX_REQUESTS` | No | Requests allowed in each Copilot rate-limit window |
| `COPILOT_RATE_LIMIT_WINDOW_MS` | No | Copilot rate-limit window length |
| `COPILOTKIT_TELEMETRY_DISABLED` | No | Disables anonymous SDK telemetry; defaults to `true` |
| `AUTH_LOGIN_RATE_LIMIT_MAX` | No | Login attempts per rate-limit window |
| `AUTH_LOGIN_RATE_LIMIT_WINDOW_MS` | No | Login rate-limit window length |
| `AUTH_REGISTER_RATE_LIMIT_MAX` | No | Registration attempts per rate-limit window |
| `AUTH_REGISTER_RATE_LIMIT_WINDOW_MS` | No | Registration rate-limit window length |

Both JWT secrets are mandatory. Production startup also rejects known example values and secrets shorter than 32 characters.

## Authentication and security

- Access tokens are sent as `Authorization: Bearer <token>`.
- Refresh sessions use secure rotation and device-aware records.
- Login and registration have configurable in-memory rate limits.
- Production CORS accepts only origins listed in `FRONTEND_URL`.
- Request IDs are attached for tracing and safe error responses.
- File uploads are validated before local or S3-compatible storage.
- Idempotency keys protect supported mutation flows from duplicate writes.

## CopilotKit runtime

Enable the runtime only when `OPENAI_API_KEY` is configured:

```dotenv
COPILOTKIT_ENABLED=true
OPENAI_API_KEY=...
COPILOT_MODEL=openai/gpt-4o-mini
```

The runtime provides five read-only financial tools scoped to the authenticated user:

- `getFinancialOverview`
- `getExpenseBreakdown`
- `getBudgetStatus`
- `getSavingGoals`
- `compareMonthlySpending`

The runtime validates thread ownership, message size, model/provider configuration, tool-step limits, request rate limits, timeouts, HTTPS/origin requirements in production, and client disconnect cancellation. Browser-side mutation and UI tools are documented in the [frontend README](../frontend/README.md).

## Scripts

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run dev:backend` | Start the API with Nodemon |
| `npm run build --workspace=moneymate-backend` | Compile TypeScript to `backend/dist` |
| `npm run prisma:generate --workspace=moneymate-backend` | Generate the Prisma client |
| `npm run prisma:migrate --workspace=moneymate-backend` | Apply development migrations |
| `npm run prisma:seed --workspace=moneymate-backend` | Seed system categories |
| `npm run test:unit --workspace=moneymate-backend` | Run unit tests |
| `npm run test:integration --workspace=moneymate-backend` | Run integration tests |
| `npm run test:all --workspace=moneymate-backend` | Run unit and integration tests |
| `npm run test:coverage --workspace=moneymate-backend` | Generate Jest coverage |
| `npm run test:dev-startup --workspace=moneymate-backend` | Start the API, check `/health`, and stop it |
| `npm run test:copilot-live --workspace=moneymate-backend` | Call the configured model to validate the Copilot schema |

Integration tests read `backend/.env.test`. If MySQL is unavailable, database-dependent tests are skipped locally; set `REQUIRE_DATABASE_INTEGRATION=true` to fail instead. CI always requires the integration database. Never use a production database for tests.

## Production notes

- The backend Docker image runs `prisma migrate deploy` before starting the compiled server.
- Set `FRONTEND_URL` to the exact HTTPS origins that may call the API.
- Ensure the reverse proxy forwards `X-Forwarded-Proto` correctly.
- Use S3-compatible storage when local container storage is not durable.
- Back up and test database restore procedures before applying production migrations.
