# MoneyMate Web Frontend

The frontend is the React/Vite web client for MoneyMate. It provides authenticated personal-finance workflows, reporting, administration, AI features, receipt scanning, and the CopilotKit-powered assistant.

## Stack

- React 18.3 and TypeScript
- Vite 8
- React Router
- Tailwind CSS and shared MoneyMate design tokens
- TanStack Query and Axios
- Zustand
- Recharts
- CopilotKit React v2 and Zod
- Vitest, Testing Library, and Storybook

## Source layout

```text
frontend/
├── src/
│   ├── assets/              # Asset exports
│   ├── components/          # Shared UI and feature components
│   ├── config/              # API, Copilot, and route configuration
│   ├── constants/           # Routes and storage keys
│   ├── contexts/            # Application and Copilot providers
│   ├── data/                # Static navigation data
│   ├── helpers/             # Navigation and view helpers
│   ├── hooks/               # Reusable feature hooks
│   ├── layouts/             # Authenticated application shell
│   ├── pages/               # Route-level screens
│   ├── services/            # Axios client and API integration
│   ├── stores/              # Zustand auth and theme state
│   ├── styles/              # Global and CopilotKit CSS
│   ├── test/                # Shared test setup and render helpers
│   ├── theme/               # Chart and theme integration
│   ├── types/               # Frontend-only types
│   └── utils/               # Formatting and date helpers
├── nginx.conf
└── vite.config.ts
```

## Setup

Install workspace dependencies from the repository root:

```bash
npm ci
```

Create the frontend environment file:

```powershell
Copy-Item frontend/.env.example frontend/.env
```

```bash
cp frontend/.env.example frontend/.env
```

Start the backend first, then start Vite:

```bash
npm run dev:frontend
```

The application runs at <http://localhost:5173>. During local development, Vite proxies `/api` to <http://localhost:5000>.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | No | API base URL; defaults to `/api` |
| `VITE_COPILOTKIT_ENABLED` | No | Enables the CopilotKit UI; defaults to `false` |

Use a same-origin `/api` value behind Nginx in production. Vite variables are compiled into the bundle, so rebuild after changing them.

## Routes

| Path | Screen |
| --- | --- |
| `/` | Dashboard |
| `/wallets` | Wallets |
| `/transactions` | Transactions |
| `/categories` | Categories |
| `/budgets` | Budgets |
| `/saving-goals` | Savings goals |
| `/recurring` | Recurring transactions |
| `/reports` | Reports |
| `/monthly-balance` | Monthly savings/balance |
| `/ai` | AI financial advisor |
| `/profile` | User profile |
| `/admin` | Administrator area |
| `/login`, `/register` | Public authentication screens |

Authenticated routes use route guards and the shared page layout. The admin route has a separate role guard.

## Data and state

- TanStack Query owns server data, caching, retries, and invalidation.
- The Axios client injects access tokens, refreshes sessions, and normalizes API behavior.
- Zustand stores authentication and theme state.
- Theme selection is persisted to local storage and applied through the root `.dark` class.
- Shared DTOs and design tokens come from the workspace packages under `packages/`.

See [src/theme/README.md](./src/theme/README.md) before changing palette, typography, dimensions, chart tokens, or Tailwind theme integration.

## CopilotKit assistant

The CopilotKit frontend mounts only when the user is authenticated and `VITE_COPILOTKIT_ENABLED=true`. The backend must also have `COPILOTKIT_ENABLED=true` and a valid OpenAI API key. When the frontend flag is disabled, MoneyMate uses the legacy chat widget.

The provider sends safe UI context to the agent, including the current route, screen name, theme, locale, local date, and time zone. It does not expose the access token as agent context.

Three browser-side tools are registered for the default agent:

- `recordExpense` opens a review form. The user must select or verify the wallet/category and explicitly confirm before the transaction API is called.
- `setAppTheme` applies and persists an exact `light` or `dark` theme.
- `navigateToPage` maps an allowlisted page identifier to an internal React Router route; it does not accept arbitrary URLs.

The runtime endpoint is derived from `VITE_API_URL` as `<api-base>/copilotkit`. Requests include the current bearer token and credentials.

## Styling and components

- Tailwind is extended with `@moneymate/design-tokens`.
- Global application styles live in `src/styles/index.css`.
- CopilotKit overrides live in `src/styles/copilotkit.css`.
- Reusable primitives live under `src/components/common`.
- Feature components keep their tests and Storybook stories next to the implementation.
- The interface supports light/dark themes, responsive layouts, keyboard focus, and reduced-motion preferences.

## Scripts

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run dev:frontend` | Start the Vite development server |
| `npm run build --workspace=moneymate-frontend` | Type-check and create a production bundle |
| `npm run lint --workspace=moneymate-frontend` | Run ESLint |
| `npm run test --workspace=moneymate-frontend` | Run the Vitest suite once |
| `npm run test:watch --workspace=moneymate-frontend` | Run Vitest in watch mode |
| `npm run test:coverage --workspace=moneymate-frontend` | Generate coverage reports |
| `npm run storybook --workspace=moneymate-frontend` | Start Storybook on port 6006 |
| `npm run build-storybook --workspace=moneymate-frontend` | Build the static Storybook site |

## Testing conventions

- Component and page tests use Vitest with jsdom and Testing Library.
- Shared render helpers are under `src/test`.
- API, route, store, hook, and utility logic should have focused unit coverage.
- Test user-visible outcomes and accessibility roles instead of component implementation details.

Run the standard checks with:

```bash
npm run lint --workspace=moneymate-frontend
npm run test --workspace=moneymate-frontend
npm run build --workspace=moneymate-frontend
```

## Production deployment

The frontend Dockerfile builds the Vite application and serves `dist/` with Nginx. The included Nginx configuration supports the SPA fallback and proxies `/api` to the backend service. Set build-time Vite variables through Docker build arguments or Docker Compose and rebuild whenever they change.
