# Tổng quan project

> Đối chiếu mã nguồn ngày 13/10/2026. [Mục lục](README.md).

## Giới thiệu và mục tiêu

MoneyMate giúp người dùng ghi nhận thu/chi, tổ chức ví và danh mục, đặt ngân sách, theo dõi mục tiêu tiết kiệm và xem báo cáo tài chính cá nhân. Sản phẩm hướng đến giao diện tiếng Việt và định dạng tiền `vi-VN`/VND, có web và ứng dụng iOS/Android dùng chung một API.

Mục tiêu kỹ thuật là giữ quy tắc nghiệp vụ và quyền truy cập ở backend, đồng thời tái sử dụng kiểu dữ liệu và design token giữa các nền tảng. Đây là npm monorepo gồm ba ứng dụng và năm package; hiện chỉ một phần hợp đồng API được dùng chung.

## Người dùng và quyền

| Đối tượng | Phạm vi |
| --- | --- |
| Khách | Đăng ký, đăng nhập |
| `USER` | Quản lý dữ liệu tài chính, hồ sơ, phiên và thiết bị của chính mình |
| `ADMIN` | Quản lý tài khoản người dùng qua khu vực và API admin được bảo vệ |
| Người vận hành | Cấu hình dịch vụ, database, storage, backup và phát hành; không phải role riêng trong ứng dụng |

Đăng ký tạo tài khoản `USER`. Seed chỉ tạo danh mục hệ thống. Web chuyển người dùng `ADMIN` sang trang admin; quyền thực tế vẫn do middleware backend quyết định. Xem [xác thực và phân quyền](auth_sessions.md).

## Phạm vi chức năng

| Nhóm | Chức năng hiện có | Đọc chi tiết |
| --- | --- | --- |
| Tài khoản | Login/register, refresh luân chuyển, quản lý phiên, hồ sơ, đổi mật khẩu, xóa tài khoản | [Auth](auth_sessions.md) |
| Tài chính | Ví, danh mục, khoản thu/chi, chuyển ví, lọc/sắp xếp/phân trang giao dịch | [Nghiệp vụ](business_rules.md) |
| Lập kế hoạch | Ngân sách theo tháng, mục tiêu tiết kiệm, nạp/rút, lịch thu/chi định kỳ | [Requirements](requirements.md) |
| Báo cáo | Dashboard, tháng/năm, xu hướng, phân loại chi phí, snapshot, Excel/PDF | [API](api.md) |
| Hóa đơn | Upload/download attachment, OCR ảnh và trích xuất PDF để điền bản nháp | [API](api.md) |
| Thông báo | Thông báo nội bộ, đọc/xóa, đăng ký thiết bị Expo push | [Mobile](../apps/mobile/README.md) |
| AI | Phân tích, dự báo ngân sách, tư vấn và chat; có đường xử lý dự phòng tùy tác vụ | [Kiến trúc](architecture.md) |
| Copilot web | 6 tool đọc/tìm giao dịch, 10 tool ghi có xác nhận (gồm sửa/xóa thu chi), đổi theme, điều hướng và giữ hội thoại khi đóng/mở khung chat | [Kiến trúc](architecture.md) |
| Mobile offline | Cache query và outbox tạo/sửa giao dịch JSON; đồng bộ delta vào SQLite | [Kiến trúc](architecture.md) |

## Cách hệ thống tổ chức dữ liệu tài chính

Các tên trường phản ánh lịch sử của implementation, cần đọc theo quy tắc hiện tại:

- `Wallet.initialBalance` là số dư mutable, không chỉ là số tiền khi mở ví.
- Khoản `INCOME` tăng số dư ví. Khoản `EXPENSE` thông thường kiểm tra đủ số dư và ghi báo cáo, nhưng không trừ ví.
- Chuyển ví và nạp/rút mục tiêu thay đổi số dư trực tiếp trong database transaction.
- Dashboard dùng tổng số dư ví active làm `netWorth`; không cộng riêng tiền đang nằm trong mục tiêu.
- Các báo cáo có thể đưa số dư ví vào trường mang tên `totalIncome`/`income`; phần chi có cả khoản định kỳ dự kiến theo kỳ.

Ví dụ ví có 1.000.000 VND, ghi khoản chi 100.000 VND thì số dư ví vẫn 1.000.000 VND; nếu nạp 200.000 VND vào mục tiêu thì ví còn 800.000 VND. Đây là mô tả mã nguồn hiện tại, không phải đề xuất đổi nghiệp vụ. Công thức và các trường hợp update/delete nằm trong [business_rules.md](business_rules.md).

## Công nghệ và hạ tầng

Web sử dụng React/Vite/Tailwind, mobile sử dụng Expo/React Native/Expo Router. Backend sử dụng Express/TypeScript/Zod, Prisma và MySQL 8. Tích hợp tùy chọn gồm OpenAI, S3-compatible storage và Expo push. Docker Compose có MySQL, API và Nginx phục vụ web.

Phiên bản khai báo, công cụ kiểm thử và phạm vi từng package nằm trong [tech-stack.md](tech-stack.md). Hướng dẫn local nằm trong [environment-setup.md](environment-setup.md).

## Giới hạn và phần chưa có

- Chưa có reset mật khẩu qua email, đăng nhập social hoặc kết nối ngân hàng tự động trong mã nguồn hiện tại.
- Không có dịch vụ tỷ giá: trường currency của ví không tạo ra quy đổi tự động; các tổng hợp/định dạng chủ yếu dùng VND.
- Offline mobile chỉ hỗ trợ một số thao tác giao dịch; file hóa đơn không được lưu vào outbox và delta SQLite chưa được màn hình dùng như nguồn dữ liệu đầy đủ.
- Sinh trắc học có hàm kiểm tra và thao tác tại hồ sơ; chưa tự động khóa ứng dụng lúc khởi động.
- Copilot web không có tool chỉnh sửa/xóa dữ liệu tài chính. Thread ownership và lịch sử runner nằm trong RAM của tiến trình.
- Tool Copilot `transferFunds` hiện kiểm tra response là `true`, trong khi API trả object `WalletTransfer`; UI có thể báo lỗi sau khi server đã chuyển tiền và chưa cập nhật cache. Kiểm tra dữ liệu server trước khi lặp lại thao tác.
- Scheduler định kỳ chạy lúc khởi động và mỗi 24 giờ; chưa có worker/scheduler ngoài tiến trình.
- CI thực hiện kiểm tra/build/smoke test, chưa tự động publish hoặc deploy. Build mobile tại root là export bundle Android.
- Hiệu năng, accessibility và native features cần kiểm chứng ở môi trường triển khai/thiết bị; repo chưa đưa ra SLA hay chứng nhận tuân thủ.

Các giới hạn này được đưa vào [SRS](srs.md), [testing](testing.md) và [deployment](deployment.md) để người phát triển và vận hành cùng hiểu phạm vi.
