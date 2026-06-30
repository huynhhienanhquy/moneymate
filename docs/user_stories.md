# User Stories - MoneyMate

This document lists the user stories for **MoneyMate**, split across the development phases (MVP, Advanced, AI). Each story includes detailed acceptance criteria (AC).

---

## Phase 1: MVP Features

### US-01: User Registration
**As a** new visitor,  
**I want to** register for a MoneyMate account with my name, email, and password,  
**So that** I can securely store and track my personal finances.

#### Acceptance Criteria:
- **AC-01**: Registration form requires Full Name, a valid unique email, and a password (min 8 characters, containing at least one number and letter).
- **AC-02**: The API must validate input formats and return descriptive error messages (e.g., "Email already registered").
- **AC-03**: Upon successful registration, the user is redirected to the login screen with a success message.
- **AC-04**: Password must be saved securely using bcrypt hashing.

### US-02: Multi-Wallet Setup
**As a** user,  
**I want to** create multiple wallets (e.g., Cash, Techcombank, Momo),  
**So that** I can track balances separately across different assets.

#### Acceptance Criteria:
- **AC-01**: User can add a new wallet by entering Name, choosing a Type (Cash, Bank, Credit Card, E-wallet, Saving), selecting a Currency, and inputting an Initial Balance.
- **AC-02**: Wallets list displays the current calculated balance for each wallet.
- **AC-03**: User can edit a wallet's name and type, or delete the wallet entirely.

### US-03: Custom Categories
**As a** user,  
**I want to** customize my income and expense categories,  
**So that** I can classify my cash flow according to my personal lifestyle.

#### Acceptance Criteria:
- **AC-01**: System provides standard default categories (e.g., Salary, Food, Utilities) which are read-only.
- **AC-02**: User can create a custom category by choosing Category Name, Type (Income/Expense), a hex Color, and a descriptive Icon.
- **AC-03**: Users cannot duplicate names for custom categories of the same type.

### US-04: Log Income & Expenses
**As a** user,  
**I want to** record my daily transactions (income or expense),  
**So that** my wallet balances and reports reflect actual spending.

#### Acceptance Criteria:
- **AC-01**: User can log a transaction with Amount, Category, Wallet, Date, and optional note.
- **AC-02**: Amount must be positive and non-zero.
- **AC-03**: Saving an expense transaction automatically reduces the selected wallet balance.
- **AC-04**: Saving an income transaction automatically increases the selected wallet balance.

### US-05: Dashboard Overview
**As a** user,  
**I want to** see an visual summary dashboard when I open the app,  
**So that** I can instantly understand my overall financial status this month.

#### Acceptance Criteria:
- **AC-01**: Dashboard shows net worth (sum of all wallet balances).
- **AC-02**: Dashboard displays current month statistics: Total Income, Total Expenses, and Net Savings.
- **AC-03**: Includes a Pie Chart showing expenses grouped by category.
- **AC-04**: Includes a list of the 5 most recent transactions.

---

## Phase 2: Advanced Features

### US-06: Category Budgeting
**As a** user,  
**I want to** set monthly spending limits for specific expense categories,  
**So that** I can prevent overspending.

#### Acceptance Criteria:
- **AC-01**: User can define a monthly budget for any expense category.
- **AC-02**: Budget progress bar dynamically updates as new transactions are added.
- **AC-03**: System sends an in-app notification when spending reaches 80% and 100% of the budget.

### US-07: Saving Goals progress
**As a** user,  
**I want to** set up saving goals with targets (e.g., Buy a laptop) and deposit funds into them,  
**So that** I can systematically save money for future plans.

#### Acceptance Criteria:
- **AC-01**: User can create a goal with Title, Target Amount, Target Date, and Description.
- **AC-02**: User can transfer money from any wallet to the goal, which updates the goal's saved amount and decreases the wallet's balance.
- **AC-03**: System highlights goal status as Completed when target amount is reached.

### US-08: Automatic Recurring Bills
**As a** user,  
**I want to** set up recurring transaction schedules (e.g., monthly rent, weekly gym fee),  
**So that** the system automatically logs these transactions for me.

#### Acceptance Criteria:
- **AC-01**: User can define recurring schedules with Interval (Daily, Weekly, Monthly, Yearly), Start Date, Wallet, Category, and Amount.
- **AC-02**: A daily automated task evaluates schedules and logs transactions when their execution date matches the current date.

---

## Phase 3: AI Features

### US-09: Smart Receipt Scanner (OCR)
**As a** user,  
**I want to** take a photo of my store receipt and have the system scan it,  
**So that** I don't have to enter transaction details manually.

#### Acceptance Criteria:
- **AC-01**: User uploads a receipt image (PNG, JPG).
- **AC-02**: AI extracts Amount, Date, Merchant, and recommends a Category.
- **AC-03**: Pre-filled form is shown to the user to review and save with one click.
