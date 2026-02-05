// src/components/GoogleDriveSettings.tsx
// Settings component for Google Drive integration

import React, { useState, useEffect } from 'react';
import { googleDriveService, type GoogleDriveConfig } from '../services/googleDriveService';

interface GoogleDriveSettingsProps {
  onClose: () => void;
}

export const GoogleDriveSettings: React.FC<GoogleDriveSettingsProps> = ({ onClose }) => {
  const [clientId, setClientId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    // Load existing credentials
    const credentials = googleDriveService.getCredentials();
    if (credentials) {
      setClientId(credentials.clientId);
      setApiKey(credentials.apiKey);
    }
    setIsConnected(googleDriveService.isAuthenticated());
  }, []);

  const handleSaveCredentials = () => {
    if (!clientId.trim() || !apiKey.trim()) {
      setError('Both Client ID and API Key are required');
      return;
    }
    googleDriveService.saveCredentials({ clientId: clientId.trim(), apiKey: apiKey.trim() });
    setError(null);
    alert('Credentials saved! Click "Connect to Google Drive" to authenticate.');
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const initialized = await googleDriveService.initialize();
      if (!initialized) {
        setError('Failed to initialize Google Drive API. Check your credentials.');
        return;
      }

      const authenticated = await googleDriveService.authenticate();
      if (authenticated) {
        setIsConnected(true);
        alert('Successfully connected to Google Drive!');
      } else {
        setError('Authentication failed or was cancelled.');
      }
    } catch (err: any) {
      setError(err.message || 'Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    googleDriveService.signOut();
    setIsConnected(false);
  };

  const handleClearCredentials = () => {
    if (confirm('This will remove your Google Drive credentials. Continue?')) {
      googleDriveService.clearCredentials();
      setClientId('');
      setApiKey('');
      setIsConnected(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/20 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Google Drive Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">✕</button>
        </div>

        {/* Connection Status */}
        <div className={`p-4 rounded-lg mb-6 ${isConnected ? 'bg-green-900/30 border border-green-600/30' : 'bg-yellow-900/30 border border-yellow-600/30'}`}>
          <div className="flex items-center gap-3">
            <span className={`text-2xl ${isConnected ? 'text-green-400' : 'text-yellow-400'}`}>
              {isConnected ? '✓' : '⚠'}
            </span>
            <div>
              <p className={`font-semibold ${isConnected ? 'text-green-300' : 'text-yellow-300'}`}>
                {isConnected ? 'Connected to Google Drive' : 'Not Connected'}
              </p>
              <p className="text-sm text-slate-400">
                {isConnected 
                  ? 'Images will be automatically uploaded to your Google Drive' 
                  : 'Configure credentials below to enable automatic image uploads'}
              </p>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mb-6">
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2"
          >
            {showHelp ? '▼' : '▶'} How to get Google Cloud credentials
          </button>
          
          {showHelp && (
            <div className="mt-3 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg text-sm text-slate-300">
              <ol className="list-decimal list-inside space-y-2">
                <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener" className="text-blue-400 hover:underline">Google Cloud Console</a></li>
                <li>Create a new project or select existing one</li>
                <li>Enable <strong>Google Drive API</strong> from APIs & Services → Library</li>
                <li>Go to <strong>APIs & Services → Credentials</strong></li>
                <li>Create <strong>API Key</strong>:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Click "Create Credentials" → "API Key"</li>
                    <li>Copy the key and paste below</li>
                  </ul>
                </li>
                <li>Create <strong>OAuth 2.0 Client ID</strong>:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Click "Create Credentials" → "OAuth client ID"</li>
                    <li>Select "Web application"</li>
                    <li>Add <code className="bg-black/50 px-1 rounded">{window.location.origin}</code> to Authorized JavaScript origins</li>
                    <li>Copy the Client ID and paste below</li>
                  </ul>
                </li>
                <li>Configure <strong>OAuth Consent Screen</strong>:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Set to "External" for testing</li>
                    <li>Add your email as test user</li>
                  </ul>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Credentials Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-white mb-2">OAuth Client ID:</label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="xxxx.apps.googleusercontent.com"
              className="w-full p-3 bg-black/60 border border-white/20 rounded-lg text-white font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-white mb-2">API Key:</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full p-3 bg-black/60 border border-white/20 rounded-lg text-white font-mono text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-600/30 rounded-lg text-red-300 mb-4">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSaveCredentials}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
          >
            Save Credentials
          </button>

          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isLoading || !clientId || !apiKey}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⟳</span> Connecting...
                </>
              ) : (
                <>🔗 Connect to Google Drive</>
              )}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all"
            >
              Disconnect
            </button>
          )}

          <button
            onClick={handleClearCredentials}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
          >
            Clear Credentials
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-6 pt-4 border-t border-white/10 text-sm text-slate-400">
          <p>
            <strong>Note:</strong> Credentials are stored locally in your browser. 
            Images will be uploaded to a folder called "TowerDefense_Questions" in your Google Drive.
          </p>
        </div>
      </div>
    </div>
  );
};
