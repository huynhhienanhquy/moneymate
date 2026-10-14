# Troubleshooting — Xử lý lỗi thường gặp

> Đối chiếu working tree ngày **2026-10-13**. Bắt đầu bằng xác định workspace, URL/cổng, môi trường và log/request ID; không đưa `.env`, token hoặc nội dung tài chính vào issue công khai.

## 1. Dependency, workspace và build

| Triệu chứng | Nguyên nhân cần kiểm tra | Cách xử lý |
| --- | --- | --- |
| `EBADENGINE`, Vite/Expo không khởi động | Node khác phiên bản yêu cầu | `node --version`; root yêu cầu `>=22.13`, `.nvmrc`/CI dùng `22.14.0` |
| Không tìm thấy `@moneymate/*` hoặc entrypoint `dist` | Install từ subfolder hoặc chưa build package | Chạy `npm ci` từ root, rồi `npm run build:packages` |
| Prisma client chưa generate | Thiếu generated client sau install/thay schema | `npm run prisma:generate --workspace=moneymate-backend` trước build/start |
| React hook lỗi/React instance lệch ở web | Web React 18 và mobile React 19 được liên kết sai | Install theo root lockfile; giữ alias/dedupe trong Vite, không ép dùng một React version cho mọi workspace |
| Mobile typecheck thành công nhưng máy thật lỗi | Typecheck/export không chạy native app | Kiểm tra development/release build và log thiết bị theo [Testing](testing.md) |

Nguồn: [root package.json](../package.json), [frontend vite.config.ts](../frontend/vite.config.ts), [mobile package.json](../apps/mobile/package.json). Không xóa lockfile để né lỗi cài đặt trước khi xác định dependency hoặc version khác biệt.

## 2. Backend không khởi động

### Secret JWT bị thiếu hoặc bị từ chối

Lỗi `JWT_ACCESS_SECRET is required`, `JWT_REFRESH_SECRET is required`, hoặc yêu cầu ít nhất 32 ký tự đến từ [env.ts](../backend/src/config/env.ts). Kiểm tra backend chạy từ workspace để `dotenv.config()` nạp đúng `backend/.env`. Root `.env` không tự nạp vào backend local. Thay secret ví dụ bằng hai giá trị ngẫu nhiên độc lập, rồi restart.

### Cấu hình Copilot không hợp lệ

`COPILOTKIT_ENABLED` chỉ nhận `true`/`false`. Nếu bật cần `OPENAI_API_KEY`, model phải có prefix `openai/`; các biến giới hạn số phải đúng range trong [Environment Setup](environment-setup.md). Các giới hạn vẫn được parse khi Copilot tắt. Xem [copilotkit.ts](../backend/src/config/copilotkit.ts).

### Port đã được dùng

Xác định process đang chiếm cổng trước khi dừng nó. Đổi `PORT` trong backend config hoặc dành lại cổng cho server, rồi điều chỉnh web proxy/mobile URL nếu port khác 5000. Startup smoke dùng cổng 5099 riêng, đổi bằng `DEV_STARTUP_CHECK_PORT` nếu bị chiếm. Vite có thể chọn port khác khi 5173 bận; đọc URL thực tế trong log.

## 3. MySQL và migration

| Triệu chứng | Kiểm tra | Hướng xử lý |
| --- | --- | --- |
| Prisma không kết nối DB | Host/port, service healthy, firewall/network | So sánh URL với môi trường host/container; Compose backend dùng hostname `mysql`, local dùng host DB thực tế |
| Access denied | Username/password/quyền DB | Cấp credential đúng, kiểm tra URL encoding nếu password có ký tự đặc biệt; không log URL có mật khẩu |
| Unknown database | DB chưa được tạo hoặc sai tên | Tạo DB local riêng, sửa URL; không dùng DB khác chỉ để test thành công |
| Missing table/column | Chưa áp dụng migration hoặc client/schema lệch | Generate client, kiểm tra `prisma migrate status`, áp dụng migration đã commit bằng `migrate deploy` |
| DB đã healthy nhưng app nghiệp vụ lỗi | Healthcheck/liveness chưa kiểm tra schema | Query endpoint authenticated và đọc log Prisma; `/health` trả `ok` mà không truy cập DB |

```bash
npm run prisma:generate --workspace=moneymate-backend
npm exec --workspace=moneymate-backend -- prisma migrate status
```

Chỉ chạy migration sau khi xác nhận đúng DB và đánh giá SQL. Không dùng `migrate reset` để sửa lỗi production. Chi tiết schema/migration: [Database Design](erd.md).

**Compose không expose cổng MySQL ra host.** Nếu chạy backend local cạnh stack Compose, `localhost:3306` không tự nối vào MySQL của Compose. Dùng DB local riêng, hoặc thiết kế override expose port có chủ đích cho môi trường phát triển. Nguồn: [docker-compose.yml](../docker-compose.yml).

## 4. Web không gọi được API, CORS và cookie

### `404`, HTML thay vì JSON, hoặc `Failed to fetch`

Kiểm tra `VITE_API_URL` có prefix `/api` và backend có chạy. Khi dev chuẩn dùng `/api`, Vite chuyển request tới port 5000. URL loopback có pathname `/api` được chuẩn hóa về proxy. API remote đầy đủ không được Vite tự proxy theo cùng cách; cần host reachable và CORS đúng.

Trong deployment web, static SPA host phải chuyển `/api` tới backend; nếu SPA fallback xử lý `/api`, client sẽ nhận HTML và lỗi parse. Nginx config của repo proxy `/api` và fallback các route web còn lại. Nguồn: [API config](../frontend/src/config/api.ts), [Vite proxy](../frontend/vite.config.ts), [Nginx](../frontend/nginx.conf).

### Origin bị chặn

Đặt origin trình duyệt chính xác vào `FRONTEND_URL`, phân cách dấu phẩy. `http://localhost:5173` khác `http://127.0.0.1:5173`, port/protocol khác cũng là origin khác. Development có allowlist HTTP hostname bổ sung `localhost`, `127.0.0.1`, `10.10.10.183`; IP LAN khác phải cấu hình explicit. Production không dùng fallback development. Nguồn: [cors.ts](../backend/src/config/cors.ts).

Copilot có kiểm tra origin riêng nghiêm ngặt theo allowlist cấu hình; một origin được CORS development chấp nhận chưa đủ để được runtime Copilot cho phép. Xem [security.ts](../backend/src/copilotkit/security.ts).

### Login thành công nhưng refresh liên tục `401`

Kiểm tra cookie `refreshToken` trong DevTools, request có credentials, host có nhất quán và frontend/API có cùng site phù hợp. Production cookie là `Secure`, `HttpOnly`, `SameSite=Lax`; deploy HTTP hoặc chia domain/site không phù hợp có thể khiến browser không gửi cookie. Compose smoke chưa kiểm tra luồng này. Dùng HTTPS và cùng origin qua proxy là cấu hình trong [Deployment](deployment.md).

Web giữ access token trong state và refresh qua cookie; native dùng refresh token trong SecureStore/body. Không copy cách gửi cookie web sang native hoặc yêu cầu native đọc HttpOnly cookie. Session revoke, rotation và session expired xem [auth_sessions.md](auth_sessions.md).

### `429 AUTH_RATE_LIMITED`

Đọc `Retry-After` và chờ cửa sổ rate limit; mặc định login 10/15 phút và register 5/giờ theo IP. Xác minh IP client/proxy nếu nhiều người dùng bị gom thành một IP. Không vô hiệu rate limit để sửa lỗi proxy. Nguồn: [auth-rate-limit.ts](../backend/src/middlewares/auth-rate-limit.ts).

## 5. Mobile không kết nối hoặc không mở được app

- Trên máy thật, `localhost` chỉ điện thoại đó. Đặt `EXPO_PUBLIC_API_URL=http://<IP-LAN-của-máy>:5000/api` trong môi trường local khi cần, giữ máy/điện thoại cùng mạng và kiểm tra cổng backend từ thiết bị.
- Android emulator dùng fallback `10.0.2.2` nếu không có configured URL hoặc hostname Metro. Hostname Metro có độ ưu tiên cao hơn fallback; URL explicit giúp tránh chọn sai host.
- Tunnel Expo không tunnel API. Đặt API URL reachable riêng rồi restart Expo; không dùng hostname tunnel Metro cộng cổng 5000 làm API.
- Expo web mặc định gọi `http://localhost:5000/api`; khi truy cập từ máy khác cần URL explicit và origin web trong CORS.
- Sau thay `.env`, restart Metro. Khi nghi cache bundle cũ, từ `apps/mobile` chạy `npx expo start --clear`.
- Trên Android thật với Expo Go, dùng chức năng Scan QR code trong Expo Go nếu camera hệ thống không mở `exp://` link.

Nguồn: [mobile API resolution](../apps/mobile/src/lib/api.ts), [mobile README](../apps/mobile/README.md). Preview/production phải cấu hình HTTPS API reachable; không dựa vào discovery Metro trong app đã phát hành.

### Push không đăng ký được

Mã [notifications.ts](../apps/mobile/src/lib/notifications.ts) từ chối notification module trên Expo Go và yêu cầu EAS project ID. Dùng development/release build, thiết bị phù hợp, cấp permission, hoàn thiện APNs/FCM credential, rồi kiểm tra đăng ký token với backend. Có token chưa đảm bảo push được giao; xem [Mobile Release](mobile_release.md).

## 6. Attachment, receipt OCR và AI

### File attachment bị mất sau restart/redeploy

Local storage lưu theo `process.cwd()/uploads`, backend workspace là `backend/uploads`. Compose chưa mount thư mục này, nên tạo lại container làm mất file dù bản ghi DB còn. Đặt volume bền vững hoặc `STORAGE_DRIVER=s3` với đủ `S3_BUCKET`, `S3_REGION`, `S3_PUBLIC_URL` và credential SDK. Compose hiện chưa truyền nhóm biến S3; cần cấu hình deployment. Xem [storage.service.ts](../backend/src/services/storage.service.ts) và [Deployment](deployment.md).

### `/uploads/...` không tải được

URL storage trong DB là tham chiếu nội bộ. API client nhận `/api/attachments/:id/content` và endpoint xác minh quyền sở hữu transaction trước khi đọc object. Dùng Bearer token khi tải; không mở public thư mục để né auth. Nguồn: [attachment.service.ts](../backend/src/services/attachment.service.ts), [API Documentation](api.md).

### Quét hóa đơn chậm hoặc không nhận đúng số tiền

Kiểm tra ảnh/PDF đủ rõ, content type và kích thước upload, log OCR và quyền camera/photo trên thiết bị. Kết quả OCR là draft cần review trước khi ghi transaction. Đối chiếu [receipt-ocr.service.ts](../backend/src/services/ai/receipt-ocr.service.ts) và [Business Logic](business_rules.md); OCR test dùng mock không chứng minh chất lượng trên mọi hóa đơn thật.

### AI/Copilot không hoạt động

`OPENAI_API_KEY` rỗng khiến AI service dùng fallback theo chức năng. Copilot route chỉ được mount khi `COPILOTKIT_ENABLED=true`; UI web cần `VITE_COPILOTKIT_ENABLED=true` và rebuild/restart phù hợp. Nếu gặp 404, kiểm tra hai cờ và runtime URL `/api/copilotkit`. Nếu lỗi provider/timeout, kiểm tra key/model và giới hạn theo log; không chạy live smoke chỉ để giải quyết lỗi cấu hình local. Nguồn: [ai.ts](../backend/src/config/ai.ts), [app.ts](../backend/src/app.ts), [Copilot frontend config](../frontend/src/config/copilotkit.ts).

SSE không trả stream kịp khi proxy buffering hoặc timeout sai. Nginx mẫu tắt buffering/cache cho `/api`, read timeout 300 giây; kiểm tra thêm proxy/CDN bên ngoài. Live smoke có thể gọi API tính phí; xem [Testing](testing.md).

### Copilot chuyển tiền báo lỗi nhưng số dư đã thay đổi

API trả HTTP 201 và object `WalletTransfer`, còn `TransferConfirmation` trên web kiểm tra `response.data.data === true`. Vì không khớp contract, UI có thể báo lỗi sau khi server đã commit và chưa invalidate Query cache. Tải lại danh sách ví hoặc kiểm tra response/query API để xác định kết quả trước khi gửi một transfer mới. Không coi thông báo lỗi ở tool này là bằng chứng tiền chưa chuyển.

Nguồn: [DataMutationTools](../frontend/src/components/MoneyMateCopilot/DataMutationTools.tsx), [transaction controller](../backend/src/controllers/transaction.controller.ts), [transaction repository](../backend/src/repositories/transaction.repository.ts). Giới hạn được ghi trong [kiến trúc](architecture.md).

## 7. Test và CI thất bại hoặc bỏ qua DB

| Thông báo / tình huống | Ý nghĩa và cách xử lý |
| --- | --- |
| `MySQL test database is unavailable; running database-independent integration tests only` | Auth DB suite đã bị bỏ qua; dùng DB test riêng và đặt `REQUIRE_DATABASE_INTEGRATION=true` để yêu cầu full suite |
| `MySQL test database is required but unavailable` | Runner fail đúng khi `CI=true` hoặc cờ require bằng `true`; kiểm tra DB test host/port |
| TCP probe pass nhưng integration auth fail | Probe không kiểm tra password/schema; migrate DB test, kiểm tra credential |
| Startup health pass, recurring log lỗi DB | `/health` không dùng DB; bổ sung DB/query verification |
| Coverage web fail dù UI test pass | Coverage có threshold 90% trên `.ts`; xem nhánh nghiệp vụ chưa test thay vì chỉ thêm render test |
| CI Docker smoke fail | Đọc compose logs; kiểm tra MySQL healthy, Prisma migration, secret và web proxy |

Nguồn: [integration runner](../backend/scripts/run-integration-tests.cjs), [startup check](../backend/scripts/check-dev-start.cjs), [CI](../.github/workflows/ci.yml). `npm test` không bao gồm integration/mobile. Auth integration ghi user test và không cleanup; dùng môi trường riêng theo [Testing](testing.md).

## 8. Thu thập thông tin để xử lý tiếp

Ghi lại commit/release, OS/Node, workspace/lệnh, URL không chứa credential, HTTP status/code, request ID, thời điểm và bước tái hiện. Đính kèm log đã loại token/password/key và xác định test nào đã chạy hoặc bị skip. Với mobile thêm OS/app version, Expo Go hay native build, mạng và trạng thái offline/outbox; với DB thêm migration status đã che connection string.

Các giá trị này giúp phân biệt lỗi cấu hình, contract, dữ liệu và môi trường mà không phải reset dữ liệu để thử lại.
