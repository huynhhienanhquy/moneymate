-- AddIndex
CREATE INDEX `transactions_userId_deletedAt_transactionDate_idx`
  ON `transactions`(`userId`, `deletedAt`, `transactionDate`);

-- AddIndex
CREATE INDEX `recurring_transactions_isActive_nextExecutionDate_idx`
  ON `recurring_transactions`(`isActive`, `nextExecutionDate`);
