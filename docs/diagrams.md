# System Diagrams - MoneyMate

This document presents the visual models for **MoneyMate** using Mermaid diagrams, explaining the Use Cases and key Activity flows.

---

## 1. Use Case Diagram

The diagram below outlines the interactions between the **Authenticated User** (Actor), the **System Chron Engine** (Background Actor), and the system use cases.

```mermaid
usecaseDiagram
    actor User as "Authenticated User"
    actor Cron as "System Cron Engine"

    User --> (Register / Login / Logout)
    User --> (Manage Wallets)
    User --> (Transfer Funds Between Wallets)
    User --> (Manage Custom Categories)
    User --> (Record Transaction)
    User --> (Filter / Search Transactions)
    User --> (Set Category Budget)
    User --> (Manage Saving Goals)
    User --> (Setup Recurring Schedule)
    User --> (View Dashboard & Charts)
    User --> (Upload Receipt / OCR)
    User --> (Query AI Advisor)

    Cron --> (Auto-Generate Recurring Transactions)
    Cron --> (Evaluate Budgets & Trigger Alerts)
```

---

## 2. Activity Diagrams

### 2.1 Expense Recording Flow
This activity diagram details the flow when a user creates an expense transaction.

```mermaid
flowchart TD
    Start([User starts recording transaction]) --> Input[Input Amount, Wallet, Category, Date, and Note]
    Input --> Validate{Is inputs valid? \n (Amount > 0?)}
    Validate -- No --> Error[Show validation errors] --> Input
    Validate -- Yes --> CheckBalance{Wallet Type == CREDIT_CARD \n OR Wallet Balance >= Amount?}
    
    CheckBalance -- Yes --> Save[Write Transaction to DB]
    CheckBalance -- No --> Overdraft{Allow Overdraft?}
    Overdraft -- Yes --> Save
    Overdraft -- No --> ErrorBalance[Show insufficient balance error] --> Stop([Cancel transaction])

    Save --> UpdateBalance[Recalculate Wallet Balance]
    UpdateBalance --> EvaluateBudget{Is Category Budget \n defined for this month?}
    
    EvaluateBudget -- No --> Finish([Transaction saved successfully])
    EvaluateBudget -- Yes --> CheckThreshold{Expenses >= 80% of Budget?}
    
    CheckThreshold -- No --> Finish
    CheckThreshold -- Yes --> Check100{Expenses >= 100% of Budget?}
    
    Check100 -- No --> Trigger80Alert[Trigger 80% Warning Notification] --> Finish
    Check100 -- Yes --> Trigger100Alert[Trigger 100% Limit Alert Notification] --> Finish
```

### 2.2 Inter-Wallet Transfer Flow
This activity diagram details the atomic process of moving funds from Wallet A to Wallet B.

```mermaid
flowchart TD
    Start([User requests Wallet Transfer]) --> Select[Select Wallet A, Wallet B, Amount, and Date]
    Select --> Validate{Are wallets owned by user \n and different?}
    
    Validate -- No --> Error[Show selection error] --> Stop([Transfer cancelled])
    Validate -- Yes --> CheckBalance{Wallet A balance >= Amount?}
    
    CheckBalance -- No --> BalanceError[Show insufficient funds in Source Wallet] --> Stop
    CheckBalance -- Yes --> BeginTransaction[Begin Database Transaction]
    
    BeginTransaction --> CreateTransferRecord[Create Transfer log in database]
    CreateTransferRecord --> DebitA[Debit Wallet A balance]
    DebitA --> CreditB[Credit Wallet B balance]
    
    CreditB --> Commit{Did all steps succeed?}
    Commit -- Yes --> Success[Commit Database Transaction] --> Finish([Transfer successfully posted])
    Commit -- No --> Rollback[Rollback Transaction] --> SystemError[Show system processing error] --> Stop
```

### 2.3 Automated Recurring Transaction Cron Flow
This activity diagram details how the background engine automatically spawns transaction entries for scheduled bills.

```mermaid
flowchart TD
    Start([Cron triggers daily at 00:05 UTC]) --> Fetch[Fetch active recurring schedules where nextExecutionDate <= Today]
    Fetch --> Loop{Are there remaining pending schedules?}
    
    Loop -- No --> EndCron([Cron job finished])
    Loop -- Yes --> GetItem[Get next recurring schedule configuration]
    
    GetItem --> BeginTx[Begin Database Transaction]
    BeginTx --> CreateTx[Create normal Transaction entry using template data]
    CreateTx --> UpdateWallet[Adjust Wallet balance]
    UpdateWallet --> RecalculateNext[Calculate next execution date based on frequency]
    RecalculateNext --> SaveNext[Update nextExecutionDate in schedule record]
    
    SaveNext --> NotifyUser[Create in-app recurring transaction execution notification]
    NotifyUser --> Commit{Verify database steps succeeded?}
    
    Commit -- Yes --> CommitTx[Commit Transaction] --> Loop
    Commit -- No --> RollbackTx[Rollback Transaction] --> LogError[Log execution failure details] --> Loop
```
