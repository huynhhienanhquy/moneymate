# Kế hoạch Phát triển MoneyMate Đa nền tảng

> **Dự án:** MoneyMate — Web, iOS và Android  
> **Phiên bản:** 2.0  
> **Cập nhật:** 22/08/2026  
> **Trạng thái:** Đã triển khai baseline Giai đoạn 0–5; chờ hạ tầng ngoài và kiểm thử thiết bị thật  

## 1. Mục tiêu và Phạm vi

MoneyMate hiện có web React/TypeScript và backend Node.js/Express/Prisma/MySQL. Mục tiêu là bổ sung ứng dụng iOS/Android dùng chung backend và các package không phụ thuộc nền tảng.

Mobile gồm đăng nhập, dashboard, ví, danh mục, giao dịch, ngân sách, mục tiêu, camera OCR, AI Advisor, sinh trắc học, push notification và deep link. Admin, báo cáo chuyên sâu và xuất Excel/PDF tiếp tục ưu tiên trên web.

Offline read cache thuộc Mobile MVP; offline mutation sync được triển khai sau MVP.

## 2. Công nghệ Mobile

- React Native với Expo Managed Workflow và Expo Router.
- TypeScript, NativeWind và design tokens dùng chung.
- TanStack Query cho server state; Zustand cho client state khi cần.
- SecureStore cho refresh token.
- SQLite cho dữ liệu offline bền vững và outbox.
- Expo Camera/Image Picker, Local Authentication và Notifications.

Sử dụng **Expo SDK stable đang được hỗ trợ tại thời điểm triển khai**, sau đó khóa phiên bản trong lockfile. React Native được chọn vì phù hợp với codebase React/TypeScript và hỗ trợ tốt các khả năng native cần thiết.

## 3. Kiến trúc Repository

Giữ nguyên `frontend/` và `backend/` trong giai đoạn đầu để tránh ảnh hưởng Docker, alias và deployment.

```text
moneymate/
├── frontend/                     # Web hiện tại
├── backend/                      # REST API hiện tại
├── apps/
│   └── mobile/                   # Expo React Native
├── packages/
│   ├── contracts/                # DTO, enum, API response types
│   ├── validation/               # Zod schemas dùng chung
│   ├── domain/                   # Business logic thuần
│   ├── api-core/                 # API client factory và API functions
│   └── design-tokens/            # Màu, spacing, typography
├── docs/
└── package.json
```

Chỉ cân nhắc chuyển web/backend vào `apps/` sau khi Mobile MVP và pipeline build ổn định. Turborepo là tùy chọn, không phải điều kiện bắt đầu.

### Phạm vi Chia sẻ Code

| Nhóm | Mức chia sẻ | Ghi chú |
| :--- | :---: | :--- |
| DTO, enum, response types | 90% - 100% | Không phụ thuộc nền tảng |
| Validation và business rules thuần | 80% - 100% | Tách phần phụ thuộc Express/Multer |
| Formatters và tính toán tài chính | 80% - 100% | Thống nhất timezone và kiểu tiền |
| API functions/query definitions | 50% - 80% | Dùng dependency injection |
| Zustand stores | 20% - 50% | Persistence riêng theo nền tảng |
| UI, routing, biểu đồ, file picker | 0% - 20% | Web và Mobile triển khai riêng |

Tỷ lệ chia sẻ tổng thể ban đầu dự kiến **30% - 45%**. Không chia sẻ component web với React Native.

## 4. Shared API và Platform Adapters

Không chuyển Axios singleton hiện tại vào package dùng chung vì nó phụ thuộc Zustand, cookie, `localStorage` và biến môi trường Vite. `api-core` cung cấp client factory:

```ts
interface ApiClientOptions {
  baseUrl: string;
  getAccessToken: () => string | null | Promise<string | null>;
  refreshSession: () => Promise<string>;
  onUnauthorized: () => void | Promise<void>;
}
```

- Web: refresh token qua HttpOnly cookie; access token trong memory.
- Mobile: refresh token qua SecureStore; access token trong memory.
- Test: adapter in-memory.

Không tạo `shared-stores` tổng quát ngay từ đầu. Chỉ chia sẻ types, state machine, actions hoặc selectors thuần; persistence và lifecycle nằm trong từng app.

## 5. Authentication Đa thiết bị

Backend hiện nhận refresh token từ cookie hoặc body nhưng login chỉ trả access token trong response. Cần hoàn thiện contract mobile trước khi xây dựng auth UI:

1. Login mobile gửi `deviceId`, `deviceName`, `platform`, `appVersion` và timezone.
2. Web dùng HttpOnly cookie; mobile nhận refresh token qua body và lưu bằng SecureStore.
3. Rotation trả refresh token mới cho mobile.
4. Database chỉ lưu **hash của refresh token**.
5. Mỗi phiên có `sessionId`, `tokenFamily`, `createdAt`, `lastSeenAt`, `expiresAt`, `revokedAt`.
6. Hỗ trợ logout phiên hiện tại, thu hồi một thiết bị và logout tất cả.
7. Phát hiện token reuse và thu hồi token family liên quan.
8. Access token chỉ giữ trong memory.
9. Sinh trắc học chỉ mở khóa token đã lưu, không thay thế xác thực server.

## 6. Offline và Đồng bộ

### Offline Read Cache — thuộc MVP

- Khôi phục dữ liệu đã tải gần nhất bằng TanStack Query persistence.
- Hiển thị trạng thái kết nối và thời điểm đồng bộ gần nhất.
- Xóa dữ liệu nhạy cảm khi logout.

### Offline Mutation Sync — sau MVP

- SQLite lưu dữ liệu và outbox; MMKV chỉ dùng cho preferences/metadata nhỏ.
- Mỗi mutation có client-generated UUID và `idempotencyKey`.
- Outbox có trạng thái `pending`, `syncing`, `failed`, `synced`.
- Retry bằng exponential backoff, không tạo bản ghi trùng.
- API hỗ trợ delta sync bằng cursor hoặc `updatedSince`.
- Xóa dữ liệu dùng tombstone/delete operation.
- UI hiển thị bản ghi chờ đồng bộ hoặc đồng bộ lỗi.

### Conflict Policy

| Dữ liệu/thao tác | Chính sách |
| :--- | :--- |
| Preferences không quan trọng | Last-Write-Wins |
| Ví, danh mục, ngân sách, mục tiêu | Optimistic concurrency; trả `409 Conflict` khi version cũ |
| Tạo giao dịch/chuyển ví | Idempotency key và database transaction |
| Sửa giao dịch | Kiểm tra version và lưu audit metadata |
| Xóa/đảo giao dịch | Ưu tiên soft delete hoặc reversal |
| Không merge an toàn | Tải dữ liệu mới và yêu cầu xử lý lại |

## 7. Backend cần Bổ sung

### Session và Push Notification

- Mở rộng session theo mục 5.
- Device token gồm user, device, platform, provider, app version, locale, timezone, `lastSeenAt` và trạng thái.
- Vô hiệu token khi Expo/FCM/APNs báo không còn hợp lệ.
- Notification preferences, quiet hours, delivery log, deduplication và retry.
- Worker/queue riêng cho notification và scheduled jobs.

### API và Vận hành

- Stable error codes, pagination, OpenAPI contract và API versioning.
- Idempotency, optimistic concurrency và audit metadata.
- Rate limiting, request ID, structured logging, error monitoring và readiness checks.
- Object storage cho ảnh hóa đơn thay vì local disk trong production.
- Retention, authorization và deletion policy cho ảnh hóa đơn.

API phải thống nhất biểu diễn tiền, ưu tiên decimal string như `"125000.00"` hoặc integer theo đơn vị nhỏ nhất; không tính tiền bằng floating-point không kiểm soát.

## 8. Native Features

### Camera và OCR

Chụp/chọn ảnh → kiểm tra chất lượng → xem trước → nén → upload → OCR → người dùng xác nhận/chỉnh sửa → tạo giao dịch.

### Bảo mật Thiết bị

- SecureStore cho refresh token.
- Face ID/Touch ID/vân tay để mở khóa app.
- Che nội dung khi app vào background/app switcher.
- Xóa session và dữ liệu nhạy cảm khi logout/revoke.

### Push và Deep Links

- Cảnh báo ngân sách, giao dịch định kỳ và sự kiện quan trọng.
- iOS Associated Domains và `apple-app-site-association`.
- Android intent filters và `assetlinks.json`.
- Domain HTTPS production; custom scheme làm fallback.
- Kiểm tra đăng nhập và quyền sở hữu entity trước khi điều hướng.

## 9. Lộ trình Triển khai

### Giai đoạn 0 — API Contract và Backend Foundation (1 - 2 tuần)

- Chốt response/error format, pagination, date/time và money representation.
- Chuẩn hóa contracts từ OpenAPI.
- Thiết kế auth web/mobile, session và token rotation.
- Chốt idempotency, concurrency và sync metadata.
- Test rotation, revoke, reuse và duplicate mutation.

### Giai đoạn 1 — Shared Packages (1 - 2 tuần)

- Tạo `contracts`, `validation`, `domain`, `api-core`, `design-tokens`.
- Di chuyển từng phần nhỏ, không di chuyển UI/browser-specific store.
- Thêm `apps/*`, `packages/*` vào npm workspaces.
- Kiểm tra build, test, Docker sau mỗi bước.

### Giai đoạn 2 — Mobile Online-First MVP (6 - 10 tuần)

- Khởi tạo Expo, navigation, auth, SecureStore và app lifecycle.
- Dashboard, Ví, Danh mục, Giao dịch, Ngân sách và Mục tiêu.
- Offline read cache, error monitoring và test thiết bị thật.

### Giai đoạn 3 — Native Features (4 - 6 tuần)

- Camera/OCR review flow và object storage.
- Biometrics và privacy screen.
- Push, worker/queue và deep links.
- AI Advisor với quota, timeout, retry và kiểm soát chi phí.

### Giai đoạn 4 — Offline Mutation Sync (4 - 8 tuần)

- SQLite, outbox và background sync.
- Idempotency, delta sync, delete propagation và conflict resolution.
- Test mất mạng giữa request, retry, app bị kill và token hết hạn.

### Giai đoạn 5 — Hardening và Store Release (2 - 4 tuần)

- Security, accessibility, performance và privacy review.
- EAS Build/Submit, TestFlight và Play closed testing.
- Privacy policy, account deletion, permission disclosures và store metadata.
- Crash monitoring, staged rollout và rollback plan.

Tổng thời gian dự kiến cho bản production có OCR, push và offline mutation sync là **16 - 24 tuần**. Có thể phát hành bản online-first trước và đưa offline mutation sync sang phiên bản sau.

## 10. Rủi ro Chính

| Rủi ro | Mức độ | Kiểm soát |
| :--- | :---: | :--- |
| Mất/trùng dữ liệu khi offline | Cao | Idempotency, outbox, versioning, audit, network tests |
| Refresh token bị đánh cắp | Cao | SecureStore, token hash, rotation, reuse detection |
| OCR nhận sai | Trung bình | Kiểm tra ảnh và xác nhận trước khi lưu |
| Push gửi trùng/sai thiết bị | Trung bình | Device lifecycle, deduplication, delivery log |
| Regression web khi đổi repo | Trung bình | Di chuyển nhỏ, build/test/Docker liên tục |
| Store review chậm | Trung bình | Chuẩn bị privacy, deletion, permissions từ sớm |

## 11. Tiêu chí Hoàn thành

- `npm ci`, build và test chạy thành công từ root workspace.
- Web hiện tại không bị regression.
- Contract thay đổi có migration/versioning và test.
- Không lưu raw refresh token ở nơi không an toàn.
- Mutation tài chính quan trọng có idempotency và test retry.
- Dữ liệu nhạy cảm được xóa khi logout/revoke.
- Có logging/monitoring phù hợp.
- Test ít nhất trên một thiết bị iOS và Android thật trước release.
- Tài liệu môi trường, build, migration và rollback được cập nhật.

## 12. Bước Tiếp theo

1. Chạy migrations và integration tests trên MySQL staging/test.
2. Tạo EAS project, cấu hình APNs/FCM và các biến môi trường mobile.
3. Thiết lập `app.moneymate.vn` cho Universal Links/App Links.
4. Kiểm thử trên thiết bị iOS/Android thật và hoàn tất legal/store review.

## 13. Trạng thái Triển khai

| Giai đoạn | Đã triển khai trong repo | Còn phụ thuộc/bổ sung |
| :--- | :--- | :--- |
| 0 — Backend foundation | Mobile/web session transport, token hash/rotation, device sessions, request ID, stable error code, device tokens, idempotency; version/concurrency cho giao dịch | Chạy migrations và integration tests trên MySQL; mở rộng version cho các entity còn lại nếu cần offline CRUD |
| 1 — Shared packages | Contracts, validation, domain, API core, design tokens; web/backend/mobile đã dùng một phần | Tiếp tục di chuyển DTO/schema theo từng module |
| 2 — Mobile MVP | Expo Router, auth/register, Dashboard, Ví, Giao dịch, Ngân sách, Mục tiêu, AI, profile | Hoàn thiện CRUD UI nâng cao và kiểm thử UX thiết bị thật |
| 3 — Native features | SecureStore, biometrics, privacy shield, camera/OCR, object-storage local/S3, Expo push registration/delivery, deep links | APNs/FCM/EAS credentials, S3 production, universal-link files và HTTPS domain production |
| 4 — Offline | SQLite outbox, exponential backoff, TanStack Query persistence, idempotent replay, cursor delta sync, tombstones và version conflict khi xóa | Mở rộng offline edit/delete UI và conflict UX cho các entity ngoài giao dịch |
| 5 — Release | EAS profiles, CI, privacy draft, account deletion, release/rollback runbook | Tài khoản Apple/Google/Expo, legal review, store assets và staged rollout |

Các mục phụ thuộc dịch vụ ngoài hoặc thiết bị thật không được xem là đã xác minh chỉ vì code/config đã tồn tại.
