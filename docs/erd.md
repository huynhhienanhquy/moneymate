# MoneyMate Entity Relationship Model

> Derived from `backend/prisma/schema.prisma`, verified on 2026-09-24. The Prisma schema and migrations are authoritative.

## Entity relationship diagram

```mermaid
erDiagram
    User ||--o{ Wallet : owns
    User ||--o{ Category : creates
    User ||--o{ Transaction : records
    User ||--o{ Budget : defines
    User ||--o{ SavingGoal : owns
    User ||--o{ RecurringTransaction : schedules
    User ||--o{ Notification : receives
    User ||--o{ RefreshToken : authenticates
    User ||--o{ DeviceToken : registers
    User ||--o{ IdempotencyRecord : scopes
    User ||--o{ WalletTransfer : initiates
    User ||--o{ MonthlySavingsSnapshot : caches

    Wallet ||--o{ Transaction : contains
    Wallet ||--o{ RecurringTransaction : funds
    Wallet ||--o{ GoalTransaction : funds
    Wallet ||--o{ WalletTransfer : source
    Wallet ||--o{ WalletTransfer : destination

    Category ||--o{ Transaction : classifies
    Category ||--o{ Budget : limits
    Category ||--o{ RecurringTransaction : classifies

    SavingGoal ||--o{ GoalTransaction : tracks
    RecurringTransaction o|--o{ Transaction : generates
    Transaction ||--o{ Attachment : has

    User {
        string id PK
        string email UK
        string passwordHash
        string fullName
        string avatarUrl "nullable"
        Role role
        datetime createdAt
        datetime updatedAt
    }

    Wallet {
        string id PK
        string userId FK
        string name
        WalletType type
        string currency
        decimal initialBalance
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "nullable"
    }

    Category {
        string id PK
        string userId FK "nullable for system categories"
        string name
        CategoryType type
        string color
        string icon
        datetime createdAt
        datetime updatedAt
    }

    Transaction {
        string id PK
        string userId FK
        string walletId FK
        string categoryId FK
        string recurringTransactionId FK "nullable"
        decimal amount
        TransactionType type
        text note "nullable"
        datetime transactionDate
        int version
        datetime deletedAt "nullable"
        datetime createdAt
        datetime updatedAt
    }

    Budget {
        string id PK
        string userId FK
        string categoryId FK "nullable for global budget"
        string categoryScope
        decimal amount
        int month
        int year
        boolean warningNotified
        boolean exceededNotified
        datetime createdAt
        datetime updatedAt
    }

    SavingGoal {
        string id PK
        string userId FK
        string title
        decimal targetAmount
        decimal currentAmount
        datetime targetDate
        datetime createdAt
        datetime updatedAt
    }

    GoalTransaction {
        string id PK
        string savingGoalId FK
        string walletId FK
        decimal amount
        GoalTransactionType type
        datetime createdAt
    }

    RecurringTransaction {
        string id PK
        string userId FK
        string walletId FK
        string categoryId FK
        decimal amount
        CategoryType type
        Frequency frequency
        text note "nullable"
        datetime startDate
        datetime nextExecutionDate
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    Notification {
        string id PK
        string userId FK
        string title
        text message
        NotificationType type
        boolean isRead
        datetime createdAt
    }

    RefreshToken {
        string id PK
        string userId FK
        string tokenHash UK
        string tokenFamily
        string deviceId "nullable"
        string deviceName "nullable"
        string platform
        string appVersion "nullable"
        string timezone "nullable"
        datetime expiresAt
        datetime lastSeenAt
        datetime revokedAt "nullable"
        datetime createdAt
    }

    DeviceToken {
        string id PK
        string userId FK
        string deviceId
        string token UK
        string platform
        string provider
        string appVersion "nullable"
        string locale "nullable"
        string timezone "nullable"
        boolean isActive
        datetime lastSeenAt
        datetime createdAt
        datetime updatedAt
    }

    IdempotencyRecord {
        string id PK
        string userId FK
        string key
        string requestHash
        string status
        int statusCode "nullable"
        json responseBody "nullable"
        datetime createdAt
        datetime expiresAt
    }

    WalletTransfer {
        string id PK
        string userId FK
        string sourceWalletId FK
        string destinationWalletId FK
        decimal amount
        text note "nullable"
        datetime transferDate
        datetime createdAt
    }

    MonthlySavingsSnapshot {
        string id PK
        string userId FK
        int month
        int year
        decimal salaryIncome
        decimal otherIncome
        decimal expense
        decimal savings
        decimal walletBalance
        int formulaVersion
        datetime createdAt
    }

    Attachment {
        string id PK
        string transactionId FK "nullable before association"
        string url
        string filename
        string fileType
        int fileSize
        datetime createdAt
    }
```

## Enumerations

| Enum | Values |
| --- | --- |
| `Role` | `USER`, `ADMIN` |
| `WalletType` | `CASH`, `BANK`, `CREDIT_CARD`, `E_WALLET`, `SAVING` |
| `CategoryType` | `INCOME`, `EXPENSE` |
| `TransactionType` | `INCOME`, `EXPENSE`, `TRANSFER` |
| `GoalTransactionType` | `DEPOSIT`, `WITHDRAW` |
| `Frequency` | `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY` |
| `NotificationType` | `BUDGET_ALERT`, `BILL_REMINDER`, `GOAL_COMPLETED`, `RECURRING_TRANSACTION` |

## Key constraints and indexes

### Ownership and deletion

- Deleting a `User` cascades through directly owned relational data.
- `Wallet` and `Transaction` use nullable `deletedAt` timestamps for soft deletion.
- Transactions restrict wallet/category deletion at the database relation level.
- Attachments cascade when their associated transaction row is physically deleted.
- A recurring source on a generated transaction is nullable and becomes `NULL` if the schedule is deleted.

### Uniqueness

- User email is globally unique.
- Custom/system category identity is constrained by `(userId, name, type)`.
- A budget is unique by `(userId, categoryScope, month, year)`; `categoryScope` normalizes global versus category scope for MySQL uniqueness.
- Monthly snapshots are unique by `(userId, month, year)`.
- Refresh-token hashes and push-provider tokens are globally unique.
- Device registration is unique by `(userId, deviceId, provider)`.
- Idempotency keys are unique per user.

### Operational indexes

- Wallets: `(userId, deletedAt)`.
- Transactions: `(userId, updatedAt)`, `(userId, deletedAt, transactionDate)`, and `(recurringTransactionId, transactionDate)`.
- Recurring schedules: `(isActive, nextExecutionDate)`.
- Refresh sessions: `(userId, revokedAt)` and `tokenFamily`.
- Device tokens: `(userId, isActive)`.
- Idempotency records: `expiresAt`.

## Data semantics

- Monetary columns use `Decimal(15,2)`.
- VND is the default wallet currency, but the wallet schema stores a currency string.
- The field named `Wallet.initialBalance` currently stores the mutable wallet amount used by income, transfer, and savings-goal operations; the name is retained for migration compatibility.
- Expense transactions are reporting records in the current service behavior and do not decrement that stored wallet amount.
- `Transaction.version` and `deletedAt` support optimistic concurrency and mobile tombstone synchronization.
- `Budget.warningNotified` and `exceededNotified` prevent duplicate threshold notifications.
- `MonthlySavingsSnapshot.formulaVersion` supports invalidating/recomputing historical formulas.
- `IdempotencyRecord.requestHash` prevents reuse of the same key with a different request body.

## Migration policy

Schema changes must be introduced through new Prisma migrations. Production deployments use `prisma migrate deploy`; they must never use `migrate reset`. Destructive or large-table migrations require a tested backup/restore and a forward-fix plan.
