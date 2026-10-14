# Environment Setup — Cài đặt môi trường

> Đối chiếu với mã nguồn trong working tree ngày **2026-10-13**. Các lệnh dưới đây chạy từ thư mục gốc repository, trừ khi có `cd` cụ thể.

## 1. Công cụ và phạm vi cài đặt

| Công cụ | Yêu cầu của repository |
| --- | --- |
| Node.js | `>=22.13`; `.nvmrc` và CI chọn `22.14.0` |
| npm | Dùng npm workspaces và `package-lock.json` ở root; cài bằng `npm ci` |
| MySQL | MySQL 8.0 là phiên bản được Compose và CI dùng |
| Git | Lấy mã nguồn và theo dõi migration |
| Docker + Compose v2 | Tùy chọn để chạy toàn bộ stack hoặc tạo DB local riêng |
| Expo và thiết bị/emulator | Cần khi phát triển `apps/mobile`; iOS simulator cần máy macOS |

Repository gồm backend, frontend web, mobile và năm package dùng chung. Cài dependency ở root để các `file:` dependency và workspace được liên kết đúng. Không lấy `apps/mobile/package-lock.json` làm lockfile cho toàn monorepo.

```bash
node --version
npm --version
npm ci
```

Xem [Tech Stack](tech-stack.md), [Project Structure](project-structure.md) và [Testing](testing.md) để hiểu tác dụng của từng workspace.

## 2. Tạo file cấu hình local

Chỉ copy khi file đích chưa tồn tại. Không ghi đè cấu hình đang dùng và không commit khóa thật. Root `.env` phục vụ Compose; backend, frontend và mobile đọc `.env` của workspace tương ứng.

**Windows PowerShell:**

```powershell
if (-not (Test-Path -LiteralPath backend/.env)) { Copy-Item -LiteralPath backend/.env.example -Destination backend/.env }
if (-not (Test-Path -LiteralPath frontend/.env)) { Copy-Item -LiteralPath frontend/.env.example -Destination frontend/.env }
if (-not (Test-Path -LiteralPath apps/mobile/.env)) { Copy-Item -LiteralPath apps/mobile/.env.example -Destination apps/mobile/.env }
```

**Bash:**

```bash
test -f backend/.env || cp backend/.env.example backend/.env
test -f frontend/.env || cp frontend/.env.example frontend/.env
test -f apps/mobile/.env || cp apps/mobile/.env.example apps/mobile/.env
```

Sinh một secret ngẫu nhiên bằng lệnh sau; chạy hai lần để có giá trị độc lập cho access token và refresh token, rồi điền vào `backend/.env` hoặc secret store của môi trường triển khai:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Lệnh này dùng được trong cả PowerShell và Bash. Giá trị ví dụ trong `backend/.env.example` chỉ giúp nhận diện biến cần thay; production từ chối các secret ví dụ đã biết và secret dưới 32 ký tự.

## 3. Biến backend

| Biến | Mặc định trong mã / ví dụ | Cách dùng |
| --- | --- | --- |
| `DATABASE_URL` | Ví dụ: `mysql://root:password@localhost:3306/moneymate` | Bắt buộc khi truy cập DB và chạy Prisma; thay host, user, mật khẩu và tên DB theo môi trường |
| `JWT_ACCESS_SECRET` | Không có fallback | Bắt buộc lúc server khởi động; production cần ít nhất 32 ký tự và không dùng giá trị ví dụ |
| `JWT_REFRESH_SECRET` | Không có fallback | Cùng yêu cầu với access secret; dùng một giá trị độc lập |
| `PORT` | `5000` | Cổng HTTP backend |
| `NODE_ENV` | Ví dụ: `development` | Production bật secure cookie, `trust proxy=1`, CORS nghiêm ngặt và ẩn chi tiết lỗi nội bộ |
| `FRONTEND_URL` | Mã mặc định: `http://localhost:5173` | Danh sách origin phân cách dấu phẩy; origin gồm protocol, host và port, không thêm `/api` |
| `STORAGE_DRIVER` | Mọi giá trị khác `s3` dùng local; ví dụ: `local` | Local lưu dưới `backend/uploads` khi backend chạy từ workspace |
| `S3_BUCKET`, `S3_REGION`, `S3_PUBLIC_URL` | Không có | Bắt buộc khi `STORAGE_DRIVER=s3`; URL làm prefix nội bộ để tìm object |
| `S3_ENDPOINT` | Không có | Tùy chọn cho dịch vụ S3 tương thích |
| `S3_FORCE_PATH_STYLE` | `false` | Chỉ chuỗi `true` bật path-style |
| `OPENAI_API_KEY` | Rỗng | Tùy chọn; có khóa thì AI service dùng LLM, không có khóa dùng khả năng fallback/local theo chức năng |
| `AI_MODEL` | `gpt-4o-mini` | Model của AI service thông thường; độc lập với model Copilot |
| `AI_MAX_TOKENS` | `1500` | Giới hạn token của AI service |
| `AUTH_LOGIN_RATE_LIMIT_MAX` | `10` | Số lượt login/IP/window; giá trị không phải số nguyên dương quay về mặc định |
| `AUTH_LOGIN_RATE_LIMIT_WINDOW_MS` | `900000` | Cửa sổ login 15 phút |
| `AUTH_REGISTER_RATE_LIMIT_MAX` | `5` | Số lượt register/IP/window |
| `AUTH_REGISTER_RATE_LIMIT_WINDOW_MS` | `3600000` | Cửa sổ register 1 giờ |

S3 client dùng cơ chế credential mặc định của AWS SDK, ví dụ workload role hoặc biến môi trường do hạ tầng cấp. Không đưa credential S3 vào biến frontend/mobile. File [storage.service.ts](../backend/src/services/storage.service.ts) không đọc credential từ một biến riêng của MoneyMate.

### CopilotKit tùy chọn

| Biến | Mặc định | Giá trị hợp lệ |
| --- | --- | --- |
| `COPILOTKIT_ENABLED` | `false` | `true` hoặc `false`; bật yêu cầu `OPENAI_API_KEY` |
| `COPILOT_MODEL` | `openai/gpt-4o-mini` | Khi bật phải có prefix `openai/` |
| `COPILOT_MAX_STEPS` | `3` | Số nguyên `1–8` |
| `COPILOT_MAX_OUTPUT_TOKENS` | `1500` | Số nguyên `256–4096` |
| `COPILOT_MAX_MESSAGE_CHARS` | `4000` | Số nguyên `256–20000` |
| `COPILOT_MODEL_TIMEOUT_MS` | `45000` | Số nguyên `5000–120000` |
| `COPILOT_RATE_LIMIT_MAX_REQUESTS` | `60` | Số nguyên `5–600` |
| `COPILOT_RATE_LIMIT_WINDOW_MS` | `60000` | Số nguyên `10000–3600000` |
| `COPILOTKIT_TELEMETRY_DISABLED` | Server đặt `true` nếu chưa có giá trị | Ví dụ và Docker đều tắt telemetry |

Các giới hạn số được kiểm tra ngay khi cấu hình Copilot được tạo, kể cả khi cờ bật là `false`. Mã nguồn xác thực tại [env.ts](../backend/src/config/env.ts), [copilotkit.ts](../backend/src/config/copilotkit.ts) và [auth-rate-limit.ts](../backend/src/middlewares/auth-rate-limit.ts).

## 4. Biến frontend và mobile

| Workspace / biến | Mặc định | Khi cần thay |
| --- | --- | --- |
| Web `VITE_API_URL` | `/api` | Giữ `/api` khi dùng Vite proxy hoặc Nginx chung origin; đổi sang URL API đầy đủ nếu deploy tách origin |
| Web `VITE_COPILOTKIT_ENABLED` | `false` | Bật cùng backend khi dùng CopilotKit; giá trị ngoài `true`/`false` gây lỗi |
| Mobile `EXPO_PUBLIC_API_URL` | Rỗng trong ví dụ | Bắt buộc cấu hình URL API thiết bị truy cập được cho preview/production; ví dụ `https://api.example.com/api` |
| Mobile `EXPO_PUBLIC_EAS_PROJECT_ID` | Rỗng | Cần trước khi đăng ký Expo push; mã cũng thử `extra.eas.projectId`/`Constants.easConfig.projectId` |

`VITE_*` và `EXPO_PUBLIC_*` được đưa vào mã client; chúng không phải nơi chứa secret. Restart dev server sau khi đổi `.env`; build lại artifact nếu thay biến đã nhúng lúc build.

Web dev chuẩn hóa URL API loopback dạng `http://localhost:5000/api` về `/api` để đi qua Vite proxy. Vite mặc định chuyển `/api` tới `http://localhost:5000`, hoặc dùng origin loopback trong `VITE_API_URL` nếu được cấu hình. Xem [vite.config.ts](../frontend/vite.config.ts) và [api.ts](../frontend/src/config/api.ts).

## 5. Tạo DB và áp dụng migration

Chuẩn bị một database **local riêng** bằng MySQL đang có. Với tài khoản có quyền tạo DB, chạy trong MySQL client:

```sql
CREATE DATABASE IF NOT EXISTS moneymate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Nếu muốn DB local trong Docker, lệnh sau tạo riêng container, expose cổng 3306 và volume. Thay mật khẩu ví dụ trước khi dùng; nếu host đã có MySQL, chọn cổng khác và sửa `DATABASE_URL` tương ứng.

```bash
docker run --name moneymate-local-db -e MYSQL_ROOT_PASSWORD=change-this-local-password -e MYSQL_DATABASE=moneymate -p 3306:3306 -v moneymate_local_mysql:/var/lib/mysql -d mysql:8.0
```

Đợi MySQL khởi động, sửa `backend/.env`, rồi chạy:

```bash
npm run prisma:generate --workspace=moneymate-backend
npm exec --workspace=moneymate-backend -- prisma migrate deploy
npm run prisma:seed --workspace=moneymate-backend
npm run build:packages
```

`migrate deploy` áp dụng migration đã commit và không tạo migration mới. Khi thay Prisma schema trong quá trình phát triển, dùng script `npm run prisma:migrate --workspace=moneymate-backend` (`prisma migrate dev`), review SQL rồi commit migration. Không dùng `migrate dev` hoặc `migrate reset` để nâng cấp production.

Seed tạo **14 category hệ thống**, tìm bản ghi có cùng tên/type và `userId=null` để tránh thêm trùng; seed không tạo tài khoản demo/admin. Migration `20260904010000_link_recurring_and_seed_categories` cũng bổ sung category hệ thống khi chạy `migrate deploy` trên DB mới. Tạo user bằng đăng ký; quy trình quản trị xem [Authentication & Authorization](auth_sessions.md). Thiết kế schema/migration xem [Database Design](erd.md).

## 6. Chạy local

Mở các terminal riêng tại root:

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

```bash
npm run dev:mobile
```

| Địa chỉ | Mục đích |
| --- | --- |
| `http://localhost:5173` | Web Vite dev server |
| `http://localhost:5000/health` | HTTP liveness của backend |
| `http://localhost:5000/api-docs` | Swagger UI |
| `http://localhost:5000/api` | Prefix API, không phải trang HTML |

Kiểm tra HTTP bằng `curl http://localhost:5000/health` trong Bash hoặc `Invoke-RestMethod http://localhost:5000/health` trong PowerShell. Endpoint này không query DB; kết quả `ok` chưa chứng minh DB/migration hoạt động.

Backend xử lý recurring đến hạn khi khởi động và sau mỗi 24 giờ theo thời điểm process được mở. Vì vậy startup trên DB có dữ liệu thật có thể tạo giao dịch đến hạn. Dùng DB phát triển riêng.

### Kết nối từ mobile và máy khác

Thứ tự chọn API của mobile: `EXPO_PUBLIC_API_URL` nếu có → trên web dùng `http://localhost:5000/api` → native thử hostname Metro → fallback Android `http://10.0.2.2:5000/api`, iOS `http://localhost:5000/api`.

- Thiết bị thật cần cùng LAN và truy cập được cổng backend; cấu hình URL explicit nếu hostname Metro không đúng.
- Android emulator dùng `10.0.2.2` để gọi máy host khi không dùng hostname Metro.
- Tunnel Expo chỉ chuyển lưu lượng Metro; API cần URL reachable riêng từ điện thoại.
- CORS áp dụng cho trình duyệt, gồm Expo web. Production chỉ cho origin khớp `FRONTEND_URL`; development còn cho HTTP origin có hostname `localhost`, `127.0.0.1` hoặc `10.10.10.183`. IP LAN khác cần thêm explicit, không được tự cho phép.
- Bật Windows Firewall cho cổng local cần thiết theo mạng phát triển. Không thay firewall hoặc mở DB public chỉ để xử lý lỗi API.

Các native feature đầy đủ cần development/release build và thiết bị phù hợp; xem [Mobile Release](mobile_release.md). Script mobile `build` chạy typecheck và Expo Android export, chưa tạo APK/AAB/IPA.

## 7. Chạy toàn stack bằng Compose

Tạo root `.env` từ [root .env.example](../.env.example), điền ba giá trị bắt buộc `MYSQL_ROOT_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` rồi chạy:

```bash
docker compose up --build -d
docker compose ps
docker compose logs --tail=100 backend
```

Web ở `http://localhost`, backend ở cổng `5000`, DB chỉ ở network nội bộ Compose. Compose không map cổng MySQL 3306 ra host, nên backend local không thể dùng trực tiếp DB này bằng `localhost:3306`. Backend container tự chạy `prisma migrate deploy` trước khi mở server. Web Nginx proxy `/api` tới backend.

Compose đặt `NODE_ENV=production` và secure refresh cookie; chạy HTTP local chỉ phù hợp smoke check, cần kiểm tra hành vi cookie trước khi dùng cho phiên đăng nhập thực tế. Stack chưa có TLS và chưa cấu hình storage attachment bền vững. Xem [Deployment](deployment.md) trước khi triển khai.

`docker compose down` dừng stack và giữ named volume DB. **`docker compose down --volumes` xóa dữ liệu DB của stack**, chỉ dùng khi cố ý hủy môi trường dùng một lần.

## 8. Checklist sau cài đặt

1. `npm ci`, Prisma generate và build package hoàn thành.
2. Migration áp dụng vào đúng DB local; có category hệ thống, không có tài khoản seeded mặc định.
3. Backend `/health` và một luồng đăng ký/đăng nhập/truy cập dữ liệu chạy được.
4. Web dùng đúng API, mobile dùng URL thiết bị truy cập được.
5. Chạy bộ kiểm tra phù hợp theo [Testing](testing.md); khi lỗi tra [Troubleshooting](troubleshooting.md).
