# MoneyMate Business Rules

> Implementation reference, verified against the repository on 2026-09-24. Service and repository tests are authoritative when this summary and executable behavior differ.

## 1. Authentication and authorization

- Emails are trimmed, normalized to lowercase, and unique.
- Passwords contain at least eight characters at validation time and are stored with bcrypt using 10 salt rounds.
- Access tokens use HS256, expire after 15 minutes, and include user ID, email, and role.
- Refresh tokens expire after seven days, are stored only as SHA-256 hashes, rotate atomically, and belong to a token family.
- Reusing a revoked refresh token revokes the whole family.
- Logout and session revocation set `revokedAt`; audit records are retained.
- Users may access only their own records. Administrator endpoints require the `ADMIN` role.
- Login and registration are rate limited.

## 2. Wallets

- Supported wallet types are `CASH`, `BANK`, `CREDIT_CARD`, `E_WALLET`, and `SAVING`.
- Currency defaults to `VND`.
- The persisted `initialBalance` field currently acts as the mutable wallet amount for balance-affecting operations.
- Income credits the wallet. Transfers debit the source and credit the destination. Savings-goal deposits debit a wallet and withdrawals credit it.
- Expense records contribute to spending and reports but do not decrement the persisted wallet amount in the current implementation.
- A transfer requires two different active wallets owned by the user, a positive amount, and sufficient source balance.
- Transfers execute atomically and create two `TRANSFER` transaction records plus one `WalletTransfer` audit record.
- Deleting a wallet is a soft delete. Historical records remain, the wallet disappears from active queries, and active recurring schedules using it are disabled.

## 3. Categories

- Categories are strictly `INCOME` or `EXPENSE`.
- System categories have `userId=null` and are available to every user.
- Custom categories belong to one user.
- Custom category names are unique per user and type.
- A transaction or recurring schedule category must match its income/expense type.
- Budgets may reference only expense categories or use the global scope.

## 4. Transactions and transfers

- Normal transaction creation accepts only `INCOME` or `EXPENSE`; transfers use the dedicated transfer endpoint.
- Amounts must be positive.
- Normal transaction dates cannot be in the future.
- Wallets and custom categories must belong to the authenticated user; system categories are allowed.
- Lists support search, wallet/category/type/date filters, sorting, and bounded pagination.
- Updates and deletes use an optional client version and an atomic database version check. Conflicts return `VERSION_CONFLICT`.
- Deleting a normal transaction sets `deletedAt` and increments its version so mobile sync receives a tombstone.
- Transfer transactions cannot be edited or deleted through the normal transaction endpoints.
- Create-transaction and transfer requests support user-scoped idempotency keys and request hashes.

## 5. Budgets

- A budget has a positive amount, month, year, and either a global scope or one expense category.
- Only one budget may exist for each `(user, category scope, month, year)` tuple.
- Usage is calculated from non-deleted expense transactions for the selected period.
- Status is `OK` below 80%, `WARNING` from 80% to below 100%, and `EXCEEDED` at 100% or above.
- Threshold flags are atomically claimed so each warning/exceeded level is notified once per budget state.
- Budget alerts are processed after an expense commit. Notification failure does not roll back the financial transaction.
- Exceeding a budget does not block an expense.

## 6. Savings goals

- A goal requires a positive target amount and a target date.
- Status is derived rather than persisted: `COMPLETED` when current amount reaches the target, `EXPIRED` when the target date has passed, otherwise `ACTIVE`.
- A deposit requires an active wallet owned by the user, a positive amount, and sufficient wallet balance.
- Deposits and withdrawals update both wallet and goal amounts atomically and create `GoalTransaction` history.
- Withdrawals cannot exceed the goal's current amount.
- A completed goal triggers a best-effort notification.
- A goal can be deleted only when its current amount is zero and it has no funding history.

## 7. Recurring transactions

- Supported frequencies are `DAILY`, `WEEKLY`, `MONTHLY`, and `YEARLY`.
- A schedule references an active owned wallet and an accessible category with the same type.
- Pausing stops generation. Resuming resets the recurrence anchor and next execution time to the resume time; paused occurrences are skipped.
- The backend checks due schedules at startup and every 24 hours while the process remains alive.
- Processing catches up missed occurrences chronologically, with a maximum of 100 occurrences per schedule per run.
- The processor atomically advances `nextExecutionDate` before creating linked transactions, preventing duplicate claims by concurrent workers.
- Recurring income credits a wallet. Recurring expenses affect reporting and budget alerts under the same rules as normal expenses.
- Transaction creation and schedule advancement are atomic; notifications and post-commit budget alerts are best effort.

## 8. Reports and snapshots

- Dashboard and report queries exclude soft-deleted wallets and transactions.
- Reports provide current wallet totals, monthly income/expense aggregates, category breakdowns, trends, and yearly summaries.
- Monthly savings snapshots cache closed-period calculations and carry a formula version.
- Writes that affect a closed period invalidate the matching snapshot so it can be recalculated.
- Excel and PDF exports use the same authenticated monthly reporting scope.

## 9. Attachments and OCR

- Uploads accept JPEG, PNG, WEBP, and PDF files up to 5 MiB.
- Attachments may use local storage in development or S3-compatible storage in production.
- Attachment reads and deletes must validate ownership through the associated transaction.
- Receipt OCR returns proposed data for user review; it does not automatically create a transaction.

## 10. Notifications and devices

- Notifications belong to one user and may be listed, marked read individually or in bulk, and deleted.
- Push device registration supports iOS and Android and is unique per `(user, device, provider)` while the provider token is globally unique.
- Budget, goal, and recurring workflows create in-app notifications; push delivery is an optional side effect.

## 11. Mobile synchronization

- Transaction sync uses a bounded opaque cursor derived from `(updatedAt, id)`.
- Sync responses include soft-delete tombstones.
- The mobile outbox retries supported mutations with stable idempotency keys and exponential backoff.
- A conflict must be shown to the user or resolved explicitly; the client must not silently overwrite a newer server version.

## 12. AI and Copilot

- AI output is advisory and must not be presented as guaranteed financial or investment results.
- Personal financial numbers require an authenticated, user-scoped tool call; the model must not invent them from chat text.
- Copilot financial tools are read-only.
- `recordExpense` requires explicit confirmation before calling the transaction API.
- `setAppTheme` accepts only `light` or `dark`.
- `navigateToPage` accepts only allowlisted internal pages and cannot navigate to arbitrary URLs.
- The Copilot cannot edit or delete transactions.
- Model errors must be converted to safe user-facing messages without exposing secrets or provider internals.
