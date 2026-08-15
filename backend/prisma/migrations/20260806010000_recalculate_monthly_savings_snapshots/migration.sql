-- Mark existing snapshots as using the legacy formula. The application safely
-- recalculates each legacy row once and then locks it at formula version 4.
ALTER TABLE `monthly_savings_snapshots`
ADD COLUMN `formulaVersion` INTEGER NOT NULL DEFAULT 1;
