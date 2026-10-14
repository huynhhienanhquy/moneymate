# Deployment — Build và triển khai

> Trạng thái repository ngày **2026-10-13**. Repository có cấu hình build, CI và Compose smoke stack. Hạ tầng production, TLS, secrets, image registry, store accounts và quy trình rollout cần được cung cấp theo môi trường thực tế.

## 1. Artifact và pipeline hiện có

| Thành phần | Build | Artifact / runtime |
| --- | --- | --- |
| Shared packages | `npm run build:packages` | `packages/*/dist`; cần trước consumer |
| Backend | `npm run build --workspace=moneymate-backend` | `backend/dist`, chạy `node dist/server.js` từ workspace backend |
| Web | `npm run build --workspace=moneymate-frontend` | `frontend/dist`; static SPA dùng API |
| Mobile Android export | `npm run build --workspace=moneymate-mobile` | `apps/mobile/dist`; Metro assets/bundle, chưa phải APK/AAB |
| Mobile web export | `npm run build:web --workspace=moneymate-mobile` | `apps/mobile/.tmp-web-export`; artifact khác web Vite |
| Native mobile binary | EAS profiles trong `apps/mobile/eas.json` | Cần signing, account và cấu hình release ngoài repository |

Root `npm run build` nối các build package/backend/web/mobile Android. Không tự chạy Prisma generate. [CI](../.github/workflows/ci.yml) thực hiện lint/build/test và smoke Docker; **không có bước tự động deploy, publish image, EAS Build/Submit hoặc cập nhật store**. Xem [Testing](testing.md) cho phạm vi từng gate.

## 2. Docker Compose

Root [docker-compose.yml](../docker-compose.yml) có ba service:

- `mysql`: image `mysql:8.0`, DB `moneymate`, named volume `mysql_data`, healthcheck; không expose MySQL ra host.
- `backend`: build từ [backend/Dockerfile](../backend/Dockerfile), expose host `5000`, chờ DB healthy, startup chạy `npx prisma migrate deploy && node dist/server.js`.
- `frontend`: build từ [frontend/Dockerfile](../frontend/Dockerfile), Nginx expose host `80`, proxy `/api` tới `backend:5000`, hỗ trợ SPA fallback và tắt buffering cho streaming.

Docker build dùng context ở root, `npm ci` và build shared packages. Backend runtime hiện copy toàn bộ `node_modules` từ builder, gồm các dependency cần cho Prisma CLI; chưa có bước prune dependency production. [.dockerignore](../.dockerignore) có các pattern loại node_modules, output, `backend/uploads` và root `.env`/`.env.*`; kiểm tra phạm vi ignore của cấu hình local trước khi gửi build context.

### Chạy stack

Tạo root `.env` từ `.env.example`, điền secret ngẫu nhiên và password DB riêng. Cấu hình bắt buộc của Compose: `MYSQL_ROOT_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`. `FRONTEND_URL` mặc định `http://localhost`; AI/Copilot optional mặc định tắt.

```bash
docker compose up --build -d
docker compose ps
docker compose logs --tail=100 backend
```

Smoke sau khởi động:

**PowerShell:**

```powershell
Invoke-RestMethod http://localhost:5000/health
(Invoke-WebRequest http://localhost/).StatusCode
```

**Bash:**

```bash
curl --fail http://localhost:5000/health
curl --fail http://localhost/
```

`/health` là liveness, không query DB. Kiểm tra thêm login, một query wallet/category và một thao tác thử nghiệm trước khi kết luận ứng dụng sẵn sàng.

### Giới hạn cần xử lý trước production

| Hạng mục | Trạng thái trong Compose | Việc cần hoàn thiện |
| --- | --- | --- |
| HTTPS | Chỉ HTTP port 80/5000 | TLS termination, hostname thực tế và forwarding header đáng tin cậy |
| Refresh cookie | Backend `NODE_ENV=production` nên `Secure`, `HttpOnly`, `SameSite=Lax` | Dùng HTTPS và kiểm tra cookie trên URL triển khai; chọn web/API cùng site hoặc proxy cùng origin |
| Attachment | Mặc định storage local; chưa mount volume backend | Mount storage bền vững tại `/app/backend/uploads`, hoặc cấu hình S3 kèm credential/backup |
| Storage env | Compose chưa truyền `STORAGE_DRIVER`/`S3_*` | Bổ sung qua cấu hình deployment/override; root `.env` không tự truyền mọi biến vào container |
| DB access | Backend dùng MySQL root | Cấp user ứng dụng với quyền tối thiểu, quản lý quyền migration riêng nếu hạ tầng cho phép |
| Secrets | Interpolation từ env / `.env` host | Cấp từ secret store, giới hạn quyền đọc và xoay secret theo kế hoạch |
| Monitoring | Log stdout và HTTP liveness | Thiết lập alert, backup/restore, quan sát DB và các luồng nghiệp vụ |
| Scale | Recurring scheduler và rate limiter ở process | Review concurrency, retry, rate-limit tập trung và session/runtime state trước nhiều replica |

Frontend Docker nhận `VITE_API_URL=/api` và `VITE_COPILOTKIT_ENABLED` lúc **build**; thay env của container Nginx sau build không đổi giá trị nhúng trong JavaScript. Backend nhận env lúc **runtime**.

Nginx hiện gửi `Host`/`X-Forwarded-Proto`, có read timeout 300 giây và không có TLS block. Backend đặt `trust proxy=1` trong production. Xác minh số proxy hop, header và địa chỉ client của deployment thực tế trước khi dựa vào rate limiting theo IP.

## 3. Deploy thủ công backend và web

Ví dụ quy trình dành cho một release đã review, thực hiện từ root trong môi trường staging/production đã được cấp secret và DB đúng:

```bash
npm ci
npm run prisma:generate --workspace=moneymate-backend
npm run build:packages
npm run build --workspace=moneymate-backend
npm run build --workspace=moneymate-frontend
npm exec --workspace=moneymate-backend -- prisma migrate status
npm exec --workspace=moneymate-backend -- prisma migrate deploy
npm run start --workspace=moneymate-backend
```

Process manager/hạ tầng cần quản lý restart, shutdown và log; lệnh `start` tự nó chỉ chạy Node. Phục vụ `frontend/dist` qua static hosting/reverse proxy với SPA fallback về `index.html`, và route `/api` đúng backend. Nếu tách API domain, đặt `VITE_API_URL` trước build và allowlist origin web trong `FRONTEND_URL`.

### Migration và dữ liệu

1. Xác nhận `DATABASE_URL` trỏ đúng môi trường; lấy backup và kiểm tra khả năng restore trước migration ảnh hưởng dữ liệu.
2. Đọc SQL pending, thử trên staging với schema/dữ liệu đại diện; đánh giá thời gian lock và tính tương thích với client còn đang chạy.
3. Chạy `prisma migrate deploy` theo release process. Container backend cũng chạy lệnh này ở startup; không chạy migration trùng tùy tiện khi mở nhiều instance.
4. Seed category hệ thống đã có trong migration; `prisma:seed` chỉ tạo category thiếu, không bootstrap account/admin.
5. Xác minh schema, count dữ liệu và luồng tài chính sau cập nhật. Xem [Database Design](erd.md) và [Business Logic](business_rules.md).

Không sửa/xóa migration đã được áp dụng để rollback. Ưu tiên migration sửa tiếp và rollback code khi schema vẫn tương thích. `migrate reset` và `docker compose down --volumes` xóa dữ liệu; chúng chỉ dành cho môi trường dùng một lần.

## 4. Production checklist

- Secret JWT độc lập, ít nhất 32 ký tự; `NODE_ENV=production`, `DATABASE_URL`, exact origin `FRONTEND_URL` đúng.
- HTTPS, cookie refresh/rotation/revoke, CORS, HTTP header và API error envelope được kiểm tra qua endpoint công khai.
- Attachment có storage bền vững, backup và quyền truy cập; tải bằng API authenticated `/api/attachments/:id/content`, không public thư mục uploads.
- Backup DB đã thử restore, migration có review, không dùng tài khoản seeded/secret ví dụ.
- API health, luồng wallet/transaction/transfer và idempotency đúng; recurring startup không gây tạo trùng.
- Chọn cơ chế vận hành recurring phù hợp khi restart hoặc scale. Server hiện xử lý startup và `setInterval(24h)` theo vòng đời process, chưa có external cron/queue trong repo.
- Theo dõi HTTP 5xx/401/429, DB connection, sync conflict, storage error, push delivery và AI timeout. Log request ID phục vụ truy vết.
- Nếu bật Copilot, bật hai cờ backend/web, cấp key ở backend, review model/rate/token/time limits và xác minh SSE qua proxy.

## 5. Mobile release

[apps/mobile/eas.json](../apps/mobile/eas.json) định nghĩa:

| Profile | Cấu hình hiện có |
| --- | --- |
| `development` | `developmentClient=true`, phân phối internal |
| `preview` | Phân phối internal |
| `production` | Tự tăng build version (`autoIncrement=true`) |
| Submit `production` | Object rỗng; thông tin account/store cần hoàn thiện bên ngoài |

Cấu hình app hiện dùng scheme `moneymate`, iOS bundle ID/Android package `vn.moneymate.app` và App/Universal Link host `app.moneymate.vn`. Đây là cấu hình trong source, không phải bằng chứng domain, store account hoặc domain association đã được provision.

Trước build preview/production cần `EXPO_PUBLIC_API_URL` tới API HTTPS, EAS project ID cho push, signing/APNs/FCM credential, domain association và metadata/privacy policy phù hợp. Biến `EXPO_PUBLIC_*` được nhúng vào app và không chứa credential backend. Có profile EAS chưa chứng minh binary đã được tạo hoặc nộp store.

Làm theo [Mobile Release Runbook](mobile_release.md) cho preflight, native export, device verification, staged rollout và rollback. Root `npm run build` chỉ export Android; CI chưa export iOS và chưa tự chạy EAS. Expo Go không đủ để xác nhận push và mọi native behavior.

## 6. Rollback và xử lý sự cố

1. Xác định component và version lỗi từ log/request ID; xem [Troubleshooting](troubleshooting.md).
2. Nếu lỗi build client, phục hồi artifact đã biết tốt tương thích API/schema hiện tại. Biến client chỉ thay sau rebuild.
3. Nếu lỗi optional Copilot, tắt cờ backend/runtime và rebuild web khi cần thay cờ UI; không xoay JWT secret như một thao tác rollback thông thường vì sẽ làm token mất hiệu lực.
4. Nếu lỗi migration/dữ liệu, bảo vệ backup và lập forward fix; không reset production DB.
5. Với mobile, dừng rollout store, giữ API tương thích bản app đã phát hành và thực hiện checklist rollback trong runbook.

`docker compose down` giữ named volume MySQL nhưng không đảm bảo attachment local còn tồn tại khi container bị xóa. Đảm bảo attachment đã có storage bền vững trước khi dùng thao tác này trong deployment có dữ liệu.
