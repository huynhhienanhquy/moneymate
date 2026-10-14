# MoneyMate

MoneyMate là ứng dụng quản lý tài chính cá nhân, gồm web React, mobile Expo và API Express dùng chung MySQL. Người dùng quản lý ví, khoản thu/chi, ngân sách, mục tiêu tiết kiệm, giao dịch định kỳ, báo cáo, hóa đơn và trợ lý AI.

> Tài liệu đối chiếu với mã nguồn trong workspace ngày **13/10/2026**. Bắt đầu từ [mục lục tài liệu](docs/README.md), gồm đủ 15 chủ đề từ tổng quan đến changelog.

## Chức năng chính

- Đăng ký, đăng nhập, refresh token luân chuyển, quản lý phiên và phân quyền `USER`/`ADMIN`.
- Quản lý nhiều ví, danh mục hệ thống/cá nhân, giao dịch thu/chi và chuyển tiền giữa ví.
- Theo dõi ngân sách theo tháng, nạp/rút mục tiêu tiết kiệm và tạo giao dịch theo lịch.
- Dashboard, báo cáo tháng/năm, xu hướng và xuất Excel/PDF.
- Đính kèm hóa đơn, OCR, thông báo trong ứng dụng và đăng ký thiết bị nhận push.
- Web Copilot đọc số liệu tổng hợp, điều khiển giao diện và chuẩn bị các thao tác tạo dữ liệu để người dùng xác nhận.
- Mobile có lưu phiên bảo mật, cache và outbox cho một số thao tác giao dịch khi mất mạng.

Các luồng báo cáo sử dụng quy tắc tài chính riêng của project: `Wallet.initialBalance` được cập nhật khi thu tiền/chuyển ví/nạp-rút mục tiêu; khoản `EXPENSE` thông thường kiểm tra đủ số dư nhưng không trừ số dư ví. Xem [quy tắc nghiệp vụ](docs/business_rules.md) trước khi diễn giải các trường `income`, `savings` và `netWorth`.

## Cấu trúc repository

```text
moneymate/
├── backend/          # API, Prisma, scheduler, AI và Copilot runtime
├── frontend/         # Web React/Vite
├── apps/mobile/      # Expo Router, iOS/Android
├── packages/         # Contracts, validation, domain, API helper, design tokens
├── docs/             # Tài liệu kỹ thuật, yêu cầu và vận hành
├── .github/workflows/ci.yml
├── docker-compose.yml
└── package.json      # npm workspaces và lệnh tổng hợp
```

Chi tiết: [cấu trúc project](docs/project-structure.md), [tech stack](docs/tech-stack.md), [kiến trúc](docs/architecture.md).

## Chạy local

Yêu cầu Node.js `>=22.13` (`.nvmrc`: `22.14.0`), npm và MySQL 8. Chạy lệnh từ thư mục gốc repository.

```bash
npm ci
npm run build:packages
```

Tạo các file cấu hình bằng PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
Copy-Item apps/mobile/.env.example apps/mobile/.env
```

Hoặc Bash:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Điền `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` trong `backend/.env`; tạo database `moneymate`, rồi chạy:

```bash
npm run prisma:generate --workspace=moneymate-backend
npm run prisma:migrate --workspace=moneymate-backend
npm run prisma:seed --workspace=moneymate-backend
```

Seed tạo danh mục hệ thống, không tạo tài khoản admin hay tài khoản mẫu. Mở các terminal riêng và chạy mỗi lệnh trong một terminal:

```bash
npm run dev:backend
npm run dev:frontend
npm run dev:mobile
```

| Dịch vụ | Địa chỉ local |
| --- | --- |
| Web | [localhost:5173](http://localhost:5173) |
| API | [localhost:5000/api](http://localhost:5000/api) |
| Health | [localhost:5000/health](http://localhost:5000/health) |
| Swagger | [localhost:5000/api-docs](http://localhost:5000/api-docs) |

Web proxy `/api` đến port 5000. Mobile chạy trên điện thoại cần URL API là IP LAN của máy backend, thay vì `localhost`. Xem [cài đặt môi trường](docs/environment-setup.md) để cấu hình CORS, biến môi trường và Expo.

## Chạy bằng Docker Compose

```powershell
Copy-Item .env.example .env
```

Điền các secret và mật khẩu trong `.env`, rồi chạy:

```bash
docker compose up --build
```

Web mở ở [localhost](http://localhost), API ở port 5000. Backend tự chạy `prisma migrate deploy` lúc khởi động. MySQL trong Compose không publish port ra host; backend chạy ngoài Docker cần database truy cập được riêng. Cấu hình Compose hiện không gắn volume cho file upload local. Xem [triển khai](docs/deployment.md) trước khi dùng môi trường có dữ liệu cần giữ lâu dài.

## Lệnh thường dùng

| Lệnh tại root | Phạm vi |
| --- | --- |
| `npm run build:packages` | Build 5 package dùng chung |
| `npm run build` | Packages → backend → web → kiểm tra kiểu và export bundle Android |
| `npm run lint` | Web và mobile |
| `npm test` | Backend unit và frontend Vitest |
| `npm run test:integration` | Backend integration; cần database test để chạy nhóm auth |

Export mobile chưa tạo APK/AAB/IPA. Integration tests phải dùng database test riêng; đọc [testing](docs/testing.md) và [quy trình phát hành mobile](docs/mobile_release.md) để biết phạm vi kiểm tra.

## AI và Copilot

AI có đường xử lý dự phòng khi chưa có `OPENAI_API_KEY`; OCR ảnh có thể dùng Tesseract, PDF có thể trích xuất văn bản. Web CopilotKit tắt mặc định. Để bật, đặt `OPENAI_API_KEY` và `COPILOTKIT_ENABLED=true` ở backend, `VITE_COPILOTKIT_ENABLED=true` ở frontend, rồi khởi động lại cả hai.

Runtime Copilot nằm tại `/api/copilotkit`. Server có 6 tool đọc theo người dùng, gồm tìm giao dịch; web có 10 tool ghi dữ liệu với xác nhận, gồm sửa/xóa giao dịch thu/chi, và 2 tool đổi theme/điều hướng. Đóng/mở khung chat giữ hội thoại trong phiên đăng nhập hiện tại. Danh sách và giới hạn nằm trong [API](docs/api.md) và [kiến trúc](docs/architecture.md). Mobile dùng chatbot `/api/ai/chat`, không dùng bộ tool Copilot web.

Tool chuyển tiền Copilot hiện kiểm tra sai kiểu response, có thể báo lỗi dù server đã chuyển tiền. Kiểm tra lại dữ liệu trước khi gửi thao tác lần nữa; xem giới hạn trong [kiến trúc](docs/architecture.md).

## Đọc tiếp

- [Bộ tài liệu đầy đủ: 15 chủ đề](docs/README.md).
- Hướng dẫn từng ứng dụng: [backend](backend/README.md), [web](frontend/README.md), [mobile](apps/mobile/README.md).
- [Yêu cầu](docs/requirements.md), [database/ERD](docs/erd.md), [xác thực](docs/auth_sessions.md), [troubleshooting](docs/troubleshooting.md).
- [Lịch sử thay đổi](docs/changelog.md).
