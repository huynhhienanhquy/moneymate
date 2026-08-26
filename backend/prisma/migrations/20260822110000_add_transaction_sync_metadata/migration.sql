ALTER TABLE `transactions`
  ADD COLUMN `version` INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN `deletedAt` DATETIME(3) NULL;

CREATE INDEX `transactions_userId_updatedAt_idx`
  ON `transactions`(`userId`, `updatedAt`);
