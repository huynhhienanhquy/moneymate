-- Existing tokens are hashed in-place so active sessions remain valid with the
-- matching application release. Rollback requires users to sign in again.
ALTER TABLE `refresh_tokens`
  ADD COLUMN `tokenFamily` VARCHAR(36) NULL,
  ADD COLUMN `deviceId` VARCHAR(191) NULL,
  ADD COLUMN `deviceName` VARCHAR(191) NULL,
  ADD COLUMN `platform` VARCHAR(16) NOT NULL DEFAULT 'web',
  ADD COLUMN `appVersion` VARCHAR(32) NULL,
  ADD COLUMN `timezone` VARCHAR(64) NULL,
  ADD COLUMN `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `revokedAt` DATETIME(3) NULL;

UPDATE `refresh_tokens`
SET `token` = SHA2(`token`, 256), `tokenFamily` = UUID();

ALTER TABLE `refresh_tokens`
  MODIFY `token` VARCHAR(64) NOT NULL,
  MODIFY `tokenFamily` VARCHAR(36) NOT NULL;

CREATE INDEX `refresh_tokens_userId_revokedAt_idx`
  ON `refresh_tokens`(`userId`, `revokedAt`);
CREATE INDEX `refresh_tokens_tokenFamily_idx`
  ON `refresh_tokens`(`tokenFamily`);
