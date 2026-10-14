# Đặc tả yêu cầu hệ thống — MoneyMate

> Baseline tài liệu ngày 13/10/2026, đối chiếu workspace hiện tại. Không phải số version phát hành ứng dụng. [Mục lục](README.md).

## 1. Mục đích và phạm vi

SRS xác định sản phẩm, giao diện, ràng buộc dữ liệu, chất lượng và cách nghiệm thu MoneyMate. Yêu cầu có ID nằm trong [requirements.md](requirements.md); quy tắc chi tiết nằm trong [business_rules.md](business_rules.md).

MoneyMate cung cấp web và mobile iOS/Android cho tài chính cá nhân: tài khoản, ví, danh mục, thu/chi, chuyển ví, ngân sách, mục tiêu, lịch định kỳ, báo cáo, attachment, thông báo, OCR và AI. Admin có khu vực quản lý tài khoản riêng. Không có tích hợp ngân hàng, FX, social login hoặc reset mật khẩu qua email trong phạm vi hiện tại.

## 2. Người sử dụng

`USER` quản lý dữ liệu của mình. `ADMIN` quản lý tài khoản qua API được bảo vệ. Khách chỉ sử dụng đăng ký/đăng nhập. Người vận hành quản lý infrastructure, cấu hình và release bên ngoài role sản phẩm.

Web guard có thể chuyển admin sang trang admin, nhưng backend mới là ranh giới kiểm soát quyền. User ID trong body hoặc ngữ cảnh AI không thay thế principal từ access token.

## 3. Thành phần hệ thống

Web React/Vite và Expo mobile gọi Express API. API dùng Prisma/MySQL, có object-storage adapter, AI provider, OCR, Expo push và scheduler định kỳ. Shared packages cung cấp auth contract/schema, token và helper chọn lọc; chưa phải toàn bộ domain/API dùng chung.

Web dùng Axios/TanStack Query/Zustand; mobile dùng fetch adapter, Query persistence, SQLite và SecureStore native. Sơ đồ và module ở [architecture](architecture.md), [project structure](project-structure.md), [ERD](erd.md).

## 4. Giao diện bên ngoài

| Giao diện | Contract |
| --- | --- |
| REST | Prefix `/api`, JSON request/response; upload multipart, export/download binary |
| Xác thực API | `Authorization: Bearer <accessToken>` |
| Phiên web | Refresh cookie HttpOnly; request refresh gửi credentials |
| Phiên native | Refresh token trong body và SecureStore, metadata platform/device |
| API delta | Cursor opaque, version, `deletedAt` và tombstone giao dịch |
| Mutation replay | `Idempotency-Key` trên route hỗ trợ; không bao phủ mọi POST |
| Copilot web | `/api/copilotkit`, authenticated single endpoint; giao thức agent/stream riêng |
| Health | `GET /health` xác nhận tiến trình HTTP; không suy diễn tất cả dependency healthy |
| Swagger | `/api-docs` có UI; không thay thế route inventory/validator trong [api.md](api.md) |

Web có public login/register, khu vực tài chính có auth và admin route có role. Mobile dùng Expo Router với page tài chính, hóa đơn và thông báo. Cấu hình môi trường gồm URL API, origin, secret, storage/AI tùy chọn; xem [environment setup](environment-setup.md).

## 5. Chức năng và dữ liệu

### 5.1 Tài khoản

Đăng ký yêu cầu email/họ tên/password. Access token HS256 hạn 15 phút; refresh opaque hạn 7 ngày, lưu SHA-256 ở DB và rotate atomic. Refresh reuse thu hồi family. Người dùng xem/revoke phiên, đổi mật khẩu và xóa tài khoản bằng password confirmation. Đổi mật khẩu thu hồi refresh session; access JWT đã phát hành không có blacklist tức thời.

### 5.2 Tài chính và lập kế hoạch

Ví có số dư mutable trong `initialBalance`; income tăng số dư, expense thường ghi báo cáo/kiểm tra đủ số dư nhưng không trừ ví. Transfer và nạp/rút goal thực sự dịch chuyển tiền atomic. Giao dịch thường có soft delete và optimistic version tùy payload; transfer bất biến qua CRUD thường.

Budget là tổng hoặc theo danh mục của một tháng; ngưỡng 80%/100% tạo notification, vượt budget không tự chặn expense. Goal có progress/status tính từ dữ liệu và không được xóa nếu có tiền/lịch sử. Recurring hỗ trợ 4 chu kỳ, claim kỳ để chống trùng và catch up có giới hạn.

### 5.3 Báo cáo

Dashboard/report/trend/year và export sử dụng các định nghĩa cụ thể trong service/repository, gồm số dư ví, khoản thực tế và khoản định kỳ dự kiến. Không gán mọi trường `income`/`savings` cho một công thức thu trừ chi thông thường. Snapshot kỳ đóng là cache có thể vô hiệu/tính lại, không phải sổ kế toán bất biến.

### 5.4 File và thông báo

Attachment thuộc giao dịch/user, giới hạn MIME và 5 MiB. Storage local hoặc S3-compatible tùy cấu hình. OCR đưa dữ liệu dự thảo để xem lại; PDF không có text/ảnh khó đọc có thể trả kết quả độ tin cậy thấp. Push là tác vụ ngoài DB, failure delivery không hoàn tác dữ liệu tài chính đã commit.

### 5.5 AI và Copilot

AI REST có analysis/forecast/advisor/chat/OCR và fallback tùy tác vụ. CopilotKit web cần flag/key: 6 tool server đọc user-scoped, gồm tìm giao dịch có giới hạn; 10 tool web ghi có xác nhận, gồm sửa/xóa giao dịch thu/chi; 2 tool theme/navigation. Ghi chỉ xảy ra sau xác nhận REST qua quyền user, sửa/xóa kiểm tra version. Đóng/mở khung chat giữ hội thoại trong phiên đăng nhập. Native mobile dùng REST chat, không đăng ký bộ tool web.

Luồng Copilot `transferFunds` đang có lỗi contract: backend trả object `WalletTransfer`, UI chờ boolean `true`. Transfer có thể đã commit trong khi UI báo lỗi và chưa invalidate cache; điều kiện chấp nhận báo thành công chưa đạt ở luồng này. Xem [kiến trúc](architecture.md).

## 6. Chất lượng và ràng buộc

- Ownership, input validation, password hash, refresh rotation, rate limits và idempotency là các cơ chế hiện có, cần giữ khi phát triển.
- HTTPS, backup/restore, secret rotation, durable storage và giám sát là trách nhiệm triển khai; Compose không tự cung cấp đầy đủ.
- Strict TypeScript và phân lớp backend hỗ trợ bảo trì; các workspace khác phiên bản React/TypeScript/Zod.
- Latency, throughput và accessibility cần đo; repo chưa xác nhận SLA hay chứng nhận WCAG.
- Ngày kỳ báo cáo/scheduler có phần phụ thuộc timezone backend. Currency chưa có quy đổi.
- Scheduler chạy trong process mỗi 24 giờ và lúc startup; Copilot thread state/rate counters có phần in-memory, cần đánh giá trước multi-instance.
- Outbox mobile tạo/sửa JSON không lưu file; retry phụ thuộc sự kiện kết nối, delta SQLite chưa nối đầy đủ với UI.
- Biometrics có thao tác thử ở hồ sơ, chưa tự động app lock. Camera/push/screen privacy/deep link cần build và thiết bị phù hợp.

## 7. Nghiệm thu và vận hành

| Mảng | Cách kiểm chứng |
| --- | --- |
| Logic/security backend | Unit tests; auth/Copilot integration theo [testing](testing.md) |
| Web | Vitest component/hooks/store, lint và production build |
| Mobile | Lint/typecheck/export; native/device QA theo [mobile release](mobile_release.md) |
| Database | Áp dụng migration trên DB riêng, kiểm tra constraint; staging/backup/restore trước production |
| Provider tùy chọn | Smoke staging với key/bucket/device thật theo cấu hình được duyệt |
| Production | HTTP, login/refresh, ownership, write/report/storage và monitoring sau deploy |

Tests có trong repo không đồng nghĩa đã chạy thành công cho mọi cấu hình. Không có bộ E2E browser/mobile tự động hoàn chỉnh hiện tại. CI chưa publish/deploy; phải áp dụng [deployment runbook](deployment.md).

Thay đổi API/schema/nghiệp vụ phải cập nhật requirement/story tương ứng và [changelog](changelog.md).
