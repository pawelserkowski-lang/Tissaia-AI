/**
 * Cloud storage interface and implementations
 * Supports multiple cloud storage providers
 */

export interface CloudStorageProvider {
  name: string;
  authorize(): Promise<void>;
  isAuthorized(): Promise<boolean>;
  uploadFile(file: Blob, path: string): Promise<string>;
  downloadFile(path: string): Promise<Blob>;
  listFiles(folder?: string): Promise<CloudFile[]>;
  deleteFile(path: string): Promise<void>;
  createFolder(path: string): Promise<void>;
  getQuota(): Promise<CloudQuota>;
}

export interface CloudFile {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  createdAt: Date;
  modifiedAt: Date;
  isFolder: boolean;
}

export interface CloudQuota {
  used: number;
  total: number;
  available: number;
}

/**
 * Base cloud storage class
 */
export abstract class BaseCloudStorage implements CloudStorageProvider {
  abstract name: string;
  protected accessToken: string | null = null;

  abstract authorize(): Promise<void>;
  abstract isAuthorized(): Promise<boolean>;
  abstract uploadFile(file: Blob, path: string): Promise<string>;
  abstract downloadFile(path: string): Promise<Blob>;
  abstract listFiles(folder?: string): Promise<CloudFile[]>;
  abstract deleteFile(path: string): Promise<void>;
  abstract createFolder(path: string): Promise<void>;
  abstract getQuota(): Promise<CloudQuota>;

  /**
   * Store access token
   */
  protected setToken(token: string): void {
    this.accessToken = token;
    localStorage.setItem(`${this.name}_token`, token);
  }

  /**
   * Retrieve access token
   */
  protected getToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem(`${this.name}_token`);
    }
    return this.accessToken;
  }

  /**
   * Clear access token
   */
  protected clearToken(): void {
    this.accessToken = null;
    localStorage.removeItem(`${this.name}_token`);
  }
}

/**
 * Google Drive implementation
 */
export class GoogleDriveStorage extends BaseCloudStorage {
  name = 'GoogleDrive';
  private clientId: string;
  private apiKey: string;
  private scope = 'https://www.googleapis.com/auth/drive.file';

  constructor(clientId: string, apiKey: string) {
    super();
    this.clientId = clientId;
    this.apiKey = apiKey;
  }

  async authorize(): Promise<void> {
    // Load Google API client
    await this.loadGoogleApi();

    // Initialize the client
    await new Promise<void>((resolve, reject) => {
      (window as any).gapi.load('client:auth2', async () => {
        try {
          await (window as any).gapi.client.init({
            apiKey: this.apiKey,
            clientId: this.clientId,
            scope: this.scope,
            discoveryDocs: [
              'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
            ],
          });

          const auth = (window as any).gapi.auth2.getAuthInstance();
          if (!auth.isSignedIn.get()) {
            await auth.signIn();
          }

          const user = auth.currentUser.get();
          const authResponse = user.getAuthResponse();
          this.setToken(authResponse.access_token);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async isAuthorized(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Verify token is still valid
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async uploadFile(file: Blob, path: string): Promise<string> {
    const token = this.getToken();
    if (!token) throw new Error('Not authorized');

    const metadata = {
      name: path.split('/').pop(),
      parents: ['root'],
    };

    const formData = new FormData();
    formData.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    formData.append('file', file);

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.id;
  }

  async downloadFile(fileId: string): Promise<Blob> {
    const token = this.getToken();
    if (!token) throw new Error('Not authorized');

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return await response.blob();
  }

  async listFiles(folder: string = 'root'): Promise<CloudFile[]> {
    const token = this.getToken();
    if (!token) throw new Error('Not authorized');

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folder}'+in+parents&fields=files(id,name,size,mimeType,createdTime,modifiedTime)`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('List files failed');
    }

    const data = await response.json();
    return data.files.map((file: any) => ({
      id: file.id,
      name: file.name,
      path: file.name,
      size: parseInt(file.size || '0'),
      mimeType: file.mimeType,
      createdAt: new Date(file.createdTime),
      modifiedAt: new Date(file.modifiedTime),
      isFolder: file.mimeType === 'application/vnd.google-apps.folder',
    }));
  }

  async deleteFile(fileId: string): Promise<void> {
    const token = this.getToken();
    if (!token) throw new Error('Not authorized');

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Delete failed');
    }
  }

  async createFolder(name: string): Promise<void> {
    const token = this.getToken();
    if (!token) throw new Error('Not authorized');

    const metadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
    };

    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      throw new Error('Create folder failed');
    }
  }

  async getQuota(): Promise<CloudQuota> {
    const token = this.getToken();
    if (!token) throw new Error('Not authorized');

    const response = await fetch(
      'https://www.googleapis.com/drive/v3/about?fields=storageQuota',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Get quota failed');
    }

    const data = await response.json();
    const quota = data.storageQuota;

    return {
      used: parseInt(quota.usage || '0'),
      total: parseInt(quota.limit || '0'),
      available: parseInt(quota.limit || '0') - parseInt(quota.usage || '0'),
    };
  }

  private loadGoogleApi(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }
}

/**
 * Dropbox implementation
 */
export class DropboxStorage extends BaseCloudStorage {
  name = 'Dropbox';
  private clientId: string;

  constructor(clientId: string) {
    super();
    this.clientId = clientId;
  }

  async authorize(): Promise<void> {
    const redirectUri = `${window.location.origin}/oauth/dropbox`;
    const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${this.clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}`;

    // Open popup for OAuth
    const popup = window.open(authUrl, 'Dropbox Auth', 'width=600,height=700');

    // Wait for token in callback
    return new Promise((resolve, reject) => {
      const checkPopup = setInterval(() => {
        try {
          if (popup?.closed) {
            clearInterval(checkPopup);
            const token = localStorage.getItem('dropbox_temp_token');
            if (token) {
              this.setToken(token);
              localStorage.removeItem('dropbox_temp_token');
              resolve();
            } else {
              reject(new Error('Authorization failed'));
            }
          }
        } catch (error) {
          // Cross-origin error, popup still open
        }
      }, 500);
    });
  }

  async isAuthorized(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(
        'https://api.dropboxapi.com/2/users/get_current_account',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async uploadFile(file: Blob, path: string): Promise<string> {
    const token = this.getToken();
    if (!token) throw new Error('Not authorized');

    const response = await fetch(
      'https://content.dropboxapi.com/2/files/upload',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            path: `/${path}`,
            mode: 'add',
            autorename: true,
          }),
        },
        body: file,
      }
    );

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.id;
  }

  async downloadFile(path: string): Promise<Blob> {
    const token = this.getToken();
    if (!token) throw new Error('Not authorized');

    const response = await fetch(
      'https://content.dropboxapi.com/2/files/download',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Dropbox-API-Arg': JSON.stringify({
            path: `/${path}`,
          }),
        },
      }
    );

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return await response.blob();
  }

  async listFiles(folder: string = ''): Promise<CloudFile[]> {
    const token = this.getToken();
    if (!token) throw new Error('Not authorized');

    const response = await fetch(
      'https://api.dropboxapi.com/2/files/list_folder',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: `/${folder}`,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('List files failed');
    }

    const data = await response.json();
    return data.entries.map((entry: any) => ({
      id: entry.id,
      name: entry.name,
      path: entry.path_display,
      size: entry.size || 0,
      mimeType: entry['.tag'] === 'folder' ? 'folder' : 'file',
      createdAt: new Date(entry.client_modified || Date.now()),
      modifiedAt: new Date(entry.server_modified || Date.now()),
      isFolder: entry['.tag'] === 'folder',
    }));
  }

  async deleteFile(path: string): Promise<void> {
    const token = this.getToken();
    if (!token) throw new Error('Not authorized');

    const response = await fetch(
      'https://api.dropboxapi.com/2/files/delete_v2',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: `/${path}`,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Delete failed');
    }
  }

  async createFolder(path: string): Promise<void> {
    const token = this.getToken();
    if (!token) throw new Error('Not authorized');

    const response = await fetch(
      'https://api.dropboxapi.com/2/files/create_folder_v2',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: `/${path}`,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Create folder failed');
    }
  }

  async getQuota(): Promise<CloudQuota> {
    const token = this.getToken();
    if (!token) throw new Error('Not authorized');

    const response = await fetch(
      'https://api.dropboxapi.com/2/users/get_space_usage',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Get quota failed');
    }

    const data = await response.json();

    return {
      used: data.used,
      total: data.allocation.allocated,
      available: data.allocation.allocated - data.used,
    };
  }
}

/**
 * Local storage implementation (fallback)
 */
export class LocalStorage extends BaseCloudStorage {
  name = 'LocalStorage';

  async authorize(): Promise<void> {
    // No authorization needed for local storage
    this.setToken('local');
  }

  async isAuthorized(): Promise<boolean> {
    return true;
  }

  async uploadFile(file: Blob, path: string): Promise<string> {
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const fileData = {
      data: base64,
      size: file.size,
      type: file.type,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    localStorage.setItem(`local_file_${path}`, JSON.stringify(fileData));
    return path;
  }

  async downloadFile(path: string): Promise<Blob> {
    const data = localStorage.getItem(`local_file_${path}`);
    if (!data) {
      throw new Error('File not found');
    }

    const fileData = JSON.parse(data);
    const buffer = Uint8Array.from(atob(fileData.data), (c) => c.charCodeAt(0));
    return new Blob([buffer], { type: fileData.type });
  }

  async listFiles(): Promise<CloudFile[]> {
    const files: CloudFile[] = [];
    const prefix = 'local_file_';

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        const path = key.substring(prefix.length);
        const data = JSON.parse(localStorage.getItem(key)!);

        files.push({
          id: path,
          name: path.split('/').pop() || path,
          path,
          size: data.size,
          mimeType: data.type,
          createdAt: new Date(data.createdAt),
          modifiedAt: new Date(data.modifiedAt),
          isFolder: false,
        });
      }
    }

    return files;
  }

  async deleteFile(path: string): Promise<void> {
    localStorage.removeItem(`local_file_${path}`);
  }

  async createFolder(): Promise<void> {
    // Folders not supported in localStorage
  }

  async getQuota(): Promise<CloudQuota> {
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const item = localStorage.getItem(key);
        used += (item?.length || 0) * 2; // Approximate bytes
      }
    }

    const total = 10 * 1024 * 1024; // 10MB typical limit

    return {
      used,
      total,
      available: total - used,
    };
  }
}
