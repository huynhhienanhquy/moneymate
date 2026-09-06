-- Generated transactions retain a stable link to their recurring template.
ALTER TABLE `transactions`
ADD COLUMN `recurringTransactionId` VARCHAR(191) NULL;

CREATE INDEX `transactions_recurringTransactionId_transactionDate_idx`
ON `transactions`(`recurringTransactionId`, `transactionDate`);

ALTER TABLE `transactions`
ADD CONSTRAINT `transactions_recurringTransactionId_fkey`
FOREIGN KEY (`recurringTransactionId`) REFERENCES `recurring_transactions`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;

-- prisma migrate deploy does not run seed.ts. Provision the same global
-- categories here so a fresh production deployment can transfer funds.
INSERT INTO `categories` (`id`, `userId`, `name`, `type`, `color`, `icon`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Lương', 'INCOME', '#4CAF50', 'briefcase', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Lương' AND `type` = 'INCOME');
INSERT INTO `categories` (`id`, `userId`, `name`, `type`, `color`, `icon`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Kinh doanh', 'INCOME', '#8BC34A', 'trending-up', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Kinh doanh' AND `type` = 'INCOME');
INSERT INTO `categories` (`id`, `userId`, `name`, `type`, `color`, `icon`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Đầu tư', 'INCOME', '#009688', 'dollar-sign', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Đầu tư' AND `type` = 'INCOME');
INSERT INTO `categories` (`id`, `userId`, `name`, `type`, `color`, `icon`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Quà tặng', 'INCOME', '#E91E63', 'gift', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Quà tặng' AND `type` = 'INCOME');
INSERT INTO `categories` (`id`, `userId`, `name`, `type`, `color`, `icon`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Khác (Thu nhập)', 'INCOME', '#9E9E9E', 'more-horizontal', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Khác (Thu nhập)' AND `type` = 'INCOME');
INSERT INTO `categories` (`id`, `userId`, `name`, `type`, `color`, `icon`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Ăn uống', 'EXPENSE', '#FF5722', 'utensils', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Ăn uống' AND `type` = 'EXPENSE');
INSERT INTO `categories` (`id`, `userId`, `name`, `type`, `color`, `icon`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Thuê nhà', 'EXPENSE', '#795548', 'home', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Thuê nhà' AND `type` = 'EXPENSE');
INSERT INTO `categories` (`id`, `userId`, `name`, `type`, `color`, `icon`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Hóa đơn & Tiện ích', 'EXPENSE', '#FFC107', 'receipt', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Hóa đơn & Tiện ích' AND `type` = 'EXPENSE');
INSERT INTO `categories` (`id`, `userId`, `name`, `type`, `color`, `icon`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Di chuyển', 'EXPENSE', '#03A9F4', 'car', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Di chuyển' AND `type` = 'EXPENSE');
INSERT INTO `categories` (`id`, `userId`, `name`, `type`, `color`, `icon`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Giải trí', 'EXPENSE', '#9C27B0', 'gamepad-2', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Giải trí' AND `type` = 'EXPENSE');
INSERT INTO `categories` (`id`, `userId`, `name`, `type`, `color`, `icon`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Sức khỏe', 'EXPENSE', '#F44336', 'heart-pulse', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Sức khỏe' AND `type` = 'EXPENSE');
INSERT INTO `categories` (`id`, `userId`, `name`, `type`, `color`, `icon`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Giáo dục', 'EXPENSE', '#3F51B5', 'graduation-cap', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Giáo dục' AND `type` = 'EXPENSE');
INSERT INTO `categories` (`id`, `userId`, `name`, `type`, `color`, `icon`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Mua sắm', 'EXPENSE', '#673AB7', 'shopping-bag', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Mua sắm' AND `type` = 'EXPENSE');
INSERT INTO `categories` (`id`, `userId`, `name`, `type`, `color`, `icon`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Khác (Chi tiêu)', 'EXPENSE', '#607D8B', 'more-horizontal', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Khác (Chi tiêu)' AND `type` = 'EXPENSE');
