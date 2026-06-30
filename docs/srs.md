# Software Requirement Specification (SRS) - MoneyMate

## 1. Introduction

### 1.1 Document Purpose
This Software Requirement Specification (SRS) document details the requirements, architecture, and specifications for **MoneyMate**, a Smart Personal Finance Management System. It serves as a blueprint for the developers, designers, and testers involved in building the application.

### 1.2 Project Scope
MoneyMate is a comprehensive web-based application designed to help users track and optimize their personal finances. The platform covers income/expense tracking, multi-wallet management, budget setting, saving goal milestones, automatic recurring transaction execution, graphical reports, and intelligent AI-driven financial insights.

### 1.3 Intended Audience
- **Developers**: To build Frontend, Backend, and AI systems matching specifications.
- **Q/A & Testers**: To write unit, integration, and end-to-end test cases.
- **Product Owners / Users**: To verify business rules and functional behavior.

---

## 2. Overall Description

### 2.1 Product Perspective
MoneyMate is developed as a modular web application implementing a strict **Clean Architecture** pattern to ensure decoupling, high maintainability, and scalability.

```
       [ Presentation Layer (React SPA / Controllers) ]
                             │
                             ▼
                 [ Service Layer (Use Cases) ]
                             │
                             ▼
         [ Repository Layer (Database Access / Prisma) ]
                             │
                             ▼
                 [ Database Layer (MySQL) ]
```

### 2.2 Product Functions
MoneyMate features are split into three developmental phases:
- **Phase 1 (MVP)**: Secure authentication, profile management, multi-wallet accounts, custom category classification, simple transaction CRUD (income/expense), and a responsive dashboard highlighting monthly summary reports.
- **Phase 2 (Advanced)**: Budgets with threshold alerts, saving goals with deposit transactions, automated recurring transaction engine, inter-wallet transfers, receipt attachment uploads, PDF/Excel export, and dark mode UI.
- **Phase 3 (AI Features)**: AI expense analyzer, budget predictive warnings, OCR receipt scanner, financial conversational chatbot, and personalized financial advisors.

### 2.3 User Classes and Characteristics
- **General User**: Individuals wanting to manage their cash flow, track expenses, and plan their future saving goals.
- **System Administrator (Future scope)**: For monitoring platform health, user analytics, and system-wide category configuration.

### 2.4 Design and Implementation Constraints
- **Tech Stack**:
  - **Frontend**: React + TypeScript + Vite + Tailwind CSS + Shadcn UI + Recharts
  - **Backend**: Node.js + Express.js + TypeScript + Prisma ORM
  - **Database**: MySQL (hosted on Railway or local)
- **Deployment**: Vercel (Frontend), Render (Backend).
- **Coding Standard**: CamelCase for variables/keys, PascalCase for components/classes, Kebab-case for folders/files. Linting via ESLint and formatting via Prettier.

---

## 3. System Features & Modules

### 3.1 Authentication & User Management
- **Register**: Users register using name, email, and password. Data is validated on both ends.
- **Login**: Issue short-lived JSON Web Token (JWT) Access Token and long-lived Refresh Token.
- **Logout**: Invalidate the Refresh Token in the database.
- **Forgot Password**: Password reset sequence via token.
- **Profile Management**: Update user metadata, email, and upload profile avatar.

### 3.2 Wallet Management
- **Multi-Wallet Support**: Users can manage multiple wallets (e.g., Cash, Bank accounts, Credit Cards, E-wallets, Savings).
- **Transfer**: Inter-wallet transfers (Phase 2 feature) with automatic double entry bookkeeping logs.
- **CRUD Operations**: Users can add, edit, or delete wallets. Deleting a wallet handles cascade operations or archival.

### 3.3 Category Management
- **System Default Categories**: Built-in standard categories for Income (e.g., Salary, Investment) and Expense (e.g., Food, Rent, Entertainment).
- **Custom Categories**: Users can create their own sub-categories or custom categories with distinct colors and icons.

### 3.4 Transactions Module
- **CRUD Operations**: Support creating, viewing, editing, and deleting transactions.
- **Types**: Income, Expense, Transfer (inter-wallet).
- **Features**: Notes, receipt image attachments, date select, search, sorting, and advanced multi-filter (by wallet, category, type, and date range).

### 3.5 Budgeting Module (Phase 2)
- Set monthly budget limits per category or overall.
- Real-time tracking and visual progress bars.
- Warnings triggers when spending reaches 80% and 100% thresholds.

### 3.6 Saving Goals (Phase 2)
- Target savings setting with target completion date.
- Dedicated deposit functionality linked directly to a wallet.
- Goal completion milestones and progression status calculation.

### 3.7 Recurring Transactions (Phase 2)
- Set up automatic logs for recurring payments (e.g., rent, Netflix, insurance, salary).
- Cron jobs evaluate and generate transactions automatically on the specified frequency.

### 3.8 Reports & Analytics
- **Dashboard**: High-level view of current net worth, monthly income, monthly expenses, and recent transactions.
- **Visual Analytics**: Interactive Recharts (Pie Chart for category breakdown, Bar Chart for monthly comparison, Line Chart for spending trend over time).

### 3.9 AI Features (Phase 3)
- **OCR Receipt Parsing**: Upload receipts to auto-populate transaction details (date, merchant, total, items).
- **Predictive Budgeting**: Highlight categories likely to exceed their budgets based on daily run rate.
- **Conversational Chatbot**: Chat interface supporting general natural language financial queries.
