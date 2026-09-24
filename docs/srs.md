# MoneyMate Software Requirements Specification

> Version 3.0 — implementation-aligned baseline, 2026-09-24.

## 1. Purpose

This specification defines the current scope, architecture, external interfaces, constraints, and verification expectations for MoneyMate. Detailed requirement identifiers live in [requirements.md](./requirements.md), while domain invariants live in [business_rules.md](./business_rules.md).

## 2. Product scope

MoneyMate is a Vietnamese-oriented personal finance system delivered through a React web application and an Expo iOS/Android application backed by one Express/MySQL API.

The product supports:

- accounts, rotating multi-device sessions, profiles, and administration;
- wallets, categories, income/expense records, and atomic wallet transfers;
- budgets, savings goals, recurring transactions, notifications, and attachments;
- dashboards, monthly/yearly analytics, trend data, and Excel/PDF exports;
- mobile offline replay and transaction delta synchronization;
- receipt OCR, AI analysis/advice, and an authenticated financial Copilot;
- light/dark themes and Copilot-driven application navigation.

## 3. Users

### 3.1 Standard user

Manages only their own financial data, sessions, devices, profile, exports, AI requests, and application preferences.

### 3.2 Administrator

Uses a protected administration area to list, inspect, update, or delete users. Administrator access does not remove the need for authentication and route authorization.

### 3.3 Operations team

Maintains infrastructure, secrets, database migrations/backups, attachment storage, optional AI/push integrations, monitoring, and release processes. Operations access is outside the end-user product UI.

## 4. System architecture

```text
React web ──────┐
                ├── Express API ── Prisma ── MySQL
Expo mobile ────┘        │
                         ├── Object storage
                         ├── OpenAI/CopilotKit (optional)
                         └── Expo push service (optional)
```

The API is the authorization and business-rule boundary. Web and mobile clients share contracts and selected domain/design packages but retain platform-specific UI and storage adapters.

See [architecture.md](./architecture.md) and [erd.md](./erd.md) for details.

## 5. Functional overview

### 5.1 Identity and sessions

Registration creates a standard user. Login returns a 15-minute JWT access token and a seven-day rotating refresh session. Web uses an HttpOnly refresh cookie; mobile uses SecureStore with a response-body refresh token. Users can inspect and revoke sessions. Account deletion requires password confirmation.

Password reset by email is not implemented in the current baseline.

### 5.2 Financial records

Users manage wallets and system/custom categories, record income and expenses, and transfer between owned wallets. Transaction lists support search, filtering, sorting, and pagination. Mobile sync consumes versioned updates and deletion tombstones. Transfers use a dedicated immutable workflow.

### 5.3 Planning and automation

Budgets track global or category spending by month and issue threshold notifications. Savings goals accept atomic wallet deposits/withdrawals and expose derived progress/status. Recurring schedules support daily, weekly, monthly, and yearly generation with bounded catch-up.

### 5.4 Reporting

The dashboard provides current summary values and recent transactions. Monthly, yearly, category, and trend endpoints power web/mobile visualizations. Authenticated monthly exports are available as PDF and Excel. Closed-period snapshots support repeatable historical reporting.

### 5.5 Files and notifications

Users can manage transaction attachments. Uploads are limited by MIME type and size and may be stored locally or in S3-compatible storage. In-app notifications support read/delete workflows; mobile devices can register Expo push tokens.

### 5.6 AI and Copilot

Optional AI endpoints provide analysis, forecasting, advisor insights, chat, and receipt OCR. The Copilot runtime supplies five read-only aggregate financial tools. Browser tools prepare an expense with human confirmation, apply a theme, or navigate to an allowlisted route.

AI output is advisory. The model must call a user-scoped tool before presenting personal financial numbers and must never receive server secrets.

## 6. External interfaces

### 6.1 HTTP API

- JSON APIs are rooted at `/api`.
- OpenAPI/Swagger UI is served at `/api-docs`.
- A health endpoint is served at `/health`.
- Authenticated requests use `Authorization: Bearer <access-token>`.
- Browser refresh uses credentials/cookies.
- Errors use a consistent safe response envelope and may include stable error codes.

### 6.2 Web interface

The React SPA provides public login/register pages, authenticated finance pages, a protected admin area, responsive navigation, light/dark themes, receipt scanning, and an optional Copilot popup. Route-level screens are lazy loaded.

### 6.3 Mobile interface

The Expo application provides corresponding finance screens plus SecureStore sessions, SQLite offline support, camera/OCR, biometrics, screenshot protection, notifications, and deep links. Native features require a compatible development or production build.

### 6.4 Third-party services

- MySQL stores relational data.
- S3-compatible storage is optional for attachments.
- OpenAI is optional for AI and Copilot.
- Expo/Apple/Google services are optional for mobile builds and notifications.

## 7. Data and consistency

- User data is isolated by authenticated ownership.
- Financial amounts use decimal database fields and VND is the default currency.
- Wallet and transaction soft deletion preserves historical/sync behavior.
- Normal transaction updates/deletes use optimistic versions.
- Supported mutation replay is guarded by user-scoped idempotency records.
- Multi-record financial writes use database transactions.
- Report snapshots are invalidated after relevant backdated changes.

## 8. Security and privacy

- Production requires HTTPS, strong JWT secrets, and exact configured browser origins.
- Passwords use bcrypt; refresh tokens are stored as hashes and rotated.
- Rate limits protect authentication and Copilot endpoints.
- Request size, message length, upload, pagination, tool-step, output, and timeout limits reduce abuse risk.
- Logs and model context must exclude credentials and unnecessary financial detail.
- Account deletion and provider/backups retention require operational procedures documented in the privacy policy.

## 9. Quality attributes

- **Reliability:** atomic financial operations, idempotent replay, optimistic conflicts, graceful shutdown, and verified migrations.
- **Maintainability:** strict TypeScript, layered backend, adjacent tests, and shared workspace packages.
- **Usability:** responsive screens, explicit loading/error/offline states, Vietnamese currency/date behavior, and safe confirmations.
- **Accessibility:** semantic controls, keyboard support, visible focus, reduced motion, and WCAG 2.1 AA intent.
- **Portability:** browser plus iOS/Android clients using one authenticated API.
- **Observability:** request IDs, safe structured error logging, health checks, and release monitoring.

## 10. Constraints and known limits

- CopilotKit and OpenAI features are disabled unless configured.
- Copilot thread ownership is in memory and follows the current runtime process lifetime; Rich Threads are not enabled.
- The recurring scheduler uses process startup plus a 24-hour interval, not an external distributed scheduler.
- Local attachment storage is not durable across ephemeral container replacement.
- Push, biometrics, camera, and deep-link behavior require physical-device validation.
- Performance must be measured in the target deployment; no fixed production latency is guaranteed by this repository.
- The Copilot can prepare an expense but cannot edit or delete transactions.

## 11. Verification

Acceptance requires proportionate checks across:

- backend unit tests and MySQL-backed integration tests;
- frontend Vitest, lint, type-check, and production build;
- mobile type-check, lint, Expo doctor/export, and physical-device smoke tests;
- migration rehearsal and restore testing;
- security checks for ownership, role boundaries, session replay, CORS/HTTPS, upload validation, and secret handling;
- end-to-end verification of optional OpenAI, storage, and push providers in staging.
