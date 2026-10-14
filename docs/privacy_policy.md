# Bản nháp mô tả quyền riêng tư và xử lý dữ liệu

> Bản nháp kỹ thuật đối chiếu ngày 13/10/2026. **Chưa phải chính sách đã công bố**. Đơn vị vận hành cần điền thông tin và xác nhận thực tế triển khai trước khi sử dụng. [Mục lục](README.md).

## 1. Thông tin đơn vị vận hành

| Nội dung | Giá trị cần hoàn thiện |
| --- | --- |
| Tên đơn vị chịu trách nhiệm | [CẦN ĐIỀN] |
| Địa chỉ và kênh liên hệ quyền riêng tư | [CẦN ĐIỀN] |
| Ngày hiệu lực và version chính sách | [CẦN ĐIỀN] |
| Môi trường/quốc gia phục vụ và nơi xử lý dữ liệu | [CẦN ĐIỀN] |
| Nhà cung cấp thực tế và thời hạn lưu | [CẦN ĐIỀN] |
| Cách tiếp nhận yêu cầu truy cập/xóa/xuất dữ liệu | [CẦN ĐIỀN] |

Tài liệu chỉ mô tả code và điểm cần hoàn thiện; không khẳng định nghĩa vụ pháp lý, cơ sở xử lý hoặc chính sách thương mại của đơn vị chưa được xác định.

## 2. Dữ liệu hệ thống xử lý

| Nhóm | Dữ liệu trong implementation |
| --- | --- |
| Tài khoản | Email, họ tên, password hash, avatar URL, role và timestamps |
| Tài chính | Ví, danh mục, giao dịch, note, budget, goal/history, lịch định kỳ, snapshot và báo cáo |
| Phiên | Hash refresh token, family/session/device metadata, platform, appVersion, timezone và thời gian phiên |
| Thiết bị/push | Device ID, platform, Expo push token và trạng thái đăng ký |
| File/hóa đơn | Attachment metadata, nội dung file trong storage, file OCR tạm và trường trích xuất |
| AI | Prompt, lịch sử/đầu vào chat theo request, ngữ cảnh UI và số liệu tài chính cần cho tác vụ |
| Kỹ thuật | Request ID, lỗi vận hành và thông tin kết nối dùng rate limit/log |

Database không lưu password gốc hoặc refresh token gốc. Native lưu refresh credential qua SecureStore; bản Expo web có adapter storage khác và không có cùng bảo đảm bảo mật OS. Auth và storage chi tiết ở [auth sessions](auth_sessions.md), [architecture](architecture.md), [ERD](erd.md).

## 3. Mục đích sử dụng trong ứng dụng

Dữ liệu phục vụ tài khoản/phiên, cách ly user, đồng bộ, quản lý tài chính, báo cáo/export, thông báo, attachment, OCR và AI khi được cấu hình. Metadata phục vụ chống token replay, ghi trùng, conflict và chẩn đoán lỗi.

Ngữ cảnh UI gửi vào Copilot gồm route/screen/theme/locale/ngày/timezone. User ID dùng kiểm soát quyền lấy từ token trên server, không lấy từ ngữ cảnh model. Các tool server Copilot trả số liệu tổng hợp; không có nghĩa mọi tác vụ AI REST chỉ nhận aggregate giống hệt.

## 4. Nhà cung cấp và nơi lưu dữ liệu

- Database/hosting phụ thuộc môi trường triển khai.
- Attachment dùng local storage hoặc S3-compatible theo cấu hình.
- Khi OpenAI được bật, nội dung cần cho chat/analysis hoặc ảnh receipt có thể được gửi đến provider.
- Tesseract và trích xuất PDF có thể xử lý trên backend; OCR dùng file tạm và có cleanup trong `finally`.
- Push backend gửi payload/token đến Expo; phát hành native còn liên quan Apple/Google.
- Copilot thread/runner có state RAM trong process; chưa có lưu lịch sử Rich Threads bền vững được cấu hình.

Không gọi danh sách dependency là danh sách nhà xử lý dữ liệu cuối cùng. Bản công bố phải xác định provider thực sự dùng, loại dữ liệu gửi, vị trí lưu, thời hạn và cấu hình hợp đồng tương ứng.

## 5. Lưu giữ và xóa

Các thời hạn kỹ thuật hiện có như access token 15 phút, refresh 7 ngày, idempotency 24 giờ không phải chính sách lưu giữ toàn bộ dữ liệu. Đơn vị vận hành cần xác định thời hạn riêng cho account, log, attachment, backup, token đã revoke và dữ liệu provider.

Tự xóa tài khoản yêu cầu password; service lấy URL attachment, xóa user/dữ liệu quan hệ rồi gọi xóa file bằng best effort. Nếu file cleanup thất bại, lỗi được log và cần đối soát; không hứa mọi byte ở storage/backup/provider bị xóa ngay. Admin deletion cần đối chiếu luồng riêng trong [business rules](business_rules.md).

Soft delete transaction/wallet giữ dấu/lịch sử phục vụ báo cáo và sync, không đồng nghĩa hard delete dữ liệu. Backup và log nằm ngoài database cascade.

## 6. Cơ chế bảo vệ hiện có

Implementation có bcrypt, JWT access, hash/rotation refresh, ownership/role checks, validation, upload limits, auth/Copilot rate limits và request IDs. Native có secure credential storage và screen protection integration.

HTTPS, durable storage, backup, quyền truy cập database, secret rotation và giám sát phải do triển khai cấu hình. Compose hiện chưa có TLS termination hay volume upload local. MIME allowlist không kiểm tra virus; biometric hiện chưa tự động khóa ứng dụng. Xem [deployment](deployment.md) và [mobile release](mobile_release.md).

## 7. Thao tác của người dùng

Người dùng có thể sửa hồ sơ, đổi mật khẩu, quản lý/revoke phiên, quản lý dữ liệu qua UI/API được hỗ trợ, tải báo cáo Excel/PDF và xóa tài khoản bằng password confirmation. Export báo cáo không phải export toàn bộ dữ liệu cá nhân.

AI/Copilot được bật/tắt theo cấu hình triển khai; không mô tả như một consent toggle riêng cho từng user nếu UI chưa có. Người dùng có thể quản lý permission camera/notification trong OS. Bản công bố cần nêu kênh và quy trình thực tế để thực hiện quyền liên quan.

## 8. Nội dung cần hoàn thiện trước công bố

Đơn vị vận hành điền thông tin liên hệ, provider, retention, quốc gia áp dụng, yêu cầu độ tuổi, quy trình yêu cầu dữ liệu và cách thông báo thay đổi. Chỉ công bố các cam kết đã được xác nhận với sản phẩm/hạ tầng/quy trình thực tế.

Việc viết lại tài liệu không thay đổi cơ chế thu thập dữ liệu hoặc tự xác nhận chính sách đã được phê duyệt.
