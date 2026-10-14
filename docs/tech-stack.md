# Tech stack

> Đối chiếu manifest và cấu hình trong repository ngày 13/10/2026. [Mục lục](README.md).

## Nguyên tắc phiên bản

Các giá trị dưới đây là **phiên bản khai báo** trong `package.json`, không phải danh sách phiên bản mới nhất trên Internet. Dấu `^`/`~` cho phép npm chọn phiên bản tương thích; [package-lock.json](../package-lock.json) khóa dependency thực tế. Dùng `npm ci` từ root để cài theo lockfile, không tự nâng dependency chỉ để khớp bảng tài liệu.

| Phạm vi | Công nghệ chính | Khai báo hiện tại | Vai trò |
| --- | --- | --- | --- |
| Runtime | Node.js, npm workspaces | Node `>=22.13`; `.nvmrc` `22.14.0` | Cài/build/chạy monorepo |
| Backend | TypeScript | `^5.4.5` | Strict, target ES2022, module Node16 |
| HTTP API | Express | `^4.19.2` | Routes, middleware, controller |
| Database | MySQL | Image `mysql:8.0` trong Compose | Dữ liệu quan hệ |
| ORM/migration | Prisma, `@prisma/client` | `^5.12.1` | Schema, generated client, migration |
| Backend validation | Zod | `^3.22.4` | Request schema và package validation |
| Authentication | jsonwebtoken, bcryptjs | `^9.0.2`, `^2.4.3` | JWT access và hash mật khẩu |
| Web | React, React DOM | `18.3.1` | SPA |
| Web bundler | Vite | `^8.2.2` | Dev server, proxy, build |
| Web TypeScript | TypeScript | `^5.2.2` | Strict và noEmit |
| Web navigation | React Router DOM | `^7.18.2` | Route bảo vệ và lazy pages |
| Web styles | Tailwind CSS | `^3.4.1` | Utility classes và theme token |
| Web data/state | TanStack Query, Zustand, Axios | `^5.28.9`, `^4.5.2`, `^1.6.8` | Cache, state, HTTP |
| Web charts/icons | Recharts, Lucide React | `^2.12.3`, `^0.363.0` | Biểu đồ và icon |
| Web validation | Zod | `^4.5.4` | Schema tool/frontend; khác major với backend |
| Mobile runtime | Expo | `~57.0.22` | SDK 57 và native modules |
| Mobile UI | React, React Native | `19.2.3`, `0.86.3` | UI iOS/Android |
| Mobile navigation | Expo Router | `~57.0.21` | File-based routing |
| Mobile TypeScript | TypeScript | `~6.0.3` | Typecheck |
| Mobile data/state | TanStack Query, Zustand | `^5.101.4`, `^5.0.15` | Persist query cache và state |
| Mobile local data | expo-sqlite, expo-secure-store | `~57.0.3`, `~57.0.4` | Outbox/cache và lưu phiên native |
| Mobile network | NetInfo, fetch | NetInfo `12.0.1` | Trạng thái kết nối và HTTP adapter riêng |
| AI client | OpenAI SDK | `^6.45.0` | LLM/vision khi có API key |
| Copilot | `@copilotkit/runtime`, `@copilotkit/react-core` | `1.69.0`, dùng API `/v2` trên web | Agent runtime và confirmed tools |
| OCR/PDF input | Tesseract.js, pdf-parse | `^7.0.0`, `^2.4.5` | OCR `vie+eng` và đọc văn bản PDF |
| Export | ExcelJS, PDFKit | `^4.4.0`, `^0.19.1` | Xuất báo cáo |
| Attachment | Multer, AWS S3 SDK | `^2.2.0`, `^3.1116.0` | Upload memory, storage local/S3 |
| API docs | swagger-jsdoc, swagger-ui-express | `^6.3.0`, `^5.0.1` | Swagger UI tại `/api-docs` |

Web và mobile cố ý có phiên bản React, TypeScript và Zustand khác nhau trong manifest hiện tại. Không giả định một dependency hoisted ở root thay thế dependency của từng workspace.

Nguồn: [root](../package.json), [backend](../backend/package.json), [frontend](../frontend/package.json), [mobile](../apps/mobile/package.json).

## Package dùng chung

| Package | Nội dung | Mức sử dụng hiện tại |
| --- | --- | --- |
| [contracts](../packages/contracts/src/index.ts) | DTO auth, platform, login và response envelope | Web/mobile dùng các kiểu auth; chưa có đầy đủ DTO nghiệp vụ tài chính |
| [validation](../packages/validation/src/index.ts) | Schema login/platform và metadata thiết bị | Backend auth validator import |
| [domain](../packages/domain/src/index.ts) | `assertMoney` kiểm tra chuỗi tiền tối đa 2 số thập phân | Helper hiện chưa có import trong app; không bảo đảm toàn bộ API dùng helper này |
| [api-core](../packages/api-core/src/index.ts) | API client abstraction, retry sau unauthorized | Khai báo dependency mobile, nhưng client mobile hiện dùng adapter fetch riêng |
| [design-tokens](../packages/design-tokens/src/index.ts) | Màu và token dùng chung; có entry web | Web/mobile sử dụng để xây theme |

## Công cụ phát triển và kiểm thử

| Công cụ | Công dụng |
| --- | --- |
| Nodemon/ts-node | Chạy backend development |
| Jest 29/ts-jest/Supertest | Backend unit và integration HTTP |
| Vitest 5/Testing Library/jsdom | Frontend component, hooks, store và hành vi |
| ESLint 9/typescript-eslint | Lint web; Expo config cho mobile |
| Storybook 10/addon-a11y | Xem component web; không phải một bộ E2E hay chứng nhận accessibility |
| Expo CLI/EAS profiles | Dev, export và cấu hình build/submission mobile |
| Docker/Compose/Nginx | Build API/web và chạy cùng MySQL |
| GitHub Actions | Validate npm, lint, test, build và smoke Docker |

Chưa có bộ Playwright/Cypress E2E hoặc test runner mobile riêng được cấu hình trong các workspace. Xem [testing](testing.md) về kiểm tra hiện có và QA cần làm thủ công.

## Dịch vụ ngoài và phương án dự phòng

- **OpenAI:** chỉ backend giữ key. AI REST có fallback tùy tác vụ; CopilotKit cần bật flag và có key để khởi tạo.
- **Storage:** mặc định local; S3-compatible là adapter tùy chọn. Database lưu metadata/đường dẫn, không chứa file nhị phân.
- **Push:** backend gọi Expo push khi có thiết bị/token phù hợp. Cấu hình và quyền thiết bị phải được hoàn thành khi phát hành.
- **MySQL:** là dependency chính của nghiệp vụ; Prisma schema dùng provider `mysql`, không có adapter PostgreSQL/SQLite cho backend.

Chi tiết biến môi trường ở [environment-setup.md](environment-setup.md), topology ở [architecture.md](architecture.md), giới hạn khi triển khai ở [deployment.md](deployment.md).
