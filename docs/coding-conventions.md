# Quy ước lập trình và Git workflow

> Đối chiếu cấu hình và cách tổ chức code ngày 13/10/2026. [Mục lục](README.md).

## Quy tắc có cấu hình thực thi

| Nguồn | Quy tắc |
| --- | --- |
| [.editorconfig](../.editorconfig) | UTF-8, LF, indent 2 spaces, newline cuối file; Markdown không tự trim trailing spaces |
| [Backend tsconfig](../backend/tsconfig.json) | Strict, ES2022, Node16, source map, build bỏ tests |
| [Web tsconfig](../frontend/tsconfig.json) | Strict, noUnusedLocals/Parameters, noEmit, alias `@/*` |
| [Shared tsconfig](../packages/tsconfig.base.json) | Strict, declaration output, ES2022 |
| [Web ESLint](../frontend/eslint.config.js) | JavaScript/TypeScript và React Hooks; lệnh lint yêu cầu 0 warning |
| [Mobile ESLint](../apps/mobile/eslint.config.js) | Expo flat config |

Repo chưa có cấu hình Prettier, Husky, commitlint hoặc quy tắc bảo vệ branch trong mã nguồn. Một số luật lint web đang tắt, gồm `no-explicit-any` và `react-hooks/exhaustive-deps`; việc lint thành công không thay thế review kiểu dữ liệu hay dependency effect.

## Naming và vị trí file

| Thành phần | Quy ước đang dùng | Ví dụ |
| --- | --- | --- |
| React page/component web | PascalCase folder/file | `pages/WalletsPage/WalletsPage.tsx` |
| React hook | `use` + PascalCase | `useReferenceData.ts` |
| Backend module | kebab-case và hậu tố trách nhiệm | `saving-goal.service.ts`, `auth.controller.ts` |
| Hàm/biến | camelCase | `createTransaction`, `walletId` |
| Class/interface/type | PascalCase | `TransactionService`, `LoginRequest` |
| Constant/enum nghiệp vụ | UPPER_SNAKE_CASE | `MAX_RECURRING_OCCURRENCES_PER_RUN`, `EXPENSE` |
| Mobile route | Theo tên file Expo Router | `saving-goals.tsx`, `(tabs)/index.tsx` |
| Mobile component dùng chung | kebab-case | `navigation-shell.tsx`, `app-icon.tsx` |
| Test | `.test.ts`/`.test.tsx` | `auth.service.test.ts`, `App.test.tsx` |

Giữ phong cách của module đang sửa; không đổi hàng loạt tên hoặc định dạng trong cùng một thay đổi nhỏ.

## Ranh giới trách nhiệm

Luồng backend là route → middleware/validator → controller → service → repository/Prisma. Controller lấy user đã xác thực, đọc input đã validate, gọi service và trả envelope. Service chịu trách nhiệm ownership, invariant và transaction database. Repository tập trung query/persistence; một số service tài chính trực tiếp dùng `prisma.$transaction` để gộp thao tác.

- Không lấy `userId` gửi trong body để thay thế principal từ middleware auth.
- Dùng `AppError` cho lỗi nghiệp vụ dự kiến và helper response/error middleware cho JSON thống nhất.
- Kiểm tra enum/schema/ownership ở server dù UI đã validate.
- Các write nhiều bản ghi phải giữ transaction/điều kiện atomic hiện có.
- Update/delete giao dịch phải giữ version và hỗ trợ conflict; replay phải giữ idempotency key cũ.
- Khi đổi công thức tài chính, cập nhật đồng thời reports, AI context, tests và [business rules](business_rules.md).

Web dùng service API/query hook cho dữ liệu; auth/theme store cho state ứng dụng. Mobile tách route mỏng, page, component, provider, storage và HTTP adapter. Khi thêm state, xác định nó là cache server, state UI hay dữ liệu bền vững trước khi chọn nơi đặt.

## Kiểu dữ liệu, ngày và tiền

Database dùng Prisma Decimal cho tiền. Các API hiện nhận nhiều amount dạng JSON number và có các bước chuyển `Number(...)`; không suy diễn rằng package `assertMoney` đã được dùng toàn hệ thống. Định dạng hiển thị dùng VND/`vi-VN`, còn currency của ví không cung cấp FX conversion.

Giữ ID ở dạng string, tên enum đúng schema, timestamp đúng validator. Chuyển ngày từ UI qua helper ngày của từng client; tránh ghép ISO/UTC thủ công làm lệch ngày calendar. Backend tính một số kỳ theo timezone tiến trình, nên thay đổi timezone triển khai cần kiểm tra biên tháng và scheduler. Xem [nghiệp vụ](business_rules.md).

## Import và tái sử dụng

- Dùng alias `@/` nơi workspace đã hỗ trợ; shared package dùng tên `@moneymate/...`.
- Tái sử dụng component/token hiện có trước khi thêm bản sao.
- DTO/schema dùng chung chỉ đưa vào `packages/` khi thật sự cần qua ranh giới nền tảng; không import UI React Native vào web hay dependency server vào client.
- Với auth thay đổi cả validator, contract, API và client; tránh hai payload khác nhau nhưng cùng tên.
- Comment giải thích invariant, giới hạn hoặc quyết định khó thấy từ code; tránh lặp lại tên hàm.

## Git workflow đề xuất

Đây là cách làm khuyến nghị cho đóng góp, không phải pipeline bắt buộc đã cấu hình:

1. Xem `git status` và giữ nguyên thay đổi không thuộc task.
2. Tạo branch cho một mục tiêu, ví dụ `codex/docs-project` hoặc prefix theo quy định của nhóm.
3. Sửa trong phạm vi cần thiết, cập nhật docs/test liên quan, kiểm tra diff.
4. Chạy kiểm tra phù hợp theo [testing.md](testing.md). Dùng database test riêng cho integration.
5. Commit nêu hành vi cụ thể, theo kiểu lịch sử repo: `feat: ...`, `fix: ...`, `refactor: ...`, `docs: ...`.
6. PR mô tả vấn đề, kết quả, validation đã chạy, giới hạn và migration/config cần áp dụng.

Không commit `.env`, token, dữ liệu cá nhân, database dump hoặc build/export artifact. Không chạy live AI check mặc định: đó là thao tác gọi provider có thể tính phí. Với schema change, thêm migration và kế hoạch triển khai; không chỉ sửa schema rồi dùng `db push` để bỏ qua lịch sử.

## Quy tắc riêng của workspace

Đọc `AGENTS.md` liên quan trước khi sửa code. [Mobile AGENTS](../apps/mobile/AGENTS.md) yêu cầu đọc docs Expo đúng phiên bản SDK 57 trước khi viết code mobile. Tài liệu này ghi lại quy ước của repo và không thay thế các chỉ dẫn của người dùng hoặc workspace.
