# Sơ đồ hệ thống

> Dựa trên mã nguồn trong worktree ngày 2026-10-13. Các sơ đồ mô tả luồng đã có trong source; cấu hình môi trường và kiểm thử runtime xem [kiến trúc](architecture.md), [testing](testing.md) và [deployment](deployment.md).

## 1. Thành phần runtime

```mermaid
flowchart LR
    Web[Web React và Vite]
    Mobile[Mobile Expo]
    API[Express API]
    DB[(MySQL qua Prisma)]
    Storage[(File local hoặc S3)]
    AI[OpenAI và CopilotKit]
    Push[Expo Push]
    Secure[(SecureStore native)]
    Cache[(SQLite native và query cache)]

    Web -->|HTTP hoặc HTTPS và JSON| API
    Mobile -->|HTTP hoặc HTTPS và JSON| API
    Mobile --> Secure
    Mobile --> Cache
    API --> DB
    API --> Storage
    API -. cấu hình tùy chọn .-> AI
    API -. cấu hình tùy chọn .-> Push
```

MySQL là dữ liệu server chính. SQLite trên mobile lưu cache/outbox; không kết nối trực tiếp MySQL. HTTPS cần ingress/cấu hình triển khai phù hợp, Compose mặc định chỉ mở HTTP.

## 2. Request tài chính

```mermaid
flowchart TD
    Request[Request REST và Bearer token] --> Route[Route và middleware]
    Route --> Auth{Token và quyền hợp lệ?}
    Auth -->|Không| Reject[HTTP 401 hoặc 403]
    Auth -->|Có| Validate[Validate body và query]
    Validate --> Service[Controller gọi service]
    Service --> Ownership{Ownership và quy tắc hợp lệ?}
    Ownership -->|Không| Error[Trả lỗi 4xx qua error middleware]
    Ownership -->|Có| Repo[Repository hoặc Prisma transaction]
    Repo --> DB[(MySQL)]
    DB --> Response[JSON response hoặc file export]
```

Các endpoint dùng idempotency kiểm tra `Idempotency-Key` sau auth; endpoint cập nhật/xóa transaction còn kiểm tra `version`. Không phải mọi endpoint đều có cùng chuỗi middleware. Xem [API](api.md).

## 3. Phiên web và native

```mermaid
sequenceDiagram
    participant Client as Web hoặc mobile
    participant API as Auth API
    participant DB as MySQL

    Client->>API: POST /api/auth/login với platform và device metadata
    API->>DB: Kiểm tra user, tạo session và hash refresh token
    alt platform web
        API-->>Client: Access token và HttpOnly refresh cookie
    else platform ios hoặc android
        API-->>Client: Access token và refresh token trong body
        Client->>Client: Lưu refresh token vào SecureStore
    end
    Client->>API: Request private với Bearer access token
    API-->>Client: 401 nếu access token không hợp lệ
    Client->>Client: Gom các refresh đồng thời thành một promise
    Client->>API: POST /api/auth/refresh bằng cookie hoặc body
    API->>DB: Kiểm tra và xoay refresh token một lần trong transaction
    alt refresh hợp lệ
        API-->>Client: Access token mới và refresh token mới
        Client->>API: Retry request gốc một lần
    else token đã dùng lại hoặc phiên không còn hợp lệ
        API-->>Client: 401 hoặc 403
        Client->>Client: Xóa credential và quay về đăng nhập
    end
```

Refresh token không lưu plaintext trong MySQL. Nhánh phát hiện reuse có cơ chế thu hồi token family. Lỗi mạng/5xx khi refresh có cách xử lý khác lỗi xác thực; đọc [auth sessions](auth_sessions.md) để biết TTL và điều kiện thu hồi.

## 4. Web Copilot và xác nhận ghi dữ liệu

```mermaid
sequenceDiagram
    participant User as Người dùng
    participant Web as Copilot UI web
    participant Runtime as Copilot runtime có auth
    participant Tools as Financial tools đọc
    participant REST as REST API nghiệp vụ

    User->>Web: Gửi câu hỏi hoặc yêu cầu thao tác
    Web->>Runtime: Messages, UI context và Bearer header
    Runtime->>Runtime: Auth, origin, rate limit và thread ownership
    alt Đọc dữ liệu tài chính
        Runtime->>Tools: Gọi một trong 5 read-only tools theo user
        Tools-->>Runtime: Dữ liệu hoặc thống kê giới hạn
        Runtime-->>Web: Stream trả lời
    else Tạo dữ liệu hoặc chuyển tiền
        Runtime-->>Web: Gọi browser tool chuẩn bị bản nháp
        Web->>User: Hiện form hoặc thẻ kiểm tra thông tin
        alt Người dùng xác nhận
            User->>Web: Xác nhận lưu
            Web->>REST: Request REST được xác thực
            REST-->>Web: Kết quả sau validation và nghiệp vụ
            Web-->>Runtime: Kết quả thành công hoặc lỗi
        else Người dùng hủy
            User->>Web: Hủy
            Web-->>Runtime: Không ghi dữ liệu
        end
    else Đổi theme hoặc điều hướng
        Runtime-->>Web: setAppTheme hoặc navigateToPage
        Web->>Web: Áp dụng giá trị trong allowlist
    end
```

Browser write tools gồm `recordExpense`, `recordIncome`, `transferFunds`, `createCategory`, `createWallet`, `createBudget`, `createSavingGoal`, `createRecurringTransaction`. Backend financial tools đọc không trực tiếp ghi DB. Mobile chatbot dùng REST `/ai/chat`, không dùng luồng browser tools này.

## 5. Recurring transaction

```mermaid
flowchart TD
    Start[API khởi động hoặc timer 24 giờ] --> Query[Tìm lịch active đến hạn]
    Query --> Dates[Tính tối đa 100 lần còn thiếu mỗi lịch]
    Dates --> Tx[Bắt đầu Prisma transaction]
    Tx --> Claim{Claim lịch theo ngày chạy cũ thành công?}
    Claim -->|Không| Skip[Bỏ qua lịch đã được worker khác nhận]
    Claim -->|Có| Generate[Tạo giao dịch liên kết và cập nhật ngày tiếp theo]
    Generate --> Commit{Transaction commit?}
    Commit -->|Không| Rollback[Rollback và báo lỗi]
    Commit -->|Có| Notify[Thông báo và kiểm tra ngân sách sau commit]
    Notify --> Next[Lịch tiếp theo hoặc kết thúc]
    Skip --> Next
```

Timer nằm trong tiến trình API. Claim ở DB giảm việc tạo trùng giữa các lượt đồng thời, nhưng cấu hình này chưa có scheduler/worker riêng. Quy tắc ngày và số dư xem [business rules](business_rules.md).

## 6. Mobile outbox hiện tại

```mermaid
flowchart TD
    Form[Form tạo hoặc sửa transaction] --> Request[Gửi JSON kèm UUID idempotency]
    Request --> Result{Kết quả request}
    Result -->|Thành công| Invalidate[Invalidate Query và cập nhật UI]
    Result -->|HTTP 4xx| Error[Hiện lỗi cho người dùng]
    Result -->|Lỗi mạng hoặc HTTP 5xx| Platform{Native iOS hoặc Android?}
    Platform -->|Không| Unsupported[Web adapter báo không hỗ trợ outbox]
    Platform -->|Có| Outbox[(SQLite outbox theo user)]
    Outbox --> Event[NetInfo báo có kết nối]
    Event --> Replay[Replay tối đa 50 mục đến thời điểm retry]
    Replay --> ReplayResult{Request thành công?}
    ReplayResult -->|Có| Synced[Đánh dấu synced]
    ReplayResult -->|Không| Failed[Đánh dấu failed và đặt next_attempt_at]
    Synced --> Delta[Tải tối đa 10 trang transaction delta]
    Failed --> Delta
    Delta --> Local[(transactions_cache và cursor SQLite)]
```

Ảnh attachment không nằm trong outbox. Delete/transfer chưa đi qua queue này. Backoff chỉ lưu thời điểm retry; chưa có timer replay độc lập hoặc UI xử lý conflict. Delta chưa được nối làm nguồn hiển thị của màn hình giao dịch và replay chưa invalidate Query cache. Đọc [mobile README](../apps/mobile/README.md) trước khi mô tả ứng dụng là offline-first.

Idempotency middleware bảo vệ POST tạo transaction/transfer, PUT sửa và DELETE giao dịch trong thời hạn record 24 giờ; PUT/DELETE vẫn kiểm tra `version` và DELETE đưa query version vào hash. Không hiểu mũi tên replay là bảo đảm exactly-once vô thời hạn cho mọi thao tác.

## 7. Docker Compose

```mermaid
flowchart LR
    Browser[Trình duyệt] -->|HTTP port 80| Nginx[Nginx frontend]
    Nginx -->|SPA dist| Assets[Web bundle]
    Nginx -->|Proxy /api| Backend[Backend port 5000]
    Device[Mobile có API URL phù hợp] -->|API port hoặc ingress| Backend
    Backend -->|migrate deploy trước startup| DB[(MySQL service)]
    DB --> Volume[(mysql_data volume)]
```

API `/health` hiện dùng port backend; Nginx không proxy đường dẫn này. TLS, backup và lưu bền file upload cần bổ sung trong môi trường deploy. CI Docker smoke kiểm tra health, SPA và 401 của route private; đây không phải kiểm thử end-to-end trên thiết bị hoặc xác nhận production.
