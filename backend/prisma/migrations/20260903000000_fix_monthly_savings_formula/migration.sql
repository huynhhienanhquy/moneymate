-- New snapshots store actual income components and calculate savings as income minus expense.
-- Existing version-4 snapshots remain untouched so the application recalculates them lazily.
ALTER TABLE `monthly_savings_snapshots`
ALTER COLUMN `formulaVersion` SET DEFAULT 5;
