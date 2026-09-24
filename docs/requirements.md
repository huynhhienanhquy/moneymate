# Functional & Non-functional Requirements - MoneyMate

This document maps out the detailed Functional Requirements (FRs) and Non-functional Requirements (NFRs) for the **MoneyMate** Personal Finance Management System.

---

## 1. Functional Requirements (FR)

### 1.1 Authentication & User Module (FR-AUTH)
- **FR-AUTH-01 (Register)**: The system shall allow users to register an account using their Full Name, Email, and Password. Email must be unique and properly formatted.
- **FR-AUTH-02 (Login)**: The system shall authenticate users using their Email and Password, returning a short-lived Access Token (JWT) and a long-lived Refresh Token.
- **FR-AUTH-03 (Token Refresh)**: The system shall automatically exchange a valid Refresh Token for a new Access Token upon expiration to maintain session continuity.
- **FR-AUTH-04 (Logout)**: The system shall invalidate the user's current session by deleting their Refresh Token from the database.
- **FR-AUTH-05 (Profile View)**: The system shall allow authenticated users to view their profile details, including their Avatar, Name, Email, and Registration Date.
- **FR-AUTH-06 (Profile Update)**: The system shall allow users to update their Name and upload/change their Avatar image (stored via Cloud/Uploads folder).

### 1.2 Wallet Module (FR-WALL)
- **FR-WALL-01 (Create Wallet)**: The system shall allow users to create multiple wallets by specifying a Name, Wallet Type (Cash, Bank, Credit Card, E-wallet, Saving), Currency, and Initial Balance.
- **FR-WALL-02 (Update Wallet)**: The system shall allow users to edit the wallet name, type, and current balance adjustments.
- **FR-WALL-03 (Delete Wallet)**: The system shall allow users to delete a wallet. Upon deletion, all associated transactions must either be cascade-deleted or re-assigned to a default wallet (depending on user choice).
- **FR-WALL-04 (Wallet Transfer)**: The system shall allow users to transfer funds between their own wallets, specifying the Source Wallet, Destination Wallet, Amount, Date, and Optional Notes.

### 1.3 Category Module (FR-CAT)
- **FR-CAT-01 (Default Categories)**: The system shall provide pre-defined, non-editable categories (e.g., Food, Transport, Rent, Salary, Dividends).
- **FR-CAT-02 (Custom Categories)**: The system shall allow users to create custom categories with a Name, Type (Income or Expense), Color (HEX code), and Icon.
- **FR-CAT-03 (Manage Categories)**: The system shall allow users to edit and delete their custom categories.

### 1.4 Transaction Module (FR-TX)
- **FR-TX-01 (Create Transaction)**: The system shall allow users to record an Income or Expense transaction specifying Amount, Date, Category, Wallet, Notes, and an optional image attachment (receipt).
- **FR-TX-02 (Edit/Delete)**: The system shall allow users to update or delete any transaction, automatically recalculating the associated wallet balance.
- **FR-TX-03 (Search & Filter)**: The system shall allow users to search transactions by notes/tags and filter them by Wallet, Category, Transaction Type, and Date Range.
- **FR-TX-04 (Sort)**: The system shall support sorting transactions by Date (Ascending/Descending) and Amount (Highest/Lowest).

### 1.5 Budget Module (FR-BUD)
- **FR-BUD-01 (Monthly Budgets)**: The system shall allow users to set monthly expense limits for specific categories.
- **FR-BUD-02 (Budget Tracking)**: The system shall display budget usage in real-time using progress bars.
- **FR-BUD-03 (Budget Alert)**: The system shall generate in-app notifications when a category's expenses reach 80% and 100% of its budget limit.

### 1.6 Saving Goals Module (FR-GOAL)
- **FR-GOAL-01 (Goal Setting)**: The system shall allow users to define saving goals with a Title, Target Amount, Target Date, and Description.
- **FR-GOAL-02 (Deposit to Goal)**: The system shall allow users to deposit money into a saving goal from an active wallet, deducting the balance from the wallet.
- **FR-GOAL-03 (Goal Tracking)**: The system shall calculate and display the current progress percentage and project whether the goal will be reached by the target date.

### 1.7 Recurring Transactions Module (FR-REC)
- **FR-REC-01 (Create Recurring Schedule)**: The system shall allow users to configure recurring income or expense templates (e.g., monthly salary, utility bills, subscriptions) specifying the Interval (Daily, Weekly, Monthly, Yearly).
- **FR-REC-02 (Automated Generation)**: The system shall automatically create the transaction records on the scheduled dates and update the associated wallet balances.

### 1.8 Reports & Dashboard (FR-REP)
- **FR-REP-01 (Dashboard Summary)**: The system shall display total balance across all wallets, monthly net savings, monthly total income, and monthly total expenses.
- **FR-REP-02 (Visual Charts)**: The system shall render charts showing:
  - Category breakdown (Pie Chart).
  - Income vs. Expense monthly comparisons (Bar Chart).
  - Net savings progress over time (Line Chart).
- **FR-REP-03 (Export Data)**: The system shall support exporting monthly transaction logs to PDF or Excel spreadsheets.

---

## 2. Non-functional Requirements (NFR)

### 2.1 Security & Data Protection (NFR-SEC)
- **NFR-SEC-01 (Transport Security)**: All communication between the client and server must be encrypted using HTTPS/TLS 1.3.
- **NFR-SEC-02 (Password Hashing)**: User passwords must be stored using bcrypt hashing. Raw passwords must never be stored.
- **NFR-SEC-03 (Input Validation)**: All input data on both the client (Zod schemas) and server (express validators + Zod schema validation) must be strictly sanitized and validated to prevent SQL Injection and Cross-Site Scripting (XSS).
- **NFR-SEC-04 (Token Storage)**: JWT access tokens must be stored in application state (in-memory) and refresh tokens should be stored in secure, `httpOnly`, `sameSite: strict` cookies to prevent XSS and CSRF token thefts.

### 2.2 Performance & Scalability (NFR-PERF)
- **NFR-PERF-01 (API Latency)**: Common API read endpoints (e.g., get profile, list wallets) must respond within **200ms** under normal load conditions.
- **NFR-PERF-02 (Database Connection)**: Database queries must utilize index optimizations (e.g., indexes on `userId` in transactions, `nextExecutionDate` in recurring tables) to handle up to 100,000 transaction records per user without latency degradation.
- **NFR-PERF-03 (Responsive UI)**: The frontend interface must load and render charts within **1.5 seconds** on broadband networks.

### 2.3 Usability & Design (NFR-USE)
- **NFR-USE-01 (Responsive Design)**: The interface must adapt cleanly to all viewports (Mobile, Tablet, Desktop) using Tailwind CSS.
- **NFR-USE-02 (Accessibility)**: Color contrasts on visual charts must meet WCAG 2.1 AA requirements.
- **NFR-USE-03 (Dark Mode)**: The application must support seamless toggle between Light and Dark mode UI states.

### 2.4 Maintainability & Architecture (NFR-MNT)
- **NFR-MNT-01 (Clean Architecture)**: The backend project structure must maintain strict layer separation: Route -> Controller -> Service -> Repository -> Database. Dependencies must point inwards.
- **NFR-MNT-02 (Type Safety)**: Both frontend and backend codebase must be written using TypeScript with strict mode enabled.
