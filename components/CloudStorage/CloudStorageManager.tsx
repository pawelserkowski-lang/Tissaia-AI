import React, { useEffect } from 'react';
import { useCloudStorage, CloudProvider } from '../../hooks/useCloudStorage';
import { formatFileSize } from '../../utils/i18n/formatters';

interface CloudStorageManagerProps {
  provider: CloudProvider;
  onClose?: () => void;
}

/**
 * Cloud Storage Manager Component
 * Manages cloud storage connections and file operations
 */
export const CloudStorageManager: React.FC<CloudStorageManagerProps> = ({
  provider,
  onClose,
}) => {
  const {
    isAuthorized,
    isLoading,
    error,
    files,
    quota,
    authorize,
    listFiles,
    deleteFile,
    fetchQuota,
  } = useCloudStorage(provider);

  useEffect(() => {
    if (isAuthorized) {
      listFiles();
      fetchQuota();
    }
  }, [isAuthorized, listFiles, fetchQuota]);

  const providerNames: Record<CloudProvider, string> = {
    'google-drive': 'Google Drive',
    'dropbox': 'Dropbox',
    'local': 'Local Storage',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {providerNames[provider]}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Authorization */}
      {!isAuthorized ? (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Connect to {providerNames[provider]}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Sync your files across devices
          </p>
          <button
            onClick={authorize}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      ) : (
        <>
          {/* Quota */}
          {quota && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Storage Used</span>
                <span>
                  {formatFileSize(quota.used)} / {formatFileSize(quota.total)}
                </span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${(quota.used / quota.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* File List */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Files ({files.length})
            </h3>

            {files.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No files found
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {file.isFolder ? (
                        <svg
                          className="w-6 h-6 text-blue-500 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-6 h-6 text-gray-500 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)} •{' '}
                          {file.modifiedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteFile(file.path)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete file"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      )}
    </div>
  );
};
