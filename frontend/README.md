# MoneyMate Web

> Tài liệu cho workspace `moneymate-frontend`, đối chiếu source/cấu hình ngày 2026-10-13. Lệnh bên dưới là quy trình được khai báo; kết quả kiểm thử phải được ghi riêng trong PR hoặc báo cáo chạy lệnh.

Web là SPA cho các luồng quản lý ví, thu/chi, danh mục, ngân sách, mục tiêu, recurring, báo cáo, AI/OCR và quản trị. Đây là client trình duyệt chính; bản Expo web trong `apps/mobile` là một ứng dụng khác.

## Bắt đầu

Từ root repository, dùng Node đáp ứng `>=22.13` và cài dependencies chung:

```powershell
npm ci
npm run build:packages
Copy-Item frontend/.env.example frontend/.env
```

Hoàn thành [thiết lập backend và DB](../docs/environment-setup.md), chạy backend ở terminal khác, sau đó:

```powershell
npm run dev:frontend
```

Mở [web local](http://localhost:5173). Vite phục vụ mọi interface mạng (`host: true`), port mặc định `5173`, proxy `/api` tới `http://localhost:5000`. Cấu hình API loopback hợp lệ có thể đổi origin đích proxy; đọc [vite.config.ts](vite.config.ts) khi backend dùng port khác.

## Stack trong manifest

| Nhóm | Cấu hình khai báo |
| --- | --- |
| UI | React/React DOM `18.3.1`, TypeScript, React Router `^7.18.2` |
| Build | Vite `^8.2.2`, Tailwind CSS `^3.4.1` |
| State/HTTP | TanStack Query 5, Axios, Zustand 4 |
| Biểu đồ/icon | Recharts 2, Lucide React |
| Trợ lý | `@copilotkit/react-core` `1.69.0`, API v2; Zod 4 |
| Kiểm thử/UI catalog | Vitest 5, Testing Library, jsdom, Storybook 10 và a11y addon |

Khoảng phiên bản trên lấy từ [package.json](package.json); bản resolved nằm trong lockfile root. Web và mobile dùng React major khác nhau, không ép web dùng React 19 từ dependency root. Vite có alias/dedupe React về dependency của frontend.

## Biến môi trường

| Biến | Mặc định trong mẫu | Hành vi |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | Base URL của Axios và Copilot runtime |
| `VITE_COPILOTKIT_ENABLED` | `false` | Bật UI Copilot; chỉ chấp nhận `true` hoặc `false` không phân biệt hoa thường |

Các biến `VITE_*` được đưa vào bundle client. Chỉ đặt public URL/feature flag; không đặt server secret. Thay đổi env cần restart dev server hoặc rebuild bundle. Khi develop với API loopback `/api`, [config/api.ts](src/config/api.ts) dùng đường dẫn `/api` cùng origin để cookie và proxy hoạt động thống nhất.

Trong production qua Nginx, giữ base `/api` cùng origin. Nếu dùng API khác origin, cần CORS/cookie/HTTPS phù hợp phía backend, xem [auth sessions](../docs/auth_sessions.md). Frontend Dockerfile nhận các giá trị qua build arguments, không đọc lại env khi container Nginx khởi động.

## Route và truy cập

| Path | Chức năng | Điều kiện UI |
| --- | --- | --- |
| `/login`, `/register` | Đăng nhập, đăng ký | Public |
| `/` | Tổng quan | User private |
| `/wallets`, `/categories`, `/transactions` | Ví, danh mục, giao dịch | User private |
| `/budgets`, `/saving-goals`, `/recurring` | Ngân sách, mục tiêu, lịch định kỳ | User private |
| `/reports`, `/monthly-balance` | Báo cáo và kết dư tháng | User private |
| `/ai`, `/profile` | Tư vấn AI, profile và phiên | User private |
| `/admin` | Quản trị | Role `ADMIN` |

Route paths có nguồn chung ở [constants/routes.ts](src/constants/routes.ts). Các màn hình lazy-load qua [AppRoutes.tsx](src/config/route/AppRoutes.tsx). `PrivateRoute` chuyển tài khoản admin về `/admin`; admin không dùng các route user qua guard này. `AdminRoute` chuyển user thường về `/`, chưa đăng nhập về `/login`. Backend vẫn kiểm tra quyền từng request.

## Dữ liệu và phiên

- TanStack Query quản lý server data. QueryClient mặc định retry một lần và tắt refetch khi window focus; mutation phải invalidate những query chịu ảnh hưởng.
- Zustand giữ auth và theme. Access token chỉ ở bộ nhớ; localStorage có profile cache và lựa chọn theme.
- Axios gắn Bearer header, gửi cookie bằng `withCredentials`, gom refresh đồng thời và retry request 401 một lần. Login/logout được serialize với refresh đang chạy.
- Khởi động có profile cache sẽ gọi refresh để lấy lại token. Lỗi mạng hiện trạng thái thử lại, không tự xóa user; refresh trả 401/403 sẽ xóa phiên.
- Web không có SQLite outbox hoặc cam kết ghi dữ liệu offline. Không coi profile cache là chứng cứ phiên còn hợp lệ.

Các type auth dùng `@moneymate/contracts`; chưa có toàn bộ DTO tài chính dùng chung. Adapter HTTP thực tế nằm tại [services/api/client.ts](src/services/api/client.ts), không dùng factory của `@moneymate/api-core`.

## Trợ lý AI

Copilot mount khi `VITE_COPILOTKIT_ENABLED=true`, phiên đã khôi phục và có access token. Backend phải bật `COPILOTKIT_ENABLED` và có model/key hợp lệ. Khi flag frontend tắt, layout dùng chat REST cũ. Lỗi runtime được hiện trong UI; flag bật không tự đảm bảo model có credit hoặc kết nối được.

Runtime URL được ghép thành `<api-base>/copilotkit`. [MoneyMateCopilotProvider](src/contexts/MoneyMateCopilotProvider.tsx) gửi route, tên màn hình, theme, `vi-VN`, ngày local và timezone làm UI context; token chỉ ở transport header.

| Nhóm browser tools | Tên công cụ | Hành vi |
| --- | --- | --- |
| Ghi giao dịch | `recordExpense`, `recordIncome`, `transferFunds` | Hiện bản nháp để người dùng xác nhận trước REST write |
| Sửa/xóa giao dịch | `updateTransaction`, `deleteTransaction` | Tìm giao dịch qua `findTransactions`, tải lại chi tiết, hiển thị thông tin/thay đổi và chờ xác nhận; gửi version và idempotency key |
| Tạo dữ liệu | `createCategory`, `createWallet`, `createBudget`, `createSavingGoal`, `createRecurringTransaction` | Hiện thẻ/form xác nhận, validate và gọi API sau xác nhận |
| Điều khiển UI | `setAppTheme`, `navigateToPage` | Theme `light`/`dark`, route theo allowlist |

Backend Copilot có 6 công cụ đọc theo user, gồm tìm giao dịch; browser write tools không thay thế backend validation. Khi kết quả tìm có nhiều giao dịch phù hợp, chatbot phải hỏi người dùng chọn. Sửa/xóa áp dụng cho thu/chi, không áp dụng cho TRANSFER. OCR gợi ý dữ liệu hóa đơn để người dùng kiểm tra trước khi lưu. Quy tắc và giới hạn xem [architecture](../docs/architecture.md), [API](../docs/api.md), [business rules](../docs/business_rules.md).

Khung chat được ẩn thay vì unmount khi đóng; thread, nội dung đang nhập và thẻ xác nhận được giữ khi mở lại trong phiên đăng nhập. Refresh trình duyệt hoặc đăng xuất vẫn bắt đầu phiên chat mới; chưa có lưu lịch sử chat lâu dài.

**Lỗi contract hiện tại của Copilot transfer:** [TransferConfirmation](src/components/MoneyMateCopilot/DataMutationTools.tsx) yêu cầu `response.data.data === true`, nhưng [controller API](../backend/src/controllers/transaction.controller.ts) trả object `WalletTransfer` với HTTP `201`. Vì vậy server có thể đã commit chuyển tiền nhưng thẻ xác nhận vẫn báo “Máy chủ chưa xác nhận giao dịch chuyển tiền”, không hoàn tất luồng thành công/invalidate Query. Cần kiểm tra dữ liệu ví/transfer trước khi tạo yêu cầu mới. Retry cùng request/key còn hiệu lực được middleware replay response; tạo tool call/key khác có thể tạo một transfer khác. Đây là giới hạn đã biết của UI Copilot hiện tại, chưa được sửa trong đợt tài liệu hóa.

## Cấu trúc và giao diện

| Thư mục | Trách nhiệm |
| --- | --- |
| `src/config/route`, `constants`, `data`, `helpers` | Routing và navigation |
| `src/pages`, `layouts` | Màn hình và shell |
| `src/components/common` | UI dùng lại |
| `src/components/MoneyMateCopilot` | Chat UI và confirmation tools |
| `src/hooks`, `services`, `stores`, `contexts` | Behavior, HTTP/query, state, providers |
| `src/styles`, `theme` | Tailwind layers, Copilot CSS, Recharts adapter |
| `src/test`, `*.test.*`, `*.stories.*` | Test helpers, tests và Storybook |

`publicDir` trỏ tới [assets/images](../assets/images) tại root. Font web là Plus Jakarta Sans được tải qua Google Fonts trong `index.html`. Design tokens được map bởi Tailwind; xem [theme README](src/theme/README.md) trước khi đổi palette/kích thước. Responsive/dark/focus/reduced-motion được xử lý trong CSS và components, vẫn cần visual/a11y QA khi thay layout.

## Lệnh workspace

Chạy từ root:

| Lệnh | Mục đích |
| --- | --- |
| `npm run dev:frontend` | Dev server |
| `npm run build --workspace=moneymate-frontend` | `tsc` rồi Vite build vào `frontend/dist/` |
| `npm run preview --workspace=moneymate-frontend` | Preview bundle sau build |
| `npm run lint --workspace=moneymate-frontend` | ESLint, không chấp nhận warning |
| `npm run test --workspace=moneymate-frontend` | Vitest một lượt |
| `npm run test:watch --workspace=moneymate-frontend` | Vitest watch |
| `npm run test:coverage --workspace=moneymate-frontend` | V8 coverage |
| `npm run storybook --workspace=moneymate-frontend` | Storybook port `6006` |
| `npm run build-storybook --workspace=moneymate-frontend` | Storybook static |

Vitest dùng jsdom và Testing Library, helpers ở `src/test/`. Coverage thresholds cấu hình 90% cho statements/branches/functions/lines của logic `src/**/*.ts`, loại test/story/types/bootstrap; không phải 90% toàn bộ JSX hoặc toàn bộ project. Không có E2E browser suite được khai báo trong workspace này. Xem [testing](../docs/testing.md).

## Deploy và xử lý lỗi

Dockerfile build app với shared packages, copy `dist/` vào Nginx. [nginx.conf](nginx.conf) có SPA fallback và proxy `/api` với buffering tắt cho stream Copilot. TLS/ingress là cấu hình ngoài Compose hiện tại.

Nếu named export design token không cập nhật, build lại package rồi restart Vite bằng `--force` theo [theme README](src/theme/README.md). Nếu đăng nhập không giữ phiên, kiểm tra cùng origin, CORS/cookie và `VITE_API_URL`; nếu Copilot lỗi, kiểm tra đồng thời flag frontend/backend và key/model server, không đặt API key vào frontend env.

[Tài liệu toàn project](../docs/README.md) · [Cấu trúc](../docs/project-structure.md) · [Thiết lập](../docs/environment-setup.md) · [Deployment](../docs/deployment.md) · [Troubleshooting](../docs/troubleshooting.md) · [Coding conventions](../docs/coding-conventions.md)
