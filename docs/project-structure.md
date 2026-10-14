# Cấu trúc project

> Đối chiếu thư mục và import trong worktree ngày 2026-10-13. Bản đồ này mô tả mã nguồn hiện tại; không liệt kê toàn bộ file sinh ra hoặc dependency.

## 1. Monorepo

```text
moneymate/
├─ backend/                  API Express + Prisma
├─ frontend/                 SPA React/Vite
├─ apps/
│  └─ mobile/                Expo Router cho iOS/Android và bản web preview
├─ packages/                 Type/helper/design tokens dùng chung
├─ assets/images/            Asset public của web
├─ docs/                     Tài liệu sản phẩm, kỹ thuật và vận hành
├─ .github/workflows/ci.yml  Build/test và Docker smoke
├─ codex-agent-kit/          Bộ workflow/template hỗ trợ phát triển
├─ package.json              Workspaces và lệnh điều phối
├─ package-lock.json         Dependency lockfile chung
├─ docker-compose.yml        MySQL + backend + frontend
├─ .env.example              Mẫu biến môi trường Compose
├─ .nvmrc                    Phiên bản Node tham chiếu
└─ .editorconfig             Quy ước editor
```

Workspaces được khai báo là `frontend`, `backend`, `apps/*`, `packages/*`. Cài dependencies từ root bằng `npm ci`; không tự tạo lockfile riêng cho workspace. Shared package được build trước app vì app import bản `dist/` của package.

## 2. Backend

```text
backend/
├─ prisma/
│  ├─ schema.prisma          Mô hình MySQL, enum và quan hệ
│  ├─ migrations/            Lịch sử schema có thứ tự
│  └─ seed.ts                Seed development theo script workspace
├─ scripts/                 Công cụ kiểm tra startup
├─ src/
│  ├─ app.ts                Lắp Express và nhóm route
│  ├─ server.ts             Mở server, recurring timer, graceful shutdown
│  ├─ common/               AppError, response, recurrence và tiện ích
│  ├─ config/               Prisma, CORS, env, Swagger, AI/Copilot
│  ├─ middlewares/          Auth/admin, validation, upload, idempotency, errors
│  ├─ routes/               Endpoint + middleware
│  ├─ controllers/          Adapter HTTP cho service
│  ├─ validators/           Zod request schemas
│  ├─ services/             Use case và kiểm tra nghiệp vụ
│  │  └─ ai/                Provider/model, chat, OCR, analysis, forecast
│  ├─ repositories/         Truy vấn và transaction Prisma
│  ├─ copilotkit/           Runtime stream và financial tools
│  └─ __tests__/
│     ├─ unit/              Test service, repository, middleware, config
│     ├─ integration/       HTTP auth và Copilot
│     └─ helpers/           Prisma mock và setup
├─ Dockerfile
├─ .env.example
└─ README.md
```

Khi sửa một endpoint, lần theo route → validator/middleware → controller → service → repository. Quyền sở hữu và số dư cần kiểm tra ở server dù UI đã validate. Truy vấn nhiều bảng cần tham gia cùng Prisma transaction, tránh gọi repository với client mặc định trong lúc service cần rollback toàn bộ use case.

Nguồn tham chiếu: [API](api.md), [DB/ERD](erd.md), [business rules](business_rules.md), [backend README](../backend/README.md).

## 3. Web

```text
frontend/
├─ .storybook/              Cấu hình Storybook
├─ src/
│  ├─ main.tsx, App.tsx     React entry và khởi tạo phiên/theme
│  ├─ assets/               Adapter/export asset phía client
│  ├─ components/
│  │  ├─ common/            UI primitive, sidebar và topbar
│  │  ├─ MoneyMateCopilot/  Chat UI, write confirmation và app tools
│  │  └─ ...                Thành phần receipt/notification/feature
│  ├─ config/
│  │  └─ route/             Route tree, PrivateRoute, AdminRoute
│  ├─ constants/            Route path và khóa localStorage
│  ├─ contexts/             AppProviders và MoneyMateCopilotProvider
│  ├─ data/, helpers/       Navigation data và helper giao diện
│  ├─ hooks/                Form, reference data, notifications, AI/OCR
│  ├─ layouts/              Shell trang đã đăng nhập
│  ├─ pages/                Màn hình theo route
│  ├─ services/
│  │  ├─ api/client.ts      Axios, Bearer header và refresh cookie
│  │  └─ queryClient.ts     QueryClient dùng chung
│  ├─ stores/               Zustand auth/theme
│  ├─ styles/               Tailwind layer và Copilot overrides
│  ├─ theme/                Chart adapter và hướng dẫn theme
│  ├─ types/, utils/        Types client, ngày và format tiền
│  └─ test/                 Test render helpers và mock dùng chung
├─ vite.config.ts           Proxy, publicDir, aliases, test/coverage config
├─ tailwind.config.js       Map tokens vào CSS/Tailwind
├─ nginx.conf               SPA fallback và proxy API
├─ Dockerfile
└─ README.md
```

Test `*.test.ts(x)` và story `*.stories.tsx` thường đặt cạnh component/hook/page. Asset web được Vite lấy từ [assets/images](../assets/images), vì `publicDir` trỏ ra root. Đọc [frontend README](../frontend/README.md) và [theme README](../frontend/src/theme/README.md) khi sửa UI.

## 4. Mobile

```text
apps/mobile/
├─ src/
│  ├─ app/                  Expo Router entry, Stack và nhóm (tabs)
│  ├─ pages/                Màn hình được route re-export
│  ├─ components/           UI, icon, chart, navigation shell, chatbot
│  ├─ lib/                  Fetch API, ngày, ảnh và push registration
│  ├─ providers/            Phiên, Query persist và offline replay
│  ├─ storage/              SecureStore, SQLite DB, key-value và outbox
│  ├─ stores/               Zustand auth
│  ├─ theme/                Theme provider + React Native adapter
│  └─ types/                DTO tài chính phía mobile
├─ assets/                  Icons, ảnh và Be Vietnam Pro fonts
├─ app.json                 Expo config, permission, IDs và deep links
├─ eas.json                 Development/preview/production build profiles
├─ metro.config.js          Metro/workspace configuration
├─ tsconfig.json            Alias @ và TypeScript config
├─ .env.example
├─ AGENTS.md                Hướng dẫn đọc Expo docs trước khi viết code
└─ README.md
```

File `.web.ts`/`.web.tsx` thay thế adapter native khi Metro build web: key-value dùng localStorage; offline provider không mở SQLite và enqueue outbox báo không hỗ trợ. Đừng giả định web export của Expo là client `frontend/` hoặc có mọi native capability.

Xem [mobile README](../apps/mobile/README.md), [kiến trúc offline](architecture.md), [mobile release](mobile_release.md). [mobile-ui-design.md](mobile-ui-design.md) là tài liệu thiết kế riêng; khi có khác biệt, đối chiếu code để xác định hành vi đang chạy.

## 5. Shared packages

| Package | Nội dung thực tế | Consumer hiện thấy trong source |
| --- | --- | --- |
| `@moneymate/contracts` | Auth user/login/token, platform và API envelope types | Web/mobile auth và API platform |
| `@moneymate/validation` | Zod schema login và platform | Backend auth validator |
| `@moneymate/domain` | `assertMoney` cho chuỗi decimal | Chưa thấy app import helper này |
| `@moneymate/api-core` | Factory client với transport và refresh abstraction | Mobile khai báo dependency; chưa thấy app import factory |
| `@moneymate/design-tokens` | Tokens native chung và `webTheme` | Web Tailwind/Recharts, mobile theme adapter |

Mỗi package có `src/index.ts`, `package.json`, `tsconfig.json`; dùng base config [packages/tsconfig.base.json](../packages/tsconfig.base.json), xuất JavaScript CommonJS và declaration vào `dist/`. Không xem `dist/` là nguồn chỉnh sửa.

## 6. Đặt thay đổi ở đâu

| Loại thay đổi | Vị trí chính | Tài liệu cần cập nhật |
| --- | --- | --- |
| Endpoint/request/error | Backend route, validator, controller, service | [api.md](api.md) |
| DB/quan hệ/constraint | Prisma schema + migration | [erd.md](erd.md), [business_rules.md](business_rules.md) |
| Session/role | Backend auth và client adapters/stores | [auth_sessions.md](auth_sessions.md) |
| Route/màn hình | Web `config/route`/pages; mobile `app`/pages | [requirements.md](requirements.md), README workspace |
| Palette/kích thước | `design-tokens`, web/mobile adapter | [theme README](../frontend/src/theme/README.md) |
| Offline/retry | Mobile storage/provider/form + API idempotency/sync | [architecture.md](architecture.md), [mobile_release.md](mobile_release.md) |
| CI/container/env | Workflow, Dockerfile, Compose và `.env.example` | [environment-setup.md](environment-setup.md), [deployment.md](deployment.md) |

Các thư mục `node_modules/`, `dist/`, coverage và `.expo/` là dependency/output. `codex-agent-kit/` là bộ hỗ trợ workflow, không phải runtime server hay một workspace được build. Quy trình đóng góp đọc ở [coding conventions](coding-conventions.md); kiểm thử ở [testing](testing.md).
