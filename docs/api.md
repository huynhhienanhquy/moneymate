# Tài liệu API MoneyMate

> Đối chiếu working tree ngày 2026-10-13. Nguồn chính: [app.ts](../backend/src/app.ts), [routes](../backend/src/routes), [validators](../backend/src/validators), [controllers](../backend/src/controllers) và [services](../backend/src/services).

## Quy ước chung

API local mặc định là `http://localhost:5000/api`. Các đường dẫn trong bảng đã bao gồm `/api`. JSON request dùng `Content-Type: application/json`; upload dùng `multipart/form-data` với trường `file`. ID tạo bởi server là UUID. `:id` là tham số đường dẫn; đa số route không gắn validator cho tham số này, nên không có bảo đảm rằng ID sai định dạng luôn trả 400.

Ký hiệu quyền truy cập:

- **Public**: không cần access token.
- **User**: `Authorization: Bearer <accessToken>`; middleware REST cũng hỗ trợ cookie `accessToken`, nhưng login không tự đặt cookie này.
- **Admin**: access token có claim `role=ADMIN`.
- **Refresh**: cookie `refreshToken` hoặc JSON body chứa `refreshToken`; không dùng access token để thay thế.

Service kiểm tra chủ sở hữu dữ liệu. Category có `userId=null` là danh mục hệ thống có thể đọc và sử dụng; chỉ danh mục riêng mới được chỉnh sửa/xóa. Lỗi xác thực `401 UNAUTHORIZED` áp dụng cho mọi route User/Admin; Admin còn có thể trả 403. Mọi route có thể trả `500 INTERNAL_ERROR` khi lỗi ngoài dự kiến, nên bảng chỉ ghi thêm lỗi cụ thể của nghiệp vụ.

Phản hồi JSON REST thành công:

```json
{
  "success": true,
  "message": "Wallets retrieved successfully",
  "data": [],
  "requestId": "f29e4615-17ca-4fd4-8bd6-e5dd429d4284"
}
```

Phản hồi lỗi:

```json
{
  "success": false,
  "code": "REQUEST_FAILED",
  "message": "Validation failed",
  "errors": [{ "field": "amount", "message": "Amount must be positive and non-zero" }],
  "requestId": "f29e4615-17ca-4fd4-8bd6-e5dd429d4284"
}
```

`X-Request-Id` được nhận hoặc tạo bởi [request-id middleware](../backend/src/middlewares/request-id.ts), trả qua response header và envelope. `message` là chuỗi mô tả, có cả tiếng Anh và tiếng Việt. Client nên xử lý HTTP status cùng `code`, không suy diễn mã lỗi từ bản dịch của `message`. Nhiều lỗi nghiệp vụ hiện dùng mã mặc định `REQUEST_FAILED`.

Các cột tiền trong Prisma là `Decimal(15,2)`. Trường Decimal chưa được service chuyển đổi thường serialize thành **chuỗi**, ví dụ transaction `amount: "50000"`, wallet `initialBalance: "1000000"`. Các trường tính toán của báo cáo/budget/goal thường là **number**. Ngày từ Prisma serialize thành ISO timestamp; request ngày được Zod ép sang `Date`. Không coi mọi trường tiền API là cùng một kiểu JSON; xem [schema](../backend/prisma/schema.prisma) và [contracts](../packages/contracts/src).

Validator Zod bỏ các trường không khai báo, ép kiểu query được chỉ định và ghi dữ liệu đã parse vào request. Trong bảng, `?` nghĩa là tùy chọn, `UUID` là chuỗi UUID, `positive` là JSON number > 0, `date` là giá trị được `z.coerce.date()` chấp nhận. PUT hiện hỗ trợ cập nhật từng trường, không yêu cầu gửi toàn bộ object.

## Health và Swagger

| Method | Đường dẫn | Quyền | Input | Thành công | Lưu ý |
| --- | --- | --- | --- | --- | --- |
| GET | `/health` | Public | Không | 200 `{status:"ok",timestamp}` | Không dùng envelope; chỉ xác nhận tiến trình HTTP đang trả lời, không probe MySQL |
| GET | `/api-docs` | Public | Không | Swagger UI | Có cấu hình OpenAPI, nhưng hiện route/controller không có annotation `@swagger`/`@openapi`; không dùng UI này làm danh mục endpoint đầy đủ |

## Authentication và tài khoản

Nguồn: [auth routes](../backend/src/routes/auth.routes.ts), [auth validator](../backend/src/validators/auth.validator.ts), [login schema dùng chung](../packages/validation/src/index.ts), [user validator](../backend/src/validators/user.validator.ts). Chi tiết lifecycle ở [Authentication & Authorization](auth_sessions.md).

| Method | Đường dẫn | Quyền | Input / validator | Thành công (`data`) | Lỗi bổ sung |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | `registerSchema`: `email` hợp lệ, `password` ≥ 8 ký tự, `fullName` không rỗng | 201 `{id,email,fullName}`; chưa đăng nhập | 400 email trùng/validation; 429 `AUTH_RATE_LIMITED` |
| POST | `/api/auth/login` | Public | `loginSchema`: `email`, `password` không rỗng; `platform?=web` (`web/ios/android`); metadata thiết bị bên dưới | 200 `{user,accessToken}`; mobile thêm `refreshToken`; luôn set refresh cookie | 400 validation; 401 thông tin đăng nhập sai; 429 `AUTH_RATE_LIMITED` |
| POST | `/api/auth/refresh` | Refresh | Không gắn Zod; cookie được ưu tiên hơn body token | 200 `{accessToken,user}`; chỉ thêm `refreshToken` khi request dùng body và không có cookie; set cookie mới | 401 token thiếu/hết hạn/không tồn tại; 401 `REFRESH_TOKEN_REUSED` |
| POST | `/api/auth/logout` | Public | Cookie hoặc `{refreshToken?}`; không gắn Zod | 200 `null`; xóa cookie, revoke record nếu có | Lỗi DB khi revoke có thể trả 500; cookie vẫn được clear |
| GET | `/api/auth/sessions` | User | Không | 200 mảng session active | — |
| DELETE | `/api/auth/sessions/:id` | User | ID record refresh token hiện tại | 200 `null` | 404 không có record active thuộc user |
| DELETE | `/api/auth/sessions` | User | Không | 200 `null`; revoke mọi refresh record chưa revoke của user | — |
| GET | `/api/users/profile` | User | Không | 200 `{id,email,fullName,avatarUrl,createdAt}` | 404 user không tồn tại |
| PUT | `/api/users/profile` | User | `updateProfileSchema`: `fullName?` không rỗng, `avatarUrl?` URL hoặc `null`; chuỗi rỗng đổi thành `null` | 200 `{id,email,fullName,avatarUrl}` | 400 validation; 404 user |
| PUT | `/api/users/change-password` | User | `changePasswordSchema`: `currentPassword` không rỗng, `newPassword` ≥ 8 ký tự | 200 `null`; cập nhật hash và revoke refresh sessions trong cùng DB transaction | 400 mật khẩu hiện tại sai/validation; 404 user |
| DELETE | `/api/users/profile` | User | `deleteAccountSchema`: `{password}` không rỗng | 200 `null`; xóa tài khoản và dữ liệu quan hệ | 400 mật khẩu sai/validation |

Metadata login: `deviceId?`, `deviceName?` được trim, dài 1–191; `appVersion?` 1–32; `timezone?` 1–64. `user` trong login/refresh gồm `id,email,fullName,avatarUrl,role`. Session list trả `id,deviceId,deviceName,platform,appVersion,timezone,lastSeenAt,createdAt,expiresAt`, không trả token/hash/family. Session ID thay đổi sau rotation; client cần tải lại danh sách trước khi revoke.

## Ví và danh mục

Nguồn: [wallet routes](../backend/src/routes/wallet.routes.ts), [wallet validator](../backend/src/validators/wallet.validator.ts), [category routes](../backend/src/routes/category.routes.ts), [category validator](../backend/src/validators/category.validator.ts).

| Method | Đường dẫn | Quyền | Input / validator | Thành công (`data`) | Lỗi bổ sung |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/wallets` | User | `createWalletSchema`: `name`, `type`; `currency?`; `initialBalance?=0` number ≥ 0 | 201 wallet | 400 validation |
| GET | `/api/wallets` | User | Không | 200 mảng ví active, mới nhất trước | — |
| GET | `/api/wallets/:id` | User | ID ví | 200 wallet | 404 ví không active/không thuộc user |
| PUT | `/api/wallets/:id` | User | `updateWalletSchema`: `name?`, `type?`, `initialBalance?` ≥ 0 | 200 wallet; số dư gửi lên thay thế giá trị hiện tại | 400 validation; 404 ví |
| DELETE | `/api/wallets/:id` | User | ID ví | 200 `null`; set `deletedAt` và tắt lịch recurring của ví | 404 ví |
| POST | `/api/categories` | User | `createCategorySchema`: `name`, `type=INCOME/EXPENSE`; `color?` dạng `#RRGGBB`, `icon?` không rỗng | 201 category riêng | 400 trùng tên/type với danh mục riêng hoặc hệ thống/validation |
| GET | `/api/categories` | User | Không | 200 mảng danh mục riêng + hệ thống | — |
| GET | `/api/categories/:id` | User | ID category | 200 category | 404 không tồn tại/không được đọc |
| PUT | `/api/categories/:id` | User | `updateCategorySchema`: `name?`, `color?`, `icon?`; không đổi type | 200 category | 400 validation; 403 danh mục hệ thống; 404 category |
| DELETE | `/api/categories/:id` | User | ID category | 200 `null` | 403 danh mục hệ thống; 404 category; lỗi FK khi còn giao dịch/lịch recurring hiện chưa map riêng, có thể 500 |

Wallet type: `CASH`, `BANK`, `CREDIT_CARD`, `E_WALLET`, `SAVING`; currency mặc định `VND`, chưa có quy đổi tỷ giá. Wallet object gồm `id,userId,name,type,currency,initialBalance,createdAt,updatedAt,deletedAt`. Category object gồm `id,userId,name,type,color,icon,createdAt,updatedAt`. Kiểm tra trùng category chủ động chỉ có lúc tạo; cập nhật trùng hoặc race uniqueness có thể thành lỗi DB 500.

## Giao dịch, chuyển tiền và báo cáo

Nguồn: [transaction routes](../backend/src/routes/transaction.routes.ts), [validator](../backend/src/validators/transaction.validator.ts), [service](../backend/src/services/transaction.service.ts), [repository](../backend/src/repositories/transaction.repository.ts).

| Method | Đường dẫn | Quyền | Input / validator | Thành công (`data`) | Lỗi bổ sung |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/transactions` | User | `createTransactionSchema`: `walletId,categoryId` UUID, `amount` positive, `type=INCOME/EXPENSE`, `transactionDate` date ≤ hiện tại, `note?`; `Idempotency-Key?` | 201 transaction với wallet name và category name/color | 400 sai type category, ngày tương lai, `INSUFFICIENT_WALLET_BALANCE`, validation; 404 wallet/category; 409 idempotency |
| GET | `/api/transactions` | User | `transactionListSchema`; filter/pagination bên dưới | 200 `{transactions,pagination}`; loại `TRANSFER`, loại deleted | 400 validation |
| GET | `/api/transactions/:id` | User | ID transaction | 200 transaction, kèm wallet/category đầy đủ | 404 không tồn tại/deleted/không thuộc user |
| PUT | `/api/transactions/:id` | User | `updateTransactionSchema`: các trường tạo tùy chọn, `version?` integer > 0 | 200 transaction với version tăng 1 | 400 type/category/ngày/số dư/validation; 404 transaction/wallet/category; 409 `VERSION_CONFLICT` |
| DELETE | `/api/transactions/:id` | User | `deleteTransactionSchema`: query `version?` integer > 0 | 200 `null`; soft delete, version tăng 1 | 400 không cho xóa TRANSFER/validation; 404 transaction; 409 `VERSION_CONFLICT` |
| POST | `/api/transactions/transfer` | User | `walletTransferSchema`: `sourceWalletId,destinationWalletId` UUID, `amount` positive, `transferDate` date, `note?`; `Idempotency-Key?` | 201 `WalletTransfer` | 400 cùng ví/số dư/validation; 404 ví; 409 idempotency; 500 thiếu category hệ thống EXPENSE |
| GET | `/api/transactions/dashboard` | User | Không; tháng hiện tại theo server | 200 dashboard bên dưới | — |
| GET | `/api/transactions/trend` | User | `monthlyTrendQuerySchema`: `months?=6`, integer 1–12 | 200 mảng trend, cũ đến mới, kết thúc tháng hiện tại | 400 validation |
| GET | `/api/transactions/report` | User | `monthlyReportQuerySchema`: `month?` 1–12, `year?` 1970–9999; mặc định tháng/năm hiện tại | 200 monthly report | 400 validation |
| GET | `/api/transactions/report/yearly` | User | `yearlyReportQuerySchema`: `year?` integer 1970–9999, mặc định hiện tại | 200 yearly report; có upsert snapshot tháng đã đóng | 400 validation |
| GET | `/api/transactions/sync` | User | `transactionSyncSchema`: `cursor?` dài 1–1024, `take?=100` integer 1–200 | 200 `{items,nextCursor,hasMore}`; có tombstone và TRANSFER | 400 cursor sai/validation |

`GET /transactions` nhận query:

| Trường | Ràng buộc / mặc định |
| --- | --- |
| `walletId`, `categoryId` | UUID tùy chọn |
| `type` | `INCOME/EXPENSE/TRANSFER`; danh sách vẫn luôn loại TRANSFER, nên lọc TRANSFER trả rỗng |
| `startDate`, `endDate` | `YYYY-MM-DD` là ngày lịch hợp lệ hoặc ISO datetime có offset; start ≤ end |
| `search` | Trim, tối đa 200 ký tự; tìm trong note, tên ví, tên category |
| `sortBy` | `transactionDate` (mặc định), `amount`, `createdAt`, `updatedAt`, `type` |
| `order` | `desc` (mặc định) hoặc `asc` |
| `skip` | Integer 0–1.000.000, mặc định 0 |
| `take` | Integer 1–200, mặc định 20 |

`startDate/endDate` được so sánh timestamp trực tiếp; `endDate=2026-10-13` là đầu ngày UTC, không tự mở rộng đến hết ngày. Gửi ISO cuối ngày với offset thích hợp nếu muốn bao phủ trọn ngày. Các khoảng báo cáo tháng lại dùng lịch và timezone của tiến trình server; metadata `timezone` login không làm đổi cách tính này.

Ví dụ pagination (rút gọn transaction):

```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": {
    "transactions": [{ "id": "11111111-1111-4111-8111-111111111111", "amount": "50000", "type": "EXPENSE", "version": 1 }],
    "pagination": { "total": 41, "skip": 0, "take": 20 }
  },
  "requestId": "example-request-id"
}
```

Trang tiếp theo tăng `skip` bằng số bản ghi đã tải. Sync dùng cursor opaque base64url chứa `(updatedAt,id)` và sắp xếp tăng dần theo hai trường này. Lưu `nextCursor` sau khi áp dụng thành công mọi item. `deletedAt` khác null là tombstone; `hasMore=true` khi trang đủ `take`, có thể cần thêm một request để xác nhận đã hết. Timestamp cursor cũ vẫn được hỗ trợ để chuyển phiên bản. Đây là delta của **transactions**, không đồng bộ mọi entity.

`version` trên update/delete là tùy chọn; khi có, server kiểm tra với version đã đọc, đồng thời write có điều kiện chống thay đổi đồng thời. Client muốn tránh ghi đè dữ liệu đã cũ phải luôn gửi version đã tải. `TRANSFER` không chỉnh sửa/xóa qua CRUD thường; hiện không có API sửa/xóa WalletTransfer.

### Ý nghĩa response báo cáo

| Response | Các trường chính |
| --- | --- |
| Dashboard | `netWorth`, `walletBalanceTotal`, `monthlyIncome`, `actualIncome`, `recurringIncome`, `monthlyExpense`, `actualExpense`, `recurringExpense`, `monthlySavings`, `monthlyRemaining`, `recentTransactions` (tối đa 5) |
| Monthly report | `{month,year,summary,categoryExpenses}`; summary: `totalIncome,actualIncome,recurringIncome,salaryIncome,otherIncome,totalExpense,actualExpense,recurringExpense,netSavings,remainingAmount,walletBalance` |
| Trend item | `{month,year,label,income,actualIncome,recurringIncome,expense,remaining}` |
| Yearly report | `{year,totalIncome,totalExpense,netSavings,monthlyData,accountCreatedAt,walletBalanceTotal,categoryExpenses}`; monthlyData đủ 12 tháng: `{month,label,income,salaryIncome,otherIncome,walletBalance,expense,savings,remaining}` |
| Category breakdown | Mảng `{id,name,color,amount}` |

**Ý nghĩa hiện tại cần phân biệt:** monthly report `summary.totalIncome` và trend `income` là số dư ví tại cuối kỳ, còn dashboard `monthlyIncome` là thu nhập thực tế cộng recurring dự kiến. Dashboard `monthlySavings` và monthly report `netSavings` là số dư ví trừ tổng chi kỳ đó. Yearly top-level `totalIncome` cộng số dư cuối tháng của các tháng từ lúc tạo tài khoản đến hiện tại; `monthlyData.income/savings` lại dùng thu nhập phát sinh. Không cộng lẫn các trường cùng tên giữa màn hình; công thức chi tiết và giới hạn tái dựng lịch sử ở [business rules](business_rules.md).

### Idempotency

[Middleware](../backend/src/middlewares/idempotency.ts) được gắn trên `POST /transactions`, `POST /transactions/transfer`, `PUT /transactions/:id` và `DELETE /transactions/:id`. Header tùy chọn `Idempotency-Key` dài tối đa 100 ký tự, unique theo user, thời hạn 24 giờ. Hash request gồm method, path, body và query có giá trị **sau validation**, bao gồm version của DELETE. Cùng key/cùng request đã hoàn tất sẽ trả status/body cũ, kể cả lỗi terminal 5xx; key đang xử lý hoặc bị dùng lại cho request khác trả 409 `REQUEST_FAILED`. Response phát lại giữ requestId cũ trong body. Không retry một request đã nhận response terminal bằng key mới nếu chưa xác minh kết quả nghiệp vụ. Persist response là bước riêng sau mutation; crash hoặc ghi cache lỗi có thể để key `PENDING` đến hết hạn.

## Ngân sách, mục tiêu và recurring

Nguồn: [budget](../backend/src/validators/budget.validator.ts), [saving goal](../backend/src/validators/saving-goal.validator.ts), [recurring](../backend/src/validators/recurring.validator.ts) validators.

| Method | Đường dẫn | Quyền | Input / validator | Thành công (`data`) | Lỗi bổ sung |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/budgets` | User | `createBudgetSchema`: `amount` positive, `month` integer 1–12, `year` 2000–2100; `categoryId?` UUID hoặc null (global) | 201 enriched budget | 400 trùng ngân sách/sai type/validation; 404 category; 409 unique race |
| GET | `/api/budgets` | User | Query `month?,year?` dùng `safeParseInt` và fallback hiện tại; **không gắn Zod query** | 200 mảng enriched budget của kỳ | — |
| GET | `/api/budgets/:id` | User | ID budget | 200 enriched budget | 404 budget |
| PUT | `/api/budgets/:id` | User | `updateBudgetSchema`: `amount?` positive, `categoryId?` UUID/null; không đổi kỳ | 200 enriched budget; reset cờ cảnh báo khi đổi amount/category | 400 type/validation; 404 budget/category; 409 trùng scope |
| DELETE | `/api/budgets/:id` | User | ID budget | 200 `null` | 404 budget |
| POST | `/api/saving-goals` | User | `createSavingGoalSchema`: `title`, `targetAmount` positive, `targetDate` date | 201 enriched goal | 400 validation |
| GET | `/api/saving-goals` | User | Không | 200 mảng enriched goal | — |
| GET | `/api/saving-goals/:id` | User | ID goal | 200 enriched goal, 10 goalTransactions gần nhất kèm wallet name | 404 goal |
| PUT | `/api/saving-goals/:id` | User | `updateSavingGoalSchema`: `title?,targetAmount?,targetDate?` như create | 200 enriched goal | 400 validation; 404 goal |
| DELETE | `/api/saving-goals/:id` | User | ID goal | 200 `null`; chỉ goal chưa có tiền và chưa có lịch sử funding | 404 goal; 409 `SAVING_GOAL_NOT_EMPTY` |
| POST | `/api/saving-goals/:id/deposit` | User | `goalTransactionSchema`: `walletId` UUID, `amount` positive | 200 enriched goal; trừ ví và tăng goal atomic | 400 validation/`INSUFFICIENT_WALLET_BALANCE`; 404 goal/wallet |
| POST | `/api/saving-goals/:id/withdraw` | User | `goalTransactionSchema`: `walletId` UUID, `amount` positive | 200 enriched goal; trừ goal và tăng ví atomic | 400 thiếu goal balance (mã mặc định hoặc `INSUFFICIENT_GOAL_BALANCE` nếu race)/validation; 404 goal/wallet |
| POST | `/api/recurring-transactions` | User | `createRecurringSchema`: `walletId,categoryId` UUID, `amount` positive, `type=INCOME/EXPENSE`, `frequency`, `startDate` date, `note?` | 201 recurring, nextExecutionDate=startDate | 400 type category/validation; 404 wallet/category |
| GET | `/api/recurring-transactions` | User | Không | 200 mảng recurring theo nextExecutionDate tăng dần | — |
| GET | `/api/recurring-transactions/:id` | User | ID recurring | 200 recurring | 404 recurring |
| PUT | `/api/recurring-transactions/:id` | User | `updateRecurringSchema`: mọi trường create tùy chọn, `isActive?` boolean | 200 recurring | 400 type/validation; 404 recurring/wallet/category |
| PATCH | `/api/recurring-transactions/:id/toggle` | User | Không | 200 recurring đã đảo isActive | 404 recurring/wallet khi resume |
| DELETE | `/api/recurring-transactions/:id` | User | ID recurring | 200 `null`; transaction đã sinh được giữ, recurringTransactionId về null | 404 recurring |

Enriched budget bổ sung `spent,remaining,percentage,status`; `status=OK/WARNING/EXCEEDED` theo phần trăm làm tròn, ngưỡng 80/100. `spent` chỉ là EXPENSE thực tế chưa xóa, khác tổng chi có recurring dự kiến của báo cáo. Enriched goal chuyển amount sang number, bổ sung `progress` tối đa 100 và `status=ACTIVE/EXPIRED/COMPLETED`. Goal vẫn có thể được nạp vượt target. Target date không bị yêu cầu tương lai. Các endpoint deposit/withdraw không có idempotency middleware.

Frequency: `DAILY/WEEKLY/MONTHLY/YEARLY`. Lịch có thể bắt đầu trong quá khứ hoặc tương lai. Resume đặt lại cả startDate và nextExecutionDate thành thời điểm resume để bỏ khoảng pause. Scheduler chạy lúc backend khởi động và mỗi 24 giờ từ lúc khởi động; không có HTTP endpoint chạy scheduler.

## Thông báo và push

Nguồn: [routes](../backend/src/routes/notification.routes.ts), [validators](../backend/src/validators/notification.validator.ts), [service](../backend/src/services/notification.service.ts).

| Method | Đường dẫn | Quyền | Input / validator | Thành công (`data`) | Lỗi bổ sung |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/notifications` | User | `unreadOnly=true` để chỉ chưa đọc; không gắn Zod | 200 `{notifications,unreadCount}`; tối đa 50, mới nhất trước | — |
| PATCH | `/api/notifications/read-all` | User | Không | 200 `null` | — |
| PATCH | `/api/notifications/:id/read` | User | ID notification | 200 `null` | 404 notification không thuộc user |
| DELETE | `/api/notifications/:id` | User | ID notification | 200 `null` | 404 notification |
| POST | `/api/notifications/devices` | User | `registerDeviceSchema`: `deviceId` 1–191, `token` 10–255, `platform=ios/android`; `provider?=expo`, `appVersion?` ≤ 32, `locale?` ≤ 32, `timezone?` ≤ 64; chuỗi được trim | 200 DeviceToken đã upsert | 400 validation |
| DELETE | `/api/notifications/devices` | User | `unregisterDeviceSchema`: JSON `{deviceId}` 1–191, trim | 200 `null`; deactivate thiết bị active | 400 validation; 404 không có thiết bị active |

Notification có `id,userId,title,message,type,isRead,createdAt`. `unreadCount` là toàn bộ notification chưa đọc của user, không chỉ 50 item trả về. Type gồm `BUDGET_ALERT/BILL_REMINDER/GOAL_COMPLETED/RECURRING_TRANSACTION`; chưa có scheduler BILL_REMINDER riêng. Push thất bại không hủy notification đã lưu.

## Attachments và export

Nguồn: [routes](../backend/src/routes/attachment.routes.ts), [upload middleware](../backend/src/middlewares/upload.ts), [attachment service](../backend/src/services/attachment.service.ts), [export service](../backend/src/services/export.service.ts).

| Method | Đường dẫn | Quyền | Input / validator | Thành công | Lỗi bổ sung |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/attachments/transactions/:transactionId` | User | Multipart `file`; JPEG/PNG/WEBP/PDF, ≤ 5 MiB; không có Zod params | 201 attachment metadata trong envelope | 400 thiếu file/`INVALID_FILE_TYPE`/Multer; 413 `LIMIT_FILE_SIZE`; 404 transaction |
| GET | `/api/attachments/transactions/:transactionId` | User | ID transaction | 200 mảng metadata trong envelope | 404 transaction |
| GET | `/api/attachments/:id/content` | User | ID attachment | 200 binary theo MIME, Content-Disposition inline, `Cache-Control: private, no-store` | 404 attachment/transaction không được đọc |
| DELETE | `/api/attachments/:id` | User | ID attachment | 200 `null` | 400 attachment chưa liên kết; 403 transaction không được truy cập; 404 attachment |
| GET | `/api/attachments/export/excel` | User | `monthlyReportQuerySchema`: `month?,year?` như monthly report | 200 binary XLSX, filename `report-<month>-<year>.xlsx` | 400 validation |
| GET | `/api/attachments/export/pdf` | User | `monthlyReportQuerySchema`: `month?,year?` | 200 binary PDF, filename `report-<month>-<year>.pdf` | 400 validation |

Metadata: `id,transactionId,url,filename,fileType,fileSize,createdAt`; `url` trả cho client là `/api/attachments/<id>/content`, không phải URL lưu trữ nội bộ. Download phải gửi access token. Upload kiểm tra MIME khai báo, chưa có kiểm tra magic bytes/antivirus. Không có route public `/uploads` trong app. Export và content không dùng JSON success envelope; lỗi vẫn qua middleware JSON nếu xảy ra trước khi gửi binary.

## AI REST và CopilotKit

Nguồn: [AI routes](../backend/src/routes/ai.routes.ts), [AI services](../backend/src/services/ai), [Copilot runtime](../backend/src/copilotkit/runtime.ts).

| Method | Đường dẫn | Quyền | Input / validator | Thành công (`data`) | Lỗi bổ sung |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/ai/status` | User | Không | 200 `{aiEnabled,model,features}` | — |
| GET | `/api/ai/analyze/expenses` | User | Query `month?,year?` parse integer; không gắn Zod | 200 `{month,year,summary,topCategories,expenseChangePercent,insights,aiSummary,poweredBy}` | — |
| POST | `/api/ai/analyze/expenses` | User | Body `month?,year?`; query nếu parse được được ưu tiên; không gắn `analyzeExpensesSchema` | 200 như GET | — |
| GET | `/api/ai/budget/forecast` | User | Query `month?,year?`; không gắn Zod | 200 `{month,year,dayOfMonth,daysInMonth,forecasts,atRiskCount,summary}` | — |
| GET | `/api/ai/advisor/insights` | User | Không | 200 `{healthScore,recommendations,aiAdvice,context,poweredBy}` | — |
| POST | `/api/ai/receipt/scan` | User | Multipart `file`, cùng giới hạn attachments | 200 receipt result bên dưới; không lưu transaction | 400 thiếu file/type; 413 file lớn |
| POST | `/api/ai/chat` | User | `chatSchema`: `message` 1–1000 ký tự; `history?` mảng `{role:user/assistant,content:string}` | 200 `{reply,poweredBy,suggestions}` | 400 validation |
| POST | `/api/copilotkit` | Bearer User | Protocol single-route của CopilotKit v2, payload ≤ 64kb; chỉ tồn tại khi enabled | Runtime JSON/stream theo operation; không dùng envelope REST success | 400 `INVALID_REQUEST/INVALID_THREAD_ID/INVALID_RUN_ID`; 401 `UNAUTHORIZED`; 403 origin/thread; 413 payload/message; 426 HTTPS; 429 `RATE_LIMITED`; 503 capacity; 500 runtime |

`history` chat hiện không giới hạn số item/kích thước từng content ở Zod; service chỉ đưa 6 item cuối vào LLM. `analyzeExpensesSchema` tồn tại trong source nhưng không được gắn vào route, nên không mô tả min/max của schema đó như API contract đã enforce. AI không có key hoặc khi gọi provider thất bại có fallback rule/parser; `poweredBy` của analysis/advisor thể hiện cấu hình khả dụng, không luôn chứng minh LLM đã trả lời thành công. Budget forecast là phép ngoại suy chi/ngày, không gọi LLM.

Receipt result: `amount,transactionDate,merchant,note,suggestedCategoryId,suggestedCategoryName` có thể null; `confidence=high/medium/low`, `rawText` tối đa 500 ký tự, `poweredBy=openai/parser`. PDF trích text; ảnh ưu tiên vision nếu có key rồi fallback Tesseract `vie+eng`. Người dùng cần kiểm tra đề xuất trước khi gọi API tạo giao dịch.

Copilot single-route được SDK vận chuyển theo `{method,params?,body?}`; body có thể là object hoặc JSON string. Dùng SDK cùng phiên bản đã khóa trong [package.json](../backend/package.json), không giả lập các URL REST `agent/run` riêng. Operation runtime gồm `info`, `agent/run`, `agent/suggest`, `agent/connect`, `agent/stop`; `threads/*`, `memories/*`, debug events bị chặn. `inspector/metadata` bị chặn ở production. Runtime chỉ chấp nhận Bearer, không đọc cookie accessToken; Origin phải thuộc `FRONTEND_URL`, production phải HTTPS. Thread/run ID phải dài 1–200, không whitespace/control characters. User message mặc định tối đa 4000 ký tự; rate limit mặc định 60 request/phút theo IP.

Server đăng ký 6 financial tools read-only: `getFinancialOverview`, `getExpenseBreakdown`, `getBudgetStatus`, `getSavingGoals`, `compareMonthlySpending`, `findTransactions`. Tool tìm giao dịch hỗ trợ `transactionId`, `search`, `type`, `startDate/endDate` YYYY-MM-DD, `limit` 1–20 (mặc định 10), `offset`; trả `transactions,total,hasMore` với ID/version/loại/số tiền/ngày/tên ví/tên danh mục/ghi chú và `editable`. Agent bind userId từ JWT; client không được truyền userId để đổi phạm vi dữ liệu. Các thao tác ghi, sửa và xóa trong giao diện Copilot là frontend tools gọi REST sau xác nhận; sửa/xóa gửi version và idempotency key. Xem [frontend README](../frontend/README.md). Runner và thread ownership nằm trong RAM, không phải API lưu lịch sử chat lâu dài.

Các bộ lọc `findTransactions` chấp nhận `null`; tìm danh sách dùng `transactionId=null`, mặc định limit=10/offset=0. Danh sách rỗng trả `success=true`. ID không tìm thấy hoặc không được truy cập trả `TRANSACTION_NOT_FOUND` (không retry cùng ID; tìm lại bằng bộ lọc), ngày không hợp lệ trả `INVALID_TOOL_INPUT`. Database lỗi/timeout vẫn trả `FINANCIAL_DATA_UNAVAILABLE`/`TOOL_TIMEOUT` và không lộ dữ liệu nội bộ.

## Admin

Nguồn: [admin routes](../backend/src/routes/admin.routes.ts), [controller](../backend/src/controllers/admin.controller.ts), [repository](../backend/src/repositories/admin.repository.ts).

| Method | Đường dẫn | Quyền | Input / validator | Thành công (`data`) | Lỗi bổ sung |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/admin/users` | Admin | Không | 200 mảng users với `_count.transactions/wallets`; không pagination | 403 quyền |
| GET | `/api/admin/users/:id` | Admin | ID user | 200 user, `_count` thêm budgets/goals/recurring | 403 quyền; 404 user |
| PUT | `/api/admin/users/:id` | Admin | `{fullName?,role?}`; **không gắn Zod**; enum DB chỉ USER/ADMIN | 200 user selected fields | 400 sửa chính mình; 403 quyền; 404 user; dữ liệu sai có thể 500 |
| DELETE | `/api/admin/users/:id` | Admin | ID user | 200 `null`; xóa user và dọn attachments sau DB delete | 400 xóa chính mình; 403 quyền; 404 user |

Admin response không gồm passwordHash/refresh tokens. Role lấy từ JWT, nên thay đổi role không cập nhật quyền token đang lưu ngay lập tức; cần login/refresh mới. Route này chưa tự revoke session khi admin đổi role.

## Ví dụ gọi API

Các lệnh dùng Bash và dữ liệu giả; thay UUID bằng ID trả từ API. Không lưu token thật vào repository. Trên PowerShell dùng `curl.exe` thay cho alias `curl` hoặc dùng `Invoke-RestMethod`.

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"example-password-123","fullName":"Người dùng thử"}'

curl -c cookies.txt -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"example-password-123","platform":"web"}'

curl -b cookies.txt -c cookies.txt -X POST http://localhost:5000/api/auth/refresh \
  -H 'Content-Type: application/json' -d '{}'

curl http://localhost:5000/api/wallets -X POST \
  -H 'Authorization: Bearer <access-token>' -H 'Content-Type: application/json' \
  -d '{"name":"Tiền mặt","type":"CASH","initialBalance":1000000}'

curl http://localhost:5000/api/transactions -X POST \
  -H 'Authorization: Bearer <access-token>' -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: example-expense-01' \
  -d '{"walletId":"11111111-1111-4111-8111-111111111111","categoryId":"22222222-2222-4222-8222-222222222222","amount":50000,"type":"EXPENSE","note":"Ăn trưa","transactionDate":"2026-10-12T05:00:00.000Z"}'

curl 'http://localhost:5000/api/transactions?type=EXPENSE&skip=0&take=20&sortBy=transactionDate&order=desc' \
  -H 'Authorization: Bearer <access-token>'

curl http://localhost:5000/api/transactions/11111111-1111-4111-8111-111111111111 -X PUT \
  -H 'Authorization: Bearer <access-token>' -H 'Content-Type: application/json' \
  -d '{"note":"Đã kiểm tra","version":1}'

curl http://localhost:5000/api/ai/receipt/scan -X POST \
  -H 'Authorization: Bearer <access-token>' -F 'file=@receipt.png'

curl 'http://localhost:5000/api/attachments/export/excel?month=10&year=2026' \
  -H 'Authorization: Bearer <access-token>' -o report-10-2026.xlsx
```

## Mã lỗi và giới hạn hiện tại

| Status / code | Cách xử lý |
| --- | --- |
| 400 `REQUEST_FAILED` | Kiểm tra `errors` nếu validation; nếu không, đọc message nghiệp vụ |
| 400 `INSUFFICIENT_WALLET_BALANCE` | Giảm amount hoặc chọn/nạp ví; không retry mù |
| 400 `INSUFFICIENT_GOAL_BALANCE` | Tải lại số dư goal; pre-check service có thể dùng mã mặc định |
| 401 `UNAUTHORIZED` | Refresh một lần, serialize các refresh đồng thời; login nếu refresh không hợp lệ |
| 401 `REFRESH_TOKEN_REUSED` | Xóa credential cũ và đăng nhập lại; family đã revoke |
| 403 `REQUEST_FAILED` | Thiếu quyền hoặc cố sửa danh mục hệ thống |
| 404 `REQUEST_FAILED` | Resource không tồn tại hoặc không thuộc phạm vi user |
| 409 `VERSION_CONFLICT` | Tải lại transaction/version, để user giải quyết trước khi ghi lại |
| 409 `SAVING_GOAL_NOT_EMPTY` | Giữ goal có funding history, kể cả đã rút về 0 |
| 409 `REQUEST_FAILED` | Trùng budget, idempotency pending hoặc key bị reuse khác payload |
| 429 `AUTH_RATE_LIMITED` / `RATE_LIMITED` | Tuân theo `Retry-After` và RateLimit headers |
| 413 `LIMIT_FILE_SIZE` / `PAYLOAD_TOO_LARGE` / `MESSAGE_TOO_LONG` | Giảm file/payload/message |
| 500 `INTERNAL_ERROR` / `COPILOT_RUNTIME_ERROR` | Ghi requestId, kiểm tra log server; không hiển thị provider internals |

REST chưa có JSON catch-all 404 và chưa map chung các lỗi Prisma FK/unique; route lạ có thể trả 404 mặc định Express. JSON malformed ngoài Copilot hiện có thể rơi vào lỗi 500 chung. Không có public signup role, reset password/email verification, OAuth, webhook, currency conversion hay rate limit chung cho toàn bộ REST API.

Xem thêm [thiết lập môi trường](environment-setup.md), [thiết kế database](erd.md), [nghiệp vụ](business_rules.md), [testing](testing.md).
