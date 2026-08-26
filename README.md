# MoneyMate

MoneyMate là ứng dụng quản lý tài chính cá nhân, hỗ trợ theo dõi thu chi, quản lý ví và ngân sách, đặt mục tiêu tiết kiệm, tự động hóa giao dịch định kỳ, đọc hóa đơn và đưa ra gợi ý bằng AI.

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Web | React 19, Vite, TypeScript, Tailwind CSS |
| Mobile | React Native, Expo SDK 54, Expo Router, SQLite |
| State & data | Zustand, TanStack Query, Axios |
| API | Node.js, Express, TypeScript, Zod |
| Database | MySQL 8, Prisma ORM |
| AI & OCR | OpenAI API, Tesseract.js |
| Kiểm thử | Jest, ts-jest, Supertest |
| Triển khai | Docker, Docker Compose, Nginx |

## Chức năng chính

- Đăng ký, đăng nhập và phân quyền người dùng/quản trị viên bằng JWT.
- Quản lý ví, danh mục, giao dịch và chuyển tiền giữa các ví.
- Theo dõi ngân sách, mục tiêu tiết kiệm và giao dịch định kỳ.
- Dashboard, báo cáo tháng, biểu đồ xu hướng và xuất Excel/PDF.
- Thông báo trong ứng dụng và đính kèm chứng từ giao dịch.
- Phân tích chi tiêu, dự báo ngân sách, chat tư vấn và quét hóa đơn bằng AI/OCR.
- Tài liệu OpenAPI qua Swagger UI.

## Cấu trúc dự án

```text
moneymate/
├── backend/
│   ├── prisma/                 # schema, migrations và seed
│   ├── src/
│   │   ├── common/             # lỗi, response và tiện ích dùng chung
│   │   ├── config/             # Prisma, Swagger và cấu hình AI
│   │   ├── controllers/        # xử lý request/response
│   │   ├── middlewares/        # auth, validation, upload, error
│   │   ├── repositories/       # truy cập dữ liệu
│   │   ├── routes/             # khai báo API routes
│   │   ├── services/           # nghiệp vụ và các dịch vụ AI
│   │   ├── validators/         # Zod schemas
│   │   └── __tests__/          # unit và integration tests
│   ├── uploads/                # file runtime, không commit lên Git
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/                # App root và router
│   │   ├── features/           # màn hình nhóm theo nghiệp vụ
│   │   └── shared/             # API client, component và store dùng chung
│   ├── nginx.conf
│   └── Dockerfile
├── apps/
│   └── mobile/                 # iOS/Android app dùng Expo Router
├── packages/                   # Contracts, validation, domain, API core và design tokens
├── docs/                       # yêu cầu và tài liệu thiết kế
├── docker-compose.yml
└── package.json                # npm workspaces
```

Repo dùng npm workspaces. `package-lock.json` ở thư mục gốc phục vụ cài đặt local; lockfile trong từng ứng dụng được giữ riêng để Docker có thể build với từng context độc lập.

## Yêu cầu

- Node.js 20 trở lên (phiên bản khuyến nghị nằm trong `.nvmrc`).
- npm.
- MySQL 8 nếu chạy local, hoặc Docker và Docker Compose.

## Chạy nhanh bằng Docker

```bash
docker compose up --build
```

Sau khi các container khởi động:

- Web: <http://localhost>
- API: <http://localhost:5000/api>
- Swagger: <http://localhost:5000/api-docs>

Các giá trị mặc định trong `docker-compose.yml` chỉ phù hợp cho môi trường phát triển. Hãy cung cấp secret mạnh qua biến môi trường khi triển khai thật.

## Chạy local

### 1. Cài dependency

Tại thư mục gốc:

```bash
npm ci
```

### 2. Cấu hình môi trường

PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Bash:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Cập nhật `DATABASE_URL` và hai JWT secret trong `backend/.env`. `OPENAI_API_KEY` là tùy chọn; khi bỏ trống, các chức năng cần OpenAI sẽ không hoạt động.

### 3. Chuẩn bị database

Tạo database MySQL tên `moneymate`, sau đó chạy:

```bash
npm run prisma:generate --workspace=moneymate-backend
npm run prisma:migrate --workspace=moneymate-backend
npm run prisma:seed --workspace=moneymate-backend
```

### 4. Khởi động ứng dụng

Mở hai terminal tại thư mục gốc:

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

Frontend chạy tại <http://localhost:5173>, backend tại <http://localhost:5000>.

Mobile chạy bằng:

```bash
npm run dev:mobile
```

Sao chép `apps/mobile/.env.example` thành `apps/mobile/.env` và đặt `EXPO_PUBLIC_API_URL` thành địa chỉ backend mà thiết bị/emulator truy cập được. Android emulator thường dùng `http://10.0.2.2:5000/api`; thiết bị thật cần IP LAN hoặc HTTPS staging.

## Scripts

| Lệnh | Mục đích |
| --- | --- |
| `npm run dev:frontend` | Chạy Vite dev server |
| `npm run dev:backend` | Chạy API với Nodemon |
| `npm run dev:mobile` | Chạy Expo development server |
| `npm run build` | Build shared packages, backend, web và typecheck mobile |
| `npm run lint` | Lint web và mobile |
| `npm test` | Chạy test backend |
| `npm run test:watch --workspace=moneymate-backend` | Chạy test ở watch mode |
| `npm run test:coverage --workspace=moneymate-backend` | Tạo báo cáo coverage |

## Biến môi trường

### Backend

| Biến | Bắt buộc | Mô tả |
| --- | --- | --- |
| `PORT` | Không | Cổng API, mặc định `5000` |
| `DATABASE_URL` | Có | Chuỗi kết nối MySQL cho Prisma |
| `JWT_ACCESS_SECRET` | Có | Secret ký access token |
| `JWT_REFRESH_SECRET` | Có | Secret ký refresh token |
| `FRONTEND_URL` | Có | Origin frontend được phép qua CORS |
| `NODE_ENV` | Không | `development`, `test` hoặc `production` |
| `OPENAI_API_KEY` | Không | Bật các chức năng dùng OpenAI |
| `AI_MODEL` | Không | Model OpenAI, mặc định `gpt-4o-mini` |
| `AI_MAX_TOKENS` | Không | Giới hạn token phản hồi, mặc định `1500` |
| `STORAGE_DRIVER` | Không | `local` (mặc định) hoặc `s3` |
| `S3_BUCKET`, `S3_REGION`, `S3_PUBLIC_URL` | Khi dùng S3 | Bucket, region và public base URL cho file đính kèm |
| `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE` | Không | Hỗ trợ dịch vụ S3-compatible |

### Frontend

| Biến | Bắt buộc | Mô tả |
| --- | --- | --- |
| `VITE_API_URL` | Có | Base URL của API, mặc định local là `http://localhost:5000/api` |

## Kiểm thử và build

```bash
npm test
npm run build
```

Integration test cần một MySQL test database tương ứng với cấu hình trong `backend/.env.test`.

## Tài liệu

Các tài liệu chi tiết nằm trong [`docs`](./docs): kiến trúc, yêu cầu, quy tắc nghiệp vụ, ERD, sơ đồ và user stories.

## API

Khi backend đang chạy, Swagger UI tại <http://localhost:5000/api-docs> là nguồn đầy đủ và cập nhật nhất cho endpoint, request và response schema.


admin@gmail.com	password	12345678
a@gmail.com	password	12345678
