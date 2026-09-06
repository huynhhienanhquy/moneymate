# Báo cáo review toàn bộ dự án MoneyMate

Ngày review: 03/09/2026
Phạm vi: backend, frontend web, mobile, shared packages, Docker và CI.

> Các phát hiện bên dưới được giữ lại làm lịch sử review ngày 03/09. Trạng thái mới nhất ngày 05/09/2026, bao gồm các đợt sửa tiếp theo và rủi ro chưa đóng, nằm trong [PROJECT_AUDIT_2026-09-04.md](PROJECT_AUDIT_2026-09-04.md).

## 0. Trạng thái khắc phục P0/P1/P2 — 03/09/2026

| Mã lỗi | Trạng thái |
| --- | --- |
| P0-01 | Đã bỏ JWT fallback, bắt buộc secret mạnh khi chạy production, khóa HS256 và bỏ public port MySQL |
| P0-02 | Đã kiểm tra ownership/type khi update và khi scheduler xử lý recurring |
| P1-01, P1-04, P1-05, P1-06, P1-08 | Đã sửa validation và invariant cho transaction/transfer |
| P1-02, P1-07 | Đã sửa recurring bằng compare-and-swap và lịch có ngày neo |
| P1-03 | Đã thống nhất savings = income - expense, snapshot formula v5 |
| P1-09 | Đã sửa toàn bộ endpoint recurring trên mobile |
| P1-BUILD-01 | Đã tách React types theo workspace; root build đã đạt |
| P1-BUILD-02 | Đã chuyển Docker sang monorepo root context; chưa chạy image do máy kiểm tra không có Docker CLI |
| P2-01 | Đã kiểm tra ownership/type của category, chống trùng khi update và thêm khóa unique an toàn cho global budget |
| P2-02 | Đã lưu và claim nguyên tử trạng thái cảnh báo 80%/100%, tránh gửi lặp giữa nhiều request/worker |
| P2-03 | Đã cấm sửa trực tiếp `initialBalance`; web và mobile chỉ cho chỉnh tên/loại ví |
| P2-04 | Mobile giữ cached session khi offline/lỗi 5xx, chỉ xóa session khi nhận 401/403 |
| P2-05 | Cursor sync đã chứa cặp `(updatedAt, id)` và vẫn đọc được cursor timestamp cũ |
| P2-06 | MIME không hợp lệ trả 400, file quá kích thước trả 413 thay vì 500 |
| P2-07 | Admin delete đã cleanup attachment trên object storage và ghi log nếu cleanup thất bại |
| P2-TEST-01 | Root test và CI đã chạy cả backend unit tests lẫn frontend tests |
| P2-TEST-02 | Đã tách unit/integration command; local mặc định không còn phụ thuộc MySQL, CI vẫn chạy integration với MySQL service |

Kết quả sau sửa: root build đạt, lint đạt, frontend test 108/108 đạt, backend unit test 58/58 đạt và Prisma schema hợp lệ. Integration tests được cấu hình chạy riêng trong CI với MySQL service; máy review chưa chạy lại nhóm này do không có MySQL/Docker CLI.

## 1. Tổng quan kết quả tại thời điểm review ban đầu

| Hạng mục | Kết quả |
| --- | --- |
| Lint frontend và mobile | Đạt |
| Build shared packages | Đạt |
| Build backend | Đạt |
| Build frontend | Đạt |
| Build mobile | Thất bại do xung đột phiên bản React/type React |
| Frontend tests | 107/107 đạt |
| Backend unit tests | 34/34 đạt |
| Backend integration tests | 5 test thất bại vì MySQL test tại `localhost:3306` không chạy |

## 2. Lỗi nghiêm trọng

### P0-01: Có thể giả mạo JWT ADMIN khi thiếu biến môi trường

Backend sử dụng một secret cố định, công khai trong repository nếu `JWT_ACCESS_SECRET` không tồn tại. `docker-compose.yml` còn mặc định chạy production với chính secret này. Người biết secret có thể tự ký JWT chứa `role: ADMIN`.

Vị trí:

- `backend/src/middlewares/auth.ts:32`
- `backend/src/services/auth.service.ts:13`
- `docker-compose.yml:31`

Ngoài ra, Docker Compose public MySQL qua cổng `3306` và sử dụng root password mặc định `password`:

- `docker-compose.yml:7`
- `docker-compose.yml:10`

Khuyến nghị:

- Không cung cấp fallback cho secret ở production; dừng khởi động nếu thiếu biến môi trường.
- Không public MySQL ra host nếu không cần thiết.
- Bắt buộc cung cấp password mạnh từ secret manager hoặc file môi trường không commit.

### P0-02: Cross-tenant corruption qua cập nhật recurring transaction

`updateRecurring()` chỉ kiểm tra recurring record thuộc user hiện tại, nhưng không kiểm tra `walletId` và `categoryId` mới. User có thể gửi UUID ví của user khác; cron sau đó sẽ cộng hoặc trừ trực tiếp số dư ví đó.

Vị trí:

- `backend/src/services/recurring.service.ts:75`
- `backend/src/services/recurring.service.ts:84`
- `backend/src/services/recurring.service.ts:141`

Khuyến nghị: khi update phải tải và kiểm tra ownership của ví, quyền truy cập category, đồng thời kiểm tra category type khớp recurring type trước khi ghi database.

### P1-01: Transfer có thể bị sửa hoặc xóa như giao dịch bình thường

Mỗi transfer tạo hai `Transaction` loại `TRANSFER`, nhưng không có khóa liên kết giữa các transaction này với `WalletTransfer`. API update/delete chung vẫn nhận các record transfer.

Hậu quả:

- Xóa một phía chỉ ẩn transaction, không hoàn tiền và không xóa phía còn lại.
- Đổi một phía thành `INCOME` hoặc `EXPENSE` làm số dư tiếp tục thay đổi trong khi transfer gốc vẫn tồn tại.
- Mobile cho phép xóa transfer; web cho phép cả sửa và xóa.

Vị trí:

- `backend/src/repositories/transaction.repository.ts:350`
- `backend/src/repositories/transaction.repository.ts:362`
- `backend/src/services/transaction.service.ts:119`
- `backend/src/services/transaction.service.ts:211`
- `apps/mobile/src/pages/TransactionsPage/TransactionsPage.tsx:24`
- `frontend/src/pages/TransactionsPage/TransactionsPage.tsx:373`

Khuyến nghị: liên kết transaction với `WalletTransfer`, chặn generic update/delete cho loại `TRANSFER`, và cung cấp nghiệp vụ reverse/cancel transfer riêng trong một database transaction.

### P1-02: Recurring transaction có thể được tạo trùng

`processDueTransactions()` đọc toàn bộ lịch đến hạn rồi mới xử lý từng item, nhưng không lock hoặc compare-and-swap `nextExecutionDate`. Hai dashboard request, cron và startup chạy đồng thời có thể cùng tạo một kỳ giao dịch nhiều lần.

Hàm này hiện được gọi từ ba luồng, bao gồm mỗi lần mở dashboard:

- `backend/src/services/recurring.service.ts:103`
- `backend/src/services/transaction.service.ts:274`
- `backend/src/server.ts:18`
- `backend/src/server.ts:25`

Khuyến nghị: chỉ chạy trong một scheduler chuyên dụng, dùng distributed lock hoặc cập nhật có điều kiện trên giá trị `nextExecutionDate` cũ, và bổ sung unique execution key cho từng kỳ.

## 3. Lỗi logic nghiệp vụ

### P1-03: “Tiết kiệm tháng” đang được tính sai

Backend và web đều tính:

```text
tổng tài sản hiện tại - chi tiêu tháng
```

Số dư ví đã bị giảm khi ghi expense, vì vậy expense bị trừ lần thứ hai. Theo requirement, net savings tháng phải dựa trên thu nhập tháng trừ chi tiêu tháng.

Vị trí:

- `backend/src/services/transaction.service.ts:303`
- `frontend/src/pages/DashboardPage/DashboardPage.tsx:99`
- `docs/requirements.md:49`

Báo cáo năm còn lưu `totalAssets` vào trường `salaryIncome`, sau đó lấy trường này trừ expense:

- `backend/src/repositories/transaction.repository.ts:541`
- `backend/src/repositories/transaction.repository.ts:551`
- `frontend/src/pages/MonthlyBalancePage/MonthlyBalancePage.tsx:45`

Khuyến nghị: thống nhất định nghĩa `monthlySavings = monthlyIncome - monthlyExpense`; tách rõ `walletBalance`, `netWorth`, `salaryIncome` và `monthlySavings`.

### P1-04: Update transaction không kiểm tra type của category

Khi đổi `type` nhưng giữ category cũ, hoặc đổi category nhưng giữ type cũ, service chỉ kiểm tra ownership, không kiểm tra `INCOME/EXPENSE` tương ứng. Điều này có thể tạo expense nằm trong category thu nhập và làm sai báo cáo/ngân sách.

Vị trí:

- `backend/src/services/transaction.service.ts:133`
- `backend/src/services/transaction.service.ts:144`
- `backend/src/services/transaction.service.ts:173`

### P1-05: API tạo transaction cho phép tạo `TRANSFER` trực tiếp

Validator dùng toàn bộ enum `TransactionType`, bao gồm `TRANSFER`. Tuy nhiên, create service chỉ cập nhật ví cho `INCOME` và `EXPENSE`. Client có thể tạo một transfer mồ côi, không chuyển tiền và không có `WalletTransfer`.

Vị trí:

- `backend/src/validators/transaction.validator.ts:9`
- `backend/src/services/transaction.service.ts:37`
- `backend/src/services/transaction.service.ts:65`

Khuyến nghị: create transaction thông thường chỉ nhận `INCOME | EXPENSE`; transfer chỉ được tạo qua endpoint transfer chuyên dụng.

### P1-06: Transfer có thể dùng category riêng của user khác

Service tìm category đầu tiên trong toàn database mà không lọc global category hoặc category của user hiện tại. Transaction của user A có thể tham chiếu category riêng của user B và làm lộ tên/màu category trong response.

Vị trí:

- `backend/src/services/transaction.service.ts:258`
- `backend/src/repositories/category.repository.ts:17`

### P1-07: Recurring `MONTHLY` luôn nhảy về ngày 1

Bất kể ngày bắt đầu, processor đặt ngày thành `1` rồi mới tăng tháng. Ví dụ, lịch bắt đầu ngày 25/08 sẽ chạy tiếp ngày 01/09 thay vì 25/09. Phần forecast lại dùng thuật toán khác, nên dự báo và giao dịch thật không đồng nhất.

Vị trí:

- `backend/src/services/recurring.service.ts:18`
- `backend/src/repositories/transaction.repository.ts:48`

Khuyến nghị: lưu ngày neo của lịch và thống nhất một hàm tính ngày tiếp theo cho cả processor lẫn forecast, có xử lý ngày 29/30/31 và năm nhuận.

### P1-08: Giao dịch thường vẫn được đặt ngày tương lai

Business rule cấm future date ngoài recurring engine, nhưng create/update validator chỉ kiểm tra giá trị có chuyển thành `Date` được hay không.

Vị trí:

- `backend/src/validators/transaction.validator.ts:11`
- `backend/src/validators/transaction.validator.ts:22`
- `docs/business_rules.md:69`

### P1-09: Mobile recurring gọi sai endpoint

Backend mount route tại `/api/recurring-transactions`, nhưng mobile gọi `/recurring`. Toàn bộ màn hình danh sách, tạo, bật/tắt và xóa recurring sẽ nhận HTTP 404.

Vị trí:

- `apps/mobile/src/pages/RecurringPage/RecurringPage.tsx:15`
- `apps/mobile/src/pages/RecurringPage/RecurringPage.tsx:16`
- `backend/src/app.ts:62`

### P2-01: Budget thiếu kiểm tra category

Các vấn đề:

- Create cho phép category `INCOME`, dù budget chỉ áp dụng cho expense.
- Update không kiểm tra category mới thuộc user hiện tại.
- Update không kiểm tra trùng budget sau khi đổi category.
- Global budget dùng `categoryId = NULL`; unique constraint MySQL không ngăn chắc chắn hai request đồng thời tạo hai global budget.

Vị trí:

- `backend/src/services/budget.service.ts:40`
- `backend/src/services/budget.service.ts:73`
- `backend/prisma/schema.prisma:98`

### P2-02: Cảnh báo ngân sách bị gửi lặp

Sau khi đạt 80%, mọi expense tiếp theo đều tạo warning mới. Sau 100%, mọi expense tiếp theo đều tạo overlimit mới. Logic hiện tại kiểm tra trạng thái sau giao dịch, không phát hiện việc vừa vượt qua threshold.

Vị trí:

- `backend/src/services/budget.service.ts:90`
- `backend/src/services/budget.service.ts:103`

Khuyến nghị: so sánh tổng chi trước và sau giao dịch, hoặc lưu trạng thái threshold đã gửi theo budget/tháng.

### P2-03: Sửa số dư ví trực tiếp làm mất audit trail

API update cho phép ghi đè `initialBalance` dù ví đã có giao dịch. Điều này làm lịch sử và báo cáo quá khứ không thể tái tạo chính xác, trái với business rule yêu cầu balance adjustment transaction.

Vị trí:

- `backend/src/services/wallet.service.ts:30`
- `docs/business_rules.md:33`

### P2-04: Mobile tự đăng xuất khi khởi động offline

Mobile đọc user cache thành công nhưng lập tức gọi profile. Bất kỳ lỗi mạng hoặc HTTP 500 nào đều đi vào `catch`, xóa refresh token và toàn bộ query cache. Vì vậy cold start offline không thể sử dụng dữ liệu offline.

Vị trí:

- `apps/mobile/src/stores/auth.store.ts:38`
- `apps/mobile/src/stores/auth.store.ts:48`
- `apps/mobile/src/stores/auth.store.ts:51`

Khuyến nghị: chỉ xóa session khi server trả lỗi xác thực chắc chắn như 401/403; giữ cached user và query cache khi lỗi mạng hoặc server tạm thời.

### P2-05: Cursor sync có thể bỏ mất transaction

Query sắp xếp theo `(updatedAt, id)` nhưng cursor chỉ chứa `updatedAt`, và trang sau dùng điều kiện `updatedAt > cursor`. Nếu hơn `take` record có cùng timestamp tại ranh giới trang, các record còn lại có timestamp bằng cursor sẽ bị bỏ qua vĩnh viễn.

Vị trí:

- `backend/src/repositories/transaction.repository.ts:280`
- `backend/src/services/transaction.service.ts:106`

Khuyến nghị: cursor phải chứa cả `updatedAt` và `id`, với điều kiện trang sau tương đương:

```text
updatedAt > cursor.updatedAt
OR (updatedAt = cursor.updatedAt AND id > cursor.id)
```

### P2-06: Upload sai định dạng hoặc kích thước trả HTTP 500

Multer phát `Error` hoặc `MulterError`, trong khi global handler chỉ phân loại `AppError`. File trên 5 MB hoặc MIME không hợp lệ sẽ bị coi là lỗi server thay vì HTTP 400/413.

Vị trí:

- `backend/src/middlewares/upload.ts:10`
- `backend/src/middlewares/upload.ts:17`
- `backend/src/middlewares/error.ts:11`

### P2-07: Admin xóa user để lại attachment trên storage

Luồng tự xóa tài khoản có cleanup object storage, nhưng admin delete chỉ xóa database record. File local hoặc S3 của user vẫn tồn tại.

Vị trí:

- `backend/src/services/admin.service.ts:23`
- `backend/src/services/user.service.ts:62`

## 4. Lỗi build và deployment

### P1-BUILD-01: Mobile không typecheck được

Root workspace hoist React `19.2.3` nhưng mobile/Expo sử dụng React `19.1.0`; đồng thời root khai báo `@types/react` 18. TypeScript báo hàng loạt JSX component như `SafeAreaView`, `Image`, `SQLiteProvider` không phải JSX element hợp lệ.

Vị trí:

- `package.json:42`
- `package.json:44`
- `apps/mobile/package.json:36`
- `apps/mobile/package.json:48`

Kết quả: `npm run build` trả exit code 1 tại workspace `moneymate-mobile`.

### P1-BUILD-02: Docker image backend và frontend không có shared packages

Build context chỉ là `backend/` hoặc `frontend/`, trong khi dependency dùng `file:../packages/...`. Thư mục `packages` nằm ngoài Docker build context và không được copy vào image.

Vị trí:

- `backend/Dockerfile:5`
- `backend/package.json:19`
- `frontend/Dockerfile:5`
- `frontend/package.json:18`

Khuyến nghị: dùng repository root làm Docker build context và copy root lockfile, package manifests cùng các shared packages cần thiết vào builder stage.

## 5. Khoảng trống kiểm thử và CI

### P2-TEST-01: CI không chạy frontend tests

Frontend có 107 test đang pass, nhưng root `npm test` chỉ gọi backend. Workflow CI chỉ chạy root command này nên frontend tests không được thực thi trong CI.

Vị trí:

- `package.json:14`
- `frontend/package.json:11`
- `.github/workflows/ci.yml:35`

### P2-TEST-02: Integration tests local phụ thuộc MySQL đang chạy

Kết quả review local:

- 34 backend unit tests đạt.
- 5 integration tests thất bại với `Can't reach database server at localhost:3306`.

Đây là lỗi môi trường kiểm thử local, chưa phải bằng chứng cho thấy năm luồng nghiệp vụ tương ứng bị lỗi. Tuy nhiên test command không cung cấp cơ chế tự khởi tạo test database, skip integration test hoặc báo lỗi rõ ràng khi database chưa sẵn sàng.

## 6. Thứ tự sửa đề xuất

1. Xóa secret/password mặc định và khóa cấu hình production.
2. Vá cross-tenant validation trong recurring update.
3. Bảo vệ invariants của transfer và thêm liên kết dữ liệu cho hai transaction transfer.
4. Làm processor recurring idempotent, chống chạy đồng thời.
5. Sửa công thức dashboard, monthly savings và snapshot báo cáo năm.
6. Sửa validation transaction, budget và future date.
7. Sửa endpoint recurring mobile và xung đột React để build mobile chạy lại.
8. Sửa Docker build context.
9. Sửa offline initialization, cursor sync và upload error mapping.
10. Bổ sung regression tests cho từng lỗi trên và đưa frontend tests vào CI.
