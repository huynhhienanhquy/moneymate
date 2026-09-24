# MoneyMate System Diagrams

> Implementation reference, verified against the repository on 2026-09-24.

## System context

```mermaid
flowchart LR
    Web[React web app]
    Mobile[Expo mobile app]
    API[Express API]
    DB[(MySQL)]
    Storage[(Local or S3 storage)]
    OpenAI[OpenAI / CopilotKit]
    Push[Expo push service]

    Web -->|HTTPS + JSON| API
    Mobile -->|HTTPS + JSON| API
    API -->|Prisma| DB
    API -->|attachments| Storage
    API -. optional .-> OpenAI
    API -. optional .-> Push
```

## Authentication and token rotation

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB as MySQL

    Client->>API: POST /api/auth/login
    API->>DB: Verify user and create hashed refresh record
    API-->>Client: Access token + cookie/body refresh token
    Client->>API: POST /api/auth/refresh
    API->>DB: Atomically revoke old token and create successor
    alt valid one-time token
        API-->>Client: New access token + rotated refresh token
    else replay or concurrent reuse
        API->>DB: Revoke the token family
        API-->>Client: 401 REFRESH_TOKEN_REUSED
    end
```

## Financial mutation

```mermaid
flowchart TD
    Start[Authenticated request] --> Validate[Validate body and ownership]
    Validate --> Valid{Valid and user-scoped?}
    Valid -- No --> Reject[Return safe 4xx error]
    Valid -- Yes --> Tx[Execute Prisma transaction]
    Tx --> Commit{Commit succeeded?}
    Commit -- No --> Rollback[Rollback and return error]
    Commit -- Yes --> Invalidate[Invalidate affected report snapshots]
    Invalidate --> Alert{Expense affects a budget?}
    Alert -- Yes --> Notify[Claim threshold and create notification]
    Alert -- No --> Success[Return result]
    Notify --> Success
```

## Copilot interaction

```mermaid
sequenceDiagram
    participant User
    participant Web as Web Copilot UI
    participant Runtime as Authenticated Copilot runtime
    participant Tools as Financial services

    User->>Web: Ask a financial or UI question
    Web->>Runtime: Messages + safe UI context + bearer token
    Runtime->>Runtime: Validate auth, origin, limits, and thread ownership
    alt financial question
        Runtime->>Tools: Run user-scoped read-only tool
        Tools-->>Runtime: Aggregate financial data
        Runtime-->>Web: Stream answer
    else record expense
        Runtime-->>Web: Call recordExpense
        Web->>User: Show review/confirmation form
        User->>Web: Confirm or cancel
    else UI action
        Runtime-->>Web: Call setAppTheme or navigateToPage
        Web->>Web: Apply allowlisted local action
    end
```

## Recurring transaction processing

```mermaid
flowchart TD
    Trigger[Server startup or 24-hour timer] --> Query[Find active schedules due today]
    Query --> Next{Schedule available?}
    Next -- No --> Done[Run complete]
    Next -- Yes --> Dates[Calculate up to 100 missed occurrences]
    Dates --> Claim[Atomically advance nextExecutionDate]
    Claim --> Claimed{Claim succeeded?}
    Claimed -- No --> Next
    Claimed -- Yes --> Generate[Create linked transactions in one DB transaction]
    Generate --> Credit[Apply income credits and invalidate old snapshots]
    Credit --> Commit[Commit]
    Commit --> Post[Best-effort budget alerts and notification]
    Post --> Next
```

## Mobile offline synchronization

```mermaid
flowchart LR
    UI[Mobile mutation] --> Online{Online?}
    Online -- Yes --> API[Send with idempotency key]
    Online -- No --> Outbox[(SQLite outbox)]
    Outbox --> Replay[Replay with backoff]
    Replay --> API
    API --> Cache[TanStack Query cache]
    Cursor[Opaque sync cursor] --> Delta[Fetch updated records and tombstones]
    Delta --> Cache
```
