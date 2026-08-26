# MoneyMate Unified Web & Mobile UI/UX Redesign Plan

> **Mục tiêu:** Nâng cấp đồng bộ giao diện web và mobile để đẹp, sinh động, dễ hiểu, thao tác nhanh và tạo cảm giác tin cậy cho một sản phẩm quản lý tài chính.
>
> **Phạm vi:** React/Vite web, React Native/Expo SDK 54 mobile và package design token dùng chung.

## 1. Mục tiêu trải nghiệm

- Người dùng mới hiểu dashboard và tạo giao dịch đầu tiên trong dưới 2 phút.
- Các thao tác thường xuyên như thêm thu/chi, chuyển tiền và quét hóa đơn hoàn thành trong tối đa 3 bước chính.
- Web và mobile dùng cùng nhận diện, thuật ngữ, icon, màu trạng thái và thứ tự thông tin.
- Giao diện sinh động nhưng không gây mất tập trung hoặc làm chậm thiết bị.
- Luôn giải thích rõ trạng thái loading, thành công, lỗi, offline và xung đột dữ liệu.
- Đảm bảo khả năng đọc số tiền, độ tương phản, font scaling và touch target.

## 2. Nguyên tắc thiết kế

1. **Clarity first:** số dư, thu, chi, ngân sách và tiến độ là thông tin nổi bật nhất.
2. **One primary action:** mỗi màn chỉ có một hành động chính nổi bật.
3. **Progressive disclosure:** chỉ hiển thị chi tiết nâng cao khi người dùng cần.
4. **Consistent feedback:** mọi thao tác tạo/sửa/xóa đều có loading và kết quả rõ ràng.
5. **Friendly finance:** dùng ngôn ngữ gần gũi, biểu đồ dễ đọc và microcopy tích cực.
6. **Native by platform:** web tối ưu chuột/bàn phím; mobile tối ưu một tay, safe area và gesture.
7. **Motion with purpose:** animation chỉ dùng để hướng sự chú ý hoặc giải thích thay đổi trạng thái.

## 3. Design System dùng chung

Mở rộng `@moneymate/design-tokens` thành nguồn duy nhất cho web và mobile:

- Brand palette: blue, cyan, violet và gradient chính.
- Semantic palette: income, expense, success, warning, danger và info.
- Light/dark surfaces, text, border, overlay và chart palette.
- Typography scale, font weight, line height và kiểu hiển thị số tiền.
- Spacing theo hệ 4/8px; radius, shadow, blur và elevation.
- Motion tokens: duration 120/200/300ms và easing chuẩn.
- Breakpoints web và kích thước touch target mobile tối thiểu 44px.

Component chung về hành vi và hình ảnh:

- App shell, sidebar/drawer, topbar và page header.
- Button, icon button, field, select, date picker, search và filter chips.
- Card, stat card, wallet card, transaction row/card và list item.
- Badge, progress, avatar, tooltip, toast, banner và confirmation dialog.
- Modal web, bottom sheet mobile, skeleton, empty state và error state.
- Chart container, legend, period selector và insight card.

Mỗi component cần có variants, pressed/hover/focus, disabled, loading, error, light/dark và accessibility.

## 4. Visual Direction

- Phong cách hiện đại, sáng và tin cậy; glass surface dùng có chọn lọc trên app shell và hero card.
- Gradient xanh–cyan là điểm nhận diện, không phủ lên quá nhiều khu vực.
- Card phân cấp bằng surface, border và spacing; hạn chế shadow dày.
- Income dùng xanh lá, expense dùng rose; không dùng màu là dấu hiệu duy nhất.
- Icon nhất quán theo một bộ và cùng stroke weight.
- Dùng illustration nhỏ cho onboarding/empty state, không dùng hình trang trí che dữ liệu.
- Dark mode dùng slate/navy, không chỉ đảo màu light mode.

## 5. Information Architecture

### Web

- Sidebar cố định: Tổng quan, Ví, Giao dịch, Danh mục, Ngân sách, Mục tiêu, Định kỳ, Báo cáo, Tiết kiệm tháng, AI và Hồ sơ.
- Topbar: context/title, tìm kiếm khi phù hợp, chuông thông báo, theme và avatar.
- Nội dung dùng max-width hợp lý, responsive từ desktop xuống tablet/mobile web.

### Mobile

- Drawer giữ cùng thứ tự menu với web.
- Topbar cố định: hamburger/back, title, notification badge và avatar.
- FAB hoặc sticky action cho hành động chính.
- Bottom sheet cho filter, form ngắn, lựa chọn ví/danh mục và notification panel.

Web và mobile phải giữ route, tên menu và terminology đồng nhất.

## 6. Kế hoạch theo màn hình

### Authentication

- Login/Register có logo gradient, value proposition ngắn và form rõ ràng.
- Validation inline, show/hide password, password requirements và loading button.
- Mobile form không bị bàn phím che; web có layout cân đối trên màn rộng.

### Dashboard

- Hero tổng tài sản, thu/chi tháng và xu hướng so với kỳ trước.
- Quick actions: thêm thu, thêm chi, chuyển tiền và quét hóa đơn.
- Ví, ngân sách gần giới hạn, mục tiêu gần nhất và giao dịch gần đây.
- AI insight ngắn, có lý do và CTA cụ thể.
- Cho phép ẩn/hiện số tiền nhạy cảm.

### Wallets và Transfer

- Wallet card có icon theo loại, số dư, currency và action rõ ràng.
- Tổng số dư và phân bổ tài sản dễ quét.
- Transfer form hiển thị ví nguồn/đích, số dư khả dụng và preview sau chuyển.

### Transactions

- Search, filter chips, date range và loại thu/chi/chuyển.
- Group theo ngày; icon danh mục và màu trạng thái nhất quán.
- Web dùng table responsive; mobile dùng card/list và swipe action có xác nhận.
- Form số tiền ưu tiên lớn, chọn ví/danh mục nhanh và giữ offline outbox.

### Categories

- Chia rõ Thu nhập/Chi tiêu.
- Grid icon/màu dễ nhận biết; preview trực tiếp khi tạo hoặc sửa.

### Budgets

- Progress trực quan với mốc bình thường, 80% và 100%.
- Hiển thị đã dùng, giới hạn, còn lại và dự báo cuối kỳ.
- Warning có hướng xử lý, không chỉ đổi sang màu đỏ.

### Saving Goals

- Hero tiến độ, deadline, số tiền còn lại và mức đóng góp đề xuất.
- Nạp/rút tiền qua bottom sheet hoặc modal có preview số dư.
- Animation chúc mừng ngắn khi hoàn thành mục tiêu.

### Recurring

- Timeline lần chạy tiếp theo, trạng thái active/paused và frequency dễ đọc.
- Cho phép tạo, sửa, tạm dừng và xóa với feedback rõ ràng.

### Reports và Monthly Balance

- Biểu đồ có summary bằng chữ, tooltip, legend và bộ lọc kỳ.
- Palette đạt contrast; không yêu cầu người dùng suy luận chỉ từ màu.
- Export có progress và thông báo vị trí file.

### AI Advisor

- Insight cards trước chat, prompt suggestions và chat bubble dễ đọc.
- Giải thích AI dựa trên dữ liệu nào; phân biệt gợi ý với kết luận chắc chắn.
- Có loading animation ngắn và CTA dẫn tới module liên quan.

### Notifications

- Badge trên topbar của mọi màn đã đăng nhập.
- Panel xem nhanh 5 mục; màn đầy đủ hỗ trợ đọc, đọc tất cả, xóa và deep link.
- Phân biệt unread bằng surface + indicator, không chỉ font đậm.

### Profile và Settings

- Avatar, hồ sơ, theme, security, biometrics, sessions và notification preferences.
- Dangerous zone tách riêng; yêu cầu xác nhận rõ ràng.

### Receipt Scanner

- Hướng dẫn camera bằng overlay, trạng thái xử lý OCR và review trước khi lưu.
- Cho sửa số tiền, ngày, danh mục và ví khi OCR chưa chính xác.

## 7. Motion và cảm giác sinh động

- Page/card entrance nhẹ 160–220ms.
- Button/card press scale 0.98 hoặc opacity; web có hover lift tối đa 2px.
- Progress bar animate khi dữ liệu xuất hiện.
- Number transition cho tổng tài sản nếu không ảnh hưởng khả năng đọc.
- Drawer, sheet và notification panel dùng motion 200–250ms.
- Success dùng check animation hoặc haptic nhẹ; destructive action dùng warning haptic.
- Skeleton shimmer tinh tế; tránh spinner toàn màn hình kéo dài.
- Hỗ trợ Reduce Motion và không dùng animation vô hạn ngoài loading.

## 8. Trạng thái và microcopy

Mọi module phải có:

- Skeleton/loading phản ánh đúng bố cục sắp xuất hiện.
- Empty state giải thích lợi ích và có CTA tạo dữ liệu đầu tiên.
- Error state nói rõ vấn đề, giữ dữ liệu đã nhập và có nút thử lại.
- Offline banner, pending sync indicator và conflict resolution rõ ràng.
- Toast success/error ngắn; lỗi form hiển thị gần field liên quan.
- Confirmation cho xóa/chuyển tiền; ưu tiên undo nếu nghiệp vụ cho phép.

Microcopy dùng tiếng Việt nhất quán, tránh enum kỹ thuật như `EXPENSE`, `MONTHLY` xuất hiện trong UI.

## 9. Accessibility và responsive

- Contrast tối thiểu WCAG AA.
- Keyboard navigation, focus ring và skip link trên web.
- Screen reader label, role, state và reading order trên mobile.
- Touch target tối thiểu 44x44px; khoảng cách giữa action nguy hiểm và action chính.
- Font scaling mobile 100–130% không vỡ layout.
- Kiểm tra web tại 360, 768, 1024, 1440px.
- Kiểm tra mobile tại 320–375px, 390–430px và Android lớn.
- Nội dung dài, tên ví dài và số tiền lớn không tràn card.

## 10. Các giai đoạn thực hiện

### Giai đoạn 0 — Audit và baseline

- Chụp toàn bộ màn hiện tại trên web/iOS/Android.
- Lập inventory component, màu hard-code, pattern trùng lặp và lỗi UX.
- Ghi baseline: thời gian hoàn thành task, số bước và accessibility issues.

### Giai đoạn 1 — Foundation

- Hoàn thiện shared tokens, light/dark theme và typography.
- Chuẩn hóa button, field, card, badge, progress, toast, skeleton và empty/error.
- Xây Storybook/component showcase web và gallery screen nội bộ mobile nếu cần.

### Giai đoạn 2 — Navigation và Shell

- Hoàn thiện sidebar/topbar web và drawer/topbar mobile.
- Notification bell/panel, avatar, theme và active route.
- Responsive shell, safe area, keyboard và deep link.

### Giai đoạn 3 — Core journeys

- Login/Register.
- Dashboard.
- Wallets/Transfer.
- Transactions và Categories.

### Giai đoạn 4 — Planning journeys

- Budgets.
- Saving Goals.
- Recurring.
- Notifications.

### Giai đoạn 5 — Insights và account

- Reports/Monthly Balance.
- AI Advisor.
- Receipt Scanner.
- Profile, security và sessions.

### Giai đoạn 6 — Delight và hardening

- Motion, haptics, toast và celebration.
- Dark mode hoàn chỉnh.
- Accessibility, performance và responsive edge cases.
- Visual regression và device QA.

## 11. QA Matrix

- Web: Chrome, Edge, Firefox và Safari; keyboard-only và zoom 200%.
- Mobile: Expo Go SDK 54 trên iPhone và Android thật; portrait, safe area và keyboard.
- Theme: light, dark và system.
- Data: loading, empty, normal, long content, very large values, error và offline.
- Network: slow, reconnect, duplicate tap, retry và background/foreground.
- Build: typecheck, lint, unit/component test, production web build, Expo Doctor và iOS/Android bundle.

## 12. Definition of Done

Một màn chỉ hoàn thành khi:

- Khớp design token và component system dùng chung.
- Có đủ loading, empty, error, offline và success feedback.
- Hoàn thành action chính với số bước theo mục tiêu.
- Hoạt động ở light/dark, responsive và font scaling.
- Không còn enum hoặc thuật ngữ kỹ thuật trong UI.
- Touch/keyboard/screen reader flow hợp lý.
- Không có overflow, layout shift đáng kể hoặc animation giật.
- Typecheck/lint/build đạt và đã kiểm tra trực quan trên web + iOS + Android.

## 13. Chỉ số đánh giá

- Thời gian tạo giao dịch đầu tiên.
- Tỷ lệ hoàn thành thêm giao dịch/chuyển tiền/tạo ngân sách.
- Số lần validation error và thao tác quay lại.
- Tỷ lệ mở notification và đi tới deep link.
- Accessibility violations và contrast failures.
- Web Core Web Vitals; mobile startup/render time và dropped frames.
- Phản hồi người dùng về độ rõ ràng, tin cậy và thẩm mỹ.

## 14. Thứ tự ưu tiên triển khai

1. Shared tokens và component foundation.
2. Navigation shell và notification.
3. Dashboard và transaction journey.
4. Wallet, transfer, categories và budgets.
5. Goals, recurring, reports và AI.
6. Profile, scanner và remaining states.
7. Dark mode, motion, accessibility và full QA.

Không triển khai đồng loạt từng màn theo style riêng. Mỗi giai đoạn phải hoàn thiện component dùng chung trước, sau đó áp dụng cùng pattern lên web và mobile để tránh tiếp tục lệch giao diện.

## 15. Trạng thái triển khai

### Đã hoàn thành trong repository

- Mở rộng `@moneymate/design-tokens` với brand/semantic palette, light/dark surfaces, gradient, spacing, radius, typography, motion và touch target.
- Web và mobile cùng đọc token từ package chung; Tailwind không còn định nghĩa lại brand palette.
- Web app shell có page context trên topbar, skip link, landmark/active route, label cho icon action và focus-visible chuẩn.
- Web hỗ trợ `prefers-reduced-motion`, tabular number, skeleton utility và component interaction state.
- Login/Register đã bổ sung label liên kết field và nút hiện/ẩn mật khẩu dùng được bằng bàn phím/screen reader.
- Web routes được lazy-load theo màn hình; production entry bundle giảm từ khoảng 861KB xuống khoảng 307KB trước gzip.
- Mobile card có entrance motion nhẹ; button có haptic feedback và accessibility busy/disabled state.
- Mobile field/chips có accessibility label và selected state; drawer/topbar/notification shell tiếp tục dùng cùng visual language với web.
- Web production build, web lint, mobile typecheck, mobile lint và Android production bundle đều đạt.
- Kiểm tra runtime trang Login web không có console error/warning.

### Cần xác nhận trong QA thiết bị

- Đánh giá motion/haptic trên iPhone và Android thật, gồm Reduce Motion và thiết bị cấu hình thấp.
- Visual regression cho toàn bộ màn có dữ liệu thật ở light/dark và các breakpoint.
- Screen reader VoiceOver/TalkBack, web zoom 200% và keyboard-only flow đầy đủ.
- Đo thời gian hoàn thành task và Core Web Vitals trên bản deploy production.
