# Runbook phát hành mobile

> Đối chiếu repository ngày 2026-10-13. Đây là quy trình chuẩn bị release cho Expo SDK 57; các mục checklist yêu cầu bằng chứng của môi trường phát hành, không khẳng định signing, store hoặc kiểm thử thiết bị đã hoàn tất.

## 1. Những gì repository đã có

| Hạng mục | Cấu hình hiện tại | Chưa được chứng minh chỉ bằng source |
| --- | --- | --- |
| Version | App/workspace `1.0.0` | Phiên bản đang phát hành trên store |
| Native IDs | `vn.moneymate.app` cho bundle/package | IDs đã đăng ký đúng tài khoản developer |
| Deep links | Scheme `moneymate`, domain `app.moneymate.vn` | Domain ownership, association files và verified links |
| EAS profiles | `development`, `preview`, `production` | Project linkage, credentials, quyền build/submit |
| Version quản lý EAS | `appVersionSource: remote`, production `autoIncrement: true` | Build number/versionCode thực tế của candidate |
| CI | Typecheck/lint, Android/web export, backend/web test, Docker smoke | Signed native build, iOS device QA, store submission |

[eas.json](../apps/mobile/eas.json) đặt development client/internal distribution cho profile development, internal distribution cho preview và submit profile production rỗng. Manifest hiện chưa khai báo `expo-dev-client`; cần chuẩn bị dependency/cấu hình đó nếu dùng development client. Không coi việc có profile EAS là app đã sẵn sàng store.

## 2. Chọn môi trường

- **Local:** API reachable từ máy/phone; có thể suy ra host Metro nếu `EXPO_PUBLIC_API_URL` trống.
- **Preview/staging:** API HTTPS riêng và DB staging, project ID/credentials phù hợp để kiểm thử push.
- **Production:** API HTTPS, DB/storage bền vững, API contract tương thích client đang phát hành.

API URL phải bao gồm `/api`. Android emulator fallback `10.0.2.2`; phone thật không dùng `localhost` của máy tính. Metro tunnel không tunnel API. Expo web cần CORS origin; native request và cookie strategy khác web. Xem [mobile README](../apps/mobile/README.md), [setup](environment-setup.md), [auth sessions](auth_sessions.md).

`EXPO_PUBLIC_*` được đưa vào client bundle. Chỉ dùng public API URL/project ID, không đưa OpenAI/S3/JWT/DB secret vào app. Build lại candidate khi thay public configuration.

## 3. Chuẩn bị ngoài repository

Trước khi tạo native release candidate, chủ release phải xác nhận:

- [ ] Expo/EAS, Apple Developer và Google Play accounts có quyền phù hợp.
- [ ] App IDs, EAS project, signing/provisioning và APNs/FCM credentials đã liên kết đúng môi trường.
- [ ] Development client dependency/config được chuẩn bị nếu profile development được dùng.
- [ ] Domain liên kết được sở hữu và association files khớp app IDs/signing.
- [ ] API HTTPS, migrations, backup/restore, attachment storage và push driver được chuẩn bị.
- [ ] Privacy policy, support contact, store metadata, ảnh chụp và khai báo dữ liệu phản ánh hành vi thật.
- [ ] Không quảng bá biometric auto-lock, offline ảnh hoặc offline toàn bộ tính năng khi source hiện chưa triển khai.

Các cấu hình account/domain/store nằm ngoài worktree này; kiểm tra bằng tài khoản của môi trường đích. [Privacy policy](privacy_policy.md) là tài liệu nội bộ cần hoàn thiện thông tin vận hành trước khi dùng làm bản public.

## 4. Preflight source và bundles

Từ root:

```powershell
npm ci
npm run build:packages
npm run typecheck --workspace=moneymate-mobile
npm run lint --workspace=moneymate-mobile
npm run build --workspace=moneymate-mobile
npm run build:web --workspace=moneymate-mobile
npm test
npm run test:integration
```

Integration backend cần DB test/migration và biến môi trường theo [testing](testing.md). Ghi lại command, commit/worktree, môi trường, kết quả và các test bị skip; không dùng kết quả của DB mock thay cho kiểm tra MySQL.

Chẩn đoán/export iOS bổ sung từ workspace mobile:

```powershell
Set-Location apps/mobile
npx expo-doctor
npx expo export --platform ios --output-dir dist-ios
```

`npm run build` mobile tạo Android JavaScript/assets export và kiểm tra TypeScript. Expo export Android/iOS/web **không tạo APK/AAB/IPA đã ký**, không test native module trên thiết bị và không upload store. EAS build/submit là bước riêng sau khi project/credentials đã được cấu hình.

Preflight này là danh sách cần chạy cho release candidate; không phải báo cáo tất cả lệnh đã pass trong lần viết docs. CI khai báo trong [ci.yml](../.github/workflows/ci.yml) cũng không chứng minh một candidate cụ thể đã pass; kiểm tra run tương ứng.

## 5. Sẵn sàng API và dữ liệu

- [ ] Backup DB production và thử restore trên môi trường tách biệt.
- [ ] Review migration pending; chạy `migrate deploy` theo [deployment](deployment.md), không dùng reset DB production.
- [ ] Kiểm tra auth web/native, refresh rotation, logout và revoke session.
- [ ] Kiểm tra transaction version, idempotency POST, sync cursor/tombstone và tính tương thích với phiên bản mobile cũ.
- [ ] Kiểm tra recurring timer sau restart, report/export và attachment qua API.
- [ ] Kiểm tra push registration/delivery và xử lý token không còn hợp lệ.
- [ ] Xác nhận `/health` và endpoint nghiệp vụ trên staging; `/health` hiện không kiểm tra sâu DB/storage/model.

Compose mặc định không có persistent upload volume, TLS ingress hoặc S3/push env; bổ sung theo môi trường trước khi coi đây là production deployment. Native release không yêu cầu Copilot browser tools, nhưng REST AI/OCR cần provider/key server nếu các chức năng đó được cung cấp.

## 6. Kiểm thử thiết bị cho candidate đã ký

Dùng development/release build trên thiết bị iOS và Android thực. Expo Go, typecheck và bundle export không thay thế bước này.

| Nhóm | Tình huống cần kiểm tra |
| --- | --- |
| Phiên | Register/login, restart + refresh, nhiều request 401 đồng thời, revoked session, đổi mật khẩu, logout offline |
| Tài chính | Ví/danh mục, tạo/sửa/xóa transaction, transfer, ngân sách, mục tiêu, recurring |
| Báo cáo | Monthly/yearly report, kết dư, export PDF/Excel và native share |
| Offline | Tạo và sửa giao dịch mất mạng, reconnect, retry 5xx/409, chuyển tài khoản, không tạo trùng ngoài giới hạn bảo đảm |
| Delta | Edit/delete từ client khác, nhiều trang sync và tombstones |
| Ảnh/OCR | Camera/library permissions, OCR lỗi/không chắc, sửa form trước lưu, upload thất bại sau transaction commit |
| Native privacy | Background shield, screenshot behavior trên từng OS, nút kiểm tra sinh trắc học; chưa có auto-lock |
| Push | Đăng ký token, nhận notification, tap routing, foreground/background/cold start |
| Navigation | Scheme/domain links, Android Back, modal, font scale, light/dark/system và screen reader |
| Lỗi | API timeout, session expired, disk/storage error, permission denied, AI provider unavailable |

### Giới hạn offline cần chấp nhận hoặc sửa trước release

Outbox chỉ được dùng từ form tạo/sửa transaction. Không queue delete/transfer, không persist/replay attachment, không có conflict-resolution UI hay timer retry độc lập. Sync delta hiện ghi SQLite nhưng màn hình giao dịch chưa đọc cache này và replay chưa invalidate Query cache.

POST tạo transaction, PUT sửa và DELETE giao dịch có middleware idempotency tùy chọn với record thời hạn 24 giờ; PUT/DELETE vẫn dựa vào optimistic `version`. Khi client gửi key, retry cùng request đã hoàn tất được replay response. Nếu client không gửi key hoặc key đã hết hạn, retry PUT sau commit có thể trả conflict. Kiểm tra dữ liệu server trước khi hướng dẫn người dùng tạo lại thao tác lỗi. Tài liệu và UI release cần phản ánh đúng giới hạn này.

SQLite migration lên version 4 xóa cache/outbox legacy không có owner. QA upgrade từ binary cũ cần xác nhận hệ quả với dữ liệu đang chờ sync. Logout xóa credential/Query cache nhưng không xóa outbox/delta theo user; cần kiểm tra isolation khi đăng nhập tài khoản khác.

## 7. Candidate, rollout và rollback

1. Chốt version/public config và API contract của candidate; ghi commit, app version và native build numbers.
2. Tạo binary đã ký bằng profile/môi trường EAS được chuẩn bị; kiểm tra trên internal distribution/TestFlight/Play testing.
3. Lưu bằng chứng preflight và device QA, cùng những giới hạn được chấp nhận trước store submission.
4. Rollout theo từng giai đoạn; theo dõi lỗi auth, API, conflict/outbox, push và crash nếu môi trường đã có công cụ thu thập.
5. Nếu lỗi nghiêm trọng, dừng rollout, giữ logs/request IDs/build numbers và xác định API/client/DB nào gây lỗi trước khi sửa.

Rollback mobile phụ thuộc quy trình store/distribution và API vẫn phải tương thích với client còn chạy. Ưu tiên migration sửa tiến lên; không xóa migration đã áp dụng. Muốn tắt UI feature được compile qua public env phải phát hành bundle/binary thích hợp, không chỉ đổi biến backend. Source hiện chưa có cấu hình EAS Update/channel hoặc pipeline OTA, nên không giả định có thể rollback bằng OTA.

Nếu đổi session contract, chuẩn bị phương án revoke và đăng nhập lại. Giữ DB/attachment backup và bằng chứng sự cố để review sau release.

[Tổng quan](overview.md) · [Kiến trúc](architecture.md) · [Requirements](requirements.md) · [Tech stack](tech-stack.md) · [API](api.md) · [Changelog](changelog.md) · [Troubleshooting](troubleshooting.md)
