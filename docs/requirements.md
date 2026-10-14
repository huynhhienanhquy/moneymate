# Yêu cầu chức năng và phi chức năng

> Đối chiếu mã nguồn ngày 13/10/2026. Giữ các ID yêu cầu của bộ docs cũ để truy vết. [Mục lục](README.md).

**Có:** đã có implementation; không đồng nghĩa kiểm thử toàn bộ đã chạy trong đợt viết docs. **Một phần:** có code nhưng còn giới hạn nêu trong bảng. **Vận hành/mục tiêu:** cần cấu hình, quy trình hoặc kiểm chứng ngoài mã nguồn. Các yêu cầu mô tả phạm vi hiện tại, không cam kết SLA hay chức năng tương lai chưa thực hiện.

## 1. Tài khoản và phiên

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-AUTH-01 | Đăng ký bằng họ tên, email duy nhất và mật khẩu tối thiểu 8 ký tự | Có |
| FR-AUTH-02 | Đăng nhập trên web, iOS và Android | Có; native cần kiểm tra thiết bị |
| FR-AUTH-03 | Access token ngắn hạn và refresh phiên luân chuyển theo platform | Có; access JWT 15 phút, refresh opaque 7 ngày |
| FR-AUTH-04 | Xem phiên còn hoạt động, thu hồi một hoặc tất cả phiên | Có |
| FR-AUTH-05 | Xem/sửa hồ sơ và đổi mật khẩu sau khi xác nhận mật khẩu cũ | Có; đổi mật khẩu thu hồi refresh sessions |
| FR-AUTH-06 | Xóa tài khoản cần xác nhận mật khẩu và xóa dữ liệu quan hệ | Có; xóa file ngoài DB theo best effort |
| FR-AUTH-07 | Khu vực admin chỉ cho role `ADMIN` | Có |

Nguồn: [auth routes](../backend/src/routes/auth.routes.ts), [user routes](../backend/src/routes/user.routes.ts), [auth service](../backend/src/services/auth.service.ts), [auth sessions](auth_sessions.md).

## 2. Ví và danh mục

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-WALLET-01 | Tạo, xem, sửa và archive nhiều ví | Có; archive là soft delete |
| FR-WALLET-02 | Ví có loại tiền mặt, ngân hàng, thẻ tín dụng, ví điện tử, tiết kiệm và currency | Có ở API/schema; không có quy đổi tỷ giá |
| FR-WALLET-03 | Chuyển số tiền dương giữa hai ví khác nhau của mình, ví nguồn đủ số dư | Có; atomic |
| FR-CATEGORY-01 | Có danh mục hệ thống dùng chung | Có; seed không tạo tài khoản |
| FR-CATEGORY-02 | Quản lý danh mục thu/chi cá nhân với màu và icon | Có |
| FR-CATEGORY-03 | Kiểm tra quyền dùng và loại danh mục khi tham chiếu | Có |

Nguồn: [wallet service](../backend/src/services/wallet.service.ts), [category service](../backend/src/services/category.service.ts), [schema](../backend/prisma/schema.prisma).

## 3. Giao dịch và đồng bộ

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-TX-01 | Tạo, xem, sửa và soft delete khoản thu/chi | Có; expense không trừ ví theo nghiệp vụ hiện tại |
| FR-TX-02 | Tìm kiếm, lọc, sắp xếp và phân trang giao dịch | Có |
| FR-TX-03 | Ngày giao dịch thường không nằm trong tương lai | Có |
| FR-TX-04 | Phát hiện version cũ khi update/delete có cung cấp version | Có; không tuyên bố mọi client luôn gửi version |
| FR-TX-05 | Endpoint mutation được hỗ trợ nhận `Idempotency-Key` để hạn chế ghi trùng khi replay | Có; không áp dụng mặc định cho mọi POST |
| FR-TX-06 | API delta trả thay đổi và tombstone bằng cursor | Có ở API; mobile lưu vào SQLite, UI chưa đọc cache delta như nguồn đầy đủ |
| FR-TX-07 | Chuyển ví có endpoint riêng, không sửa/xóa bằng CRUD giao dịch thường | Có |

Chi tiết validator, cursor, replay và lỗi conflict nằm trong [API](api.md); quy tắc số dư nằm trong [business rules](business_rules.md).

## 4. Ngân sách và mục tiêu tiết kiệm

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-BUDGET-01 | Một ngân sách tổng hoặc theo danh mục cho mỗi tháng/năm/phạm vi | Có; constraint và kiểm tra service |
| FR-BUDGET-02 | Trả amount, spent, remaining, percentage và status | Có |
| FR-BUDGET-03 | Gửi thông báo warning khi đạt 80%, exceeded khi đạt 100%, deduplicate theo ngưỡng/kỳ | Có; không chặn expense hợp lệ khi vượt budget |
| FR-GOAL-01 | Quản lý mục tiêu có số tiền đích và ngày đích | Có |
| FR-GOAL-02 | Nạp từ ví hoặc rút về ví của mình trong transaction atomic | Có |
| FR-GOAL-03 | Tính progress và active/completed/expired từ số tiền/ngày hiện có | Có |
| FR-GOAL-04 | Không xóa mục tiêu có tiền hoặc có lịch sử nạp/rút | Có |

Nguồn: [budget service](../backend/src/services/budget.service.ts), [goal service](../backend/src/services/saving-goal.service.ts).

## 5. Giao dịch định kỳ

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-REC-01 | Tạo, sửa, tạm dừng/tiếp tục, xem và xóa lịch thu/chi | Có |
| FR-REC-02 | Hỗ trợ daily, weekly, monthly và yearly | Có |
| FR-REC-03 | Claim kỳ đến hạn để hạn chế sinh trùng khi processor chạy chồng | Có; không phải distributed scheduler ngoài app |
| FR-REC-04 | Catch up kỳ bỏ lỡ trong giới hạn và giữ liên kết schedule → giao dịch | Có; tối đa 100 occurrence mỗi schedule mỗi lần chạy |

Scheduler chạy khi server khởi động và mỗi 24 giờ. Xem [recurring service](../backend/src/services/recurring.service.ts), [server](../backend/src/server.ts) và [nghiệp vụ](business_rules.md).

## 6. Dashboard, báo cáo và export

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-REPORT-01 | Dashboard có tổng ví, chỉ số kỳ hiện tại và giao dịch gần đây | Có; `netWorth` là tổng ví active |
| FR-REPORT-02 | Báo cáo tháng có phân loại chi và số liệu tổng hợp | Có; cần đọc định nghĩa `totalIncome`/chi dự kiến |
| FR-REPORT-03 | Có monthly trend giới hạn kỳ và báo cáo năm | Có |
| FR-REPORT-04 | Export tháng dạng Excel/PDF cần xác thực | Có |
| FR-REPORT-05 | Vô hiệu snapshot kỳ đã đóng khi sửa dữ liệu quá khứ liên quan | Có; snapshot cache có thể được tính lại |

Các tên `monthlySavings`, `totalIncome`, `income` không đồng nghĩa một công thức kế toán duy nhất ở mọi endpoint. Nguồn: [transaction service](../backend/src/services/transaction.service.ts), [repository](../backend/src/repositories/transaction.repository.ts), [business rules](business_rules.md).

## 7. File, thông báo và native mobile

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-FILE-01 | Upload, list, download, delete attachment thuộc giao dịch của mình | Có |
| FR-FILE-02 | Chấp nhận JPEG/PNG/WEBP/PDF, tối đa 5 MiB | Có; MIME allowlist không phải antivirus |
| FR-NOTIFY-01 | Xem, đánh dấu đã đọc/tất cả đã đọc và xóa thông báo | Có |
| FR-NOTIFY-02 | Đăng ký/hủy đăng ký thiết bị push mobile | Có; delivery cần cấu hình và quyền native |
| FR-MOBILE-01 | Native SecureStore, outbox persistent và transaction delta sync | Một phần: outbox tạo/sửa JSON; không replay attachment; delta chưa liên kết đầy đủ UI |
| FR-MOBILE-02 | Camera/OCR, biometrics, bảo vệ màn hình, push và deep link trên build tương thích | Một phần: code tích hợp có; biometrics hiện là thao tác kiểm tra hồ sơ, cần QA thiết bị |

Nguồn: [mobile architecture](architecture.md), [mobile release](mobile_release.md), [upload middleware](../backend/src/middlewares/upload.ts).

## 8. AI và Copilot

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-AI-01 | Analysis, forecast, advisor, chat và OCR; có provider hoặc fallback tùy tác vụ | Có; không phải tất cả đều cần key, chất lượng OCR/AI cần người dùng kiểm tra |
| FR-COPILOT-01 | Server tools đọc tài chính và tìm giao dịch theo user đã xác thực | Có; 6 tool, tìm giao dịch có giới hạn/phân trang |
| FR-COPILOT-02 | Mọi thao tác ghi từ Copilot web có UI xác nhận trước khi gửi REST | Một phần: 10 tool có xác nhận, gồm sửa/xóa thu/chi; `transferFunds` kiểm tra sai kiểu response, có thể báo lỗi sau khi server đã commit |
| FR-COPILOT-03 | Đổi theme light/dark và điều hướng theo allowlist nội bộ | Có; 2 tool giao diện |
| FR-COPILOT-04 | Chat dự phòng khi CopilotKit bị tắt | Có; fallback không có cùng bộ tool mutation |
| FR-COPILOT-05 | Giữ hội thoại khi đóng/mở khung Copilot | Có trong phiên đăng nhập; chưa lưu qua refresh/đăng xuất |

Nguồn: [financial-tools](../backend/src/copilotkit/financial-tools.ts), [Copilot provider web](../frontend/src/contexts/MoneyMateCopilotProvider.tsx), [API](api.md). Mobile dùng REST chat, không dùng runtime/tool web.

## 9. Quản trị

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-ADMIN-01 | Admin list/detail/update/delete user | Có |
| FR-ADMIN-02 | Auth và role middleware bảo vệ độc lập API admin | Có; không chỉ dựa vào route UI |

Nguồn: [admin routes](../backend/src/routes/admin.routes.ts), [admin middleware](../backend/src/middlewares/admin.ts).

## 10. Yêu cầu phi chức năng

| ID | Yêu cầu | Đối chiếu hiện tại |
| --- | --- | --- |
| NFR-SEC-01 | Production dùng HTTPS và origin rõ ràng | Vận hành: Compose chưa có TLS; cấu hình CORS/Copilot có kiểm tra |
| NFR-SEC-02 | bcrypt mật khẩu, refresh token chỉ lưu hash ở DB | Có |
| NFR-SEC-03 | Bảo vệ private resource bằng auth, role và ownership | Có middleware/service; cần giữ tests cross-user |
| NFR-SEC-04 | Validate và giới hạn input/upload/message/pagination/Copilot | Có ở các validator/middleware; review khi thêm endpoint |
| NFR-SEC-05 | Secret ở server, không vào bundle/log/model context | Quy tắc phát triển/vận hành; không có chứng minh DLP toàn hệ thống |
| NFR-SEC-06 | Hai JWT secret production khác nhau, không mẫu, ít nhất 32 ký tự | Có runtime validator; refresh hiện opaque, không ký bằng refresh secret |
| NFR-DATA-01 | Write tài chính nhiều bản ghi atomic | Có Prisma transaction và cập nhật điều kiện |
| NFR-DATA-02 | Retry mutation giữ idempotency key | Có ở endpoint hỗ trợ và outbox; không bảo đảm exactly-once mọi write |
| NFR-DATA-03 | Không ghi đè edit stale khi có version | Có conflict detection; client cần truyền version |
| NFR-DATA-04 | Tombstone giữ dấu soft delete cho đồng bộ | Có với transaction |
| NFR-DATA-05 | Backup/restore/staging và kế hoạch migration | Yêu cầu vận hành; CI chưa kiểm thử restore production |
| NFR-PERF-01 | Giới hạn page size và số vòng sync | Có với transaction/sync; xem giới hạn mỗi endpoint |
| NFR-PERF-02 | Index cho truy vấn user/date, lịch, phiên, sync và idempotency | Có schema/index; cần đo query plan thực tế |
| NFR-PERF-03 | Lazy load page web | Có |
| NFR-PERF-04 | Đo hiệu năng trong môi trường mục tiêu | Mục tiêu; chưa có load test/SLA trong repo |
| NFR-UX-01 | Theme light/dark và layout thích nghi | Có code; cần QA màn hình/thiết bị |
| NFR-UX-02 | Keyboard, focus, label, reduced motion và chart summary phù hợp WCAG AA | Mục tiêu chất lượng; không tuyên bố chứng nhận |
| NFR-UX-03 | Có trạng thái loading/empty/error/offline/conflict rõ ràng | Một phần; UI offline/sync có giới hạn đã nêu |
| NFR-UX-04 | Định dạng tiền/ngày thống nhất với locale Việt Nam | Có helpers; biên timezone cần test |
| NFR-MAINT-01 | Strict TypeScript và backend phân lớp | Có cấu hình/cấu trúc |
| NFR-MAINT-02 | Dùng shared contracts/token khi cần liên nền tảng | Có một phần; contracts hiện chưa bao phủ tài chính |
| NFR-MAINT-03 | Đổi hành vi có tests phù hợp và docs | Quy trình đóng góp; xem conventions/testing |
| NFR-OPS-01 | Request ID trong phản hồi/log lỗi, tránh log dữ liệu nhạy cảm | Có middleware/error logger; không phải tracing toàn hệ thống |
| NFR-OPS-02 | Đóng HTTP server và disconnect Prisma khi nhận signal | Có; chưa có orchestrator shutdown policy riêng |

## 11. Ngoài phạm vi và truy vết

Chưa có email password reset, social login, đồng bộ ngân hàng hoặc FX conversion. Không xem khả năng export mobile là bằng chứng native QA hoặc release store; CI hiện là validation, không phải deploy tự động.

[User stories](user_stories.md) chuyển các nhóm yêu cầu thành kịch bản chấp nhận. [Testing](testing.md) nêu phạm vi kiểm thử thật, [SRS](srs.md) mô tả giao diện/ràng buộc và [deployment](deployment.md) nêu trách nhiệm vận hành.
