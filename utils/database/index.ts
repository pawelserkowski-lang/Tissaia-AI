/**
 * Database utilities exports
 */

export { IndexedDBWrapper, deleteDatabase, isIndexedDBSupported } from './indexedDB';
export type { DBConfig } from './indexedDB';

export { dbSchema, DB_NAME, DB_VERSION } from './schema';
export type {
  ImageRecord,
  ResultRecord,
  CacheRecord,
  SettingRecord,
  HistoryRecord,
} from './schema';

export {
  migrations,
  runMigrations,
  rollbackMigrations,
  exportDatabase,
  importDatabase,
  getDatabaseStats,
} from './migrations';
export type { Migration } from './migrations';
