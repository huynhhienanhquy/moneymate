# MoneyMate User Stories

> Current product baseline, verified against the repository on 2026-09-24.

## US-01 — Register and sign in securely

**As a visitor, I want to create an account and sign in, so that my financial records are private and available across devices.**

Acceptance criteria:

- Registration validates full name, normalized unique email, and a password of at least eight characters.
- Login returns a short-lived access token and creates a rotating refresh session.
- Invalid credentials use a generic error and login/registration are rate limited.
- Web and mobile receive refresh credentials through their appropriate secure transport.

## US-02 — Manage devices and account

**As a user, I want to review sessions and manage my profile, so that I stay in control of my account.**

Acceptance criteria:

- I can view active sessions and revoke one or all of them.
- I can update my name/avatar metadata and change my password after confirming the current password.
- I can delete my account only after password confirmation.
- Refresh-token replay revokes the affected token family.

## US-03 — Manage wallets and categories

**As a user, I want separate wallets and personal categories, so that my records match how I manage money.**

Acceptance criteria:

- I can create, edit, list, and archive supported wallet types.
- Archived wallets disappear from active lists while historical records remain.
- I can use read-only system categories and manage my own income/expense categories.
- The API rejects wallets/categories owned by another user and type mismatches.

## US-04 — Record and find transactions

**As a user, I want to record and organize income and expenses, so that reports reflect my activity.**

Acceptance criteria:

- I can create an income or expense with positive amount, owned wallet, compatible category, date, and optional note.
- A normal transaction date cannot be in the future.
- I can search, filter, sort, and paginate transactions.
- I can update or soft-delete a normal transaction, and stale versions produce a conflict instead of overwriting newer data.

## US-05 — Transfer between wallets

**As a user, I want to transfer money between my wallets, so that balances stay consistent.**

Acceptance criteria:

- Source and destination must be different active wallets owned by me.
- The amount must be positive and the source must have sufficient balance.
- Debit, credit, transfer audit record, and linked transaction records commit atomically.
- Retrying the same idempotent request does not create a duplicate transfer.

## US-06 — Plan with budgets

**As a user, I want monthly global or category budgets, so that I can detect overspending.**

Acceptance criteria:

- I can create one budget per scope/month/year and update or delete it.
- The UI shows limit, spent, remaining, utilization percentage, and status.
- I receive one warning at 80% and one exceeded notification at 100% or above.
- Exceeding a budget does not block a valid expense.

## US-07 — Fund savings goals

**As a user, I want to move money between wallets and goals, so that I can track progress toward a target.**

Acceptance criteria:

- I can create a goal with a positive target and target date.
- Deposits require sufficient owned-wallet balance and update wallet, goal, and history atomically.
- Withdrawals cannot exceed the saved amount and credit an owned wallet.
- Completed/expired/active status and progress are derived consistently.
- A goal with funds or funding history cannot be deleted.

## US-08 — Automate recurring activity

**As a user, I want recurring income and expense schedules, so that routine records are created automatically.**

Acceptance criteria:

- I can manage daily, weekly, monthly, and yearly schedules.
- I can pause a schedule and resume it without generating the paused period.
- Due occurrences are generated once even if processors overlap.
- Missed occurrences are caught up in order within a bounded run.

## US-09 — Understand reports

**As a user, I want dashboards and reports, so that I can understand financial trends.**

Acceptance criteria:

- The dashboard shows wallet totals, current-period metrics, and recent transactions.
- Monthly reports show summary values and expense categories.
- Trend and yearly views use bounded date ranges and exclude deleted data.
- I can export a selected month as PDF or Excel.

## US-10 — Attach and scan receipts

**As a user, I want to attach or scan receipts, so that I can keep evidence and reduce manual entry.**

Acceptance criteria:

- JPEG, PNG, WEBP, and PDF files up to 5 MiB are accepted.
- I can list, download, and delete attachments only for my own transactions.
- OCR proposes extracted fields for review rather than saving automatically.
- Storage/provider failures produce a recoverable user-facing error.

## US-11 — Receive notifications

**As a user, I want relevant alerts, so that I notice budget, goal, and recurring events.**

Acceptance criteria:

- I can list, mark read, mark all read, and delete my notifications.
- iOS/Android devices can register and unregister push tokens.
- Push delivery is optional and does not roll back committed financial data.

## US-12 — Work offline on mobile

**As a mobile user, I want safe offline behavior, so that temporary network loss does not duplicate or lose supported changes.**

Acceptance criteria:

- Supported offline mutations enter a persistent SQLite outbox.
- Replay uses the original idempotency key and bounded exponential backoff.
- Transaction deltas include edits and deletion tombstones after the saved cursor.
- Conflicts are visible and are not silently overwritten.

## US-13 — Ask the financial Copilot

**As a user, I want to ask natural-language questions, so that aggregate financial information is easier to understand.**

Acceptance criteria:

- Personal numbers come from authenticated, user-scoped read-only tools.
- Answers identify relevant time periods and format VND clearly.
- The Copilot states limitations instead of inventing unavailable data.
- Provider and connection errors are shown without exposing internal details or secrets.

## US-14 — Control the app through Copilot

**As a user, I want the Copilot to perform simple app actions, so that I can navigate and adjust the interface conversationally.**

Acceptance criteria:

- I can request light or dark mode and the exact theme is persisted.
- I can request a supported MoneyMate page; arbitrary external URLs are rejected by design.
- I can describe an expense and review the proposed amount/date/category/wallet before saving.
- Canceling the confirmation does not create a transaction.
- The Copilot cannot edit or delete transactions.

## US-15 — Administer users

**As an administrator, I want a protected user-management area, so that authorized operations staff can support the service.**

Acceptance criteria:

- Only an authenticated `ADMIN` can enter the admin route or call admin APIs.
- An administrator can list, inspect, update, and delete user accounts.
- Standard users receive an authorization failure without admin data leakage.
