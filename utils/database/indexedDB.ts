/**
 * IndexedDB wrapper for simplified database operations
 */

export interface DBConfig {
  name: string;
  version: number;
  stores: {
    name: string;
    keyPath?: string;
    autoIncrement?: boolean;
    indexes?: Array<{
      name: string;
      keyPath: string | string[];
      unique?: boolean;
      multiEntry?: boolean;
    }>;
  }[];
}

export class IndexedDBWrapper {
  private dbName: string;
  private version: number;
  private stores: DBConfig['stores'];
  private db: IDBDatabase | null = null;

  constructor(config: DBConfig) {
    this.dbName = config.name;
    this.version = config.version;
    this.stores = config.stores;
  }

  /**
   * Open database connection
   */
  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        this.stores.forEach((storeConfig) => {
          if (!db.objectStoreNames.contains(storeConfig.name)) {
            const store = db.createObjectStore(storeConfig.name, {
              keyPath: storeConfig.keyPath,
              autoIncrement: storeConfig.autoIncrement ?? true,
            });

            // Create indexes
            storeConfig.indexes?.forEach((index) => {
              store.createIndex(index.name, index.keyPath, {
                unique: index.unique ?? false,
                multiEntry: index.multiEntry ?? false,
              });
            });
          }
        });
      };
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Add item to store
   */
  async add<T>(storeName: string, item: T): Promise<IDBValidKey> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Put (add or update) item in store
   */
  async put<T>(storeName: string, item: T): Promise<IDBValidKey> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get item by key
   */
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all items from store
   */
  async getAll<T>(storeName: string, query?: IDBValidKey | IDBKeyRange): Promise<T[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll(query);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Query items by index
   */
  async queryByIndex<T>(
    storeName: string,
    indexName: string,
    query: IDBValidKey | IDBKeyRange
  ): Promise<T[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(query);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete item by key
   */
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all items from store
   */
  async clear(storeName: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Count items in store
   */
  async count(storeName: string, query?: IDBValidKey | IDBKeyRange): Promise<number> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count(query);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Iterate through all items with cursor
   */
  async forEach<T>(
    storeName: string,
    callback: (item: T, key: IDBValidKey) => void | boolean,
    direction: IDBCursorDirection = 'next'
  ): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.openCursor(null, direction);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
        if (cursor) {
          const shouldContinue = callback(cursor.value, cursor.key);
          if (shouldContinue !== false) {
            cursor.continue();
          } else {
            resolve();
          }
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Batch operations
   */
  async batch<T>(
    storeName: string,
    operations: Array<{ type: 'add' | 'put' | 'delete'; data?: T; key?: IDBValidKey }>
  ): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      operations.forEach((op) => {
        switch (op.type) {
          case 'add':
            if (op.data) store.add(op.data);
            break;
          case 'put':
            if (op.data) store.put(op.data);
            break;
          case 'delete':
            if (op.key) store.delete(op.key);
            break;
        }
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

/**
 * Delete database
 */
export function deleteDatabase(dbName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if IndexedDB is supported
 */
export function isIndexedDBSupported(): boolean {
  return typeof indexedDB !== 'undefined';
}
