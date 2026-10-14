# Theme web và design tokens

> Đối chiếu source ngày 2026-10-13. Đây là hướng dẫn adapter web; theme native có adapter riêng ở `apps/mobile/src/theme/index.tsx`.

## Nguồn và luồng sử dụng

```text
packages/design-tokens/src/index.ts + web.ts
    ↓ TypeScript build thành CommonJS dist/
frontend/tailwind.config.js
    ├─ Named utilities, palette aliases, kích thước và motion
    └─ CSS variables --ui-* và --chart-*
frontend/src/styles/index.css + components
frontend/src/theme/charts.ts → Recharts
```

| Nguồn | Trách nhiệm |
| --- | --- |
| [web.ts](../../../packages/design-tokens/src/web.ts) | Web palette semantic, light/dark colors, chart colors/geometry, font size, layout, shadow |
| [index.ts](../../../packages/design-tokens/src/index.ts) | Tokens nền dùng chung/native, motion, kích thước; export `webTheme` |
| [tailwind.config.js](../../tailwind.config.js) | Map tokens, palette aliases, CSS variables, utilities và font family |
| [index.css](../styles/index.css) | Base styles, component classes, dark/focus/reduced-motion và layout |
| [charts.ts](charts.ts) | Recharts colors, tooltip và numeric geometry |
| [copilotkit.css](../styles/copilotkit.css) | Overrides UI trợ lý |
| [theme.store.ts](../stores/theme.store.ts) | Lưu preference web và áp `.dark` |

Một số alias palette và utility vẫn được định nghĩa trực tiếp trong Tailwind; không phải toàn bộ giá trị style trong app đã được token hóa. Khi sửa foundation, kiểm tra cả shared token lẫn adapter/CSS đang ghi đè.

## Build và refresh token package

Chạy từ root repository:

```powershell
npm run build --workspace=@moneymate/design-tokens
npm run dev --workspace=moneymate-frontend -- --force
```

Package xuất CommonJS. Vite có `optimizeDeps.include` cho `@moneymate/design-tokens` để named imports hoạt động khi dev. Sau khi build package, restart Vite với `--force` và reload trình duyệt để thay optimized dependency cache. Không chỉnh trực tiếp `packages/design-tokens/dist/`.

## Chọn token trong UI

- Surface theo theme: `bg-ui-surface`, `text-ui-text`, `text-ui-muted`, `border-ui-border`.
- Giá trị semantic cố định: palette trong `webTheme.colors`, ví dụ `bg-primary`, `bg-surface-container-lowest`; kiểm tra variant `dark:` khi token đó không tự đổi.
- Kích thước/shadow: `w-sidebar`, `size-icon-nav`, `text-page-title`, `shadow-summary`.
- Motion: `duration-fast`, `duration-normal`, `duration-slow` lấy từ shared motion.

Tailwind tạo biến `--ui-*` ở `:root` và `.dark`. Zustand lưu `light` hoặc `dark` trong localStorage, mặc định web là `dark`. Web không có lựa chọn `system` trong store hiện tại; mobile hỗ trợ lựa chọn này riêng.

Sidebar và khoảng chừa nội dung dùng token `sidebar` để tránh lệch layout. Font web Plus Jakarta Sans được cấu hình ở Tailwind và nạp qua Google Fonts trong [index.html](../../index.html); font native Be Vietnam Pro được đóng gói trong mobile.

## Biểu đồ và màu người dùng

`chartTheme` lấy số đo từ `webTheme.chart`, dùng CSS variables cho màu chart/grid/muted và tooltip. Ví dụ gọi adapter hiện có:

```tsx
import { chartTheme } from '@/theme/charts';

<CartesianGrid stroke={chartTheme.grid} />
<Bar dataKey="expense" fill={chartTheme.expense} />
```

Màu danh mục do người dùng chọn là dữ liệu và có thể ghi đè palette chart. Color input và API payload cần giá trị màu thực như hex; không lưu `rgb(var(--chart-expense))` hoặc tên CSS token vào DB.

## Ranh giới với mobile và nghiệp vụ

Shared package chứa cả foundation và `webTheme`; mobile import foundation rồi điều chỉnh trong theme adapter React Native. Đổi `web.ts` không tự cập nhật mọi style mobile. Đổi token chung có thể ảnh hưởng cả hai client, cần kiểm tra adapter và export tương ứng. Mobile không dùng Tailwind/NativeWind trong source hiện tại.

Route, tiếng Việt hiển thị, format tiền, pagination, validation, số dư và quyền truy cập không phải CSS token. Giữ các quy tắc đó ở module chuyên trách thay vì đưa vào theme.

## Kiểm tra khi thay đổi giao diện

1. Build tokens và frontend; kiểm tra không lỗi import/type.
2. Xem màn hình liên quan ở light/dark, chiều rộng mobile/desktop, trạng thái loading/empty/error.
3. Kiểm tra biểu đồ/tooltip, sidebar alignment, keyboard focus và reduced motion nếu thay layout/motion.
4. Dùng Storybook cho component có story; chạy test liên quan khi thay behavior.

Danh sách này là quy trình QA, không khẳng định từng màn hình đã vượt kiểm tra accessibility. Xem [frontend README](../../README.md), [testing](../../../docs/testing.md), [coding conventions](../../../docs/coding-conventions.md) và [cấu trúc project](../../../docs/project-structure.md).
