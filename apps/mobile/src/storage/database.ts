import type { SQLiteDatabase } from 'expo-sqlite';

export interface OutboxItem {
  id: string;
  method: string;
  path: string;
  body: string;
  attempts: number;
}

export async function migrateDatabase(db: SQLiteDatabase) {
  // Wait briefly for another connection/statement instead of immediately
  // throwing SQLITE_BUSY during app bootstrap or a fast refresh.
  await db.execAsync('PRAGMA busy_timeout = 5000;');
  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = versionRow?.user_version || 0;
  if (version < 4) {
    // Legacy rows had no owner. They cannot be assigned safely to whichever
    // account happens to log in after the upgrade, so discard that local cache.
    await db.execAsync(`
      DROP TABLE IF EXISTS outbox;
      DROP TABLE IF EXISTS cache;
      DROP TABLE IF EXISTS transactions_cache;
    `);
  }
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS outbox (
      user_id TEXT NOT NULL,
      id TEXT NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      next_attempt_at TEXT,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, id)
    );
    CREATE INDEX IF NOT EXISTS outbox_user_status_created_idx ON outbox(user_id, status, created_at);
    CREATE TABLE IF NOT EXISTS cache (
      user_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, key)
    );
    CREATE TABLE IF NOT EXISTS transactions_cache (
      user_id TEXT NOT NULL,
      id TEXT NOT NULL,
      payload TEXT NOT NULL,
      version INTEGER NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      PRIMARY KEY (user_id, id)
    );
  `);
  await db.execAsync('PRAGMA user_version = 4;');
}

export interface TransactionDelta {
  id: string;
  version: number;
  updatedAt: string;
  deletedAt: string | null;
  [key: string]: unknown;
}

export async function getSyncCursor(db: SQLiteDatabase, userId: string) {
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM cache WHERE user_id = ? AND key = 'transactions.sync.cursor'", userId);
  return row?.value;
}

export async function applyTransactionDelta(db: SQLiteDatabase, userId: string, items: TransactionDelta[], nextCursor: string | null) {
  // A regular transaction is sufficient here. An exclusive transaction blocks
  // unrelated outbox reads/writes and can make statement finalization fail.
  await db.withTransactionAsync(async () => {
    for (const item of items) {
      await db.runAsync(
        `INSERT INTO transactions_cache (user_id, id, payload, version, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, id) DO UPDATE SET payload = excluded.payload, version = excluded.version,
           updated_at = excluded.updated_at, deleted_at = excluded.deleted_at
         WHERE excluded.version >= transactions_cache.version`,
        userId, item.id, JSON.stringify(item), item.version, item.updatedAt, item.deletedAt
      );
    }
    if (nextCursor) {
      await db.runAsync(
        `INSERT INTO cache (user_id, key, value, updated_at) VALUES (?, 'transactions.sync.cursor', ?, ?)
         ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        userId, nextCursor, new Date().toISOString()
      );
    }
  });
}

export async function getFailedMutationCount(db: SQLiteDatabase, userId: string) {
  const row = await db.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM outbox WHERE user_id = ? AND status = 'failed'", userId);
  return row?.count || 0;
}

export async function enqueueMutation(db: SQLiteDatabase, userId: string, item: Omit<OutboxItem, 'attempts'>) {
  await db.runAsync(
    'INSERT OR IGNORE INTO outbox (user_id, id, method, path, body, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    userId, item.id, item.method, item.path, item.body, new Date().toISOString()
  );
}

export async function getPendingMutations(db: SQLiteDatabase, userId: string) {
  return db.getAllAsync<OutboxItem>(
    "SELECT id, method, path, body, attempts FROM outbox WHERE user_id = ? AND status IN ('pending', 'failed') AND (next_attempt_at IS NULL OR next_attempt_at <= ?) ORDER BY created_at LIMIT 50",
    userId, new Date().toISOString()
  );
}

export async function markMutationSynced(db: SQLiteDatabase, userId: string, id: string) {
  await db.runAsync("UPDATE outbox SET status = 'synced', last_error = NULL WHERE user_id = ? AND id = ?", userId, id);
}

export async function markMutationFailed(db: SQLiteDatabase, userId: string, id: string, message: string, attempts: number) {
  const delaySeconds = Math.min(3600, 5 * 2 ** Math.min(attempts, 9));
  const nextAttemptAt = new Date(Date.now() + delaySeconds * 1000).toISOString();
  await db.runAsync(
    "UPDATE outbox SET status = 'failed', attempts = attempts + 1, last_error = ?, next_attempt_at = ? WHERE user_id = ? AND id = ?",
    message.slice(0, 500), nextAttemptAt, userId, id
  );
}
