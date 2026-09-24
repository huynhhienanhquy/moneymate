# Business Rules - MoneyMate

This document defines the core business rules and logic constraints for the **MoneyMate** Personal Finance Management System.

---

## 1. Authentication & Security (BR-AUTH)

### BR-AUTH-01: Password Hashing
All user passwords must be hashed before storage using the `bcrypt` algorithm with a salt round parameter of at least 10. Raw passwords must never be logged or stored in the database.

### BR-AUTH-02: Session Expiration & Tokens
- **Access Token**: Short-lived JWT (JSON Web Token), expiration set to exactly **15 minutes**. Must contain `userId` and `email` in the payload.
- **Refresh Token**: Long-lived token stored in the database, expiration set to **7 days**. When a new access token is requested using a valid refresh token, the old refresh token is rotated (Refresh Token Rotation) to prevent replay attacks.
- **Revocation**: Logging out deletes the corresponding refresh token from the database, immediately preventing subsequent access token requests with that session.

---

## 2. Wallet & Balance Constraints (BR-WALL)

### BR-WALL-01: Wallet Types
Every wallet must belong to one of the following pre-defined types:
- `CASH` (Tiền mặt)
- `BANK` (Tài khoản ngân hàng)
- `CREDIT_CARD` (Thẻ tín dụng)
- `E_WALLET` (Ví điện tử)
- `SAVING` (Tài khoản tiết kiệm)

### BR-WALL-02: Balance Computations
- Wallet balance is dynamically computed as:
  $$\text{Balance} = \text{Initial Balance} + \sum \text{Income Transactions} - \sum \text{Expense Transactions} - \sum \text{Outward Transfers} + \sum \text{Inward Transfers} - \sum \text{Saving Deposits} + \sum \text{Saving Withdrawals}$$
- The initial balance is set when the wallet is created and can be updated through a balance adjustment transaction.

### BR-WALL-03: Negative Balances
- Wallets of type `CREDIT_CARD` are allowed to have a negative balance up to their credit limit.
- Other wallet types (`CASH`, `BANK`, `E_WALLET`, `SAVING`) can go negative if the user records transactions retrospectively, but the UI should display a warning state, and API requests that would cause a negative balance can either warn the user or proceed depending on the user's "allow overdraft" settings (default: allow, but highlight in red).

### BR-WALL-04: Multi-Wallet Transfer Logic
- A transfer from Wallet A to Wallet B must be processed in a database transaction block (atomicity).
- If either wallet does not exist, or is owned by a different user, the transfer must fail.
- Fees associated with the transfer (if any) must be recorded as an additional `EXPENSE` transaction linked to the source wallet.

---

## 3. Category Constraints (BR-CAT)

### BR-CAT-01: Category Types
Categories are strictly typed as either `INCOME` or `EXPENSE`. A category cannot contain both income and expense transactions.

### BR-CAT-02: System Defaults vs. Custom Categories
- **System Categories**: Pre-populated standard categories (e.g., *Salary* for Income, *Food & Dining* for Expense) are global, read-only, and cannot be modified or deleted by standard users.
- **Custom Categories**: Users can create custom categories.
- Custom categories must have unique names *per user per type*. A user cannot have two custom expense categories named "Snacks". However, they can have an income category named "Gift" and an expense category named "Gift".

---

## 4. Transaction Logic (BR-TX)

### BR-TX-01: Mandatory Fields
Every transaction record must include:
- `userId` (Owner)
- `walletId` (Associated wallet)
- `categoryId` (Associated category)
- `amount` (Positive float, > 0)
- `type` (`INCOME`, `EXPENSE`, or `TRANSFER`)
- `transactionDate` (Timestamp)

### BR-TX-02: Transaction Dates
Users can record transactions in the past. However, normal transactions cannot be set with a future date (unless configured through the recurring transaction engine).

### BR-TX-03: Attachments
- Receipt uploads must be limited to standard image formats (`JPEG`, `PNG`, `WEBP`) or `PDF`.
- Maximum file size is limited to **5MB** to save storage space and bandwidth.

---

## 5. Budget Constraints (BR-BUD)

### BR-BUD-01: Time Period
Budgets are tracked on a strict monthly calendar cycle (from the 1st day of the month to the last day of the month).

### BR-BUD-02: Category Limits
- A user can define at most **one** budget limit per category per month.
- Users can also create a **Global Budget** representing total monthly spend limits across all categories.

### BR-BUD-03: Threshold Alert Triggers
The system monitors transaction creations for the current month and triggers alerts:
- **Warning Alert**: Triggered when $\text{Sum of Expenses in Category} \ge 80\% \text{ of Budget Limit}$.
- **Overlimit Alert**: Triggered when $\text{Sum of Expenses in Category} \ge 100\% \text{ of Budget Limit}$.
- Overlimit budgets do not block transactions; they only alert the user.

---

## 6. Saving Goals Constraints (BR-GOAL)

### BR-GOAL-01: Goal Lifecycle
- **Active**: Target date is in the future, and $\text{Current Savings} < \text{Target Savings}$.
- **Completed**: $\text{Current Savings} \ge \text{Target Savings}$. A goal completed notification is sent, and the status changes to `COMPLETED`.
- **Expired**: Target date is reached, but $\text{Current Savings} < \text{Target Savings}$. Status becomes `EXPIRED`.

### BR-GOAL-02: Deposit & Withdrawal Restrictions
- Depositing money into a saving goal requires a source wallet. The system must deduct the amount from the wallet balance and credit it to the saving goal (creating a goal transaction).
- Withdrawing/Refunding money from a saving goal must credit the amount back to a designated user wallet.

---

## 7. Recurring Transactions Logic (BR-REC)

### BR-REC-01: Frequency Intervals
Supported intervals are `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`.

### BR-REC-02: Automatic Generation Engine
- A system-level cron job evaluates recurring transaction schedules every day at 00:05 UTC.
- For each active scheduler where $\text{nextExecutionDate} \le \text{currentDate}$:
  1. A new `Transaction` is inserted into the database with `transactionDate` set to `nextExecutionDate`.
  2. The wallet balance is updated.
  3. The `nextExecutionDate` is calculated and updated based on the frequency.
  4. An in-app Notification is generated informing the user that a recurring transaction has been posted.
