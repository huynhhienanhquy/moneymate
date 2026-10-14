# MoneyMate Mobile

> Workspace `moneymate-mobile`, đối chiếu source/cấu hình ngày 2026-10-13. Phiên bản và khả năng dưới đây được đọc từ repository; native signing, phát hành store và kiểm thử thiết bị cần bằng chứng riêng.

Ứng dụng Expo Router cho iOS/Android với UI tiếng Việt, quản lý tài chính cá nhân, AI chat/OCR, SecureStore, query cache và SQLite outbox. Expo web là bản chạy trình duyệt của mobile; khác SPA trong `frontend/` và có giới hạn native/offline riêng.

## 1. Thiết lập local

Cài dependencies từ root, không cài workspace tách rời:

```powershell
npm ci
npm run build:packages
```

Nếu chưa có file môi trường, tạo từ mẫu:

```powershell
Copy-Item apps/mobile/.env.example apps/mobile/.env
```

Chuẩn bị MySQL, migration và chạy backend theo [environment setup](../../docs/environment-setup.md). Sau đó, từ root:

```powershell
npm run dev:mobile
```

Hoặc mở terminal trong `apps/mobile/` và chạy `npx expo start --clear` để xóa Metro cache khi cần. `npx expo start --offline --clear` chỉ đổi chế độ chạy Expo CLI; không biến các tính năng cần API thành offline.

Trước khi viết code mobile, đọc [AGENTS.md](AGENTS.md): repository yêu cầu tham chiếu tài liệu Expo đúng SDK 57. Cấu hình hiện tại lấy từ [package.json](package.json), [app.json](app.json), [metro.config.js](metro.config.js) và [eas.json](eas.json).

## 2. Stack khai báo

| Thành phần | Phiên bản/adapter trong manifest |
| --- | --- |
| Expo | `~57.0.22` |
| React / React Native | `19.2.3` / `0.86.3` |
| Expo Router | `~57.0.21`, entry `expo-router/entry` |
| TypeScript | `~6.0.3` |
| Server state | TanStack Query 5, persisted query client |
| Client state | Zustand 5 |
| Persistence native | SecureStore, SQLite và SQLite key-value |
| Network | Fetch adapter riêng và NetInfo |
| UI | React Native StyleSheet, Lucide/Expo icons, Expo Image, SVG/gradient |

Bản resolved theo lockfile root. Không thay version mobile theo React 18 của web. Shared `contracts` dùng cho auth/platform, `design-tokens` dùng qua native theme adapter. `api-core` có trong dependency nhưng networking hiện chạy [src/lib/api.ts](src/lib/api.ts), chưa import client factory đó.

## 3. API URL và mạng

| Biến | Sử dụng |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Base URL có `/api`; trống khi local để suy ra host Metro |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | Project ID dùng đăng ký Expo push nếu không có trong Expo/EAS runtime config |

Đây là public bundle configuration. Không đưa DB credential, JWT secret, OpenAI key hoặc storage secret vào `EXPO_PUBLIC_*`.

[lib/api.ts](src/lib/api.ts) chọn URL theo thứ tự:

1. `EXPO_PUBLIC_API_URL` đã trim, bỏ dấu `/` cuối.
2. Với Expo web: `http://localhost:5000/api`.
3. Native có Metro `hostUri`: `http://<Metro-host>:5000/api`.
4. Native không có host: Android dùng `http://10.0.2.2:5000/api`, iOS dùng `http://localhost:5000/api`.

Phone thật cần URL API mà phone truy cập được; `localhost` trên phone là phone. Cùng Wi-Fi, backend phải lắng nghe và firewall cho phép port. Trong Expo Go Android, dùng chức năng Scan QR của Expo Go để mở `exp://` link. Khi LAN không hoạt động, `npx expo start --tunnel` có thể giúp tới Metro; tunnel Metro không mở cổng backend, nên cần đặt API URL riêng mà phone truy cập được rồi restart Expo.

Preview/production cần đặt API URL HTTPS thật. Expo web chạy khác origin phải có origin tương ứng trong `FRONTEND_URL` backend; native fetch thường không gửi browser Origin. Không nhầm CORS với lỗi firewall/DNS.

## 4. Route và UI

Entry route ở `src/app/`, phần lớn re-export page từ `src/pages/`.

| Nhóm route | Màn hình |
| --- | --- |
| `/login`, `/register`, `/` | Auth và redirect entry |
| `/(tabs)` | Dashboard, transactions, budgets, advisor, more; profile có route nhưng ẩn khỏi tab list |
| `/wallets`, `/categories`, `/saving-goals`, `/recurring` | Quản lý tài chính |
| `/reports`, `/monthly-balance`, `/notifications` | Báo cáo, kết dư và thông báo |
| `/add-transaction`, `/transfer`, `/scan-receipt` | Thêm/sửa giao dịch, chuyển tiền, OCR |
| `/admin` | Quản trị, client guard yêu cầu `ADMIN` |

Tab bar mặc định được ẩn; [navigation-shell.tsx](src/components/navigation-shell.tsx) xây navigation UI. Native theme có `light`, `dark`, `system`, persist preference qua key-value storage. Font Be Vietnam Pro được bundle trong `assets/fonts`, nạp ở root layout và dùng qua `design-text.tsx`.

Root provider quản lý Query persistence, offline sync, session bootstrap, auth/notification navigation và chatbot. Khi thay route vẫn cần đảm bảo backend authorization; client guard chỉ điều hướng UI.

## 5. Phiên và quyền riêng tư

- Access token giữ trong bộ nhớ adapter. Refresh đồng thời dùng một promise, request 401 được retry một lần.
- Login native gửi platform, device ID/name, app version và timezone; refresh token nhận qua body và lưu SecureStore. Expo web dùng HttpOnly cookie, không persist refresh token trong localStorage.
- Profile và credential hợp lệ đã lưu cho phép giữ cache khi mạng/server tạm lỗi. Refresh 401/403 xóa session và Query cache.
- Logout xóa credential/cache local trước để hoạt động cả lúc offline, thu hồi phiên server và unregister push theo best effort. Nếu mạng không có, không khẳng định session server đã bị thu hồi.
- Query cache native nằm trong SQLite key-value, không được mô tả là encrypted SecureStore. Outbox/delta SQLite tách dữ liệu theo user; logout hiện không xóa những bảng này.
- Background có privacy shield; API screen-capture được gọi theo khả năng nền tảng.
- Nút “Kiểm tra sinh trắc học” tại profile gọi xác thực thiết bị. Source chưa bật khóa sinh trắc học tự động mỗi lần mở app.

Xem [auth sessions](../../docs/auth_sessions.md) và [privacy policy](../../docs/privacy_policy.md).

## 6. Offline và sync: phạm vi đang triển khai

Query cache persist tối đa 24 giờ, stale 30 giây và query retry một lần. Đây là snapshot truy vấn đã tải, không thay thế nguồn dữ liệu server.

| Luồng | Hiện trạng |
| --- | --- |
| Tạo/sửa transaction | `AddTransactionPage` queue JSON khi lỗi mạng hoặc 5xx; 4xx hiện lỗi |
| Delete, transfer, form khác | Chưa gọi outbox, cần request API thành công |
| Attachment của transaction | Upload sau tạo online; không lưu file vào queue, không replay ảnh của giao dịch đã queue |
| Replay | NetInfo báo connected → tối đa 50 mục đủ thời điểm retry |
| Retry lỗi | Ghi `failed`, attempts/error và exponential `next_attempt_at`; chưa có timer riêng hoặc UI xử lý conflict |
| Transaction delta | Tải `/transactions/sync` tối đa 10 trang × 100; cập nhật SQLite và cursor theo user |
| Hiển thị transaction | Đọc qua Query/API; chưa đọc `transactions_cache`, replay chưa invalidate Query cache |
| Expo web | Offline provider không mở DB; enqueue báo không hỗ trợ |

Replay dùng UUID đã lưu làm `Idempotency-Key`. Backend áp dụng idempotency cho POST tạo transaction và transfer; PUT sửa không có middleware này, dù client gửi header. PUT dựa vào `version` nên có thể conflict nếu lần trước đã commit hoặc client khác sửa. Idempotency record POST có thời hạn 24 giờ; không khẳng định chống trùng vô thời hạn.

SQLite schema hiện `user_version=4`; upgrade từ schema cũ không có owner sẽ xóa cache/outbox cũ vì không thể gán an toàn cho tài khoản đang đăng nhập. Outbox thành công được đánh dấu `synced`; chưa có cleanup định kỳ trong provider.

Do các giới hạn trên, không mô tả mọi tính năng là offline-first. Xem [architecture](../../docs/architecture.md), [diagrams](../../docs/diagrams.md), [business rules](../../docs/business_rules.md).

## 7. AI, camera, push và deep link

Chatbot mobile và advisor gọi REST AI API. Chat widget lưu hội thoại trong state theo user, chưa dùng CopilotKit browser write tools. OCR nhận ảnh camera/thư viện, gợi ý amount/date/note/category rồi mở form để kiểm tra trước lưu. Report tải PDF/Excel từ API và dùng file-system/sharing ở client.

Push có nút đăng ký trong profile, cần permission, device ID và Expo project ID. Source bỏ qua API notifications trong Expo Go, báo không hỗ trợ push trên web. Development/release native build cùng credentials APNs/FCM cần được chuẩn bị để kiểm thử push.

`app.json` khai báo scheme `moneymate`, iOS bundle/Android package `vn.moneymate.app`, associated domain và intent filter `app.moneymate.vn`. Đây là cấu hình dự kiến; domain association files và việc mở link trên app đã ký cần kiểm chứng ngoài repo.

## 8. Lệnh và mức kiểm chứng

Chạy từ root:

```powershell
npm run typecheck --workspace=moneymate-mobile
npm run lint --workspace=moneymate-mobile
npm run build --workspace=moneymate-mobile
npm run build:web --workspace=moneymate-mobile
```

| Lệnh | Output/ý nghĩa |
| --- | --- |
| `typecheck` | `tsc --noEmit` |
| `lint` | `expo lint` |
| `build` | Typecheck + Android bundle/assets export vào `apps/mobile/dist/` |
| `build:web` | Expo web export vào `.tmp-web-export/` |
| `npm run android --workspace=moneymate-mobile` | Metro và mở target Android |
| `npm run ios --workspace=moneymate-mobile` | Metro và mở target iOS nếu host có môi trường phù hợp |
| `npm run web --workspace=moneymate-mobile` | Chạy Expo web |

Trong `apps/mobile/`, có thể chạy `npx expo-doctor` và `npx expo export --platform ios --output-dir dist-ios` cho chẩn đoán/export bổ sung. Export không tạo APK/AAB/IPA đã ký, không chạy app trên thiết bị và không submit store. Workspace chưa có script test unit/integration/E2E riêng; `npm test` root chạy backend/web, không tự kiểm thử mobile.

CI khai báo Android/web export, không có EAS signing/store release. `eas.json` có development/preview/production profiles nhưng chưa đủ để chứng minh project/credentials đã được liên kết; manifest hiện chưa khai báo `expo-dev-client`. Xem [mobile release](../../docs/mobile_release.md) trước khi tạo development binary.

[Tài liệu project](../../docs/README.md) · [Cấu trúc](../../docs/project-structure.md) · [Testing](../../docs/testing.md) · [Troubleshooting](../../docs/troubleshooting.md) · [Deployment](../../docs/deployment.md)
