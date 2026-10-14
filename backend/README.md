# MoneyMate Backend

> Tài liệu theo working tree ngày 2026-10-13. Đây là API TypeScript/Express của MoneyMate, quản lý authentication, dữ liệu tài chính, recurring scheduler, notifications, attachments/export, AI REST và CopilotKit runtime tùy chọn.

## Đọc tài liệu

| Nội dung | Tài liệu |
| --- | --- |
| Danh mục toàn project | [Docs index](../docs/README.md) |
| Cài đặt local và cấu hình các app | [Environment Setup](../docs/environment-setup.md) |
| Toàn bộ endpoints, request/response/errors, sync | [API Documentation](../docs/api.md) |
| JWT, web cookie, native refresh, roles/sessions | [Authentication & Authorization](../docs/auth_sessions.md) |
| Quy tắc số dư, reports, recurring, budget/goal | [Business Logic](../docs/business_rules.md) |
| Entities, ERD, FK/index và migration history | [Database Design](../docs/erd.md) |
| Unit/integration và giới hạn kiểm thử | [Testing](../docs/testing.md) |
| Docker, CI/CD, production | [Deployment](../docs/deployment.md) |
| Lỗi và cách chẩn đoán | [Troubleshooting](../docs/troubleshooting.md) |

## Stack và cấu trúc

Node.js ≥ 22.13 theo [root package.json](../package.json); Docker dùng Node 22. Backend dùng Express 4, TypeScript 5, Prisma 5 với MySQL, Zod 3, bcryptjs, jsonwebtoken, Multer 2. AI dùng OpenAI SDK và CopilotKit runtime 1.69.0, OCR dùng pdf-parse/Tesseract. Export dùng ExcelJS/PDFKit; object storage là local hoặc AWS S3 SDK. Jest/ts-jest/Supertest kiểm thử backend. Phiên bản cài đặt chính xác xem [package-lock](../package-lock.json), ranges xem [package.json](package.json).

```text
backend/
├── prisma/
│   ├── schema.prisma        # MySQL model, relation, enum, indexes
│   ├── migrations/          # Lịch sử SQL
│   └── seed.ts              # 14 category global, không tạo account
├── scripts/                 # Startup/integration/live Copilot checks
└── src/
    ├── app.ts               # Express middleware và mount routes
    ├── server.ts            # Listen, env validation, recurring interval
    ├── common/              # Response, AppError, recurrence, utilities
    ├── config/              # DB, CORS, env, Swagger, AI/Copilot config
    ├── routes/              # HTTP routes, middleware và validator
    ├── controllers/         # HTTP input/output và lỗi
    ├── services/            # Nghiệp vụ; một số service dùng Prisma trực tiếp
    │   └── ai/              # Context, rules, LLM, OCR, forecast, advisor/chat
    ├── repositories/        # Truy vấn và DB transactions
    ├── validators/          # Zod request schemas
    ├── middlewares/         # Auth/admin, validation, request ID, rate limit, upload
    ├── copilotkit/          # Runtime/agent/tools/auth/security/prompt
    └── __tests__/           # Unit và integration tests
```

Luồng thông thường: route → middleware → controller → service → repository/Prisma. Services giữ business invariants; repository và một số services thực hiện DB transaction trực tiếp. `@moneymate/validation` được import từ workspace package; build các packages trước khi build backend.

## Chạy local

Từ root repository:

```bash
npm ci
npm run build:packages
```

Tạo file cấu hình nếu chưa có. PowerShell:

```powershell
if (-not (Test-Path backend/.env)) {
    Copy-Item backend/.env.example backend/.env
}
```

Tạo database MySQL `moneymate`, chỉnh DATABASE_URL trong file riêng, cấu hình cả hai JWT secrets. Giá trị example không dùng cho production. Không commit `.env` chứa secrets. Khi dùng MySQL bằng Docker, xem [Environment Setup](../docs/environment-setup.md) để khớp port và credentials.

```bash
npm run prisma:generate --workspace=moneymate-backend
npm run prisma:migrate --workspace=moneymate-backend
npm run prisma:seed --workspace=moneymate-backend
npm run dev:backend
```

Mặc định [API](http://localhost:5000/api), [health](http://localhost:5000/health), [Swagger UI](http://localhost:5000/api-docs). Health chỉ báo tiến trình HTTP trả lời. Swagger có cấu hình OpenAPI nhưng route/controller hiện không có endpoint annotations, nên xem [API docs](../docs/api.md) để có danh mục đầy đủ.

## API theo module

| Prefix | Nhiệm vụ |
| --- | --- |
| `/api/auth` | Register, login, refresh, logout, list/revoke sessions |
| `/api/users` | Profile, password, self-delete account |
| `/api/wallets` | Ví active, cập nhật số dư, archive |
| `/api/categories` | Category riêng và global |
| `/api/transactions` | CRUD thu/chi, transfer, dashboard/reports/trend, transaction sync |
| `/api/budgets` | Ngân sách global/category theo tháng và utilization |
| `/api/saving-goals` | Goal CRUD, deposit/withdraw |
| `/api/recurring-transactions` | Recurring CRUD/toggle; execution do server scheduler |
| `/api/notifications` | Inbox và Expo device registration |
| `/api/attachments` | Upload/list/download/delete file; export monthly XLSX/PDF |
| `/api/ai` | Analysis/advisor/forecast/chat/OCR với rule fallback |
| `/api/admin` | User management, yêu cầu ADMIN |
| `/api/copilotkit` | Runtime protocol POST single-route, chỉ mount khi enabled |

Response JSON REST dùng `{success,message,data,requestId}`; error dùng `{success:false,code,message,errors,requestId}`. Export/content và Copilot stream có định dạng riêng. [API docs](../docs/api.md) ghi validator nào thật sự gắn trên mỗi route; không phải mọi query/param đều có Zod.

## Cấu hình môi trường

Nguồn mẫu: [.env.example](.env.example). Các default dưới đây lấy từ code, không phải credential của môi trường đang chạy.

| Biến | Mặc định / yêu cầu | Công dụng |
| --- | --- | --- |
| PORT | 5000 | HTTP port |
| DATABASE_URL | Bắt buộc để dùng Prisma/MySQL | Connection URL, không chia sẻ giá trị thật |
| JWT_ACCESS_SECRET | Bắt buộc | Ký/verify access JWT HS256 |
| JWT_REFRESH_SECRET | Bắt buộc bởi startup validation | Giữ contract cấu hình; opaque refresh hiện không ký bằng secret này |
| NODE_ENV | Không đặt default trong server | Production bật secure cookie, trust proxy và giới hạn CORS/secret |
| FRONTEND_URL | http://localhost:5173 | Danh sách origins comma-separated; production đặt exact HTTPS origins |
| STORAGE_DRIVER | Local khi khác s3 | Chọn local uploads hoặc S3 |
| S3_BUCKET, S3_REGION, S3_PUBLIC_URL | Bắt buộc nếu driver=s3 | Bucket/region và prefix URL lưu metadata; file vẫn đọc qua API xác thực |
| S3_ENDPOINT | Tùy chọn | Endpoint S3-compatible |
| S3_FORCE_PATH_STYLE | false | `true` để bật path-style |
| OPENAI_API_KEY | Tùy chọn; bắt buộc nếu Copilot enabled | Bật LLM/vision và cung cấp credential Copilot |
| AI_MODEL | gpt-4o-mini | Model AI REST |
| AI_MAX_TOKENS | 1500 | Response token limit AI REST |
| COPILOTKIT_ENABLED | false; chỉ true/false | Mount runtime |
| COPILOT_MODEL | openai/gpt-4o-mini | Khi enabled phải có prefix openai/ |
| COPILOT_MAX_STEPS | 3; 1–8 | Agent step limit |
| COPILOT_MAX_OUTPUT_TOKENS | 1500; 256–4096 | Agent output limit |
| COPILOT_MAX_MESSAGE_CHARS | 4000; 256–20000 | Giới hạn user message |
| COPILOT_MODEL_TIMEOUT_MS | 45000; 5000–120000 | Timeout model run |
| COPILOT_RATE_LIMIT_MAX_REQUESTS | 60; 5–600 | Request/IP trong window |
| COPILOT_RATE_LIMIT_WINDOW_MS | 60000; 10000–3600000 | Rate window |
| COPILOTKIT_TELEMETRY_DISABLED | Server đặt true nếu chưa có | Telemetry flag SDK |
| AUTH_LOGIN_RATE_LIMIT_MAX | 10 | Login attempts/IP/window |
| AUTH_LOGIN_RATE_LIMIT_WINDOW_MS | 900000 | Login fixed window |
| AUTH_REGISTER_RATE_LIMIT_MAX | 5 | Register attempts/IP/window |
| AUTH_REGISTER_RATE_LIMIT_WINDOW_MS | 3600000 | Register fixed window |

S3 credentials dùng cơ chế credential provider của AWS SDK (environment/role), không hardcode trong source. Local uploads nằm dưới `process.cwd()/uploads`; các npm workspace commands chạy backend với cwd phù hợp. Server không public serve `/uploads`. Nếu container storage không durable, cần storage phù hợp và backup riêng.

## Các behavior cần biết khi tích hợp

- Access JWT 15 phút; refresh random token 7 ngày, DB chỉ lưu hash, rotation atomic và reuse revoke family. Web refresh qua HttpOnly cookie; native refresh qua SecureStore/body. Revoke refresh không invalidate JWT đã cấp ngay.
- `Wallet.initialBalance` là số dư mutable: INCOME tăng ví; EXPENSE ghi báo cáo, **không trừ ví**. Transfer/goal funding mới debit/credit tiền. Reports có các công thức income/savings khác nhau theo màn hình, mô tả trong [business rules](../docs/business_rules.md).
- Wallet/transaction DELETE là soft delete; sync trả transaction tombstones. PUT/DELETE transaction nhận version để client tránh ghi đè dữ liệu cũ.
- Idempotency-Key trên POST tạo transaction/transfer, PUT sửa và DELETE giao dịch; không tự áp dụng cho tất cả mutations.
- Scheduler chạy startup và mỗi 24 giờ, catch-up tối đa 100 lần/schedule/run. Không có durable queue. Notification side effects lỗi được log sau commit.
- Rule-based AI và parser OCR hoạt động khi thiếu key; Copilot enabled cần key, endpoint không tồn tại khi disabled.

## CopilotKit

Server đăng ký 6 tools chỉ đọc: `getFinancialOverview`, `getExpenseBreakdown`, `getBudgetStatus`, `getSavingGoals`, `compareMonthlySpending`, `findTransactions`. Tool tìm giao dịch trả tối đa 20 bản ghi mỗi trang, hỗ trợ ID, nội dung ghi chú/tên ví/tên danh mục, loại và khoảng ngày. User scope được bind từ JWT, không do model/client chọn userId. [Frontend README](../frontend/README.md) mô tả tools mutation/UI phía browser sau xác nhận.

`findTransactions` cho phép các bộ lọc nhận `null`: tìm danh sách phải dùng `transactionId=null`, tránh model tự điền ID khi provider yêu cầu đủ trường. ID không tồn tại/không thuộc user trả `TRANSACTION_NOT_FOUND`; ngày tìm không hợp lệ trả `INVALID_TOOL_INPUT`, phân biệt với lỗi database/timeout. Danh sách rỗng vẫn là kết quả thành công.

`npm run test:copilot-lookup-live --workspace=moneymate-backend` kiểm tra đúng câu hỏi tìm khoản chi ăn uống bằng model đã cấu hình cho danh sách rỗng và hai giao dịch mẫu. Lệnh có provider usage/network; toàn bộ dữ liệu là giả, không đọc tài chính người dùng hoặc ghi database.

Runtime chỉ chấp nhận Bearer; check origin, production HTTPS, payload 64kb, message/rate limits, thread ownership, model timeout và tool limits. Thread/run state nằm trong InMemoryAgentRunner, không lưu bền vững qua restart hay chia sẻ giữa replicas. Agent không forward system/developer messages client hoặc credential headers.

## Build và kiểm thử

Chạy từ root:

| Lệnh | Tác dụng |
| --- | --- |
| `npm run build:packages` | Build packages dùng chung |
| `npm run build --workspace=moneymate-backend` | Compile backend TypeScript sang dist |
| `npm run start --workspace=moneymate-backend` | Chạy dist/server.js sau build |
| `npm run test --workspace=moneymate-backend` | Alias test:unit |
| `npm run test:unit --workspace=moneymate-backend` | Jest unit, bỏ integration |
| `npm run test:integration --workspace=moneymate-backend` | Integration runner và DB probe |
| `npm run test:all --workspace=moneymate-backend` | Unit rồi integration |
| `npm run test:coverage --workspace=moneymate-backend` | Jest coverage theo config |
| `npm run test:dev-startup --workspace=moneymate-backend` | Start server, probe health, stop |
| `npm run test:copilot-live --workspace=moneymate-backend` | Gọi model đã cấu hình để kiểm tra Copilot tool schema; có network/provider usage |

Integration runner đọc `backend/.env.test`, probe TCP MySQL. Khi DB local không reachable, runner vẫn chạy integration Copilot không cần DB và bỏ auth.api.test; `REQUIRE_DATABASE_INTEGRATION=true` hoặc `CI=true` buộc fail khi thiếu DB. Đừng coi local integration exit 0 là DB tests đã chạy. Tài liệu này không khẳng định các suite đã chạy ở mọi môi trường; xem [Testing](../docs/testing.md) để tái hiện.

## Production

[Dockerfile](Dockerfile) build từ **root context**, cài workspace dependencies, generate Prisma, build packages/backend, rồi runtime chạy `prisma migrate deploy && node dist/server.js`. Migration deploy không gọi seed script, nhưng migration recurring/categories đã provision global categories cho fresh DB.

Cấu hình production cần MySQL reachable, JWT secrets phù hợp, exact CORS origins, HTTPS/proxy forwarding, object storage durable và backup. Health không là DB readiness; rate limiting/scheduler/Copilot memory có giới hạn khi scale nhiều replica. Xem [Deployment](../docs/deployment.md) và [Troubleshooting](../docs/troubleshooting.md) để kiểm tra theo topology hiện có.
