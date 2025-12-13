import { useState, useEffect, useCallback } from 'react';
import { IndexedDBWrapper } from '../utils/database/indexedDB';
import { dbSchema } from '../utils/database/schema';

/**
 * Custom hook for IndexedDB operations
 */
export const useIndexedDB = <T = any>(storeName: string) => {
  const [db] = useState(() => new IndexedDBWrapper(dbSchema));
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    db.open()
      .then(() => setIsReady(true))
      .catch((err) => setError(err));

    return () => db.close();
  }, [db]);

  const add = useCallback(
    async (item: T): Promise<IDBValidKey | null> => {
      try {
        return await db.add(storeName, item);
      } catch (err) {
        setError(err as Error);
        return null;
      }
    },
    [db, storeName]
  );

  const put = useCallback(
    async (item: T): Promise<IDBValidKey | null> => {
      try {
        return await db.put(storeName, item);
      } catch (err) {
        setError(err as Error);
        return null;
      }
    },
    [db, storeName]
  );

  const get = useCallback(
    async (key: IDBValidKey): Promise<T | null> => {
      try {
        const result = await db.get<T>(storeName, key);
        return result ?? null;
      } catch (err) {
        setError(err as Error);
        return null;
      }
    },
    [db, storeName]
  );

  const getAll = useCallback(
    async (query?: IDBValidKey | IDBKeyRange): Promise<T[]> => {
      try {
        return await db.getAll<T>(storeName, query);
      } catch (err) {
        setError(err as Error);
        return [];
      }
    },
    [db, storeName]
  );

  const queryByIndex = useCallback(
    async (indexName: string, query: IDBValidKey | IDBKeyRange): Promise<T[]> => {
      try {
        return await db.queryByIndex<T>(storeName, indexName, query);
      } catch (err) {
        setError(err as Error);
        return [];
      }
    },
    [db, storeName]
  );

  const remove = useCallback(
    async (key: IDBValidKey): Promise<boolean> => {
      try {
        await db.delete(storeName, key);
        return true;
      } catch (err) {
        setError(err as Error);
        return false;
      }
    },
    [db, storeName]
  );

  const clear = useCallback(async (): Promise<boolean> => {
    try {
      await db.clear(storeName);
      return true;
    } catch (err) {
      setError(err as Error);
      return false;
    }
  }, [db, storeName]);

  const count = useCallback(
    async (query?: IDBValidKey | IDBKeyRange): Promise<number> => {
      try {
        return await db.count(storeName, query);
      } catch (err) {
        setError(err as Error);
        return 0;
      }
    },
    [db, storeName]
  );

  return {
    isReady,
    error,
    add,
    put,
    get,
    getAll,
    queryByIndex,
    remove,
    clear,
    count,
  };
};

/**
 * Hook for image storage
 */
export const useImageStorage = () => {
  const db = useIndexedDB('images');

  const saveImage = useCallback(
    async (file: File, thumbnail?: Blob) => {
      const imageRecord = {
        filename: file.name,
        blob: file,
        thumbnail,
        uploadDate: Date.now(),
        status: 'pending' as const,
        metadata: {
          size: file.size,
          type: file.type,
        },
      };

      return await db.add(imageRecord);
    },
    [db]
  );

  const getImage = useCallback(
    async (id: number) => {
      return await db.get(id);
    },
    [db]
  );

  const getAllImages = useCallback(async () => {
    return await db.getAll();
  }, [db]);

  const updateImageStatus = useCallback(
    async (id: number, status: 'pending' | 'processing' | 'completed' | 'failed') => {
      const image = await db.get(id);
      if (image) {
        return await db.put({ ...image, status });
      }
      return null;
    },
    [db]
  );

  const deleteImage = useCallback(
    async (id: number) => {
      return await db.remove(id);
    },
    [db]
  );

  return {
    ...db,
    saveImage,
    getImage,
    getAllImages,
    updateImageStatus,
    deleteImage,
  };
};

/**
 * Hook for result storage
 */
export const useResultStorage = () => {
  const db = useIndexedDB('results');

  const saveResult = useCallback(
    async (
      imageId: number,
      type: 'analysis' | 'restoration',
      data: any,
      success: boolean,
      error?: string
    ) => {
      const resultRecord = {
        imageId,
        type,
        timestamp: Date.now(),
        data,
        success,
        error,
      };

      return await db.add(resultRecord);
    },
    [db]
  );

  const getResultsByImageId = useCallback(
    async (imageId: number) => {
      return await db.queryByIndex('imageId', imageId);
    },
    [db]
  );

  const getResultsByType = useCallback(
    async (type: 'analysis' | 'restoration') => {
      return await db.queryByIndex('type', type);
    },
    [db]
  );

  return {
    ...db,
    saveResult,
    getResultsByImageId,
    getResultsByType,
  };
};

/**
 * Hook for cache storage
 */
export const useCacheStorage = () => {
  const db = useIndexedDB('cache');

  const setCache = useCallback(
    async (key: string, value: any, ttl?: number) => {
      const cacheRecord = {
        key,
        value,
        timestamp: Date.now(),
        expiry: ttl ? Date.now() + ttl : undefined,
      };

      return await db.put(cacheRecord);
    },
    [db]
  );

  const getCache = useCallback(
    async (key: string) => {
      const record = await db.get(key);
      if (!record) return null;

      // Check if expired
      if (record.expiry && Date.now() > record.expiry) {
        await db.remove(key);
        return null;
      }

      return record.value;
    },
    [db]
  );

  const clearExpired = useCallback(async () => {
    const allRecords = await db.getAll();
    const now = Date.now();

    for (const record of allRecords) {
      if (record.expiry && now > record.expiry) {
        await db.remove(record.key);
      }
    }
  }, [db]);

  return {
    ...db,
    setCache,
    getCache,
    clearExpired,
  };
};

/**
 * Hook for settings storage
 */
export const useSettings = () => {
  const db = useIndexedDB('settings');

  const getSetting = useCallback(
    async (key: string) => {
      const record = await db.get(key);
      return record?.value ?? null;
    },
    [db]
  );

  const setSetting = useCallback(
    async (key: string, value: any) => {
      return await db.put({ key, value });
    },
    [db]
  );

  const removeSetting = useCallback(
    async (key: string) => {
      return await db.remove(key);
    },
    [db]
  );

  return {
    isReady: db.isReady,
    error: db.error,
    getSetting,
    setSetting,
    removeSetting,
  };
};
