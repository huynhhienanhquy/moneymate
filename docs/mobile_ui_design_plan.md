# MoneyMate Mobile UI Design Plan

> **Mục tiêu:** Thiết kế giao diện mobile đồng bộ với nhận diện và cấu trúc thông tin của web, đồng thời giữ trải nghiệm native phù hợp iOS/Android.
>
> **Nền tảng:** React Native, Expo SDK 54, Expo Router.

## 1. Nguyên tắc Thiết kế

- Giữ cùng màu sắc, typography, icon, trạng thái và nhận diện MoneyMate với web.
- Giữ cấu trúc sidebar của web nhưng chuyển thành navigation drawer native trên điện thoại; table và modal vẫn dùng pattern mobile phù hợp.
- Ưu tiên thông tin tài chính quan trọng, thao tác một tay và khả năng đọc số tiền.
- Mọi màn hình phải hỗ trợ loading, empty, error và offline state.
- Hỗ trợ light mode, dark mode, accessibility và font scaling.
- Không làm mất cơ chế offline, outbox, đồng bộ và xử lý conflict hiện tại.

## 2. Design Foundation

Chuẩn hóa token dùng chung giữa web và mobile:

- Màu brand, cyan, violet, income, expense và warning.
- Typography và cấp độ tiêu đề.
- Spacing theo hệ 4/8px.
- Border radius, shadow và glass surface.
- Kích thước icon và touch target.
- Màu light/dark mode.
- Trạng thái pressed, focused, disabled, loading và error.

Token dùng chung được đặt trong `@moneymate/design-tokens`. Web và mobile không định nghĩa lại các giá trị cùng ý nghĩa ở nhiều nơi.

## 3. Component System

| Web | Mobile |
| :--- | :--- |
| `app-shell-card` | `ShellCard` |
| `app-card` | `Card` |
| `app-stat-card` | `StatCard` |
| `app-primary-button` | `Button` variant `primary` |
| `app-secondary-button` | `Button` variant `secondary` |
| `app-danger-button` | `Button` variant `danger` |
| `app-input` | `Field` |
| `app-badge-*` | `Badge` |
| `app-page-header` | `PageHeader` |
| Modal | `BottomSheet` hoặc native modal |
| Sidebar | `AppDrawer` trượt từ trái, cùng menu và thứ tự với web |
| Web topbar | `MobileTopBar` cố định: menu, tiêu đề, chuông và avatar |
| Notification dropdown | `NotificationPanel` dạng sheet/popover từ topbar |
| Table | Mobile list/card |
| Toast | Mobile toast/banner |
| Empty state | `EmptyState` |
| Skeleton | `SkeletonCard` |

Mỗi component phải hỗ trợ loading, disabled, error, accessibility và dark mode.

## 4. Navigation Architecture

### 4.1 Sidebar/Drawer giống web

Thay bottom tabs và More menu bằng một drawer trượt từ trái. Drawer mở bằng nút hamburger trên topbar, hỗ trợ swipe từ cạnh trái và đóng sau khi chuyển màn hình.

Thứ tự menu phải đồng nhất với web:

1. Tổng quan.
2. Ví tài khoản.
3. Giao dịch.
4. Danh mục.
5. Ngân sách.
6. Mục tiêu.
7. Định kỳ.
8. Báo cáo.
9. Tiết kiệm tháng.
10. AI Tài chính.
11. Hồ sơ.
12. Quản trị, chỉ hiển thị với tài khoản `ADMIN` khi mobile hỗ trợ màn này.

Drawer gồm ba vùng:

- Brand header: logo gradient, MoneyMate, dòng `Smart Finance` và nút đóng.
- Navigation scrollable: icon, nhãn và trạng thái active gradient giống web.
- Account footer: avatar, họ tên/email, đổi theme và đăng xuất.

Drawer rộng khoảng 82–86% màn hình, tối đa 320px. Phần còn lại có scrim tối; chạm scrim hoặc nút Back Android sẽ đóng drawer.

### 4.2 Topbar toàn ứng dụng

Mọi màn hình đã đăng nhập dùng chung một topbar cố định trong safe area:

- Trái: nút hamburger mở drawer.
- Giữa: tên màn hình hiện tại; có thể kèm nhãn MoneyMate nhỏ.
- Phải: chuông thông báo có unread badge và avatar mở Hồ sơ.
- Không cho từng màn tự thay thế chuông bằng nút action; nút thêm mới/chỉnh sửa chuyển xuống FAB hoặc page content.
- Topbar có glass surface, border và shadow đồng bộ topbar web.

### 4.3 Stack theo module

Drawer điều hướng tới màn gốc của từng module. Mỗi module tiếp tục dùng Stack cho danh sách, chi tiết, tạo mới và chỉnh sửa. Màn con hiển thị nút Back thay hamburger nhưng chuông vẫn nằm trên topbar.

## 5. Ánh xạ Màn hình Web sang Mobile

| Web | Mobile cần thiết kế |
| :--- | :--- |
| Login | Logo gradient, glass form và validation giống web |
| Register | Cùng nhận diện Login và password requirements |
| Dashboard | Tổng tài sản, stat cards, ví, giao dịch mới và shortcut |
| Wallets | Card ví, số dư, loại ví, thêm/sửa và chuyển tiền |
| Transactions | Filter chips, search, transaction cards và FAB thêm mới |
| Categories | Grid icon/màu, phân nhóm thu và chi |
| Budgets | Progress card, cảnh báo 80%/100% và form tạo/sửa |
| Saving Goals | Progress, deadline, nạp và rút tiền |
| Recurring | Trạng thái active, chu kỳ và ngày chạy tiếp theo |
| Reports | Biểu đồ native, bộ lọc thời gian và export |
| Monthly Balance | Thu nhập, chi tiêu và tích lũy theo tháng |
| AI Advisor | Chat bubbles, prompt suggestions và insight cards |
| Profile | Avatar, thông tin, theme, security và sessions |
| Notifications | Chuông trên topbar, unread badge, panel xem nhanh, danh sách đầy đủ và deep link |
| Receipt Scanner | Camera, crop/review, OCR form và xác nhận |

## 6. Dashboard Mobile

Dashboard là màn ưu tiên cao nhất:

- Topbar chung có menu drawer, avatar và chuông thông báo.
- Hero card tổng tài sản dùng gradient xanh–cyan.
- Hai stat card thu và chi trong tháng.
- Quick actions: thêm thu, thêm chi, chuyển tiền và quét hóa đơn.
- Danh sách ví dạng horizontal carousel.
- Ngân sách sắp vượt giới hạn.
- Mục tiêu tiết kiệm gần nhất.
- Giao dịch gần đây.
- AI insight ngắn.

## 7. Responsive Mobile

Thiết kế và kiểm tra tối thiểu trên:

- Màn hình nhỏ 320–375px.
- iPhone tiêu chuẩn 390–430px.
- Android nhỏ và Android lớn.
- Safe area và Dynamic Island.
- Bàn phím và form dài.
- Font scaling 100–130%.
- Portrait là chế độ chính; camera hỗ trợ xoay nếu cần.
- Số tiền và nội dung dài không được tràn card.

## 8. Motion và Feedback

- Card xuất hiện nhẹ khi dữ liệu tải xong.
- Press scale hoặc opacity cho button và card.
- Skeleton khi tải dữ liệu.
- Pull-to-refresh cho màn danh sách.
- Haptic feedback khi tạo hoặc xóa giao dịch.
- Success/error toast.
- Progress animation cho ngân sách và mục tiêu.
- Không dùng animation dài hoặc ảnh hưởng thiết bị yếu.

Drawer dùng animation trượt 200–250ms và scrim fade. Notification panel dùng sheet/popover ngắn, tôn trọng thiết lập Reduce Motion.

## 8.1 Notification trên Topbar

- Query dùng chung key `['notifications']`, đồng bộ với màn danh sách thông báo.
- Badge hiển thị số chưa đọc; từ 10 trở lên hiển thị `9+`.
- Tự refetch mỗi 60 giây, refetch khi app trở lại foreground và cập nhật ngay khi nhận push.
- Chạm chuông mở `NotificationPanel` thay vì chuyển màn ngay.
- Panel hiển thị tối đa 5 thông báo gần nhất, trạng thái loading/empty/error, thao tác đọc, đọc tất cả và xóa.
- Chạm nội dung thông báo đánh dấu đã đọc, đóng panel và mở deep link hợp lệ.
- Có nút `Xem tất cả` dẫn tới màn Thông báo đầy đủ.
- Chuông có `accessibilityLabel`; badge được đọc thành “N thông báo chưa đọc”. Touch target tối thiểu 44x44px.

## 9. Dark Mode

- Nền slate/navy gradient tương ứng web.
- Card slate trong suốt.
- Border sáng nhẹ.
- Brand color giữ đủ độ tương phản.
- Thu, chi và warning đạt contrast.
- Biểu đồ có palette riêng cho dark mode.
- Theo system theme và cho phép đổi thủ công.

## 10. Các Giai đoạn Triển khai

### Giai đoạn 1 — Foundation

- Shared design tokens.
- Theme provider light/dark.
- Card, button, input, badge và header.
- Skeleton, empty state và toast.
- App Drawer thay bottom navigation.
- Mobile Topbar dùng chung.
- Notification Bell và Notification Panel trên topbar.

### Giai đoạn 2 — Core Finance

- Login và Register.
- Dashboard.
- Wallets.
- Transactions và transaction form.
- Categories.

### Giai đoạn 3 — Planning

- Budgets.
- Saving goals.
- Recurring transactions.
- Notifications.

### Giai đoạn 4 — Insights

- Reports và biểu đồ.
- Monthly balance.
- AI Advisor.
- Receipt Scanner.

### Giai đoạn 5 — Account và Hoàn thiện

- Profile.
- Session management.
- Security settings.
- Dark mode.
- Accessibility.
- Motion và haptics.

### Giai đoạn 6 — QA

- Kiểm tra bằng Expo Go SDK 54.
- Kiểm tra trên iPhone và Android thật.
- Visual comparison với web.
- Kiểm tra empty/loading/error/offline states.
- Chạy typecheck, lint, Expo Doctor và production bundle.
- Kiểm tra drawer bằng swipe, Android Back, deep link và điều hướng lồng nhau.
- Kiểm tra notification badge/panel với 0, 1, 9 và trên 9 thông báo chưa đọc.

## 11. Definition of Done

Một màn được xem là hoàn thành khi:

- Dùng token chung, không hard-code màu tùy ý.
- Có loading, empty, error và offline state.
- Hoạt động tốt trên màn hình nhỏ.
- Không bị bàn phím che form.
- Hỗ trợ light và dark mode.
- Có accessibility label và touch target tối thiểu 44px.
- Đồng nhất nội dung, icon và thứ tự thông tin với web.
- Typecheck và lint đạt.
- Đã kiểm tra trực quan trên ít nhất một iPhone và một Android.
- Không làm mất tính năng offline và đồng bộ hiện tại.
- Sidebar có đủ menu, đúng thứ tự và active state như web.
- Topbar luôn có chuông thông báo trên mọi màn hình đã đăng nhập.
- Badge và panel thông báo cập nhật sau thao tác đọc/xóa và khi nhận push.

## 12. Thứ tự Ưu tiên

1. Chuyển navigation shell sang Drawer và Topbar dùng chung.
2. Đưa Notification Bell, unread badge và panel lên topbar.
3. Xóa bottom tabs/More sau khi mọi route đã được chuyển sang drawer.
4. Hoàn thiện token và dark mode cho drawer/topbar.
5. Kiểm tra lại tất cả module qua drawer và deep link.
6. Accessibility, motion và QA thiết bị thật.

## 13. Trạng thái triển khai (22/08/2026)

Các giai đoạn phát triển trong repository đã được triển khai trên Expo SDK 54:

- Foundation: giao diện sáng đồng bộ web, gradient/glass surface, bottom tabs + More, card, field, button variants, badge, progress, sheet, chips, empty/loading/error và skeleton.
- Core Finance: đăng nhập, đăng ký, dashboard, quick actions, ví, chuyển tiền, giao dịch thêm/sửa/xóa/tìm kiếm/lọc, danh mục và outbox offline.
- Planning: ngân sách, mục tiêu tiết kiệm, giao dịch định kỳ và thông báo.
- Insights: báo cáo, biểu đồ, cân đối tháng, AI Advisor và quét hóa đơn bằng camera/OCR.
- Account: cập nhật hồ sơ, đổi mật khẩu, sinh trắc học, push notification, quản lý session, đăng xuất và xóa tài khoản.
- UX: safe area, form cuộn khi mở bàn phím, touch target, accessibility label, pressed feedback và pull-to-refresh trên dashboard.
- QA tự động: TypeScript và ESLint đạt; production bundle iOS và Android tạo thành công bằng Expo SDK 54.

Kiểm thử trực quan trên iPhone/Android vật lý, dark mode toàn ứng dụng và haptic/toast native cần được xác nhận trong vòng QA thiết bị trước khi phát hành store; đây là bước phụ thuộc thiết bị, không thể xác nhận chỉ bằng build máy phát triển.

## 14. Kế hoạch cập nhật Navigation Shell

> **Trạng thái:** Đã triển khai trong mobile app ngày 22/08/2026. Bottom tab đã được ẩn; topbar, drawer, notification badge/panel và điều hướng tới toàn bộ module đã hoạt động. Các bước kiểm tra typecheck, lint và production bundle Android/iOS đều đạt.

Phần này thay thế quyết định cũ dùng bottom tabs + More:

1. Tạo navigation drawer dùng chung và ánh xạ toàn bộ menu web sang Expo Router.
2. Di chuyển các màn hiện tại ra khỏi phụ thuộc `(tabs)` nhưng giữ URL/deep link tương thích nếu có thể.
3. Tạo `MobileTopBar` ở cấp layout, nhận title từ route metadata và không render header riêng lặp lại trong `Screen`.
4. Tạo `NotificationBell` dùng React Query, unread badge và foreground refresh.
5. Tạo `NotificationPanel` dạng bottom sheet trên màn nhỏ; hỗ trợ đọc, đọc tất cả, xóa, deep link và `Xem tất cả`.
6. Đưa action của từng trang xuống FAB hoặc phần nội dung để topbar luôn nhất quán.
7. Thêm user card, theme action và logout vào footer drawer; ẩn menu theo role.
8. Xóa tab bar và màn More sau khi route migration hoàn tất.
9. Kiểm thử typecheck/lint, production bundle iOS/Android và trực quan trên thiết bị thật.

### Tiêu chí nghiệm thu riêng

- Mở app sau đăng nhập thấy topbar với hamburger, tên màn, chuông và avatar.
- Hamburger/swipe mở sidebar có giao diện, icon, thứ tự và active state tương ứng web.
- Chuông luôn hiển thị trên topbar; badge phản ánh đúng `unreadCount` mà không cần vào màn Thông báo.
- Người dùng có thể xử lý thông báo ngay trong panel và đi tới nội dung liên quan bằng deep link.
- Điều hướng không tạo hai header, không còn tab bar che nội dung và Android Back hoạt động đúng.
