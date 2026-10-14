# MoneyMate — Project Documentation


## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Requirements](#2-requirements)
3. [Tech Stack](#3-tech-stack)
4. [System Architecture](#4-system-architecture)
5. [Project Structure](#5-project-structure)

## 1. Project Overview

MoneyMate is a personal finance application for web, iOS, and Android, designed for Vietnamese users with VND currency formatting.

**Goal:** help users track income and expenses, control budgets, manage wallets, and plan savings.

**Scope:** accounts, transactions, wallet transfers, budgets, savings goals, recurring transactions, reports, receipt OCR, notifications, and AI assistance. Users manage their own financial data; administrators manage accounts.

The project uses TypeScript, React/Expo, Express, Prisma, and MySQL in an npm monorepo. Bank integrations, social sign-in, and automatic currency conversion are not implemented.

## 2. Requirements

### Functional Requirements

| Area | Main Features |
| --- | --- |
| Accounts | Registration, login, token refresh, session management, profiles, and passwords |
| Wallets and categories | Create/edit/archive wallets, manage income/expense categories, and transfer funds |
| Transactions | Create/edit/soft-delete records, search, filter, paginate, and check versions |
| Planning | Monthly budgets, alerts at 80%/100%, savings goals, and deposits/withdrawals |
| Recurring transactions | Daily, weekly, monthly, or yearly schedules; pause/resume |
| Reports | Dashboard, monthly/yearly reports, trends, and Excel/PDF exports |
| Receipts and notifications | Attach/scan receipts, in-app notifications, and mobile push registration |
| AI and administration | Financial analysis/chat, Copilot confirmation before writes, and user management |

### Non-functional Requirements

- **Security:** JWT authentication, role/ownership checks, bcrypt, refresh token rotation, and input validation; production requires HTTPS and secure secrets.
- **Data integrity:** database transactions for operations affecting multiple records; version checks detect conflicts, and supported endpoints use idempotency.
- **Performance and usability:** pagination, indexes, lazy loading, light/dark themes, and clear error states; performance and accessibility require practical verification.
- **Maintainability and operations:** strict TypeScript, clear module responsibilities, relevant tests/docs, request IDs, and deployment backup/restore procedures.

**Business rule:** income increases wallet balances; ordinary expenses check available funds and appear in reports but do not reduce wallet balances. Transfers and savings-goal deposits/withdrawals change balances directly.

## 3. Tech Stack

| Component | Technologies |
| --- | --- |
| Language/runtime | TypeScript, Node.js ≥ 22.13, npm workspaces |
| Web | React 18, Vite 8, Tailwind CSS, React Router, Recharts |
| Mobile | React 19, React Native 0.86, Expo SDK 57, Expo Router |
| State and HTTP | TanStack Query, Zustand; Axios on web, fetch on mobile |
| Backend | Express 4, Zod, JWT, bcryptjs |
| Database and local storage | MySQL 8, Prisma 5; SQLite and SecureStore on mobile |
| AI/OCR/exports | OpenAI, CopilotKit, Tesseract.js, pdf-parse, ExcelJS, PDFKit |
| Infrastructure and testing | Docker Compose, Nginx, GitHub Actions, Jest/Supertest, Vitest, ESLint |

OpenAI, S3-compatible storage, and Expo push are optional integrations. Installed dependency versions are locked in `package-lock.json`.

## 4. System Architecture

```text
React Web ────┐
              ├── HTTP(S) ── Express API ── Prisma ── MySQL
Expo Mobile ──┘                    │
                                  ├── Local files / S3
                                  ├── OpenAI / CopilotKit
                                  └── Expo Push
```

The backend follows **route → middleware → controller → service → repository/Prisma**. Middleware validates authentication and input; services enforce permissions and business rules; repositories access the database.

Web and mobile share the API but use separate interfaces and session storage. Web refresh uses an HttpOnly cookie; native apps store refresh tokens in SecureStore. Mobile uses query caching and a SQLite outbox for selected transaction create/edit operations.

**Current limitations:** offline support does not cover all screens or files; the scheduler runs inside the API at startup and every 24 hours; CI validates/builds but does not deploy automatically. Web Copilot has 5 read tools and 8 write tools requiring confirmation, but its transfer tool checks the wrong response type and may show an error after the server has committed the transfer.

## 5. Project Structure

```text
moneymate/
├── backend/
│   ├── prisma/           # Schema, migrations, and seed
│   └── src/
│       ├── routes/       # Endpoints and middleware
│       ├── controllers/  # Receive requests and return responses
│       ├── services/     # Financial and AI business logic
│       ├── repositories/ # Database queries
│       ├── validators/   # Input schemas
│       ├── middlewares/  # Auth, errors, uploads, idempotency
│       └── copilotkit/   # Agent runtime and financial tools
├── frontend/src/         # Web: pages, components, hooks, stores, services
├── apps/mobile/src/      # Mobile: routes, pages, providers, storage, theme
├── packages/             # Shared code and tokens
├── docs/                 # Detailed documentation
├── .github/workflows/    # CI
└── docker-compose.yml    # MySQL, API, and Nginx web hosting
```

| Package | Responsibility |
| --- | --- |
| `contracts` | Authentication types and API response envelopes |
| `validation` | Shared login/platform schemas |
| `design-tokens` | Web/mobile design tokens |
| `domain` | Money-string validation helper; not currently used by the apps |
| `api-core` | API client abstraction; mobile currently uses a separate fetch adapter |

Further details: [requirements](requirements.md), [business rules](business_rules.md), [architecture](architecture.md), and the [documentation index](README.md).
