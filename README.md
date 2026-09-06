# MoneyMate

MoneyMate là ứng dụng quản lý tài chính cá nhân, hỗ trợ theo dõi thu chi, quản lý ví và ngân sách, đặt mục tiêu tiết kiệm, tự động hóa giao dịch định kỳ, đọc hóa đơn và đưa ra gợi ý bằng AI.

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Web | React 18.3, Vite 8, TypeScript, Tailwind CSS |
| Mobile | React 19.2, React Native 0.86, Expo SDK 57, Expo Router, SQLite |
| State & data | Zustand, TanStack Query, Axios |
| API | Node.js, Express, TypeScript, Zod |
| Database | MySQL 8, Prisma ORM |
| AI & OCR | OpenAI API, Tesseract.js |
| Kiểm thử | Jest, ts-jest, Supertest, Vitest 5 |
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
│   │   ├── components/         # UI component dùng chung
│   │   ├── config/route/       # router và route guard
│   │   ├── hooks/              # React hooks dùng lại
│   │   ├── layouts/            # page shell và navigation
│   │   ├── pages/              # màn hình theo route
│   │   ├── services/           # API client và tích hợp ngoài
│   │   ├── stores/             # client state dùng chung
│   │   └── utils/              # tiện ích dùng chung
│   ├── nginx.conf
│   └── Dockerfile
├── apps/
│   └── mobile/                 # iOS/Android app dùng Expo Router
├── packages/                   # Contracts, validation, domain, API core và design tokens
├── docs/                       # yêu cầu và tài liệu thiết kế
├── docker-compose.yml
└── package.json                # npm workspaces
```

Repo dùng npm workspaces. `package-lock.json` ở thư mục gốc là nguồn cài đặt cho local, CI và Docker; luôn chạy `npm ci` từ gốc repo. Các lockfile legacy trong từng ứng dụng không được dùng bởi quy trình này. Docker build context là gốc repo để bao gồm shared packages và dependency của từng workspace.

## Yêu cầu

- Node.js 22.13 trở lên (phiên bản khuyến nghị nằm trong `.nvmrc`).
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

CopilotKit Runtime, năm financial tool chỉ-đọc, công cụ giao diện `recordExpense` và popup frontend đã được cài đặt nhưng tắt mặc định. Để thử end-to-end trong môi trường phát triển, đặt `COPILOTKIT_ENABLED=true`, `VITE_COPILOTKIT_ENABLED=true` và cấu hình `OPENAI_API_KEY` có credit API, rồi khởi động lại backend/Vite (build lại frontend khi triển khai). Endpoint single-route là `POST /api/copilotkit` và yêu cầu access token qua `Authorization: Bearer <token>`. Runtime kiểm tra ownership của thread đang hoạt động, giới hạn lưu lượng/input/output/tool steps, timeout model và hủy run khi client ngắt kết nối. Khi flag frontend tắt, MoneyMate tự động dùng chatbot cũ.

Nhập “hôm nay ăn uống hết 12 đ” để mở biểu mẫu khoản chi: kiểm tra số tiền (12 đ là 12 VND; 12k là 12000 VND), chọn ví/danh mục, rồi bấm **Xác nhận lưu**. Công cụ chỉ gọi API giao dịch khi người dùng xác nhận; hủy không ghi dữ liệu. Yêu cầu lưu có `Idempotency-Key`, khóa nội dung khi kết quả mạng chưa rõ và cập nhật các trang tài chính sau khi lưu thành công. AI chưa có chức năng sửa/xóa giao dịch. Luồng xác nhận dùng [useHumanInTheLoop của CopilotKit v2](https://docs.copilotkit.ai/reference/v2/hooks/useHumanInTheLoop).

Kiểm tra model và schema thật bằng `npm run test:copilot-live --workspace=moneymate-backend`. Lệnh dùng câu mẫu, có gọi API tính phí nhưng không lưu giao dịch hay gửi dữ liệu tài chính thật. `401 invalid_api_key` nghĩa là key bị từ chối; `429 credit_balance_exhausted`/`insufficient_quota` nghĩa là tài khoản API không đủ credit. Handshake hoặc kiểm tra danh sách model thành công chưa xác nhận được khả năng chạy model.

Trong production, Copilot endpoint chỉ nhận HTTPS và browser origin nằm trong `FRONTEND_URL`; reverse proxy phải truyền đúng `X-Forwarded-Proto`. In-memory thread ownership có cùng vòng đời với process/runtime hiện tại và Rich Threads chưa được bật.

### 3. Chuẩn bị database

Tạo database MySQL tên `moneymate`, sau đó chạy:

```bash
npm run prisma:generate --workspace=moneymate-backend
npm run prisma:migrate --workspace=moneymate-backend
npm run prisma:seed --workspace=moneymate-backend
```

Lệnh seed chỉ tạo các danh mục hệ thống. Lệnh này không tạo tài khoản admin hoặc demo với thông tin đăng nhập mặc định. Người dùng đăng ký qua ứng dụng; tài khoản admin phải được bootstrap bằng quy trình vận hành riêng với credential nằm ngoài source code.

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
| `npm run build` | Build shared packages, backend, web; typecheck và Expo Android export cho mobile |
| `npm run lint` | Lint web và mobile |
| `npm test` | Chạy backend unit tests và frontend tests |
| `npm run test:integration` | Chạy integration tests; CI bắt buộc MySQL, local có thể chỉ chạy suite độc lập DB nếu thiếu MySQL |
| `npm run test:dev-startup --workspace=moneymate-backend` | Khởi động backend bằng ts-node, kiểm tra `/health`, rồi dừng process |
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
| `COPILOTKIT_ENABLED` | Không | Bật CopilotKit Runtime; mặc định `false` |
| `COPILOT_MODEL` | Khi bật CopilotKit | Model có prefix `openai/`, mặc định `openai/gpt-4o-mini` |
| `COPILOT_MAX_STEPS` | Không | Số bước agent tối đa, từ `1` đến `8`; mặc định `3` |
| `COPILOT_MAX_OUTPUT_TOKENS` | Không | Token output tối đa, từ `256` đến `4096`; mặc định `1500` |
| `COPILOT_MAX_MESSAGE_CHARS` | Không | Số ký tự tối đa cho mỗi user message, từ `256` đến `20000`; mặc định `4000` |
| `COPILOT_MODEL_TIMEOUT_MS` | Không | Timeout mỗi model run, từ `5000` đến `120000` ms; mặc định `45000` |
| `COPILOT_RATE_LIMIT_MAX_REQUESTS` | Không | Số request Copilot tối đa trong mỗi cửa sổ, từ `5` đến `600`; mặc định `60` |
| `COPILOT_RATE_LIMIT_WINDOW_MS` | Không | Độ dài cửa sổ rate limit, từ `10000` đến `3600000` ms; mặc định `60000` |
| `COPILOTKIT_TELEMETRY_DISABLED` | Không | Tắt anonymous SDK telemetry; MoneyMate mặc định `true` |
| `STORAGE_DRIVER` | Không | `local` (mặc định) hoặc `s3` |
| `S3_BUCKET`, `S3_REGION`, `S3_PUBLIC_URL` | Khi dùng S3 | Bucket, region và public base URL cho file đính kèm |
| `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE` | Không | Hỗ trợ dịch vụ S3-compatible |

### Frontend

| Biến | Bắt buộc | Mô tả |
| --- | --- | --- |
| `VITE_API_URL` | Có | Base URL của API, mặc định local là `http://localhost:5000/api` |
| `VITE_COPILOTKIT_ENABLED` | Không | Bật popup CopilotKit frontend; mặc định `false` và cần build lại sau khi đổi |

## Kiểm thử và build

```bash
npm test
npm run build
```

Integration test cần một MySQL test database riêng tương ứng với cấu hình trong `backend/.env.test`. Không dùng database production cho test. Đặt `REQUIRE_DATABASE_INTEGRATION=true` để lệnh thất bại nếu thiếu MySQL; CI luôn bật chế độ này. CI cũng build/chạy Docker Compose stack riêng để kiểm tra backend, frontend và proxy API.

Mobile Web export: chạy `npm run build:web --workspace=moneymate-mobile` từ gốc repo. Sau nâng SDK 57, cần development build/Expo Go tương thích; export bundle không thay thế kiểm thử trên thiết bị thật.

Trước release, đọc [báo cáo audit](PROJECT_AUDIT_2026-09-04.md) để biết advisory dependency còn tồn tại, các migration cần áp dụng và giới hạn xác minh hiện tại.

## Tài liệu

Các tài liệu chi tiết nằm trong [`docs`](./docs): kiến trúc, yêu cầu, quy tắc nghiệp vụ, ERD, sơ đồ và user stories.

## API

Khi backend đang chạy, Swagger UI tại <http://localhost:5000/api-docs> là nguồn đầy đủ và cập nhật nhất cho endpoint, request và response schema.
