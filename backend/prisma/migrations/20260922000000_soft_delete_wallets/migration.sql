ALTER TABLE `wallets` ADD COLUMN `deletedAt` DATETIME(3) NULL;

CREATE INDEX `wallets_userId_deletedAt_idx` ON `wallets`(`userId`, `deletedAt`);
