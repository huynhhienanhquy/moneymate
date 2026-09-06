-- Normalize nullable category IDs into a non-null scope so MySQL can enforce
-- one global budget per user/month/year under concurrent requests.
ALTER TABLE `budgets`
ADD COLUMN `categoryScope` VARCHAR(191) NOT NULL DEFAULT 'GLOBAL',
ADD COLUMN `warningNotified` BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN `exceededNotified` BOOLEAN NOT NULL DEFAULT false;

-- Preserve any legacy duplicate global budgets without deleting user data.
-- New global budgets all use GLOBAL and are protected by the unique index.
UPDATE `budgets`
SET `categoryScope` = CASE
  WHEN `categoryId` IS NULL THEN CONCAT('LEGACY:', `id`)
  ELSE `categoryId`
END;

DROP INDEX `budgets_userId_categoryId_month_year_key` ON `budgets`;

CREATE UNIQUE INDEX `budgets_userId_categoryScope_month_year_key`
ON `budgets`(`userId`, `categoryScope`, `month`, `year`);
