# MoneyMate Requirements

> Current product baseline, verified against the repository on 2026-09-24.

The keywords **must**, **should**, and **may** indicate required, recommended, and optional behavior. This document describes the current web/API/mobile scope; Swagger and executable validation remain authoritative for wire-level details.

## 1. Functional requirements

### 1.1 Accounts and sessions

- **FR-AUTH-01**: A visitor must be able to register with full name, unique email, and password.
- **FR-AUTH-02**: A user must be able to sign in on web, iOS, and Android.
- **FR-AUTH-03**: The system must issue a short-lived access token and a rotating refresh session appropriate to the client platform.
- **FR-AUTH-04**: A user must be able to list active sessions and revoke one or all sessions.
- **FR-AUTH-05**: A user must be able to view and update profile information and change their password.
- **FR-AUTH-06**: Account deletion must require password confirmation and remove relational user data.
- **FR-AUTH-07**: Administrator functionality must be restricted to users with the `ADMIN` role.

### 1.2 Wallets and categories

- **FR-WALLET-01**: Users must be able to create, list, view, update, and archive multiple wallets.
- **FR-WALLET-02**: Wallets must support cash, bank, credit-card, e-wallet, and savings types with a currency value.
- **FR-WALLET-03**: Users must be able to transfer a positive amount between two owned wallets when the source balance is sufficient.
- **FR-CATEGORY-01**: The system must provide shared system categories.
- **FR-CATEGORY-02**: Users must be able to manage custom income and expense categories with color and icon metadata.
- **FR-CATEGORY-03**: Category ownership and type must be validated anywhere a category is referenced.

### 1.3 Transactions and synchronization

- **FR-TX-01**: Users must be able to create, list, view, update, and soft-delete income and expense records.
- **FR-TX-02**: Transaction lists must support search, filters, sorting, and pagination.
- **FR-TX-03**: Normal transaction dates must not be in the future.
- **FR-TX-04**: Updates and deletes must detect stale versions when a version is supplied.
- **FR-TX-05**: Supported mutation endpoints must accept idempotency keys to prevent duplicate replay.
- **FR-TX-06**: Mobile clients must be able to request transaction deltas and deletion tombstones using an opaque cursor.
- **FR-TX-07**: Transfers must use a dedicated atomic workflow and remain immutable through normal transaction endpoints.

### 1.4 Budgets and savings goals

- **FR-BUDGET-01**: Users must be able to manage one global or category budget per month and year.
- **FR-BUDGET-02**: Budget responses must include amount, spent, remaining, percentage, and status.
- **FR-BUDGET-03**: The system must create one warning and one exceeded notification when the relevant thresholds are first reached.
- **FR-GOAL-01**: Users must be able to manage savings goals with target amount and target date.
- **FR-GOAL-02**: Users must be able to deposit from and withdraw to owned wallets atomically.
- **FR-GOAL-03**: Goal progress and active/completed/expired status must be derived from current values.
- **FR-GOAL-04**: Funded goal history must not be discarded through deletion.

### 1.5 Recurring transactions

- **FR-REC-01**: Users must be able to create, update, pause/resume, list, and delete recurring income or expense schedules.
- **FR-REC-02**: Daily, weekly, monthly, and yearly frequencies must be supported.
- **FR-REC-03**: The processor must create due occurrences without duplicate concurrent claims.
- **FR-REC-04**: The processor must catch up missed occurrences within a bounded run and retain the link from generated transactions to their schedule.

### 1.6 Dashboard, reports, and exports

- **FR-REPORT-01**: The dashboard must show wallet totals, current-period income/expense/savings information, and recent transactions.
- **FR-REPORT-02**: Monthly reports must include category breakdowns and comparison-ready aggregates.
- **FR-REPORT-03**: The system must provide a bounded monthly trend and a yearly report.
- **FR-REPORT-04**: Users must be able to export an authenticated monthly report as Excel or PDF.
- **FR-REPORT-05**: Closed-period snapshot caches must be invalidated after backdated changes.

### 1.7 Attachments, notifications, and native capabilities

- **FR-FILE-01**: Users must be able to upload, list, download, and delete owned transaction attachments.
- **FR-FILE-02**: Uploads must enforce allowlisted types and a 5 MiB limit.
- **FR-NOTIFY-01**: Users must be able to list, mark read, mark all read, and delete notifications.
- **FR-NOTIFY-02**: Mobile clients must be able to register and unregister push devices.
- **FR-MOBILE-01**: The mobile application must support secure credential storage, an offline mutation outbox, and cursor-based transaction synchronization.
- **FR-MOBILE-02**: Camera/OCR, biometrics, privacy protection, push notifications, and deep links must be available in compatible native builds.

### 1.8 AI and Copilot

- **FR-AI-01**: Authenticated users must be able to request expense analysis, budget forecasts, advisor insights, chat, and receipt OCR when AI is configured.
- **FR-COPILOT-01**: The Copilot must expose only user-scoped aggregate financial reads from server tools.
- **FR-COPILOT-02**: Recording an expense through Copilot must display a human confirmation UI before any write.
- **FR-COPILOT-03**: The Copilot must be able to set light/dark mode and navigate only to allowlisted internal pages.
- **FR-COPILOT-04**: The application must provide a safe fallback chat experience when CopilotKit is disabled.

### 1.9 Administration

- **FR-ADMIN-01**: Administrators must be able to list, inspect, update, and delete users.
- **FR-ADMIN-02**: Admin operations must be protected independently of normal authenticated routes.

## 2. Non-functional requirements

### 2.1 Security and privacy

- **NFR-SEC-01**: Production traffic must use HTTPS; exact browser origins must be configured.
- **NFR-SEC-02**: Passwords must use bcrypt and refresh tokens must be stored only as hashes.
- **NFR-SEC-03**: All private resources must enforce authentication, role checks where applicable, and user ownership.
- **NFR-SEC-04**: Inputs, uploads, pagination, AI messages, and Copilot requests must be bounded and validated.
- **NFR-SEC-05**: Secrets must remain server-side and must never enter logs, frontend bundles, or model context.
- **NFR-SEC-06**: Production JWT secrets must be independent, non-example values of at least 32 characters.

### 2.2 Data integrity and reliability

- **NFR-DATA-01**: Multi-record financial mutations must be atomic.
- **NFR-DATA-02**: Retryable mutations must use stable idempotency keys.
- **NFR-DATA-03**: Concurrent transaction edits must not silently overwrite newer versions.
- **NFR-DATA-04**: Soft-deleted sync entities must remain available as tombstones.
- **NFR-DATA-05**: Database migrations require backup, verified restore, staging validation, and forward-fix rollback planning.

### 2.3 Performance and scalability

- **NFR-PERF-01**: Lists and sync endpoints must use bounded page sizes.
- **NFR-PERF-02**: Queries for user/date, recurring due items, sync cursors, sessions, and idempotency expiry should use indexed access paths.
- **NFR-PERF-03**: Route-level web pages should remain lazy loaded.
- **NFR-PERF-04**: Performance targets must be measured in the deployment environment; the repository does not claim a guaranteed latency without load-test evidence.

### 2.4 Accessibility and usability

- **NFR-UX-01**: Web and mobile must support light/dark themes and responsive layouts.
- **NFR-UX-02**: Keyboard navigation, visible focus, semantic labels, reduced motion, and accessible chart summaries should meet WCAG 2.1 AA intent.
- **NFR-UX-03**: Loading, empty, error, offline, and conflict states must be explicit.
- **NFR-UX-04**: Currency and dates must be formatted consistently for the Vietnamese product locale.

### 2.5 Maintainability and observability

- **NFR-MAINT-01**: TypeScript strict mode and layered backend boundaries must be preserved.
- **NFR-MAINT-02**: Shared contracts and tokens should remain in workspace packages rather than being duplicated across clients.
- **NFR-MAINT-03**: Material behavior changes require focused unit/integration tests and updated documentation.
- **NFR-OPS-01**: API responses and logs should carry request IDs without exposing credentials or personal financial payloads.
- **NFR-OPS-02**: Services must shut down gracefully and disconnect database clients.
