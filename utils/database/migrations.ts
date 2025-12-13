/**
 * Database migration utilities
 */

import { IndexedDBWrapper } from './indexedDB';

export interface Migration {
  version: number;
  description: string;
  upgrade: (db: IDBDatabase, transaction: IDBTransaction) => void;
  downgrade?: (db: IDBDatabase, transaction: IDBTransaction) => void;
}

/**
 * Migration history
 */
export const migrations: Migration[] = [
  {
    version: 1,
    description: 'Initial schema with images, results, cache, settings, and history stores',
    upgrade: (db) => {
      // Images store
      if (!db.objectStoreNames.contains('images')) {
        const imagesStore = db.createObjectStore('images', {
          keyPath: 'id',
          autoIncrement: true,
        });
        imagesStore.createIndex('filename', 'filename', { unique: false });
        imagesStore.createIndex('uploadDate', 'uploadDate', { unique: false });
        imagesStore.createIndex('status', 'status', { unique: false });
      }

      // Results store
      if (!db.objectStoreNames.contains('results')) {
        const resultsStore = db.createObjectStore('results', {
          keyPath: 'id',
          autoIncrement: true,
        });
        resultsStore.createIndex('imageId', 'imageId', { unique: false });
        resultsStore.createIndex('timestamp', 'timestamp', { unique: false });
        resultsStore.createIndex('type', 'type', { unique: false });
      }

      // Cache store
      if (!db.objectStoreNames.contains('cache')) {
        const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
        cacheStore.createIndex('expiry', 'expiry', { unique: false });
        cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // History store
      if (!db.objectStoreNames.contains('history')) {
        const historyStore = db.createObjectStore('history', {
          keyPath: 'id',
          autoIncrement: true,
        });
        historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        historyStore.createIndex('action', 'action', { unique: false });
      }
    },
  },
];

/**
 * Run migrations
 */
export function runMigrations(
  db: IDBDatabase,
  oldVersion: number,
  newVersion: number,
  transaction: IDBTransaction
): void {
  console.log(`Running migrations from version ${oldVersion} to ${newVersion}`);

  const applicableMigrations = migrations.filter(
    (m) => m.version > oldVersion && m.version <= newVersion
  );

  applicableMigrations.forEach((migration) => {
    console.log(`Applying migration ${migration.version}: ${migration.description}`);
    migration.upgrade(db, transaction);
  });
}

/**
 * Rollback migrations
 */
export function rollbackMigrations(
  db: IDBDatabase,
  oldVersion: number,
  newVersion: number,
  transaction: IDBTransaction
): void {
  console.log(`Rolling back migrations from version ${oldVersion} to ${newVersion}`);

  const applicableMigrations = migrations
    .filter((m) => m.version <= oldVersion && m.version > newVersion)
    .reverse();

  applicableMigrations.forEach((migration) => {
    if (migration.downgrade) {
      console.log(`Rolling back migration ${migration.version}: ${migration.description}`);
      migration.downgrade(db, transaction);
    } else {
      console.warn(`No downgrade available for migration ${migration.version}`);
    }
  });
}

/**
 * Export database to JSON
 */
export async function exportDatabase(db: IndexedDBWrapper): Promise<any> {
  const exported: any = {
    version: 1,
    timestamp: Date.now(),
    stores: {},
  };

  const storeNames = ['images', 'results', 'cache', 'settings', 'history'];

  for (const storeName of storeNames) {
    try {
      const data = await db.getAll(storeName);
      exported.stores[storeName] = data;
    } catch (error) {
      console.error(`Failed to export store ${storeName}:`, error);
    }
  }

  return exported;
}

/**
 * Import database from JSON
 */
export async function importDatabase(db: IndexedDBWrapper, data: any): Promise<void> {
  if (!data.stores) {
    throw new Error('Invalid import data format');
  }

  for (const [storeName, items] of Object.entries(data.stores)) {
    try {
      await db.clear(storeName);
      if (Array.isArray(items)) {
        const operations = items.map((item) => ({ type: 'add' as const, data: item }));
        await db.batch(storeName, operations);
      }
    } catch (error) {
      console.error(`Failed to import store ${storeName}:`, error);
    }
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(db: IndexedDBWrapper): Promise<{
  stores: Record<string, number>;
  total: number;
}> {
  const storeNames = ['images', 'results', 'cache', 'settings', 'history'];
  const stats: Record<string, number> = {};
  let total = 0;

  for (const storeName of storeNames) {
    try {
      const count = await db.count(storeName);
      stats[storeName] = count;
      total += count;
    } catch (error) {
      stats[storeName] = 0;
    }
  }

  return { stores: stats, total };
}
