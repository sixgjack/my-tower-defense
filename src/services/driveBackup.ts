// src/services/driveBackup.ts
// Google Drive backup service for PostgreSQL database

import { exportAllData, importAllData } from './postgresDatabase';

const BACKUP_FILE_NAME = 'tower-defense-backup.json';
const BACKUP_FOLDER_NAME = 'Tower Defense Backups';

/**
 * Initialize Google Drive API
 * Requires Google OAuth authentication
 */
async function getGapiClient(): Promise<any> {
  return new Promise((resolve, reject) => {
    // Load Google API script if not already loaded
    if ((window as any).gapi) {
      resolve((window as any).gapi);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      (window as any).gapi.load('client:auth2', () => {
        (window as any).gapi.client
          .init({
            apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
            clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            scope: 'https://www.googleapis.com/auth/drive.file'
          })
          .then(() => {
            resolve((window as any).gapi);
          })
          .catch(reject);
      });
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Authenticate with Google
 */
export async function authenticateGoogle(): Promise<boolean> {
  try {
    const gapi = await getGapiClient();
    const authInstance = gapi.auth2.getAuthInstance();
    
    if (authInstance.isSignedIn.get()) {
      return true;
    }
    
    await authInstance.signIn();
    return authInstance.isSignedIn.get();
  } catch (error) {
    console.error('Google authentication failed:', error);
    return false;
  }
}

/**
 * Sign out from Google
 */
export async function signOutGoogle(): Promise<void> {
  try {
    const gapi = await getGapiClient();
    const authInstance = gapi.auth2.getAuthInstance();
    if (authInstance.isSignedIn.get()) {
      await authInstance.signOut();
    }
  } catch (error) {
    console.error('Google sign out failed:', error);
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const gapi = await getGapiClient();
    const authInstance = gapi.auth2.getAuthInstance();
    return authInstance.isSignedIn.get();
  } catch (error) {
    return false;
  }
}

/**
 * Find or create backup folder
 */
async function getBackupFolderId(gapi: any): Promise<string | null> {
  try {
    // Search for existing folder
    const response = await gapi.client.drive.files.list({
      q: `name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)'
    });

    if (response.result.files && response.result.files.length > 0) {
      return response.result.files[0].id;
    }

    // Create new folder
    const createResponse = await gapi.client.drive.files.create({
      resource: {
        name: BACKUP_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder'
      },
      fields: 'id'
    });

    return createResponse.result.id;
  } catch (error) {
    console.error('Failed to get backup folder:', error);
    return null;
  }
}

/**
 * Upload database backup to Google Drive
 */
export async function backupToGoogleDrive(): Promise<{ success: boolean; error?: string; fileId?: string }> {
  try {
    // Check authentication
    if (!(await isAuthenticated())) {
      const authenticated = await authenticateGoogle();
      if (!authenticated) {
        return { success: false, error: 'Google authentication required' };
      }
    }

    const gapi = await getGapiClient();
    
    // Export all data
    const exportResult = await exportAllData();
    if (!exportResult.success || !exportResult.data) {
      return { success: false, error: exportResult.error || 'Failed to export data' };
    }

    // Get or create backup folder
    const folderId = await getBackupFolderId(gapi);
    if (!folderId) {
      return { success: false, error: 'Failed to create backup folder' };
    }

    // Create backup file name with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${BACKUP_FILE_NAME.replace('.json', '')}-${timestamp}.json`;

    // Convert data to JSON
    const fileContent = JSON.stringify(exportResult.data, null, 2);
    const blob = new Blob([fileContent], { type: 'application/json' });

    // Check if file already exists
    const listResponse = await gapi.client.drive.files.list({
      q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id)'
    });

    let fileId: string | undefined;

    if (listResponse.result.files && listResponse.result.files.length > 0) {
      // Update existing file
      fileId = listResponse.result.files[0].id;
      
      // Upload file content
      const form = new FormData();
      form.append('metadata', new Blob([
        JSON.stringify({ name: fileName })
      ], { type: 'application/json' }));
      form.append('file', blob);

      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
        },
        body: form
      });
    } else {
      // Create new file
      const metadata = {
        name: fileName,
        parents: [folderId]
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', blob);

      const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
        },
        body: form
      });

      const result = await uploadResponse.json();
      fileId = result.id;
    }

    return { success: true, fileId };
  } catch (error: any) {
    console.error('Backup to Google Drive failed:', error);
    return { success: false, error: error.message || 'Backup failed' };
  }
}

/**
 * List available backups from Google Drive
 */
export async function listBackups(): Promise<{ success: boolean; backups?: Array<{ id: string; name: string; createdTime: string }>; error?: string }> {
  try {
    if (!(await isAuthenticated())) {
      return { success: false, error: 'Google authentication required' };
    }

    const gapi = await getGapiClient();
    const folderId = await getBackupFolderId(gapi);

    if (!folderId) {
      return { success: false, error: 'Backup folder not found' };
    }

    const response = await gapi.client.drive.files.list({
      q: `'${folderId}' in parents and name contains '${BACKUP_FILE_NAME.replace('.json', '')}' and trashed=false`,
      fields: 'files(id, name, createdTime)',
      orderBy: 'createdTime desc'
    });

    return {
      success: true,
      backups: response.result.files || []
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to list backups' };
  }
}

/**
 * Restore database from Google Drive backup
 */
export async function restoreFromGoogleDrive(fileId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!(await isAuthenticated())) {
      return { success: false, error: 'Google authentication required' };
    }

    const gapi = await getGapiClient();

    // Download file
    const response = await gapi.client.drive.files.get({
      fileId,
      alt: 'media'
    });

    // Parse JSON data
    const backupData = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;

    // Import data
    const importResult = await importAllData(backupData);
    if (!importResult.success) {
      return { success: false, error: importResult.error || 'Failed to import data' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Restore from Google Drive failed:', error);
    return { success: false, error: error.message || 'Restore failed' };
  }
}

/**
 * Download backup as file (fallback method)
 */
export async function downloadBackup(): Promise<void> {
  const exportResult = await exportAllData();
  if (!exportResult.success || !exportResult.data) {
    throw new Error(exportResult.error || 'Failed to export data');
  }

  const dataStr = JSON.stringify(exportResult.data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${BACKUP_FILE_NAME.replace('.json', '')}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Upload backup from file (fallback method)
 */
export async function uploadBackup(file: File): Promise<{ success: boolean; error?: string }> {
  try {
    const text = await file.text();
    const backupData = JSON.parse(text);
    
    const importResult = await importAllData(backupData);
    if (!importResult.success) {
      return { success: false, error: importResult.error || 'Failed to import data' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to parse backup file' };
  }
}
