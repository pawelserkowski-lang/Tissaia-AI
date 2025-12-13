/**
 * Database schema configuration for Tissaia AI
 */

import { DBConfig } from './indexedDB';

export const DB_NAME = 'tissaia-db';
export const DB_VERSION = 1;

/**
 * Database schema
 */
export const dbSchema: DBConfig = {
  name: DB_NAME,
  version: DB_VERSION,
  stores: [
    {
      name: 'images',
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'filename', keyPath: 'filename', unique: false },
        { name: 'uploadDate', keyPath: 'uploadDate', unique: false },
        { name: 'status', keyPath: 'status', unique: false },
      ],
    },
    {
      name: 'results',
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'imageId', keyPath: 'imageId', unique: false },
        { name: 'timestamp', keyPath: 'timestamp', unique: false },
        { name: 'type', keyPath: 'type', unique: false },
      ],
    },
    {
      name: 'cache',
      keyPath: 'key',
      indexes: [
        { name: 'expiry', keyPath: 'expiry', unique: false },
        { name: 'timestamp', keyPath: 'timestamp', unique: false },
      ],
    },
    {
      name: 'settings',
      keyPath: 'key',
    },
    {
      name: 'history',
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp', unique: false },
        { name: 'action', keyPath: 'action', unique: false },
      ],
    },
  ],
};

/**
 * Type definitions for database entities
 */

export interface ImageRecord {
  id?: number;
  filename: string;
  blob: Blob;
  thumbnail?: Blob;
  uploadDate: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  metadata?: {
    size: number;
    type: string;
    width?: number;
    height?: number;
  };
}

export interface ResultRecord {
  id?: number;
  imageId: number;
  type: 'analysis' | 'restoration';
  timestamp: number;
  data: any;
  success: boolean;
  error?: string;
}

export interface CacheRecord {
  key: string;
  value: any;
  timestamp: number;
  expiry?: number;
}

export interface SettingRecord {
  key: string;
  value: any;
}

export interface HistoryRecord {
  id?: number;
  action: string;
  timestamp: number;
  data?: any;
  userId?: string;
}
