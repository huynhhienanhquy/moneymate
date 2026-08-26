CREATE TABLE `device_tokens` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `deviceId` VARCHAR(191) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `platform` VARCHAR(16) NOT NULL,
  `provider` VARCHAR(16) NOT NULL DEFAULT 'expo',
  `appVersion` VARCHAR(32) NULL,
  `locale` VARCHAR(32) NULL,
  `timezone` VARCHAR(64) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `device_tokens_token_key`(`token`),
  UNIQUE INDEX `device_tokens_userId_deviceId_provider_key`(`userId`, `deviceId`, `provider`),
  INDEX `device_tokens_userId_isActive_idx`(`userId`, `isActive`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `idempotency_records` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `key` VARCHAR(100) NOT NULL,
  `requestHash` VARCHAR(64) NOT NULL,
  `status` VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  `statusCode` INTEGER NULL,
  `responseBody` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `idempotency_records_userId_key_key`(`userId`, `key`),
  INDEX `idempotency_records_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `device_tokens` ADD CONSTRAINT `device_tokens_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `idempotency_records` ADD CONSTRAINT `idempotency_records_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
