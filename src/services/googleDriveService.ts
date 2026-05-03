// src/services/googleDriveService.ts
// Google Drive API integration for image uploads

const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

// Store credentials in localStorage
const STORAGE_KEYS = {
  CLIENT_ID: 'gdrive_client_id',
  API_KEY: 'gdrive_api_key',
  ACCESS_TOKEN: 'gdrive_access_token',
  TOKEN_EXPIRY: 'gdrive_token_expiry',
  FOLDER_ID: 'gdrive_folder_id',
};

interface GoogleDriveConfig {
  clientId: string;
  apiKey: string;
}

interface UploadResult {
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  webContentLink?: string;
  directLink?: string;
  error?: string;
}

class GoogleDriveService {
  private gapiLoaded = false;
  private gisLoaded = false;
  private tokenClient: any = null;

  // Get stored credentials
  getCredentials(): GoogleDriveConfig | null {
    const clientId = localStorage.getItem(STORAGE_KEYS.CLIENT_ID);
    const apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
    if (clientId && apiKey) {
      return { clientId, apiKey };
    }
    return null;
  }

  // Save credentials
  saveCredentials(config: GoogleDriveConfig): void {
    localStorage.setItem(STORAGE_KEYS.CLIENT_ID, config.clientId);
    localStorage.setItem(STORAGE_KEYS.API_KEY, config.apiKey);
  }

  // Clear credentials
  clearCredentials(): void {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    if (token && expiry) {
      return Date.now() < parseInt(expiry);
    }
    return false;
  }

  // Load Google API scripts
  async loadGoogleApis(): Promise<void> {
    if (this.gapiLoaded && this.gisLoaded) return;

    // Load GAPI
    if (!this.gapiLoaded) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
          (window as any).gapi.load('client', async () => {
            this.gapiLoaded = true;
            resolve();
          });
        };
        script.onerror = reject;
        document.body.appendChild(script);
      });
    }

    // Load GIS (Google Identity Services)
    if (!this.gisLoaded) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
          this.gisLoaded = true;
          resolve();
        };
        script.onerror = reject;
        document.body.appendChild(script);
      });
    }
  }

  // Initialize the API client
  async initialize(): Promise<boolean> {
    const credentials = this.getCredentials();
    if (!credentials) {
      console.error('No Google Drive credentials configured');
      return false;
    }

    try {
      await this.loadGoogleApis();

      // Initialize GAPI client
      await (window as any).gapi.client.init({
        apiKey: credentials.apiKey,
        discoveryDocs: [DISCOVERY_DOC],
      });

      // Initialize token client
      this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: credentials.clientId,
        scope: SCOPES,
        callback: '', // Will be set during auth
      });

      // Set existing token if available
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (token && this.isAuthenticated()) {
        (window as any).gapi.client.setToken({ access_token: token });
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize Google Drive API:', error);
      return false;
    }
  }

  // Authenticate with Google
  async authenticate(): Promise<boolean> {
    if (!this.tokenClient) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }

    return new Promise((resolve) => {
      this.tokenClient.callback = (response: any) => {
        if (response.error) {
          console.error('Auth error:', response.error);
          resolve(false);
          return;
        }

        // Store token
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.access_token);
        localStorage.setItem(
          STORAGE_KEYS.TOKEN_EXPIRY,
          String(Date.now() + response.expires_in * 1000)
        );

        resolve(true);
      };

      // Check if we need consent or just token refresh
      if ((window as any).gapi.client.getToken() === null) {
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        this.tokenClient.requestAccessToken({ prompt: '' });
      }
    });
  }

  // Sign out
  signOut(): void {
    const token = (window as any).gapi?.client?.getToken();
    if (token) {
      (window as any).google.accounts.oauth2.revoke(token.access_token);
      (window as any).gapi.client.setToken(null);
    }
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
  }

  // Get or create the upload folder
  async getOrCreateFolder(folderName: string = 'TowerDefense_Questions'): Promise<string | null> {
    // Check if we have a cached folder ID
    const cachedFolderId = localStorage.getItem(STORAGE_KEYS.FOLDER_ID);
    if (cachedFolderId) {
      // Verify folder still exists
      try {
        await (window as any).gapi.client.drive.files.get({
          fileId: cachedFolderId,
          fields: 'id',
        });
        return cachedFolderId;
      } catch {
        localStorage.removeItem(STORAGE_KEYS.FOLDER_ID);
      }
    }

    try {
      // Search for existing folder
      const response = await (window as any).gapi.client.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      if (response.result.files && response.result.files.length > 0) {
        const folderId = response.result.files[0].id;
        localStorage.setItem(STORAGE_KEYS.FOLDER_ID, folderId);
        return folderId;
      }

      // Create new folder
      const createResponse = await (window as any).gapi.client.drive.files.create({
        resource: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
      });

      const folderId = createResponse.result.id;
      localStorage.setItem(STORAGE_KEYS.FOLDER_ID, folderId);
      return folderId;
    } catch (error) {
      console.error('Failed to get/create folder:', error);
      return null;
    }
  }

  // Upload a file to Google Drive
  async uploadFile(file: File): Promise<UploadResult> {
    if (!this.isAuthenticated()) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        return { success: false, error: 'Authentication failed' };
      }
    }

    try {
      const folderId = await this.getOrCreateFolder();
      if (!folderId) {
        return { success: false, error: 'Failed to get/create folder' };
      }

      // Create file metadata
      const metadata = {
        name: `question_${Date.now()}_${file.name}`,
        parents: [folderId],
      };

      // Create form data for multipart upload
      const form = new FormData();
      form.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      );
      form.append('file', file);

      // Get access token
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      // Upload using fetch (multipart upload)
      const uploadResponse = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const result = await uploadResponse.json();

      // Make file publicly accessible
      await (window as any).gapi.client.drive.permissions.create({
        fileId: result.id,
        resource: {
          role: 'reader',
          type: 'anyone',
        },
      });

      // Get the direct link (for embedding in img tags)
      // Format: https://drive.google.com/uc?id=FILE_ID
      const directLink = `https://drive.google.com/uc?id=${result.id}`;

      return {
        success: true,
        fileId: result.id,
        webViewLink: result.webViewLink,
        webContentLink: result.webContentLink,
        directLink,
      };
    } catch (error: any) {
      console.error('Upload failed:', error);
      return { success: false, error: error.message || 'Upload failed' };
    }
  }

  // Upload from base64 data URL
  async uploadBase64(dataUrl: string, filename: string = 'image.png'): Promise<UploadResult> {
    // Convert base64 to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], filename, { type: blob.type });
    return this.uploadFile(file);
  }
}

// Singleton instance
export const googleDriveService = new GoogleDriveService();
export type { GoogleDriveConfig, UploadResult };
