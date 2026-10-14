# Tài liệu MoneyMate

> Đối chiếu với mã nguồn trong workspace ngày **13/10/2026**. Nội dung mô tả hành vi hiện có; yêu cầu vận hành và tính năng chưa hoàn thiện được ghi riêng. Ngày đối chiếu không đồng nghĩa với một bản phát hành đã triển khai.

## 15 chủ đề chính

| STT | Chủ đề | Tài liệu | Nội dung |
| --- | --- | --- | --- |
| 1 | Project Overview | [overview.md](overview.md) | Mục tiêu, phạm vi, người dùng, chức năng và giới hạn |
| 2 | Requirements | [requirements.md](requirements.md) | Yêu cầu chức năng, phi chức năng và trạng thái hỗ trợ |
| 3 | Tech Stack | [tech-stack.md](tech-stack.md) | Ngôn ngữ, framework, database, công cụ và hạ tầng |
| 4 | System Architecture | [architecture.md](architecture.md) | Thành phần, ranh giới trách nhiệm và luồng xử lý |
| 5 | Project Structure | [project-structure.md](project-structure.md) | Cấu trúc thư mục và trách nhiệm module |
| 6 | Environment Setup | [environment-setup.md](environment-setup.md) | Dependencies, `.env`, database và chạy local |
| 7 | Database Design | [erd.md](erd.md) | ERD, schema, quan hệ, constraint và migration |
| 8 | API Documentation | [api.md](api.md) | Endpoint, request/response, xác thực và lỗi |
| 9 | Authentication & Authorization | [auth_sessions.md](auth_sessions.md) | Login, access/refresh token, phiên và phân quyền |
| 10 | Business Logic | [business_rules.md](business_rules.md) | Quy tắc số dư, báo cáo và các luồng nghiệp vụ |
| 11 | Coding Conventions | [coding-conventions.md](coding-conventions.md) | Naming, style, ranh giới module và Git workflow |
| 12 | Testing | [testing.md](testing.md) | Unit, integration, kiểm thử giao diện và kiểm tra thiết bị |
| 13 | Deployment | [deployment.md](deployment.md) | Build, CI, Docker và triển khai production |
| 14 | Troubleshooting | [troubleshooting.md](troubleshooting.md) | Chẩn đoán lỗi và cách xử lý |
| 15 | Changelog | [changelog.md](changelog.md) | Lịch sử có căn cứ từ Git và thay đổi chưa phát hành |

## Tài liệu bổ trợ

| Tài liệu | Mục đích |
| --- | --- |
| [srs.md](srs.md) | Đặc tả phạm vi, giao diện và ràng buộc hệ thống |
| [user_stories.md](user_stories.md) | User story và điều kiện chấp nhận |
| [diagrams.md](diagrams.md) | Sơ đồ Mermaid cho các luồng chính |
| [mobile_release.md](mobile_release.md) | Runbook build, kiểm tra thiết bị, phát hành và rollback mobile |
| [privacy_policy.md](privacy_policy.md) | Bản nháp xử lý dữ liệu; cần thông tin đơn vị vận hành trước khi công bố |
| [mobile-ui-design.md](mobile-ui-design.md) | Tài liệu thiết kế UI mobile đang có trong workspace |
| [README gốc](../README.md) | Điểm vào và quick start |
| [Backend](../backend/README.md), [Web](../frontend/README.md), [Mobile](../apps/mobile/README.md) | Hướng dẫn từng workspace |
| [Theme web](../frontend/src/theme/README.md) | Token, màu sắc và biểu đồ |

## Lộ trình đọc

- **Lập trình viên mới:** overview → tech stack → environment setup → project structure → architecture → API → testing.
- **Làm tính năng tài chính:** requirements → business rules → ERD → API → user stories.
- **Vận hành/phát hành:** authentication → deployment → testing → mobile release → troubleshooting.

## Nguồn đối chiếu

| Loại thông tin | Nguồn |
| --- | --- |
| Database | [schema Prisma](../backend/prisma/schema.prisma) và [migrations](../backend/prisma/migrations) |
| HTTP thực tế | [app](../backend/src/app.ts), [routes](../backend/src/routes), [validators](../backend/src/validators), controllers/services/repositories |
| Xác thực, lỗi và giới hạn | [middlewares](../backend/src/middlewares), [tests backend](../backend/src/__tests__) |
| Payload dùng chung | [contracts](../packages/contracts/src/index.ts); phạm vi hiện chủ yếu là auth và response envelope |
| Giao diện, cache và offline | [frontend/src](../frontend/src), [mobile/src](../apps/mobile/src) và tests tương ứng |
| Lệnh và cấu hình | Các `package.json`, `.env.example`, Dockerfile, Compose và [CI](../.github/workflows/ci.yml) |
| OpenAPI | [swagger config](../backend/src/config/swagger.ts), giao diện `/api-docs`; hiện thiếu annotation endpoint, xem danh mục ở [api.md](api.md) |

Khi annotation Swagger hoặc docs khác với route/validator/service đang chạy, dùng implementation để xác định hành vi rồi cập nhật các nguồn mô tả. Không coi schema trong Swagger là bằng chứng endpoint đã được kiểm thử.

## Duy trì tài liệu

1. Cập nhật docs trong cùng thay đổi làm đổi API, nghiệp vụ, schema, cấu hình hoặc quy trình phát hành.
2. Giữ ID `FR-*`, `NFR-*`, `US-*` khi sửa diễn đạt để bảo toàn truy vết.
3. Phân biệt chức năng có mã nguồn, kiểm tra đã chạy, mục tiêu chất lượng và cấu hình bắt buộc khi vận hành.
4. Dùng dữ liệu giả trong ví dụ; không chép secret hay dữ liệu cá nhân từ `.env`, database hoặc log.
5. Kiểm tra liên kết tương đối, khối code và sơ đồ sau khi đổi tên/chuyển file.
6. Ghi thay đổi vào [changelog](changelog.md); chỉ gắn nhãn release khi đã có căn cứ phát hành.
