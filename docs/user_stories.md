# User stories và điều kiện chấp nhận

> Đối chiếu mã nguồn ngày 13/10/2026. Giữ ID `US-01` đến `US-15`. Các điều kiện dưới đây là kịch bản cần kiểm chứng, không phải báo cáo tất cả test đã chạy. [Mục lục](README.md).

## US-01 — Đăng ký và đăng nhập

**Là khách, tôi muốn tạo tài khoản và đăng nhập để quản lý dữ liệu tài chính riêng.**

- Nhập họ tên/email hợp lệ và mật khẩu tối thiểu 8 ký tự; email đã dùng được từ chối.
- Login đúng trả user/access token và refresh qua cookie web hoặc body native.
- Login sai không tiết lộ tài khoản có tồn tại; vượt giới hạn trả `429`.
- Đăng ký không cho người dùng tự chọn role admin.

Truy vết: `FR-AUTH-01..03`, `NFR-SEC-02..04`; [auth](auth_sessions.md).

## US-02 — Quản lý phiên và hồ sơ

**Là người dùng, tôi muốn xem phiên, sửa hồ sơ và kiểm soát tài khoản.**

- Xem/revoke phiên của mình; revoke một phiên không áp dụng cho phiên người khác.
- Đổi mật khẩu cần mật khẩu hiện tại và thu hồi refresh sessions.
- Xóa tài khoản cần password confirmation; DB và file cleanup có phạm vi như [nghiệp vụ](business_rules.md).
- Refresh luân chuyển; dùng lại token cũ thu hồi family. JWT access đã cấp có thể tồn tại đến hạn, không hứa revoke tức thời.

Truy vết: `FR-AUTH-04..06`; [auth](auth_sessions.md).

## US-03 — Quản lý ví và danh mục

**Là người dùng, tôi muốn chia ví và danh mục theo cách quản lý tiền của mình.**

- Tạo/sửa/xem/archive ví; archive ẩn khỏi danh sách active, giữ lịch sử.
- Dùng danh mục hệ thống và quản lý danh mục cá nhân thu/chi; không sửa danh mục hệ thống.
- Tham chiếu ví/danh mục của người khác hoặc loại không phù hợp bị từ chối.
- Currency không tạo ra FX conversion; UI/tổng hợp hiện chủ yếu VND.

Truy vết: `FR-WALLET-01..02`, `FR-CATEGORY-01..03`.

## US-04 — Ghi và tìm giao dịch

**Là người dùng, tôi muốn ghi thu/chi và tra cứu giao dịch theo thời gian, ví, danh mục.**

- Giao dịch có amount dương, ví của mình, danh mục đúng loại và ngày không tương lai.
- Khoản thu tăng ví; khoản chi thường kiểm tra đủ tiền nhưng không trừ ví theo implementation hiện tại.
- Tìm/lọc/sắp xếp/phân trang trả đúng phạm vi user; transfer không hiện như khoản thu/chi thông thường.
- Update/delete với version cũ trả conflict; delete lưu tombstone.
- Update/delete khoản thu hoàn tác ảnh hưởng số dư, có thể làm số dư âm nếu tiền đã chuyển đi; đây là giới hạn cần hiểu khi QA.

Truy vết: `FR-TX-01..04`; [business rules](business_rules.md).

## US-05 — Chuyển tiền giữa ví

**Là người dùng, tôi muốn chuyển tiền giữa hai ví để phân bổ số dư.**

- Hai ví active, khác nhau, thuộc mình; amount dương và ví nguồn đủ số dư.
- Debit/credit, bản ghi transfer và các giao dịch liên kết commit atomic.
- Retry cùng request/key trong thời gian hiệu lực idempotency không tạo transfer trùng.
- Không sửa/xóa transfer qua CRUD giao dịch thường.

Truy vết: `FR-WALLET-03`, `FR-TX-05,07`; [API](api.md).

## US-06 — Theo dõi ngân sách

**Là người dùng, tôi muốn đặt ngân sách tháng và nhận cảnh báo chi tiêu.**

- Tạo ngân sách tổng hoặc danh mục chi, không trùng phạm vi/tháng/năm.
- Xem hạn mức, đã chi, còn lại, phần trăm và status.
- Đạt 80% có warning, 100% có exceeded; ngưỡng/kỳ được deduplicate.
- Vượt budget không tự chặn khoản chi hợp lệ.

Truy vết: `FR-BUDGET-01..03`.

## US-07 — Nạp/rút mục tiêu

**Là người dùng, tôi muốn dành tiền trong ví cho mục tiêu và xem tiến độ.**

- Tạo mục tiêu số tiền/ngày đích hợp lệ; progress/status được tính từ dữ liệu.
- Deposit kiểm tra ví đủ tiền, giảm ví/tăng goal và ghi history atomic.
- Withdraw không vượt số tiền goal, tăng ví/giảm goal atomic.
- Goal có tiền hoặc có history không được xóa, kể cả đã rút hết về 0.

Truy vết: `FR-GOAL-01..04`.

## US-08 — Lập lịch thu/chi

**Là người dùng, tôi muốn tạo lịch giao dịch lặp lại để bớt thao tác thường xuyên.**

- Hỗ trợ ngày/tuần/tháng/năm, ngày bắt đầu và pause/resume; chưa có trường ngày kết thúc.
- Processor claim kỳ đến hạn để hạn chế sinh trùng khi chạy chồng.
- Catch up có giới hạn và giữ `recurringId` để báo cáo không cộng trùng khoản đã sinh.
- Scheduler chạy lúc startup/mỗi 24 giờ; không giả định giao dịch xuất hiện chính xác tại một giờ trong ngày.
- Recurring expense không có cùng kiểm tra số dư với expense thường; đối chiếu [nghiệp vụ](business_rules.md).

Truy vết: `FR-REC-01..04`.

## US-09 — Hiểu báo cáo và export

**Là người dùng, tôi muốn xem chỉ số tháng/năm và tải báo cáo.**

- Dashboard có tổng ví active và 5 giao dịch gần nhất theo service.
- Monthly/trend/year dùng đúng số dư, khoản thực tế/dự kiến và công thức của từng endpoint.
- Khoản đã soft delete được loại khỏi tổng hợp tương ứng; backdated mutation vô hiệu snapshot liên quan.
- Export Excel/PDF tháng cần auth và chỉ chứa dữ liệu của mình.
- Không diễn giải `totalIncome` trên monthly report như tổng giao dịch thu; xem định nghĩa trong [API](api.md).

Truy vết: `FR-REPORT-01..05`.

## US-10 — Đính kèm và quét hóa đơn

**Là người dùng, tôi muốn lưu chứng từ và điền nhanh giao dịch từ hóa đơn.**

- JPEG/PNG/WEBP/PDF tối đa 5 MiB qua MIME allowlist; lỗi type/size trả thông báo phù hợp.
- Download/delete chỉ áp dụng attachment/giao dịch của mình.
- OCR trả dự thảo amount/date/merchant/category/confidence; tôi xem và sửa trước khi lưu.
- Khi create/edit offline được queue, file hóa đơn không được lưu/replay; không hiển thị như attachment đã lưu thành công.

Truy vết: `FR-FILE-01..02`, `FR-AI-01`.

## US-11 — Đọc thông báo và nhận push

**Là người dùng, tôi muốn biết sự kiện ngân sách, mục tiêu và lịch định kỳ.**

- List/mark-read/mark-all/delete không tác động thông báo user khác.
- Native đăng ký/hủy token thiết bị và xử lý permission từ OS.
- Push failure không rollback thao tác tài chính đã commit.
- Delivery và deep link phải kiểm tra trên build/thiết bị theo [release runbook](mobile_release.md).

Truy vết: `FR-NOTIFY-01..02`, `FR-MOBILE-02`.

## US-12 — Ghi giao dịch khi mất mạng

**Là người dùng mobile, tôi muốn một số thao tác giao dịch tiếp tục được lưu để gửi lại sau.**

- Create/edit JSON từ trang thêm/sửa được queue khi mất mạng/lỗi phù hợp; transfer/delete và file không phải cùng phạm vi outbox.
- POST replay giữ key; PUT edit chưa có idempotency middleware ở backend và phụ thuộc version.
- Reconnect xử lý batch/backoff có giới hạn; không có timer retry độc lập bảo đảm gửi đúng thời điểm.
- Delta ghi vào SQLite kèm cursor/tombstone, nhưng màn hình chưa dùng đầy đủ cache này; QA không coi đó là offline UI hoàn chỉnh.
- Conflict/queued state phải được phân biệt với đã lưu server; đăng xuất/chuyển user cần giữ cách ly dữ liệu.

Truy vết: `FR-TX-05..06`, `FR-MOBILE-01`; [kiến trúc](architecture.md).

## US-13 — Hỏi trợ lý tài chính

**Là người dùng, tôi muốn hỏi về số liệu của mình bằng ngôn ngữ tự nhiên.**

- Copilot server lấy số liệu qua 6 tool read-only có principal user, gồm tìm giao dịch có giới hạn; không dùng userId do model truyền.
- Câu trả lời nêu kỳ và hạn chế; lỗi provider không lộ secret.
- Khi Copilot bị tắt, chat fallback vẫn có luồng riêng; không hứa kết quả hay tool giống nhau.
- Mobile REST chat được kiểm tra riêng, không coi web Copilot tests bao phủ mobile chat.

Truy vết: `FR-AI-01`, `FR-COPILOT-01,04`.

## US-14 — Thao tác bằng Copilot web

**Là người dùng, tôi muốn điều hướng, đổi theme và chuẩn bị dữ liệu từ cuộc hội thoại.**

- Đổi light/dark và mở route theo allowlist; không mở URL tùy ý qua tool.
- Xem bản nháp và xác nhận trước khi tạo expense/income/transfer/category/wallet/budget/goal/recurring.
- Hủy không gọi mutation API; chỉ hiển thị thành công khi response xác nhận.
- Tìm giao dịch, xem thông tin hiện tại/thay đổi đề xuất và xác nhận trước khi sửa hoặc xóa giao dịch thu/chi; nếu có nhiều kết quả phù hợp thì hỏi người dùng chọn.
- Giữ hội thoại, nội dung đang nhập và thẻ xác nhận khi đóng/mở khung chat trong cùng phiên đăng nhập.

**Khoảng trống hiện tại:** tool `transferFunds` chờ `data === true` nhưng API trả object `WalletTransfer`, nên có thể báo lỗi sau khi server đã chuyển tiền và chưa invalidate cache. Điều kiện hiển thị thành công chưa đạt cho tool này; kiểm tra server trước khi tạo lại thao tác.

Truy vết: `FR-COPILOT-02..03`; [Copilot provider](../frontend/src/contexts/MoneyMateCopilotProvider.tsx).

## US-15 — Quản lý người dùng

**Là admin, tôi muốn xem và quản lý tài khoản trong khu vực được bảo vệ.**

- Chỉ access token hợp lệ và role `ADMIN` vào được API admin.
- Có list/detail/update/delete theo validator và quy tắc admin service.
- Người dùng thường nhận lỗi phân quyền, không có dữ liệu admin.
- Test trực tiếp API để kiểm chứng, không chỉ dựa vào việc UI ẩn route.

Truy vết: `FR-ADMIN-01..02`; [admin service](../backend/src/services/admin.service.ts).

## Áp dụng khi nghiệm thu

Mỗi thay đổi chọn story/requirement bị ảnh hưởng và kiểm tra đường thành công, validation, ownership, lỗi và replay/conflict khi phù hợp. Phạm vi kiểm thử hiện có và các bước thủ công nằm trong [testing.md](testing.md).
