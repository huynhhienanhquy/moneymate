# Changelog

> Tổng hợp ngày 13/10/2026 từ Git của repository. [Mục lục](README.md).

## Quy ước

Các workspace hiện khai báo `1.0.0`, nhưng repository không có Git tag release tại thời điểm đối chiếu. Vì vậy các mốc bên dưới là **thay đổi trong lịch sử Git**, không phải tuyên bố đã phát hành lên production hoặc store. Hash commit là căn cứ tra cứu bằng `git show <hash>`.

## Chưa phát hành — 13/10/2026

- Viết lại README gốc và hướng dẫn backend/web/mobile bằng tiếng Việt.
- Tổ chức bộ tài liệu theo 15 chủ đề: tổng quan, yêu cầu, stack, kiến trúc, cấu trúc, môi trường, database, API, auth, nghiệp vụ, conventions, testing, deployment, troubleshooting và changelog.
- Đồng bộ mô tả với mã nguồn trong workspace: thao tác Copilot mở rộng, quy tắc số dư/báo cáo, phạm vi offline mobile, môi trường test và giới hạn CI/Compose.
- Bổ sung truy vết nguồn code, ví dụ request, sơ đồ và hướng dẫn vận hành; giữ ID yêu cầu/user story.

Đợt cập nhật docs này không đổi version ứng dụng, không tạo release và không xác nhận rằng các thay đổi code đang có trong workspace đã được kiểm thử hay triển khai.

## 03/10/2026 — `ec1eb12`

**Commit:** `feat: refresh mobile UI and expand Copilot actions`.

- Làm mới UI mobile ở navigation, auth, các trang tài chính, chatbot và phần storage/provider.
- Thêm Copilot tool và giao diện xác nhận cho tạo danh mục/ví/ngân sách/mục tiêu/lịch định kỳ, ghi thu và chuyển tiền.
- Cập nhật xử lý giao dịch/báo cáo và tests liên quan.

## 28/09/2026 — `9625418`

**Commit:** `feat: refresh finance UI and fix auth session switching`.

- Điều chỉnh UI tài chính web, theme và component dùng chung.
- Sửa luồng chuyển phiên đăng nhập và cache/API client; cập nhật auth tests.

## 24/09/2026 — `226afe2`

**Commit:** `feat: update financial workflows and documentation`.

- Cập nhật luồng tài chính và tài liệu kiến trúc, yêu cầu, nghiệp vụ, database, auth và hướng dẫn workspace.
- Thêm migration soft delete ví và cập nhật service/repository/test liên quan.
- Bổ sung tool đổi theme/điều hướng Copilot web.

Ngày này còn có `33a042c` (`feat: improve financial workflows and app guidance`) và `f23d8c6` (revert commit đó). Khi đối chiếu tính năng, dùng trạng thái sau `226afe2`, không cộng dồn thay đổi đã bị revert.

## Các mốc trước đó

| Ngày | Commit | Nội dung từ lịch sử Git |
| --- | --- | --- |
| 22/09/2026 | `99bc949` | Tách thao tác thêm khỏi top bar mobile |
| 21/09/2026 | `38e1b72` | Cập nhật UI và trải nghiệm offline mobile |
| 21/09/2026 | `f14f50f` | Validate số dư ví khi tạo giao dịch |
| 12/09/2026 | `2de5555` | Cải thiện chatbot, mobile và admin |
| 07/09/2026 | `2f94417` | Tập trung Tailwind theme và dùng React key ổn định |
| 06/09/2026 | `8af52b6` | Tích hợp CopilotKit và củng cố các nền tảng |
| 06/09/2026 | `5b457a5` | Điều chỉnh báo cáo và tiết kiệm tháng theo số dư tài sản |
| 27/08/2026 | `d62921a` | Khôi phục routing/kết nối API mobile |
| 27/08/2026 | `4e6f6f8` | Tổ chức lại pages frontend/mobile |

Bảng chỉ tóm tắt các mốc gần đây có trong log đã đọc, không thay thế toàn bộ lịch sử repository. Migration có lịch sử riêng ở [database design](erd.md).

## Cập nhật changelog khi làm thay đổi mới

Ghi mục chưa phát hành với kết quả người dùng nhìn thấy, thay đổi API/schema/config và kiểm tra đã thực hiện. Khi có release thực tế, thêm version, ngày phát hành, tag/commit và migration/runbook liên quan. Không đưa secret, dữ liệu cá nhân hoặc số liệu test chưa có bằng chứng vào changelog.
