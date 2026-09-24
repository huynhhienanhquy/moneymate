# Báo cáo rà soát lỗi còn lại — MoneyMate

**Ngày kiểm tra:** 04/09/2026

**Cập nhật gần nhất:** 05/09/2026

**Phạm vi:** backend, frontend, mobile, shared packages, Prisma, Docker và CI

**Trạng thái mã nguồn khi audit:** working tree có 59 file modified và 37 file untracked
**Chế độ:** audit ban đầu read-only; cập nhật sau các đợt sửa P0/P1/P2 và CI/technical debt

## 0. Cập nhật P0 sau khi áp dụng `codex-agent-kit`

Định nghĩa severity của kit xác định P0 là lỗi gây sự cố nghiêm trọng hoặc mất dữ liệu tức thì. Theo tiêu chí này, báo cáo ban đầu đã xếp thấp 5 finding. Các mã ban đầu được giữ lại để truy vết:

| Mã P0 | Finding ban đầu | Trạng thái code | Khắc phục |
|---|---|---|---|
| P0-01 | P1-01 | Đã sửa | Middleware ghi dữ liệu Zod đã coerce trở lại request; HTTP handler nhận `Date` thật |
| P0-02 | P1-06 | Đã sửa | Seed chỉ tạo system categories, không còn tạo admin/demo bằng credential công khai |
| P0-03 | P1-07 | Đã sửa | Chỉ xóa goal chưa từng có ledger và có số dư 0; thay đổi đồng thời trả `409 SAVING_GOAL_NOT_EMPTY` |
| P0-04 | P1-08 | Đã sửa ở code | Debit dùng atomic conditional update; chỉ một request được phép tiêu cùng số dư |
| P0-05 | P1-09 (backend) | Đã sửa | Side-effect sau commit không đổi success thành 500; mọi terminal response được lưu để replay theo idempotency key |

Hai P0 lịch sử trong `CODE_REVIEW.md` — JWT fallback/admin forgery và cross-tenant recurring update — cũng đã được kiểm tra lại và vẫn giữ đầy đủ guard.

Xác minh sau sửa: 23 backend unit suites với 124 tests đạt; 61 frontend test files với 116 tests đạt; lint và root build đạt; Prisma schema hợp lệ. MySQL test database không khả dụng nên stress/integration test race-condition trên MySQL thật chưa được chạy. Vì vậy P0-04 đã hoàn tất ở mức code và regression unit test, nhưng còn rủi ro xác minh môi trường được ghi ở cuối báo cáo.

Phần repo không thể tự vô hiệu hóa tài khoản đã được tạo từ seed cũ hoặc tự sửa dữ liệu tài chính đã hỏng trong môi trường đang chạy. Mỗi deployment từng chạy seed cũ cần audit `admin@moneymate.com`, rotate/revoke credential và session; đồng thời rà soát balance âm hoặc ledger trùng trước khi release.

## 0.1. Cập nhật P1 sau khi áp dụng `codex-agent-kit`

Đã hoàn tất toàn bộ 14 mục được phân loại lại là P1, đồng thời sửa thêm sáu finding sát phạm vi để đóng trọn nhóm P1 ban đầu:

- Mobile build giờ chạy Expo Android export thật; dashboard dùng `monthlySavings` từ backend.
- Admin logout revoke server session, xóa auth/query cache; refresh cookie không còn bị lộ khi request đồng thời gửi body token.
- Recurring occurrence có foreign key ổn định, chỉ project ngày chưa đóng, giới hạn catch-up 100 bản ghi/batch và lưu được `startDate` khi edit.
- Backdated transaction/recurring invalidates snapshot tháng đã đóng trong cùng database transaction.
- SQLite offline dùng composite key theo user; push token được chuyển owner nguyên tử và mobile unregister khi logout.
- Docker frontend dùng same-origin `/api`; migration production tạo system categories cho fresh deployment.
- Attachment được tải qua endpoint có authentication/ownership check; `/uploads` không còn public.
- PDF OCR dùng đúng `PDFParse` v2 API và đã có smoke test bằng PDF thật.
- Refresh rotation/child creation là atomic; replay revoke cả token family; đổi mật khẩu revoke mọi refresh session.
- Login và register có fixed-window rate limit cấu hình được; ngày mặc định web dùng calendar local thay vì UTC.

Xác minh sau sửa P1: root build đạt và tạo Android Hermes bundle thật; 28/28 backend suites (138 tests) và 62/62 frontend files (118 tests) đạt; lint đạt; Prisma schema hợp lệ; PDF smoke test đạt. Database integration vẫn chưa chạy vì máy kiểm tra không có MySQL khả dụng.

## 0.2. Cập nhật P2

Đã hoàn tất chín finding P2 còn mở; cộng với sáu finding đã đóng trong đợt P1, toàn bộ **15/15 P2** trong báo cáo này đã được vá:

- Backend dev dùng static OpenAI import tương thích `ts-node` và khởi động thành công.
- Mobile tự xóa session/query cache khi refresh bị revoke; Expo Web dùng HttpOnly cookie, nhận đúng platform `web` và bundle được SQLite WebAssembly.
- Dashboard, Wallets và Transactions hiển thị error/retry rõ ràng thay vì giả dữ liệu rỗng hoặc số 0.
- Budget alert bao phủ expense update và recurring expense sau commit.
- Transaction/report/export query được validate và giới hạn trước khi tới controller/Prisma.
- Xóa ví đang được tham chiếu trả `409 WALLET_IN_USE`, kể cả race dẫn tới Prisma `P2003`.
- Excel export phân trang cho tới khi lấy đủ toàn bộ giao dịch tháng.
- API chỉ nhận và Expo sender chỉ đọc provider `expo`; FCM/APNs không còn bị gửi nhầm endpoint.

Xác minh sau sửa P2: 30/30 backend suites (150 tests), 62/62 frontend files (121 tests), root build và lint đều đạt; Expo Android và Expo Web export đều thành công. MySQL integration và Docker runtime vẫn chưa thể chạy trong môi trường audit.

## 0.3. Cập nhật hoàn thiện CI/technical debt — 05/09/2026

Đã bổ sung database integration bắt buộc trên CI, lint, startup health check và Docker smoke job; tách Copilot khỏi initial bundle; đồng bộ Node 22/Expo 57/Vite 8/Vitest 5/root lockfile; thêm hai index report/scheduler. README đã cập nhật quy trình và bỏ thông tin đăng nhập mẫu cũ.

Lượt kiểm tra cuối sau `npm ci`: root build, Android/Web export, lint, 150 backend unit tests và 122 frontend tests đều đạt. Startup health check và Prisma validate đạt khi chạy ngoài sandbox. Audit còn 22 mục (1 high), MySQL/Docker/device runtime chưa xác minh; do đó **hoàn tất các thay đổi code nêu trên, chưa đủ điều kiện xác nhận toàn bộ project production-ready**.

## 1. Kết luận nhanh

Build, lint và unit test hiện đều vượt qua; toàn bộ finding P0–P2 đã nhận diện trong báo cáo được vá ở mức code. Project vẫn chưa nên triển khai production trước khi chạy migration/integration trên MySQL thật, Docker smoke test và xử lý các advisory dependency được ghi ở phần technical debt.

| Mức độ | Số nhóm lỗi | Trạng thái |
|---|---:|---|
| P0 | 5 | Đã vá cả 5; P0-04 còn thiếu xác minh concurrency trên MySQL thật |
| P1 | 14 | Đã vá 14/14 mục theo phân loại `codex-agent-kit` |
| P2 | 15 | Đã vá 15/15; 6 mục trong đợt P1 và 9 mục trong đợt P2 |
| P3 | 1 | Đề xuất tối ưu chưa có benchmark |

## 2. P1 — Cần sửa trước khi release

Các mã finding trong phần này giữ nguyên theo audit ban đầu. Năm mục đã nâng thành P0 và sửa được đánh dấu ngay trong tiêu đề.

### P1-01 → P0-01 — Đã sửa: API tạo/sửa giao dịch hợp lệ trả HTTP 500

- `backend/src/middlewares/validate.ts:8-13`
- `backend/src/validators/transaction.validator.ts:14-15,26`
- `backend/src/services/transaction.service.ts:26,167`

Middleware gọi Zod để parse nhưng không gán kết quả đã coerce trở lại `req.body`, `req.query` và `req.params`. Vì vậy `transactionDate` vẫn là string ISO khi tới service, sau đó service gọi `.getTime()` và crash.

Đã tái hiện bằng HTTP thực tế: `POST /api/transactions` với payload hợp lệ trả `500 INTERNAL_ERROR`, stack có `data.transactionDate.getTime is not a function`.

### P1-02 — Đã sửa: Mobile không bundle được bằng Metro

- `apps/mobile/babel.config.js:1`
- `apps/mobile/package.json:60-61`
- `.github/workflows/ci.yml:34`

`babel.config.js` import `babel-preset-expo/build/expo-router-plugin`, nhưng module không resolve được từ workspace mobile. Lệnh Expo Android export dừng với `Cannot find module 'babel-preset-expo/build/expo-router-plugin'`.

Script `build` của mobile chỉ chạy `tsc --noEmit`, nên root build và CI vẫn báo xanh dù không tạo được bundle thật.

### P1-03 — Đã sửa: Mobile tính sai “Tiết kiệm tháng này”

- `apps/mobile/src/pages/DashboardPage/DashboardPage.tsx:32,48`
- `apps/mobile/src/types/api.ts:4`

Backend đã trả `monthlySavings`, nhưng mobile bỏ qua field này và tính `netWorth - monthlyExpense`. Kết quả có thể chênh rất lớn so với công thức đúng `monthlyIncome - monthlyExpense`.

### P1-04 — Đã sửa: Nút đăng xuất Admin không thực sự đăng xuất

- `frontend/src/pages/AdminPage/AdminPage.tsx:40-42`
- `frontend/src/stores/auth.store.ts:36-39`

Admin logout chỉ gán `window.location.href = '/login'`; không gọi `/auth/logout` và không xóa Zustand/localStorage. Refresh cookie và session vẫn còn, nên quay lại `/admin` vẫn tiếp tục phiên cũ.

### P1-05 — Đã sửa: Refresh token HttpOnly có thể bị trả ra response body

- `backend/src/controllers/auth.controller.ts:54-70`

Controller chọn token theo `cookie || body`, nhưng quyết định có trả refresh token mới trong JSON hay không chỉ dựa trên việc body có giá trị truthy. Request có cookie hợp lệ kèm `{ "refreshToken": "dummy" }` sẽ rotate bằng cookie thật rồi nhận token mới trong response, làm mất tác dụng bảo vệ của HttpOnly trước mã JavaScript same-origin/XSS.

### P1-06 → P0-02 — Đã sửa: Seed tạo tài khoản ADMIN bằng mật khẩu công khai

- `backend/prisma/seed.ts:56-75`

Seed tạo `admin@moneymate.com`; hash trong file khớp với mật khẩu literal `password`. Không có guard ngăn seed này chạy trong production.

### P1-07 → P0-03 — Đã sửa: Xóa saving goal đang có tiền làm mất số dư và audit trail

- `backend/src/services/saving-goal.service.ts:64-68`
- `backend/src/repositories/saving-goal.repository.ts:56-58,77-94`
- `backend/prisma/schema.prisma:181`

Deposit đã trừ tiền khỏi ví và cộng vào goal. Khi delete, code chỉ xóa goal; quan hệ cascade xóa toàn bộ `GoalTransaction`, nhưng không hoàn tiền về ví và cũng không chặn xóa goal còn số dư.

### P1-08 → P0-04 — Đã sửa ở code: Race condition cho phép số dư ví hoặc saving goal âm

- `backend/src/repositories/transaction.repository.ts:289-316`
- `backend/src/services/saving-goal.service.ts:71-87,103-119`
- `backend/src/repositories/saving-goal.repository.ts:67-94`

Transfer và saving-goal withdrawal kiểm tra số dư bằng read thường, sau đó decrement vô điều kiện. Hai request song song đều có thể vượt qua precondition rồi cùng trừ tiền. Ví dụ hai lần rút 80 từ số dư 100 có thể kết thúc ở `-60`.

### P1-09 → P0-05 — Đã sửa nhánh backend: Mutation đã commit vẫn có thể trả 500 và bị tạo trùng khi retry

- `backend/src/services/transaction.service.ts:52-88`
- `backend/src/middlewares/idempotency.ts:42-54`
- `frontend/src/pages/TransactionsPage/TransactionsPage.tsx:222-234`

Backend commit transaction trước rồi mới chạy budget/notification. Nếu bước sau commit lỗi, API trả 500 và middleware xóa idempotency record; retry cùng key có thể tạo giao dịch thứ hai.

Trên web, flow đính kèm hóa đơn cũng tạo transaction trước rồi upload file. Upload lỗi khiến mutation bị reject, modal vẫn mở và không hiện lỗi đúng cách; người dùng retry sẽ tạo thêm transaction mới.

### P1-10 — Đã sửa: Báo cáo recurring có thể double-count dữ liệu lịch sử

- `backend/src/repositories/transaction.repository.ts:33-85,397-411,465-472`
- `backend/src/services/recurring.service.ts:57-88`

Projection nhận diện occurrence đã tạo bằng tổ hợp ngày, ví, category, type và amount thay vì một ID recurring ổn định. Sau khi sửa amount/category/wallet của recurring, giao dịch cũ không còn match và report cộng thêm projection theo template mới. Một giao dịch thủ công vô tình trùng tổ hợp cũng có thể làm projection bị bỏ sót.

### P1-11 — Đã sửa: SQLite mobile không tách dữ liệu offline theo user

- `apps/mobile/src/storage/database.ts:20-43,57-103`
- `apps/mobile/src/stores/auth.store.ts:99-116`
- `apps/mobile/src/providers/app-provider.tsx:79-108`

Các bảng `outbox`, `cache`, `transactions_cache` không có `user_id`. Logout và delete-account chỉ xóa SecureStore/TanStack cache, không xóa SQLite. Khi account B đăng nhập, app có thể retry payload của account A bằng token B, tái sử dụng cursor của A và bỏ sót hoặc trộn delta trong local database.

### P1-12 — Đã sửa: Push token có thể tiếp tục gắn với account cũ

- `backend/prisma/schema.prisma:260,272`
- `backend/src/repositories/notification.repository.ts:14-17`
- `apps/mobile/src/stores/auth.store.ts:99-110`

Token push là unique toàn cục, nhưng upsert dùng `(userId, deviceId, provider)`. Logout mobile không unregister device token. Account B đăng ký token đang thuộc account A sẽ gặp unique conflict, trong khi record A vẫn active và notification của A vẫn có thể được gửi tới thiết bị hiện do B sử dụng.

### P1-13 — Đã sửa: Docker frontend gọi API vào localhost của người dùng

- `docker-compose.yml:50-52`
- `frontend/Dockerfile:10-14`
- `frontend/src/config/api.ts:1`
- `frontend/nginx.conf:11-22`

Static bundle được build với `http://localhost:5000/api`. Khi người dùng mở website từ máy khác, browser gọi port 5000 trên chính máy người dùng thay vì backend container. Nginx đã có proxy same-origin `/api` nhưng client không sử dụng đường dẫn này.

### P1-14 — Đã sửa: Fresh Docker deployment không có system category cho transfer

- `backend/Dockerfile:26`
- `backend/src/services/transaction.service.ts:307-312`

Container chỉ chạy `prisma migrate deploy`; các migration không insert global category. Transfer bắt buộc một global EXPENSE category và trả 500 nếu không tìm thấy. Nguồn duy nhất tạo category hệ thống hiện là seed có credential không an toàn ở P1-06.

### P1-15 — Đã sửa: Receipt attachment local được public không cần xác thực

- `backend/src/app.ts:44-45`

Toàn bộ `/uploads` được serve bằng `express.static` trước authentication. Bất kỳ ai có URL đều có thể đọc hóa đơn hoặc attachment tài chính.

### P1-16 — Đã sửa: OCR PDF luôn thất bại âm thầm

- `backend/src/services/ai/receipt-ocr.service.ts:76-85`
- `backend/package.json`

Project dùng `pdf-parse@2.4.5`, phiên bản export class `PDFParse` và không có default function. Code lấy module object rồi gọi như function; exception bị catch và chuyển thành text rỗng, nên PDF receipt không được parse.

## 3. P2 — Lỗi chức năng, độ tin cậy và bảo mật

### P2-01 — Đã sửa: Backend development server crash khi khởi động

- `backend/src/services/ai/llm.provider.ts:20,44`
- `backend/package.json:7`

`npm run dev --workspace=moneymate-backend` dừng với TS2351 do dynamic import của package `openai` không được `ts-node` xem là constructable. Production `tsc` vẫn pass nên CI không phát hiện.

Khắc phục: chuyển sang static default import tương thích cả `tsc` và `ts-node`. Dev server đã lên port 5000; startup job chỉ cảnh báo không kết nối được MySQL của môi trường audit.

### P2-02 — Đã sửa: Mobile không tự logout khi refresh token bị revoke hoặc hết hạn

- `apps/mobile/src/lib/api.ts:47-79`
- `apps/mobile/src/providers/app-provider.tsx:61-75`

Refresh lỗi chỉ ném `ApiError`; session local và auth store không bị xóa. App vẫn ở màn riêng tư và các request tiếp tục 401 cho tới khi người dùng logout thủ công hoặc restart.

Khắc phục: refresh 401/403 hoặc retry tiếp tục bị từ chối sẽ xóa access/refresh credential, query cache và auth state; provider nhận sự kiện hết phiên và điều hướng về login.

### P2-03 — Đã sửa: Expo Web được khai báo nhưng login/session không hoạt động

- `apps/mobile/app.json:47-50`
- `apps/mobile/src/storage/session.ts:7-16`
- `apps/mobile/src/lib/api.ts:82`

`expo-secure-store` không cung cấp implementation web cho các hàm đang gọi. Ngoài ra mọi platform không phải iOS, gồm web, đều được gửi lên backend dưới tên `android`.

Khắc phục: web chỉ lưu profile/device ID trong `localStorage`, giữ refresh token trong HttpOnly cookie và gửi request với `credentials: include`; platform được gửi là `web`. Metro nhận `.wasm`, router cấu hình COOP/COEP và web output chuyển sang SPA. Expo Web export đạt với 1.146 modules.

### P2-04 — Đã sửa: Frontend biến lỗi API thành số 0 hoặc danh sách rỗng

- `frontend/src/pages/DashboardPage/DashboardPage.tsx:59-102`
- `frontend/src/pages/WalletsPage/WalletsPage.tsx:20-23,71-78`
- `frontend/src/pages/TransactionsPage/TransactionsPage.tsx:213-217,323-329`

Nhiều trang chỉ dùng giá trị fallback và không kiểm tra `isError`. Lỗi backend/network vì vậy hiển thị giống như người dùng không có dữ liệu hoặc các chỉ số tài chính bằng 0.

Khắc phục: ba trang có `role="alert"`, thông báo riêng và retry action; error không còn đi qua nhánh empty/zero.

### P2-05 — Đã sửa trong đợt P1: Ngày mặc định trên web bị lệch theo UTC

- `frontend/src/pages/TransactionsPage/TransactionsPage.tsx:30,38,254`
- `frontend/src/pages/WalletsPage/TransferModal/TransferModal.tsx:22`
- `frontend/src/pages/RecurringPage/RecurringPage.tsx:31`

Các form dùng `new Date().toISOString().slice(0, 10)`. Tại Asia/Bangkok từ 00:00 đến 06:59, ngày mặc định là ngày hôm trước.

### P2-06 — Đã sửa trong đợt P1: Form sửa recurring cho chỉnh startDate nhưng backend không lưu

- `frontend/src/pages/RecurringPage/RecurringPage.tsx:72-80`
- `backend/src/validators/recurring.validator.ts:16-25`
- `backend/src/repositories/recurring.repository.ts:70-91`

Frontend luôn gửi `startDate` khi edit, nhưng update schema và repository không hỗ trợ field này. UI báo thành công nhưng ngày bắt đầu không đổi.

### P2-07 — Đã sửa: Budget alert bỏ sót update và recurring expense

- `backend/src/services/transaction.service.ts:83-86,150-255`
- `backend/src/services/recurring.service.ts:153-177`

Chỉ create expense thường gọi `checkBudgetAlerts`. Update giao dịch làm vượt ngưỡng và expense sinh từ recurring không phát cảnh báo.

Khắc phục: expense update kiểm tra budget sau transaction commit; recurring expense kiểm tra một lần cho mỗi tháng phát sinh sau batch commit. Lỗi notification không đảo ngược giao dịch đã commit.

### P2-08 — Đã sửa trong đợt P1: Yearly report có thể stale sau backdated CRUD

- `backend/src/repositories/transaction.repository.ts:509-539`

Snapshot của tháng đã đóng được tái sử dụng vĩnh viễn theo `formulaVersion`. Create/update/delete giao dịch quá khứ không invalidate snapshot, nên monthly report và yearly report có thể trả số khác nhau.

### P2-09 — Đã sửa: Query transaction và report thiếu validation/giới hạn

- `backend/src/routes/transaction.routes.ts:21-29`
- `backend/src/controllers/transaction.controller.ts:46-56,141-174`

`sortBy`, type, date, skip/take và month/year đi thẳng tới Prisma/Date. Input sai có thể trả 500; `take` không có giới hạn cho list; tháng 13 bị JavaScript tự normalize sang năm khác.

Khắc phục: Zod schema allowlist sort/type, kiểm tra calendar date/range, coerce pagination với `take <= 200`, và giới hạn month/year/trend trước controller. Export dùng cùng period validator.

### P2-10 — Đã sửa: Xóa ví đã sử dụng trả generic HTTP 500

- `backend/src/services/wallet.service.ts:41-44`
- `backend/prisma/schema.prisma:127,182,209,304-305`

Các foreign key dùng `Restrict`. Service không kiểm tra hoặc map Prisma P2003 thành domain conflict, nên thao tác hợp lệ về mặt API kết thúc bằng lỗi server chung.

Khắc phục: repository đếm mọi transaction, recurring, transfer và goal reference; service trả `409 WALLET_IN_USE`. Prisma `P2003` trong cửa sổ race cũng được map về cùng domain error.

### P2-11 — Đã sửa trong đợt P1: Recurring catch-up không giới hạn số occurrence

- `backend/src/validators/recurring.validator.ts:12`
- `backend/src/services/recurring.service.ts:114-120,153-177`

Daily recurring với `startDate` rất xa trong quá khứ tạo toàn bộ danh sách ngày trong memory rồi insert tuần tự trong một database transaction, có thể gây data explosion hoặc timeout.

### P2-12 — Đã sửa trong đợt P1: Refresh-token family không phát hiện replay; đổi mật khẩu không revoke session

- `backend/src/repositories/refresh-token.repository.ts:24-33`
- `backend/src/services/auth.service.ts:102-131`
- `backend/src/services/user.service.ts:41-54`

Reuse token cũ chỉ nhận 401 nhưng không revoke descendants cùng family. Nếu token bị đánh cắp được rotate trước, token mới của attacker vẫn hợp lệ. Đổi mật khẩu cũng chỉ thay hash mà giữ tất cả session hiện tại.

### P2-13 — Đã sửa: Excel export âm thầm cắt tại 1.000 giao dịch

- `backend/src/services/export.service.ts:13-19`

Không có pagination hoặc cảnh báo truncated, nên báo cáo tháng có trên 1.000 giao dịch thiếu dữ liệu nhưng vẫn được xuất như báo cáo đầy đủ.

Khắc phục: export đọc theo page 500 bản ghi cho tới `pagination.total`; regression test xác nhận trang thứ hai được lấy khi tháng có 501 bản ghi.

### P2-14 — Đã sửa: API nhận FCM/APNs nhưng luôn gửi qua Expo

- `backend/src/validators/notification.validator.ts:8`
- `backend/src/services/push.service.ts:20-32`

Validator cho phép `expo`, `fcm`, `apns`, nhưng PushService gửi mọi token tới Expo Push API. Token native FCM/APNs sẽ không được xử lý đúng provider.

Khắc phục: device registration chỉ chấp nhận provider đã triển khai là `expo`; repository của Expo sender cũng lọc `provider = expo`, bảo vệ cả dữ liệu legacy.

### P2-15 — Đã sửa trong đợt P1: Auth login/register không có rate limiting hoặc lockout

- `backend/src/routes/auth.routes.ts:10-16`
- `backend/src/copilotkit/security.ts:120-138`

Project chỉ triển khai rate limiter cho Copilot endpoint. Login và register không có throttling, làm tăng rủi ro brute-force và account spam.

## 4. Khoảng trống CI và technical debt

### CI-01 — Đã sửa: Integration test có thể pass dù database suite không chạy

- `backend/scripts/run-integration-tests.cjs:34-47`

Runner giờ exit 1 khi MySQL không khả dụng nếu `CI=true` hoặc `REQUIRE_DATABASE_INTEGRATION=true`; pipeline bật chế độ bắt buộc. Đã thử bằng database endpoint không khả dụng và xác nhận exit 1. Local vẫn cho phép chạy riêng bốn test Copilot với cảnh báo rõ ràng, không coi đó là xác minh database.

### CI-02 — Đã sửa cấu hình: Pipeline thiếu lint, backend dev startup và Docker smoke test

- `.github/workflows/ci.yml:31-36`

Pipeline bổ sung lint, backend ts-node startup/health check, Expo Web export và job Docker Compose riêng. Docker smoke kiểm tra backend `/health`, frontend HTML và API proxy trả 401 khi không có authentication; stack/database CI được hủy sau job. Docker images dùng Node 22; backend image giữ cả dependency không được hoist ở `backend/node_modules`. Startup check kiểm tra process do chính nó tạo và có timeout/dọn process. Docker job chưa được thực thi trên máy audit do không có Docker CLI; chưa có kết quả CI từ xa.

Các Node Alpine stages cài OpenSSL rõ ràng để Prisma có thư viện hệ thống cần thiết; tham khảo [Prisma system requirements](https://docs.prisma.io/docs/orm/reference/system-requirements). Thay đổi Docker này vẫn cần smoke test trên runner.

### TECH-01 — Đã sửa: Copilot được eager-import ngay cả khi feature flag tắt

- `frontend/src/main.tsx:3-6`
- `frontend/src/layouts/PageLayout/PageLayout.tsx:6-7`
- `frontend/src/contexts/MoneyMateCopilotProvider.tsx:13-17,152-158`

Provider, popup và CSS Copilot được chuyển vào feature module tải bằng `React.lazy` khi flag bật. Khi flag tắt dùng chat fallback, không tải feature này. Entry JavaScript giảm từ khoảng **1.996 KB / 595 KB gzip** xuống **294 KB / 97 KB gzip**; entry CSS còn khoảng **100 KB**. Lazy Copilot chunk vẫn khoảng **1.979 KB / 555 KB gzip**, nên cảnh báo chunk lớn chưa biến mất hoàn toàn. Có regression test cho cả flag bật/tắt; chưa benchmark tương tác trên thiết bị thật.

### TECH-02 — Đã đồng bộ: Dependency tree và root lockfile không nhất quán

- `apps/mobile/package.json`
- `package-lock.json:73-76,935-941`

Root lockfile được tạo lại theo manifest mới. Mobile nâng lên Expo 57, React Native 0.86.3, React 19.2.3 và TypeScript 6.0.3 theo bộ phiên bản tương thích SDK; frontend dùng React 18.3 riêng, Vite 8/Vitest 5. `.nvmrc`, CI và Docker chuyển Node 22 (tối thiểu 22.13). Cấu hình Babel bỏ private Router plugin của SDK cũ; cập nhật các API React Native và hook initialization bị lint mới phát hiện. Chỉ root lockfile được dùng cho local/CI/Docker.

`npm ci --no-audit --no-fund` đạt và cài 2.649 packages; `npm ls --depth=0` exit 0, không còn `invalid`. Npm 10 trên Windows vẫn báo 5 package WASM optional `extraneous` (`@emnapi/core`, `@emnapi/runtime`, `@emnapi/wasi-threads`, `@napi-rs/wasm-runtime`, `@tybys/wasm-util`) và một cleanup warning EPERM. Build/lint/tests sau cài sạch đều đạt; không tuyên bố tree hoàn toàn không còn warning. Không thêm postinstall xóa cưỡng bức để che warning.

### TECH-03 — Đã thêm migration, chờ DB xác minh: Index report và recurring scheduler

- `backend/prisma/schema.prisma:113-132,194-213`

Đã thêm index `(userId, deletedAt, transactionDate)` cho transactions và `(isActive, nextExecutionDate)` cho recurring transactions, cùng migration `20260905010000_add_report_scheduler_indexes`. Prisma schema validate đạt. Chưa áp dụng migration hoặc chạy `EXPLAIN`/benchmark trên MySQL thật; chưa có bằng chứng tốc độ cải thiện.

### TECH-04 — Giảm rủi ro, chưa đóng: Advisory dependency gián tiếp

Sau nâng Expo/Metro, Vite/Vitest và vá `qs`, `npm audit --omit=dev` ngày 05/09/2026 còn **22 mục dependency bị đánh dấu**: **5 low, 16 moderate, 1 high, 0 critical**, giảm từ 43. Đây là số package nodes tổng hợp của npm, không phải 22 lỗ hổng độc lập. Lệnh vẫn exit 1; không coi audit là pass.

| Nhóm còn lại | Phạm vi và hướng xử lý |
|---|---|
| `undici` 5.x qua AI SDK legacy của CopilotKit | Còn high liên quan HTTP/WebSocket/resource exhaustion; app cấu hình OpenAI nhưng dependency vẫn hiện diện. Chưa chứng minh toàn bộ đường khai thác unreachable. Cần CopilotKit/adapter tương thích đã nâng dependency; không ép downgrade về 1.54.1 theo gợi ý npm vì khác API v2 đang dùng. |
| `@ai-sdk/provider-utils` và các provider đi qua Google Vertex | Low/resource consumption và rủi ro kế thừa Undici. Cần theo dõi bản vá runtime; giữ giới hạn đầu vào, timeout và rate limit hiện có. |
| `uuid` qua ExcelJS/Xcode | Moderate về bounds check với v3/v5/v6 khi truyền buffer. Các call site đã kiểm tra trong ExcelJS/Xcode dùng v4 không truyền buffer, nên chưa thấy đường khai thác tương ứng tại đó; package vẫn bị audit đánh dấu. Không ép downgrade ExcelJS/Expo. |
| `decode-uri-component` qua `query-string`/Expo Router | Moderate DoS khi decode input percent-encoded lỗi; liên quan đường xử lý URL/deep link, cần bản vá Router tương thích và kiểm thử deep link. |

Giữ dev/Metro/Vitest UI server không public; Copilot mặc định tắt cho đến khi được cấu hình và chấp nhận rủi ro. Không dùng `npm audit fix --force` hoặc override major chưa kiểm chứng để làm số audit về 0. TECH-04 vẫn mở, là điều kiện cần xử lý/đánh giá trước release.

## 5. Kết quả lệnh kiểm tra

| Lệnh/kiểm tra | Kết quả |
|---|---|
| `npm ci --no-audit --no-fund` | Pass; 2.649 packages, có cleanup warning Windows EPERM |
| `npm run build` | Pass sau cài sạch; shared packages, backend, frontend và Android Hermes bundle |
| `npm run lint` | Pass |
| Backend unit tests | 30/30 suites, 150/150 tests pass sau sửa P2 |
| Frontend tests | 62/62 files, 122/122 tests pass; gồm lazy Copilot bật/tắt |
| `npm run test:integration` | 4/4 test độc lập DB pass; MySQL suite chưa chạy, runner cảnh báo rõ |
| Integration với `REQUIRE_DATABASE_INTEGRATION=true`, DB không khả dụng | Exit 1 như mong đợi; không bỏ qua DB suite để báo pass |
| `prisma validate` | Schema hợp lệ |
| P0 regression tests | 6/6 suites, 36/36 tests pass; có HTTP coercion, atomic guard, delete guard, post-commit và idempotency replay |
| Expo Android export | Pass SDK 57; 1.552 modules, Hermes bundle khoảng 3,8 MB |
| `npm run build:web --workspace=moneymate-mobile` | Pass SDK 57; 1.148 modules, SQLite WASM asset và worker |
| PDF OCR smoke test (đợt P1) | Pass với PDF sinh thật; không chạy lại smoke riêng ở lượt cuối, unit regression vẫn đạt |
| `npm run test:dev-startup --workspace=moneymate-backend` | Pass `/health` tại port 5099 ngoài sandbox; một lần trong sandbox timeout 60 giây |
| `npm ls --depth=0` | Exit 0, không invalid; còn 5 optional WASM extraneous, xem TECH-02 |
| `git diff --check` | Không có whitespace error; chỉ cảnh báo LF/CRLF |
| Docker image runtime | Chưa chạy được vì máy audit không có Docker CLI |
| YAML CI/Compose và Node check scripts | Parse/syntax check đạt; không thay thế chạy pipeline thật |
| Mobile native/device smoke | Chưa chạy trên Android/iOS thật; Metro export không phải native binary build |
| `npm audit --omit=dev` | Exit 1: 22 mục (5 low, 16 moderate, 1 high, 0 critical); xem TECH-04 |

## 6. Các bước bắt buộc còn lại trước release

1. Chạy migration và stress/integration test P0/P1 trên MySQL thật; audit account seed cũ, session, balance âm và ledger trùng ở từng deployment.
2. Chạy pipeline mới để xác minh database integration và Docker smoke job; hiện chỉ cấu hình đã được thêm, chưa có kết quả từ runner.
3. Xử lý hoặc có quyết định chấp nhận rủi ro cụ thể cho TECH-04; ưu tiên high Undici và URL/deep-link decode. Không coi feature flag tắt là bản vá dependency.
4. Chạy native development build/device smoke sau nâng Expo 57: login/refresh, SQLite offline queue, camera/OCR, push notification, biometric và deep link.
5. Đo `EXPLAIN`/latency sau áp dụng hai index; xem xét tối ưu tiếp lazy Copilot chunk nếu ảnh hưởng trải nghiệm.

### Hướng dẫn migration và phục hồi

- Chạy trước trên MySQL staging/test riêng; xem toàn bộ migration chưa áp dụng bằng `prisma migrate status`. Backup phải được thử restore trước khi đụng dữ liệu deployment.
- Migration index mới chỉ thêm index, không sửa ledger. Với bảng lớn cần đo thời gian và tác động khóa trên bản sao dữ liệu trước khi lên lịch production.
- Sau `prisma migrate deploy`, xác minh cả hai index tồn tại và query report/scheduler vẫn trả dữ liệu đúng; kiểm tra P0 concurrency, recurring occurrence và snapshot invalidation.
- Nếu index gây vấn đề, ưu tiên forward-fix migration chỉ bỏ đúng hai index mới, không reset database hoặc xóa migration đã áp dụng. Các migration sửa dữ liệu trước đó cần kế hoạch restore/forward-fix riêng theo dữ liệu thực tế.
- Chưa chạy deploy, sửa dữ liệu production, commit hoặc push trong đợt này.

## 7. Ghi chú

Báo cáo này bắt đầu từ audit 04/09 và được cập nhật tới 05/09/2026, bao gồm thay đổi chưa commit. Các số dòng trong finding ban đầu là dấu vết lịch sử, có thể đã dịch sau sửa. `CODE_REVIEW.md` được giữ làm lịch sử và dẫn tới báo cáo này để tra trạng thái mới nhất.
