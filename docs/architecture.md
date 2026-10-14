# Kiến trúc hệ thống

> Đối chiếu mã nguồn và cấu hình trong worktree ngày 2026-10-13. Các mô tả dưới đây là hành vi được triển khai; không phải chứng nhận hệ thống production đã được kiểm thử.

MoneyMate là monorepo npm workspaces gồm API Express, web React/Vite và ứng dụng Expo cho iOS/Android. MySQL là nguồn dữ liệu chính. Web và mobile dùng chung API nhưng có adapter HTTP, điều hướng, lưu trữ phiên và giao diện riêng.

## 1. Các thành phần và ranh giới

```text
Web React/Vite ───────────┐
                         ├── HTTP(S)/JSON ── Express API ── Prisma ── MySQL
Mobile Expo ─────────────┘                      │
  ├─ SecureStore                               ├─ File local hoặc S3
  ├─ Query cache đã persist                    ├─ OpenAI / CopilotKit (tùy chọn)
  └─ SQLite outbox + transaction deltas        └─ Expo Push (tùy chọn)
```

| Thành phần | Trách nhiệm | Ranh giới |
| --- | --- | --- |
| `backend/` | Xác thực, phân quyền, nghiệp vụ tài chính, DB, upload/export, AI, thông báo | Quyết định quyền truy cập và tính hợp lệ của mọi thao tác |
| `frontend/` | UI trình duyệt, biểu đồ, route guards, truy vấn, OCR và trợ lý web | Không truy cập DB; dữ liệu cache/profile không thay thế xác thực server |
| `apps/mobile/` | UI native, phiên thiết bị, camera, chia sẻ báo cáo, cache và outbox | Refresh token native lưu trong SecureStore; cache tài chính nằm trong SQLite |
| `packages/` | Types, validation/helper và design tokens dùng chung | Không import ngược mã của các ứng dụng |

Backend phân phạm vi dữ liệu tài chính theo `req.user.id`; API quản trị có middleware kiểm tra vai trò riêng. Route guard ở client hỗ trợ trải nghiệm điều hướng, quyền thực sự do API quyết định. Xem [xác thực và phiên](auth_sessions.md) và [API](api.md).

## 2. Backend

Luồng thông thường:

```text
route → middleware → controller → service → repository → Prisma → MySQL
```

- **Route** ghép endpoint với middleware và controller.
- **Middleware** xác thực Bearer token, kiểm tra admin, Zod validation, giới hạn upload, idempotency, request ID và xử lý lỗi.
- **Controller** chuyển HTTP input thành tham số use case, trả JSON hoặc file export.
- **Service** kiểm tra ownership, quan hệ ví/danh mục, phiên bản và quy tắc nghiệp vụ.
- **Repository** đóng gói truy vấn Prisma; một số service dùng Prisma trực tiếp cho thao tác nhiều bảng cần transaction.
- **`copilotkit/`** là runtime riêng cho luồng trợ lý stream, kèm auth và các giới hạn đầu vào, thời gian, số bước, origin và thread.

[app.ts](../backend/src/app.ts) lắp middleware, `/health`, `/api-docs` và các nhóm `/api/*`. [server.ts](../backend/src/server.ts) nạp môi trường, kiểm tra cấu hình, mở port mặc định `5000`, chạy recurring khi khởi động và mỗi 24 giờ, đóng HTTP/Prisma khi nhận tín hiệu dừng.

Các thao tác chuyển tiền, nạp/rút mục tiêu và sinh recurring cần cập nhật nhiều bản ghi được tổ chức bằng DB transaction. Giao dịch có `version` để phát hiện ghi đè; transaction và wallet có trường xóa mềm. Đồng bộ transaction trả cả tombstone. Chi tiết dữ liệu ở [ERD](erd.md), quy tắc số dư ở [business rules](business_rules.md).

### Storage và tác vụ nền

[storage.service.ts](../backend/src/services/storage.service.ts) chọn file local nếu `STORAGE_DRIVER` khác `s3`, hoặc S3-compatible object storage nếu được cấu hình. File local nằm dưới `uploads/` của working directory backend. Truy cập attachment qua API có kiểm tra quyền; URL storage được lưu trong DB không đồng nghĩa với một static route public của Express.

Recurring là timer trong tiến trình API, không có worker/queue độc lập. Mỗi lịch được claim trong DB transaction trước khi sinh tối đa 100 lần còn thiếu trong một lượt. Khi tiến trình dừng, timer cũng dừng; lần khởi động sau sẽ xử lý những kỳ đến hạn. Thông báo sau commit có thể thất bại mà không rollback giao dịch đã ghi.

## 3. Web

[App.tsx](../frontend/src/App.tsx) khởi tạo theme và khôi phục phiên; [AppProviders.tsx](../frontend/src/contexts/AppProviders.tsx) cung cấp TanStack Query và BrowserRouter. [AppRoutes.tsx](../frontend/src/config/route/AppRoutes.tsx) lazy-load màn hình, phân route public, private và admin.

| Loại state | Cách quản lý hiện tại |
| --- | --- |
| Dữ liệu server | TanStack Query; màn hình/hook chủ động invalidate sau mutation |
| Auth/profile | Zustand; access token trong bộ nhớ, profile cache trong localStorage |
| Theme | Zustand; lựa chọn `light`/`dark` lưu localStorage, áp `.dark` lên `<html>` |
| Form, modal, bộ lọc | React state tại component/hook |

[Axios client](../frontend/src/services/api/client.ts) gắn Bearer token và `withCredentials`, gom các refresh đồng thời thành một promise, retry request 401 một lần. Login/logout chờ refresh đang chạy để tránh cạnh tranh xoay cookie. Lỗi mạng lúc khôi phục phiên giữ profile cache và hiện nút thử lại; 401/403 từ refresh xóa phiên client.

Trong development, Vite phục vụ port `5173` và proxy `/api` tới backend local. Asset public được lấy từ `assets/images/` ở root, không phải một thư mục `frontend/public/`. Trong container, Nginx phục vụ SPA và proxy `/api`; cấu hình hiện có không proxy `/health` ra frontend.

## 4. Mobile

Expo Router lấy route từ `apps/mobile/src/app/`; phần lớn route re-export màn hình ở `src/pages/`. Root layout nạp font Be Vietnam Pro, theme provider, app provider và Stack. Thanh điều hướng hiển thị qua `navigation-shell.tsx`; tab bar mặc định của Expo Router được ẩn.

[AppProvider](../apps/mobile/src/providers/app-provider.tsx) ghép các lớp:

```text
PersistQueryClientProvider
└─ OfflineProvider (native SQLite; web chỉ trả children)
   └─ SessionBootstrap
      └─ MobileChatbotProvider
         ├─ AuthNavigation
         ├─ NotificationNavigation
         └─ Màn hình
```

Mobile dùng `fetch` qua [lib/api.ts](../apps/mobile/src/lib/api.ts), tự gắn access token, gom refresh đồng thời và retry 401 một lần. Native nhận refresh token trong body và lưu SecureStore. Expo web dùng HttpOnly cookie; chỉ profile được lưu trong localStorage. Khởi động offline có thể dùng profile/cache khi có credential đã lưu, nhưng request server vẫn cần token hợp lệ.

Query cache persist tối đa 24 giờ, `staleTime` 30 giây, query retry một lần. Native dùng `expo-sqlite/kv-store`, web dùng localStorage. Outbox và transaction cache được phân theo `user_id`. Đăng xuất xóa credential và persisted Query cache; các bảng SQLite theo user không bị xóa bởi luồng logout hiện tại.

### Phạm vi offline hiện tại

- `AddTransactionPage` queue JSON **tạo hoặc sửa giao dịch** khi request lỗi mạng hoặc HTTP 5xx. HTTP 4xx trả thẳng lỗi; delete/transfer và các form khác chưa gọi outbox.
- Mỗi mục lưu một UUID dùng lại làm `Idempotency-Key`. Không queue upload ảnh; ảnh hóa đơn của giao dịch được queue không được persist/replay.
- Backend áp idempotency cho POST tạo transaction/transfer, PUT sửa và DELETE giao dịch với record thời hạn 24 giờ. PUT/DELETE vẫn kiểm tra `version`; khi client gửi key, replay cùng request đã hoàn tất trả lại response cũ. DELETE đưa query version vào hash request.
- Khi NetInfo báo có kết nối, `OutboxSync` gửi tối đa 50 mục đủ thời điểm retry rồi tải tối đa 10 trang delta, mỗi trang 100 transaction.
- Retry thất bại tăng `attempts` và đặt `next_attempt_at` bằng backoff. Chưa có timer riêng chạy đúng thời điểm đó, giao diện giải quyết conflict hoặc nút replay thủ công.
- Delta cập nhật `transactions_cache` và cursor SQLite. Màn hình giao dịch hiện đọc qua Query/API; chưa dùng bảng delta làm nguồn hiển thị và replay chưa invalidate Query cache. Vì vậy đây là hạ tầng đồng bộ từng phần, chưa phải toàn bộ UI hoạt động offline.
- Expo web không có outbox: adapter `offline.web.ts` báo lỗi khi enqueue.

### Native capability và giới hạn

Camera/ảnh được dùng cho OCR rồi chuyển kết quả sang form giao dịch để người dùng kiểm tra. Push đăng ký theo device ID, bỏ qua Expo Go và chưa hỗ trợ Expo web. App có privacy shield khi vào background và gọi API ngăn screenshot theo khả năng nền tảng. Hàm xác thực sinh trắc học hiện được gọi từ nút kiểm tra tại trang profile; chưa có khóa sinh trắc học bắt buộc mỗi lần mở app.

Scheme `moneymate`, bundle/package `vn.moneymate.app` và domain liên kết `app.moneymate.vn` được khai báo trong `app.json`. Khai báo này chưa xác nhận domain/signing hay Universal/App Links đã hoạt động trên thiết bị. Xem [mobile README](../apps/mobile/README.md) và [runbook phát hành](mobile_release.md).

## 5. AI và Copilot

Các endpoint REST `/api/ai/*` phục vụ phân tích, dự báo, tư vấn, chat và OCR. Mobile chatbot hiện gọi `/ai/chat`; không đăng ký các CopilotKit browser tools.

Web có trợ lý CopilotKit khi flag frontend được bật, người dùng đã đăng nhập và có access token. Backend cũng cần `COPILOTKIT_ENABLED=true` cùng cấu hình model/key phù hợp. Khi flag frontend tắt, UI dùng chat REST cũ.

| Nơi chạy | Công cụ | Hành vi |
| --- | --- | --- |
| Backend Copilot | `getFinancialOverview`, `getExpenseBreakdown`, `getBudgetStatus`, `getSavingGoals`, `compareMonthlySpending`, `findTransactions` | Đọc dữ liệu theo user đã xác thực; tìm giao dịch trả tối đa 20 bản ghi/trang |
| Browser Copilot | `recordExpense`, `recordIncome`, `transferFunds`, `createCategory`, `createWallet`, `createBudget`, `createSavingGoal`, `createRecurringTransaction` | Chuẩn bị dữ liệu và chờ người dùng xác nhận rồi mới gọi REST API |
| Browser Copilot | `updateTransaction`, `deleteTransaction` | Tải chi tiết giao dịch thu/chi, hiển thị trước/sau hoặc thông tin xóa, chờ xác nhận; gửi version và idempotency key |
| Browser Copilot | `setAppTheme`, `navigateToPage` | Đổi theme hợp lệ hoặc đi tới route trong allowlist |

Ngữ cảnh gửi model gồm route, tên màn hình, theme, `vi-VN`, ngày local và timezone. Access token chỉ ở header transport. Quyền truy cập do backend xác định, không lấy từ ngữ cảnh model. Các giới hạn runtime đọc ở [config/copilotkit.ts](../backend/src/config/copilotkit.ts) và [copilotkit/security.ts](../backend/src/copilotkit/security.ts).

Đóng/mở khung Copilot chỉ ẩn/hiện UI, giữ cùng thread và state đang chờ xác nhận. Provider remount theo user để tránh dùng hội thoại của tài khoản khác. Refresh/đăng xuất vẫn kết thúc phiên chat; runner giữ trạng thái trong RAM, chưa có lưu lịch sử lâu dài.

**Giới hạn Copilot transfer đã biết:** browser [TransferConfirmation](../frontend/src/components/MoneyMateCopilot/DataMutationTools.tsx) kiểm tra `data === true`, trong khi [transaction controller](../backend/src/controllers/transaction.controller.ts) trả object `WalletTransfer` và HTTP `201`. Server có thể đã commit debit/credit nhưng UI vẫn hiện lỗi xác nhận, chưa chạy nhánh invalidate thành công. Cần đối chiếu trạng thái server trước khi tạo tool call/key mới; idempotency cùng key không sửa sự lệch contract này. Tài liệu mô tả lỗi đang có, không khẳng định transfer Copilot đã hoạt động trọn vẹn.

## 6. Shared packages: mức dùng thực tế

`contracts` hiện tập trung vào auth/platform và envelope response; financial DTO vẫn có type riêng tại từng app. `validation` được backend dùng cho login. `design-tokens` được web/mobile import, với adapter style riêng. `domain` có helper kiểm tra money string; `api-core` có factory client/transport refresh, nhưng client HTTP thực tế vẫn là Axios và fetch riêng, chưa sử dụng factory này. Không coi các package helper là đã hợp nhất toàn bộ nghiệp vụ hay networking.

## 7. Triển khai và quan sát

Compose hiện gồm MySQL 8.0, backend Node và frontend Nginx; MySQL có named volume. Backend container chạy `prisma migrate deploy` trước server. Compose chưa thêm TLS ingress, persistent volume cho attachment local, biến S3/push hoặc job backup; cần cấu hình bổ sung theo môi trường thực tế. CI có build/test, mobile Android/web export và Docker smoke được khai báo, không có job ký/phát hành native lên store.

Request ID và error middleware hỗ trợ lần theo lỗi API. `/health` chỉ trả trạng thái tiến trình và timestamp, không thực hiện kiểm tra DB/S3/model sâu. Xem [deployment](deployment.md), [testing](testing.md), [troubleshooting](troubleshooting.md).

## Đọc tiếp

- [Tổng quan](overview.md) · [Requirements](requirements.md) · [Tech stack](tech-stack.md)
- [Cấu trúc project](project-structure.md) · [Sơ đồ hệ thống](diagrams.md) · [Thiết lập môi trường](environment-setup.md)
- [Coding conventions](coding-conventions.md) · [Changelog](changelog.md)
