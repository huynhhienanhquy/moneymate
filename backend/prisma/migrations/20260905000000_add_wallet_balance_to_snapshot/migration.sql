-- Add walletBalance column to store the total wallet balance at the end of each month.
-- Monthly income is now defined as the sum of all wallet balances at month-end.
-- Existing snapshots (formulaVersion < 6) will be lazily recalculated by the application.
ALTER TABLE `monthly_savings_snapshots`
  ADD COLUMN `walletBalance` DECIMAL(15, 2) NOT NULL DEFAULT 0;

ALTER TABLE `monthly_savings_snapshots`
  ALTER COLUMN `formulaVersion` SET DEFAULT 6;
