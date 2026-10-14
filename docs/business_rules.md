# Luồng nghiệp vụ và quy tắc MoneyMate

> Đối chiếu working tree ngày 2026-10-13. Tài liệu mô tả hành vi đang chạy; code/tests là nguồn kiểm tra khi có khác biệt. Nguồn chính: [services](../backend/src/services), [repositories](../backend/src/repositories), [Prisma schema](../backend/prisma/schema.prisma).

## 1. Phạm vi dữ liệu và tiền tệ

Mỗi tài khoản có ví, giao dịch, budget, mục tiêu, lịch recurring, thông báo và phiên riêng. userId lấy từ access token, không lấy từ body để xác định chủ sở hữu. Danh mục hệ thống có `userId=null` được chia sẻ, chỉ đọc; danh mục riêng thuộc đúng một user. Role `ADMIN` chỉ mở các API quản lý users, không bỏ qua ownership của mọi API tài chính. [Authentication](auth_sessions.md) mô tả rotation, role và giới hạn revoke access token.

DB lưu tiền bằng `Decimal(15,2)`; request JSON dùng number, nhiều phép tổng hợp chuyển Decimal sang JavaScript Number. Chưa có giới hạn amount thống nhất trong validator tương ứng với biên Decimal, cũng chưa có phép tính tỷ giá. Ví lưu currency string, mặc định VND; báo cáo/AI/export hiện dùng VND và cộng số tiền từ mọi ví mà không phân tách currency. Vì vậy dữ liệu nhiều loại tiền chưa được chuẩn hóa thành báo cáo chính xác theo tỷ giá.

## 2. Ví: số dư lưu hiện tại

`Wallet.initialBalance` hiện là **số dư mutable đang lưu**, dù tên field gợi ý số dư ban đầu. Tạo ví nhận giá trị ≥ 0; PUT ví có thể đặt lại số dư trực tiếp. Không có sổ riêng theo dõi các lần điều chỉnh số dư thủ công.

| Thao tác | Thay đổi số dư ví | Thay đổi dữ liệu báo cáo |
| --- | --- | --- |
| Tạo INCOME | Cộng amount vào ví | Ghi INCOME |
| Sửa INCOME | Hoàn tác amount cũ, rồi áp dụng INCOME mới nếu còn type đó | Sửa record/version |
| Xóa INCOME | Trừ khoản đã cộng trước đó | Soft delete record |
| Tạo/sửa/xóa EXPENSE | **Không trừ/cộng ví** | Ghi/sửa/soft delete EXPENSE |
| Transfer | Trừ ví nguồn, cộng ví đích | Ghi 2 TRANSFER và WalletTransfer; loại khỏi tổng thu/chi |
| Goal deposit | Trừ ví, cộng goal | Ghi GoalTransaction DEPOSIT |
| Goal withdraw | Trừ goal, cộng ví | Ghi GoalTransaction WITHDRAW |
| PUT initialBalance | Thay thế số dư đang lưu | Không tạo transaction điều chỉnh |

Ví dụ: ví có 1.000.000, ghi expense 100.000 thì ví vẫn lưu 1.000.000; báo cáo tháng trừ 100.000 khi tính số còn lại. Ghi income 200.000 thì ví thành 1.200.000. Nạp goal 300.000 thì ví thành 900.000, goal tăng 300.000. `netWorth` dashboard hiện bằng tổng ví active, không cộng goal balance.

DELETE ví là **archive**: đặt deletedAt và tắt mọi recurring active của ví trong cùng DB transaction. Ví archived biến mất khỏi danh sách, không dùng cho mutation mới; giao dịch/transfer/goal history vẫn được giữ. Không có API restore ví. Repository có index `(userId,deletedAt)` phục vụ truy vấn active.

Nguồn: [wallet service](../backend/src/services/wallet.service.ts), [wallet repository](../backend/src/repositories/wallet.repository.ts).

## 3. Danh mục

Category có type `INCOME` hoặc `EXPENSE`; transaction/recurring phải khớp type category. Tạo category riêng kiểm tra trùng name/type với cả category riêng lẫn global. Color phải `#RRGGBB`; icon là tên string, không được xác minh với một icon registry phía backend. Update không đổi type.

Category hệ thống bị cấm update/delete (403). Category riêng bị FK Restrict nếu có transaction hoặc recurring tham chiếu; soft-deleted transaction vẫn còn FK. Budget có quan hệ Cascade theo category, nên category đủ điều kiện xóa sẽ kéo theo budget liên quan. Service chưa dịch tất cả lỗi FK/unique khi update/delete thành mã nghiệp vụ riêng; xem [API](api.md).

Seed provision 14 danh mục hệ thống (5 INCOME, 9 EXPENSE), kiểm tra tồn tại trước khi tạo, không tạo tài khoản mẫu/admin. Unique `(userId,name,type)` không tự ngăn duplicate hệ thống có userId null trong MySQL; seed/service phải kiểm tra bổ sung.

Nguồn: [category service](../backend/src/services/category.service.ts), [seed](../backend/prisma/seed.ts).

## 4. Giao dịch thu/chi

Tạo/sửa chỉ nhận `INCOME/EXPENSE`; TRANSFER đi qua endpoint riêng. amount > 0, wallet active phải thuộc user, category thuộc user hoặc global và khớp type. transactionDate không được tương lai ở validator lẫn service.

Expense thường kiểm tra amount không vượt số dư ví đang lưu, nhưng expense đã ghi trước đó không làm giảm số dư này. Vì vậy nhiều expenses riêng lẻ có thể cộng vượt số dư. Khi chuyển một income cũ thành expense trong cùng ví, check availableBalance đã trừ credit của income cũ. Không sử dụng quy tắc này để suy luận đây là một ledger tự cân bằng.

Mutation INCOME và write transaction nằm trong cùng Prisma transaction. Expense mutation ghi transaction nhưng không debit ví. Update kiểm tra tổ hợp wallet/category/type cuối cùng, hoàn tác income cũ trước khi cập nhật, áp dụng income mới sau cập nhật; rollback toàn bộ nếu write có điều kiện thất bại. Xóa là soft delete và đảo credit chỉ khi transaction là INCOME.

`Transaction.version` mặc định 1; update/delete tăng 1. Client có thể gửi version đã tải; version lệch trả `409 VERSION_CONFLICT`. Write luôn có điều kiện version/deletedAt chống race từ lúc service đọc. **Nếu client không gửi version, server không biết dữ liệu client đã cũ trước lúc request bắt đầu**; mobile/web cần gửi version nếu cần ngăn ghi đè dữ liệu đã tải từ trước.

Tạo/sửa/xóa transaction của tháng đã đóng xóa snapshot của kỳ liên quan trong cùng transaction. Cảnh báo budget được kiểm tra sau expense commit; lỗi notification được log và không biến giao dịch đã commit thành thất bại.

Danh sách và recent dashboard loại TRANSFER, deleted transactions. Endpoint sync vẫn trả TRANSFER và tombstones. Attachments của transaction soft delete vẫn tồn tại ở DB/storage nhưng không còn đọc qua transaction active lookup.

**Giới hạn:** update/delete income có thể decrement ví về âm nếu tiền credit đã được transfer/deposit hoặc số dư bị chỉnh thủ công; hiện không có guard chống âm trên thao tác đảo income. Expense check trước create không debit nên không có reservation tiền.

Nguồn: [transaction service](../backend/src/services/transaction.service.ts), [validator](../backend/src/validators/transaction.validator.ts), [unit tests](../backend/src/__tests__/unit/transaction.service.test.ts).

## 5. Chuyển tiền giữa ví

Source/destination phải khác nhau, active và cùng chủ sở hữu; amount > 0. Repository kiểm tra số dư nguồn, rồi debit có điều kiện `initialBalance>=amount` ngay lúc ghi để chống race. Debit nguồn, credit đích, hai TRANSFER transaction và một WalletTransfer đều nằm trong cùng DB transaction.

TRANSFER không dùng category thu/chi do client truyền; service chọn một category global EXPENSE theo tên tăng dần. Thiếu category hệ thống làm transfer thất bại, vì vậy fresh deployment phải apply migration/seed categories. Hai transaction ghi chú “Chuyển tiền” và “Nhận tiền” là audit records; không tăng thu nhập hoặc chi tiêu.

Endpoint hiện không cấm transferDate tương lai, không kiểm tra hai currency giống nhau và không quy đổi tiền. Chưa có API sửa/xóa/đảo transfer. Transfer giữa ví giữ tổng số dư hai ví, nhưng archive một ví làm thay đổi tổng active wallets được dashboard hiển thị.

Nguồn: [transfer service](../backend/src/services/transaction.service.ts), [transfer repository](../backend/src/repositories/transaction.repository.ts).

## 6. Ngân sách

Mỗi scope (global hoặc category EXPENSE) có tối đa một budget theo user/tháng/năm cho dữ liệu mới. `categoryScope=GLOBAL` khi categoryId null, còn lại categoryScope=categoryId; unique index không phụ thuộc nullable FK. Create kiểm tra duplicate trước (400), unique race ở DB trả 409; update trùng scope trả 409.

`spent` là tổng EXPENSE **thực tế** chưa xóa trong tháng, theo category nếu có. Không cộng recurring dự kiến vào budget spent. `percentage=round(spent/amount*100)`, `remaining=max(0,amount-spent)`; status theo phần trăm đã làm tròn:

| Percentage | Status |
| --- | --- |
| < 80 | OK |
| 80–99 | WARNING |
| ≥ 100 | EXCEEDED |

Các cờ `warningNotified/exceededNotified` được claim atomic để tránh nhiều notification cho cùng ngưỡng. Mỗi lần check chỉ chọn cấp cao nhất hiện có; vượt ngay 100 không tạo thêm warning 80 trong cùng lần. Đổi amount/category reset cả hai cờ. Nếu tạo notification DB thất bại, release cờ để check sau có thể thử lại; không có queue retry độc lập. Expense create/update và recurring expense commit kích hoạt check; xóa expense hoặc tạo/sửa budget không tự gửi alert ngay.

Lưu ý migration uniqueness giữ các budget global cũ bằng scope `LEGACY:<id>`, không xóa duplicate lịch sử. DB có thể còn nhiều global budget từ trước migration; service duplicate check chặn thêm nhưng không tự hợp nhất dữ liệu cũ.

Nguồn: [budget service](../backend/src/services/budget.service.ts), [budget repository](../backend/src/repositories/budget.repository.ts), [migration](../backend/prisma/migrations/20260903010000_harden_budget_uniqueness/migration.sql).

## 7. Mục tiêu tiết kiệm

Goal có targetAmount > 0, targetDate được ép Date (có thể trong quá khứ), currentAmount mặc định 0. Status ưu tiên COMPLETED nếu current ≥ target, rồi EXPIRED nếu quá targetDate, còn lại ACTIVE. Progress làm tròn, giới hạn tối đa 100; nạp vượt target không bị cấm.

Deposit/withdraw kiểm tra ownership cả goal và ví. Deposit dùng conditional debit đủ số dư ví và tăng goal; withdraw dùng conditional debit đủ goal balance và tăng ví. Cả hai cùng ghi GoalTransaction trong DB transaction, rollback nếu một bước không thực hiện được. Không ghi transaction INCOME/EXPENSE cho funding goal.

GET goal chi tiết trả tối đa 10 GoalTransaction mới nhất. Chỉ xóa goal khi currentAmount=0 **và chưa từng có funding history**; điều kiện delete được kiểm tra lại ở DB. Goal đã nạp rồi rút hết vẫn phải giữ, trả `409 SAVING_GOAL_NOT_EMPTY`.

Deposit tới status COMPLETED tạo notification sau commit; nhiều lần deposit khi đã hoàn thành có thể tạo nhiều thông báo hoàn thành, hiện không có cờ dedupe tương tự budget. Deposit/withdraw chưa có Idempotency-Key middleware; không tự retry mutation sau timeout nếu chưa kiểm tra kết quả.

Nguồn: [saving goal service](../backend/src/services/saving-goal.service.ts), [repository](../backend/src/repositories/saving-goal.repository.ts).

## 8. Giao dịch định kỳ

Recurring hỗ trợ DAILY/WEEKLY/MONTHLY/YEARLY, chỉ INCOME/EXPENSE, amount > 0, ví active cùng user và category accessible khớp type. Tạo đặt nextExecutionDate=startDate. Đổi startDate cập nhật execution cursor; resume từ inactive đặt lại startDate và nextExecutionDate thành lúc resume để bỏ thời gian pause.

MONTHLY giữ ngày anchor ban đầu, dùng ngày cuối tháng khi thiếu ngày đó; ví dụ anchor 31/01 → 28/02 → 31/03. YEARLY tương tự với ngày nhuận. Không lấy ngày bị clamp làm anchor mới.

[server.ts](../backend/src/server.ts) gọi scheduler lúc startup, sau đó setInterval mỗi 24 giờ từ startup, không phải cron nửa đêm. Mỗi lần query due đến 23:59:59.999 của ngày server. Mỗi schedule xử lý tối đa 100 occurrences mỗi run. Scheduler claim bằng isActive và nextExecutionDate cũ, update cursor và tạo occurrences trong cùng transaction, giúp nhiều instance không cùng claim một batch.

INCOME generated tăng số dư ví; EXPENSE generated không debit ví và **không check đủ số dư như expense thường**. Scheduler recheck wallet/category ownership/type trong transaction. Generated record có recurringTransactionId để báo cáo không đếm dự kiến trùng ngày đã sinh. Batch catch-up có thể tạo record cho toàn bộ ngày hiện tại đến cuối ngày; hành vi khác future-date check của API tạo thường.

Notification recurring và budget alerts chạy sau commit, lỗi side effect chỉ log. Xóa lịch SetNull liên kết transaction đã sinh, không xóa history. Không có durable job queue, khóa scheduler toàn cục ngoài claim DB, hoặc HTTP endpoint chạy tay. Khi backend ngừng lâu, catch-up giới hạn 100/run có thể cần thêm lần startup/24 giờ để xử lý hết.

Nguồn: [recurring service](../backend/src/services/recurring.service.ts), [recurrence helper](../backend/src/common/recurrence.ts), [recurring tests](../backend/src/__tests__/unit/recurring.service.test.ts).

## 9. Báo cáo và snapshot

Khoảng tháng được tạo bằng JavaScript Date theo timezone của tiến trình server; `timezone` metadata session/device không được áp dụng vào report boundaries. Tất cả aggregates loại soft-deleted transaction. Thu nhập lương dựa vào tên category đã bỏ dấu/lowercase đúng `luong` hoặc `salary`; category income khác là otherIncome.

Recurring projection xét lịch active và các lần thực hiện từ hôm nay trở đi trong kỳ; bỏ ngày đã có generated transaction chưa xóa. Tổng thu/chi báo cáo có thể chứa số liệu dự kiến, trong khi budget chỉ dùng actual expenses.

Gọi `B` là tổng ví active hiện tại, `B_m` là số dư ví tái dựng cuối tháng, `I_a/E_a` là thu/chi actual, `I_r/E_r` là recurring dự kiến của tháng:

| Kết quả | Công thức đang dùng |
| --- | --- |
| Dashboard netWorth, walletBalanceTotal | B; không cộng goal |
| Dashboard monthlyIncome | I_a + I_r |
| Dashboard monthlyExpense | E_a + E_r |
| Dashboard monthlySavings, monthlyRemaining | B - (E_a + E_r) |
| Monthly summary actualIncome/recurringIncome | I_a / I_r |
| Monthly summary totalIncome | B_m (service ghi đè totalIncome của repository) |
| Monthly summary totalExpense | E_a + E_r |
| Monthly summary netSavings/remainingAmount | B_m - (E_a + E_r) |
| Trend income/expense/remaining | B_m / (E_a+E_r) / B_m-(E_a+E_r) |
| Yearly monthlyData income/savings | I_a+I_r / (I_a+I_r)-(E_a+E_r) |
| Yearly top-level totalIncome | Tổng B_m các tháng từ tháng tạo account đến tháng hiện tại trong năm được yêu cầu |
| Yearly top-level totalExpense/netSavings | Tổng expense các tháng được tính / totalIncome-totalExpense |

Yearly monthlyData vẫn đủ 12 tháng; top-level totals chỉ dùng tháng không trước account creation và không sau hiện tại. CategoryExpenses yearly cộng breakdown cả 12 tháng. Vì vậy các field cùng tên có thể khác ý nghĩa giữa monthly, dashboard và yearly; consumers cần đọc contract này thay vì coi mọi “income” là dòng tiền mới phát sinh.

Với kỳ hiện tại/tương lai, B_m lấy tổng ví active hiện tại. Với kỳ quá khứ, repository chọn ví đã tạo tại thời điểm đó và chưa archive trước cuối kỳ, từ số dư đang lưu đảo các INCOME, transfers và GoalTransaction sau kỳ đó. Expense không tham gia đảo số dư vì chưa từng debit ví. **Điều chỉnh initialBalance thủ công không có audit history**, nên tái dựng không phải số dư lịch sử được bảo đảm trong mọi tình huống.

Yearly GET recompute cả 12 tháng và upsert snapshot cho tháng đã đóng với `formulaVersion=9`. Schema/migration vẫn có default 6, nhưng application ghi 9 rõ ràng. Snapshot lưu actual income components, expense, savings=income-expense, walletBalance; hiện không đọc để khóa cứng tháng lịch sử. Thay đổi backdated transaction invalidates snapshot tương ứng. Đây là cache/kết quả materialized có thể tính lại, không phải hồ sơ chốt sổ immutable.

Export Excel/PDF lấy monthly report cùng công thức và toàn bộ transactions INCOME/EXPENSE của kỳ qua paging nội bộ; không chỉ trang 20 item của UI. Nó vẫn có thể hiện tổng dự kiến trong summary nhưng chỉ actual records trong bảng giao dịch.

Nguồn: [transaction repository](../backend/src/repositories/transaction.repository.ts), [transaction service](../backend/src/services/transaction.service.ts), [export service](../backend/src/services/export.service.ts).

## 10. Attachments, OCR và AI

Upload nhận JPEG/PNG/WEBP/PDF ≤ 5 MiB, lưu vào local uploads hoặc S3-compatible. Metadata liên kết transaction; client nhận URL API được bảo vệ thay cho storage URL. Download/list/upload cần transaction active cùng user; delete xác minh ownership qua transaction rồi xóa object và row. MIME validation chưa xác minh magic bytes hay antivirus.

OCR là đề xuất, không tạo expense, goal hoặc attachment tự động. File được ghi tạm và xóa trong finally; PDF trích text, ảnh ưu tiên OpenAI vision khi available rồi fallback Tesseract. Trường đọc không được có thể null, confidence chỉ là mức heuristic; user xác nhận ngày/amount/category trước khi tạo transaction.

AI REST có rule-based analysis/advisor/chat, budget forecast ngoại suy theo chi/ngày, LLM enhancement khi có key. Context lấy dữ liệu user-scoped. Chat chỉ dùng 6 history messages cuối cho model. Provider failure có thể fallback rules; analysis/advisor poweredBy dựa cấu hình chứ không phản ánh chắc chắn provider thành công.

Copilot server cung cấp 6 tools đọc dữ liệu, gồm tìm giao dịch có giới hạn/phân trang, không ghi trực tiếp. Giao diện web có các tools tạo dữ liệu/sửa/xóa thu chi/xử lý UI với xác nhận; xem [frontend README](../frontend/README.md). Nếu nhiều giao dịch phù hợp, chatbot phải hỏi người dùng chọn. Sửa/xóa gửi version của giao dịch đã hiển thị và idempotency key. Các tools đó phải tuân REST validation, số dư và quyền giống UI thường. Đóng/mở khung chat giữ state trong phiên. Runtime dùng giới hạn message/payload/rate/model steps/timeouts, ownership thread trong RAM; không có history store bền vững.

Nguồn: [attachment service](../backend/src/services/attachment.service.ts), [OCR](../backend/src/services/ai/receipt-ocr.service.ts), [financial tools](../backend/src/copilotkit/financial-tools.ts).

## 11. Thông báo và thiết bị

Budget/goal/recurring lưu notification DB, sau đó thử Expo push. Push lỗi không hủy notification; ticket DeviceNotRegistered deactivate device token. Chưa có push receipt polling/durable retry queue. Notification list trả tối đa 50 và unreadCount toàn bộ; mark read/delete scope theo user.

Device token unique global theo physical push token và unique `(userId,deviceId,provider)`. Register xóa token cũ cho logical device rồi upsert token mới vào user hiện đăng nhập trong cùng transaction. Provider hiện chỉ expo, platform ios/android. Logout client nên unregister device nếu cần ngừng push; revoke refresh không tự deactivate DeviceToken. BILL_REMINDER có enum nhưng chưa có riêng job/API tạo bill reminders.

Nguồn: [notification service](../backend/src/services/notification.service.ts), [repository](../backend/src/repositories/notification.repository.ts), [push service](../backend/src/services/push.service.ts).

## 12. Đồng bộ, idempotency và xóa tài khoản

Transaction sync delta sắp xếp theo `(updatedAt,id)`, bounded take 1–200, trả tombstones. Client apply từng item rồi persist cursor; không tự xóa tombstone server trước khi có chính sách retention. Sync chỉ transactions, các danh sách khác tải riêng.

Idempotency-Key tùy chọn chỉ trên tạo transaction và transfer. Unique theo user, hash method/path/body đã parse, sống 24 giờ. Cùng key đã hoàn tất replay nguyên response/status kể cả terminal 5xx; khác payload hoặc đang PENDING trả 409. Persist response sau business mutation là bước riêng, nên interruption có thể để PENDING. Các endpoints còn lại chưa được bảo vệ idempotency từ middleware này.

Self-delete kiểm tra password; admin-delete kiểm tra role và không cho xóa chính admin gọi API. User DB delete dựa cascade quan hệ, physical transaction delete kéo metadata attachment; storage cleanup thực hiện sau DB delete bằng Promise.allSettled. File cleanup lỗi được log nhưng account delete vẫn thành công; hiện không có cleanup retry job. Backup DB/object storage nằm ngoài lifecycle API, không tự bị xóa khi account delete.

Nguồn: [idempotency middleware](../backend/src/middlewares/idempotency.ts), [user service](../backend/src/services/user.service.ts), [admin service](../backend/src/services/admin.service.ts). Chi tiết tích hợp: [API](api.md), [database](erd.md), [testing](testing.md).
