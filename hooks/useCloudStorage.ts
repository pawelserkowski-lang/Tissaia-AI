import { useState, useCallback, useEffect } from 'react';
import {
  CloudStorageProvider,
  CloudFile,
  CloudQuota,
  GoogleDriveStorage,
  DropboxStorage,
  LocalStorage,
} from '../utils/cloud/cloudStorage';

export type CloudProvider = 'google-drive' | 'dropbox' | 'local';

/**
 * Custom hook for cloud storage operations
 */
export const useCloudStorage = (provider: CloudProvider) => {
  const [storage, setStorage] = useState<CloudStorageProvider | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [quota, setQuota] = useState<CloudQuota | null>(null);

  /**
   * Initialize storage provider
   */
  useEffect(() => {
    let storageInstance: CloudStorageProvider;

    switch (provider) {
      case 'google-drive':
        // Get credentials from environment variables
        const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
        const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
        storageInstance = new GoogleDriveStorage(googleClientId, googleApiKey);
        break;

      case 'dropbox':
        const dropboxClientId = import.meta.env.VITE_DROPBOX_CLIENT_ID || '';
        storageInstance = new DropboxStorage(dropboxClientId);
        break;

      case 'local':
      default:
        storageInstance = new LocalStorage();
        break;
    }

    setStorage(storageInstance);

    // Check if already authorized
    storageInstance.isAuthorized().then(setIsAuthorized);
  }, [provider]);

  /**
   * Authorize with cloud provider
   */
  const authorize = useCallback(async () => {
    if (!storage) return;

    setIsLoading(true);
    setError(null);

    try {
      await storage.authorize();
      setIsAuthorized(true);
    } catch (err) {
      setError(err as Error);
      setIsAuthorized(false);
    } finally {
      setIsLoading(false);
    }
  }, [storage]);

  /**
   * Upload file to cloud
   */
  const upload = useCallback(
    async (file: Blob, path: string): Promise<string | null> => {
      if (!storage || !isAuthorized) return null;

      setIsLoading(true);
      setError(null);

      try {
        const fileId = await storage.uploadFile(file, path);
        return fileId;
      } catch (err) {
        setError(err as Error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [storage, isAuthorized]
  );

  /**
   * Download file from cloud
   */
  const download = useCallback(
    async (path: string): Promise<Blob | null> => {
      if (!storage || !isAuthorized) return null;

      setIsLoading(true);
      setError(null);

      try {
        const blob = await storage.downloadFile(path);
        return blob;
      } catch (err) {
        setError(err as Error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [storage, isAuthorized]
  );

  /**
   * List files in cloud
   */
  const listFiles = useCallback(
    async (folder?: string) => {
      if (!storage || !isAuthorized) return;

      setIsLoading(true);
      setError(null);

      try {
        const fileList = await storage.listFiles(folder);
        setFiles(fileList);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    },
    [storage, isAuthorized]
  );

  /**
   * Delete file from cloud
   */
  const deleteFile = useCallback(
    async (path: string): Promise<boolean> => {
      if (!storage || !isAuthorized) return false;

      setIsLoading(true);
      setError(null);

      try {
        await storage.deleteFile(path);
        setFiles((prev) => prev.filter((f) => f.path !== path));
        return true;
      } catch (err) {
        setError(err as Error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [storage, isAuthorized]
  );

  /**
   * Create folder in cloud
   */
  const createFolder = useCallback(
    async (path: string): Promise<boolean> => {
      if (!storage || !isAuthorized) return false;

      setIsLoading(true);
      setError(null);

      try {
        await storage.createFolder(path);
        return true;
      } catch (err) {
        setError(err as Error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [storage, isAuthorized]
  );

  /**
   * Get storage quota
   */
  const fetchQuota = useCallback(async () => {
    if (!storage || !isAuthorized) return;

    setIsLoading(true);
    setError(null);

    try {
      const quotaData = await storage.getQuota();
      setQuota(quotaData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [storage, isAuthorized]);

  /**
   * Sync local data to cloud
   */
  const syncToCloud = useCallback(
    async (data: { [key: string]: any }): Promise<boolean> => {
      if (!storage || !isAuthorized) return false;

      setIsLoading(true);
      setError(null);

      try {
        const blob = new Blob([JSON.stringify(data)], {
          type: 'application/json',
        });
        await storage.uploadFile(blob, 'tissaia-sync.json');
        return true;
      } catch (err) {
        setError(err as Error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [storage, isAuthorized]
  );

  /**
   * Sync cloud data to local
   */
  const syncFromCloud = useCallback(async (): Promise<any | null> => {
    if (!storage || !isAuthorized) return null;

    setIsLoading(true);
    setError(null);

    try {
      const blob = await storage.downloadFile('tissaia-sync.json');
      const text = await blob.text();
      return JSON.parse(text);
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [storage, isAuthorized]);

  return {
    // State
    isAuthorized,
    isLoading,
    error,
    files,
    quota,

    // Actions
    authorize,
    upload,
    download,
    listFiles,
    deleteFile,
    createFolder,
    fetchQuota,
    syncToCloud,
    syncFromCloud,
  };
};
