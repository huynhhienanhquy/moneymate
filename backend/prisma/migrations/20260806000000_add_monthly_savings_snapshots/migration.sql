CREATE TABLE `monthly_savings_snapshots` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `salaryIncome` DECIMAL(15, 2) NOT NULL,
    `otherIncome` DECIMAL(15, 2) NOT NULL,
    `expense` DECIMAL(15, 2) NOT NULL,
    `savings` DECIMAL(15, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `monthly_savings_snapshots_userId_month_year_key`(`userId`, `month`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `monthly_savings_snapshots`
ADD CONSTRAINT `monthly_savings_snapshots_userId_fkey`
FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
