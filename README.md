# MoneyMate — Personal Finance Management

Quản lý tài chính cá nhân toàn diện: theo dõi thu chi, quản lý ngân sách, mục tiêu tiết kiệm, giao dịch định kỳ, và hỗ trợ AI.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | MySQL 8.0 |
| Frontend | React 18, Vite, TypeScript, TailwindCSS |
| State | Zustand + TanStack Query |
| Charts | Recharts |
| AI | OpenAI API + Tesseract.js (OCR fallback) |
| Docker | Multi-stage builds, Docker Compose |

## Features

- **Tài khoản & Xác thực**: JWT access/refresh tokens, đăng ký, đăng nhập
- **Ví**: Quản lý nhiều ví (tiền mặt, ngân hàng), xem số dư
- **Danh mục**: Danh mục thu/chi hệ thống + tự tạo
- **Giao dịch**: Thêm/sửa/xóa, phân trang, tìm kiếm, lọc theo loại/thời gian
- **Chuyển tiền**: Chuyển giữa các ví, tự động tạo giao dịch
- **Ngân sách**: Đặt hạn mức chi tiêu theo danh mục, cảnh báo vượt ngân sách
- **Mục tiêu tiết kiệm**: Đặt mục tiêu, theo dõi tiến độ
- **Giao dịch định kỳ**: Lên lịch tự động (hàng ngày/tuần/tháng/năm)
- **Báo cáo**: Xuất Excel/PDF, biểu đồ thu chi, xu hướng
- **AI Advisor**: Phân tích chi tiêu thông minh, dự báo ngân sách, chat tư vấn
- **Quét hóa đơn**: Chụp/quét hóa đơn, tự động trích xuất số tiền, danh mục
- **Thông báo**: Thông báo trong ứng dụng
- **API Docs**: Swagger UI tại `/api-docs`

## Quick Start

### Yêu cầu

- Node.js 20+
- MySQL 8.0 (hoặc Docker)
- npm

### 1. Clone & cài đặt

```bash
git clone <repo-url> && cd MyFinance

# Backend
cd backend
npm install
npx prisma generate

# Frontend
cd ../frontend
npm install
```

### 2. Cấu hình

Copy `.env.example` thành `.env` và điền các giá trị:

```bash
cp .env.example .env
# Sau đó sửa file .env
```

### 3. Chạy với Docker (khuyên dùng)

```bash
docker compose up -d
```

Mở http://localhost (frontend) và http://localhost:5000/api-docs (Swagger).

### 4. Hoặc chạy thủ công

```bash
# Tạo database MySQL (tên mặc định: moneymate)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS moneymate;"

# Backend
cd backend
cp .env.example .env   # Cấu hình DATABASE_URL, JWT secrets...
npm run prisma:migrate
npm run prisma:seed    # Tạo user demo + danh mục mặc định
npm run dev            # http://localhost:5000

# Frontend (terminal riêng)
cd frontend
VITE_API_URL=http://localhost:5000/api npm run dev  # http://localhost:5173
```

### User demo

- Email: `demo@moneymate.com`
- Mật khẩu: `password`

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Đăng ký |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/refresh` | Refresh token |
| GET/POST | `/api/wallets` | Danh sách / Tạo ví |
| GET/PUT/DELETE | `/api/wallets/:id` | Chi tiết / Sửa / Xóa ví |
| GET/POST | `/api/categories` | Danh sách / Tạo danh mục |
| GET/POST | `/api/transactions` | Danh sách (phân trang) / Tạo giao dịch |
| POST | `/api/transactions/transfer` | Chuyển tiền giữa các ví |
| GET | `/api/transactions/dashboard` | Tổng quan dashboard |
| GET | `/api/transactions/report` | Báo cáo tháng |
| GET | `/api/transactions/trend` | Xu hướng 6 tháng |
| GET/POST | `/api/budgets` | Danh sách / Tạo ngân sách |
| GET/POST | `/api/saving-goals` | Danh sách / Tạo mục tiêu |
| GET/POST | `/api/recurring-transactions` | Danh sách / Tạo giao dịch định kỳ |
| POST | `/api/ai/analyze/expenses` | Phân tích chi tiêu (AI) |
| POST | `/api/ai/budget/forecast` | Dự báo ngân sách |
| POST | `/api/ai/scan-receipt` | Quét hóa đơn |
| POST | `/api/ai/chat` | Chat với AI Advisor |
| GET/POST | `/api/attachments/transactions/:id` | Upload / Xem file đính kèm |
| GET | `/api/attachments/export/excel` | Xuất Excel |
| GET | `/api/attachments/export/pdf` | Xuất PDF |

## Environment Variables

| Variable | Default | Mô tả |
|----------|---------|-------|
| `PORT` | `5000` | Cổng backend |
| `DATABASE_URL` | `mysql://root:password@localhost:3306/moneymate` | URL kết nối MySQL |
| `JWT_ACCESS_SECRET` | (required) | Secret cho access token |
| `JWT_REFRESH_SECRET` | (required) | Secret cho refresh token |
| `FRONTEND_URL` | `http://localhost:5173` | URL frontend (CORS) |
| `OPENAI_API_KEY` | (optional) | API key cho AI features |
| `MYSQL_ROOT_PASSWORD` | `password` | MySQL root password (Docker) |

## Testing

```bash
cd backend
npm test            # Unit tests (27 tests)
npm run test:watch  # Watch mode
```

Integration tests yêu cầu MySQL instance đang chạy với database `moneymate_test`.

## Project Structure

```
MyFinance/
├── backend/
│   ├── prisma/           # Schema, migrations, seed
│   ├── src/
│   │   ├── common/       # AppError, response helpers, utils
│   │   ├── config/       # DB, Swagger, AI config
│   │   ├── controllers/  # Route handlers
│   │   ├── middlewares/   # Auth, error, upload
│   │   ├── repositories/ # Prisma data access
│   │   ├── routes/       # Express route definitions
│   │   ├── services/     # Business logic (+ AI/)
│   │   ├── validators/   # Zod schemas
│   │   └── __tests__/    # Unit + integration tests
│   ├── uploads/          # Uploaded files
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── routes/       # AppRouter, PrivateRoute
│   │   ├── services/     # Axios API client
│   │   └── store/        # Zustand stores (auth, theme)
│   ├── public/
│   └── Dockerfile
├── docs/                 # Tài liệu dự án
├── docker-compose.yml
└── .env.example
```



admin@moneymate.com	password	Admin
demo@moneymate.com	password	User
