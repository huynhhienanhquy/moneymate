# Testing — Kiểm thử

> Phạm vi được đối chiếu với scripts/config trong working tree ngày **2026-10-13**. Danh sách dưới đây mô tả các kiểm tra hiện có; kết quả một lần chạy phải được ghi riêng với commit, môi trường và những suite đã bỏ qua.

## 1. Các lệnh kiểm tra

Chạy từ root sau [Environment Setup](environment-setup.md):

| Lệnh | Phạm vi thực tế |
| --- | --- |
| `npm test` | Backend unit Jest, sau đó frontend Vitest; không chạy integration/mobile |
| `npm run test:integration` | Backend integration runner, gồm DB auth khi MySQL reachable và CopilotKit HTTP/SSE |
| `npm run lint` | ESLint frontend, sau đó Expo lint mobile; backend không có script lint |
| `npm run build` | Build năm shared package → backend TypeScript → web TypeScript/Vite → mobile typecheck/Android export |
| `npm run build:web --workspace=moneymate-mobile` | Expo web export vào `.tmp-web-export` |
| `npm run test:dev-startup --workspace=moneymate-backend` | Spawn server TypeScript, đợi `/health`, dừng process |
| `npm run test:unit --workspace=moneymate-backend` | Chỉ Jest test ngoài thư mục integration, `--runInBand` |
| `npm run test:all --workspace=moneymate-backend` | Unit rồi integration của backend |
| `npm run test:coverage --workspace=moneymate-backend` | Jest coverage theo cấu hình backend; mặc định có thể chọn cả integration |
| `npm run test:coverage --workspace=moneymate-frontend` | Vitest coverage với ngưỡng 90% cho statements/branches/functions/lines |
| `npm run typecheck --workspace=moneymate-mobile` | TypeScript mobile, không chạy ứng dụng |

`npm run build` không tự generate Prisma client. Chạy `npm run prisma:generate --workspace=moneymate-backend` sau install/thay schema. Shared package cần build để consumer giải quyết entrypoint trong `dist`.

### Chạy test cụ thể và watch

```bash
npm run test:unit --workspace=moneymate-backend -- --testPathPattern=wallet.service.test.ts
npm run test --workspace=moneymate-frontend -- src/pages/WalletsPage/WalletsPage.test.tsx
npm run test:watch --workspace=moneymate-backend
npm run test:watch --workspace=moneymate-frontend
```

Backend watch/coverage dùng cấu hình Jest mặc định, không tự thêm `--testPathIgnorePatterns=/integration/` như `test:unit`. Nếu chỉ muốn coverage unit, dùng:

```bash
npm run test:coverage --workspace=moneymate-backend -- --runInBand --testPathIgnorePatterns=/integration/
```

## 2. Backend unit và integration

Backend dùng Jest 29 + ts-jest, môi trường Node, test dưới `backend/src/__tests__`. Setup nạp `backend/.env.test` theo cwd workspace và đặt timeout 30 giây. Shell environment đã có được ưu tiên vì `dotenv` không bật override.

Unit suite bao phủ service/repository, validators, auth/controller, middleware/error/idempotency, wallet/transaction/budget/savings/recurring, attachment/OCR/export, context và Copilot security/tools/runtime. Phần lớn phụ thuộc ngoài được mock. Việc test repository qua mock không chứng minh query/migration trên MySQL thật.

Integration có hai file chính:

| Suite | Phụ thuộc | Hành vi |
| --- | --- | --- |
| `auth.api.test.ts` | MySQL thật đã migrate | Register/login/cookie/token và protected profile qua Supertest; tạo user có email duy nhất |
| `copilotkit.api.test.ts` | Runtime trong process và custom agent | Kiểm tra handshake, authorization, origin, SSE, giới hạn body/session; không gọi model ngoài |

Auth integration hiện **không tự reset DB, không tự migrate và không cleanup user**. Nó ghi dữ liệu vào `DATABASE_URL`, vì vậy phải chạy trên DB test riêng. File này còn có nhánh return sớm ở protected-profile test nếu không lấy được access token; phải đọc kết quả các test register/login trước đó khi đánh giá bằng chứng auth.

### Chuẩn bị MySQL test riêng

Tạo DB local chỉ dành cho test, ví dụ `moneymate_test`, rồi đặt URL trong shell. Không trỏ test vào production hoặc DB phát triển cần giữ. Không copy secret production vào `.env.test`.

**PowerShell** (thay URL theo MySQL test của bạn):

```powershell
$env:DATABASE_URL = 'mysql://root:test-password@127.0.0.1:3306/moneymate_test'
$env:NODE_ENV = 'test'
$env:REQUIRE_DATABASE_INTEGRATION = 'true'
npm run prisma:generate --workspace=moneymate-backend
npm exec --workspace=moneymate-backend -- prisma migrate deploy
npm run test:integration
Remove-Item Env:DATABASE_URL
Remove-Item Env:NODE_ENV
Remove-Item Env:REQUIRE_DATABASE_INTEGRATION
```

**Bash:**

```bash
export DATABASE_URL='mysql://root:test-password@127.0.0.1:3306/moneymate_test'
export NODE_ENV=test
export REQUIRE_DATABASE_INTEGRATION=true
npm run prisma:generate --workspace=moneymate-backend
npm exec --workspace=moneymate-backend -- prisma migrate deploy
npm run test:integration
unset DATABASE_URL NODE_ENV REQUIRE_DATABASE_INTEGRATION
```

Các lệnh remove/unset giả định những biến này chưa được đặt trước đó; nếu có cấu hình shell cũ, lưu và khôi phục giá trị cũ sau khi chạy. Ví dụ trên không xóa dữ liệu. Nếu muốn test từ DB trống, tạo DB dùng một lần mới và hủy đúng DB đó sau khi kiểm tra; thao tác `prisma migrate reset` là **destructive**, không nằm trong runner và không cần cho lượt test thông thường.

### Khi DB không có sẵn

[run-integration-tests.cjs](../backend/scripts/run-integration-tests.cjs) chỉ thử TCP tới host/port trong URL với timeout 1,5 giây:

- DB không reachable và `REQUIRE_DATABASE_INTEGRATION`/`CI` không bằng chuỗi `true`: log cảnh báo, bỏ `auth.api.test.ts`, vẫn chạy integration không phụ thuộc DB.
- DB không reachable và một trong hai cờ bằng `true`: exit `1`, không được báo full integration thành công.
- TCP reachable: runner chạy toàn suite. Sai password, thiếu DB, migration thiếu vẫn làm suite lỗi; probe không xác thực credential hoặc schema.

Runner trả exit code của Jest. Việc chạy integration local thành công khi DB bị bỏ qua chỉ chứng minh phần không phụ thuộc DB.

## 3. Frontend web

Vitest 5 + React Testing Library chạy trong `jsdom`, dùng [setup.ts](../frontend/src/test/setup.ts) để đăng ký DOM matchers và cleanup sau mỗi test. Test có render/page behavior, routing/auth, store/hook/API client, form/modal, receipt, notification, navigation và Copilot UI/actions.

Coverage tại [vite.config.ts](../frontend/vite.config.ts) đo file `.ts` trong ứng dụng, loại test/story/type/setup và declaration. File `.tsx` được kiểm tra bằng render/behavior suite nhưng không nằm trong phạm vi coverage này. Ngưỡng 90% chỉ được enforce khi chạy lệnh coverage; CI hiện chạy `npm test`, không chạy coverage.

Mock API/query trong jsdom không xác minh cookie/CORS trên trình duyệt thật, responsive layout hay hành vi trên máy chủ đã triển khai. Storybook (`npm run storybook --workspace=moneymate-frontend`) hỗ trợ kiểm tra component bằng tay, không phải suite E2E tự động.

## 4. Mobile và kiểm tra thủ công

Mobile chưa có script `test`, Jest/Vitest riêng hoặc framework E2E như Detox/Maestro/Playwright được cấu hình trong repository. CI kiểm tra lint, typecheck và Android/web export. Export thành công chứng minh bundle được tạo, chưa chứng minh ứng dụng chạy đúng trên thiết bị hoặc ký binary thành công.

Trên iOS/Android development/release build, kiểm tra các luồng:

1. Register/login, refresh sau restart, logout, revoke session và biometric lock.
2. Wallet/transfer/transaction CRUD; update/delete đồng bộ giữa web và mobile.
3. Offline tạo/sửa/xóa, outbox replay khi online, timeout retry/idempotency và conflict version.
4. Dashboard/budget/saving goal/recurring/report/monthly balance sau thay đổi dữ liệu.
5. Camera/photo permission, receipt OCR, upload và download attachment có auth.
6. Push registration/permission/tap routing, deep link cold start và Android Back.
7. Dark/light, font lớn, accessibility, mạng chậm và phiên hết hạn.

Xem [Mobile Release](mobile_release.md) cho checklist phát hành chi tiết và [Business Logic](business_rules.md) cho điều kiện đúng của dữ liệu tài chính.

## 5. Startup smoke và live Copilot

Startup smoke mặc định cổng `5099`, timeout `60000ms`; có thể đổi bằng `DEV_STARTUP_CHECK_PORT` và `DEV_STARTUP_CHECK_TIMEOUT_MS`. Script chờ log khởi động của process chính nó trước khi chấp nhận `/health`, rồi kết thúc process. Đây là liveness smoke, không phải DB readiness test. Server thật vẫn chạy recurring startup; DB smoke phải dùng dữ liệu thử nghiệm.

`npm run test:copilot-live --workspace=moneymate-backend` là kiểm tra **tùy chọn**, không nằm trong `npm test` hoặc CI. Script đọc `backend/.env`, gọi model ngoài để tạo expense draft 12 VND; nó không lưu transaction. Cần khóa/API hợp lệ và có thể phát sinh chi phí. Chỉ chạy khi chủ động kiểm tra dịch vụ thật; không dùng làm test unit/integration mặc định.

## 6. CI thực tế

[.github/workflows/ci.yml](../.github/workflows/ci.yml) chạy khi push và pull request:

| Job | Các gate |
| --- | --- |
| `build-and-test` | Ubuntu, Node 22.14.0, MySQL 8.0 dùng một lần → `npm ci` → Prisma generate/migrate deploy → root lint/build → mobile web export → startup smoke → root unit/web tests → integration |
| `docker-smoke` | Build/start Compose → curl backend `/health` → kiểm tra web root HTML → `/api/auth/sessions` qua Nginx phải trả `401` → logs nếu lỗi → hủy stack/volume CI |

CI đặt `REQUIRE_DATABASE_INTEGRATION=true`, `NODE_ENV=test` và URL `moneymate_test`, nên thiếu MySQL là failure. Job Docker không kiểm tra đăng nhập refresh cookie, DB query nghiệp vụ, lưu attachment hoặc release mobile. Workflow chưa publish image/artifact hoặc deploy vào production.

Khi báo kết quả, ghi rõ lệnh, exit code, DB có chạy hay bị skip, và các kiểm tra thiết bị/manual đã làm. Xem [Troubleshooting](troubleshooting.md) khi suite bị lỗi; không nâng timeout hay bỏ gate trước khi hiểu nguyên nhân.
