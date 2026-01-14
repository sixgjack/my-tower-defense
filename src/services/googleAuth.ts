// src/services/googleAuth.ts
// Direct Google OAuth authentication (replacing Firebase Auth)

export interface GoogleUser {
  uid: string; // Google user ID
  email: string;
  displayName: string;
  photoURL?: string;
}

let googleUser: GoogleUser | null = null;
let authListeners: Array<(user: GoogleUser | null) => void> = [];

/**
 * Initialize Google OAuth
 */
export async function initGoogleAuth(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Load Google Identity Services script
    if ((window as any).google?.accounts) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).google?.accounts) {
        resolve();
      } else {
        reject(new Error('Google Identity Services failed to load'));
      }
    };
    script.onerror = () => {
      reject(new Error('Failed to load Google Identity Services script'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<GoogleUser> {
  await initGoogleAuth();

  return new Promise((resolve, reject) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    
    if (!clientId) {
      reject(new Error('Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in .env'));
      return;
    }

    (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: async (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }

        try {
          // Get user info using the access token
          const userInfo = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
              'Authorization': `Bearer ${response.access_token}`
            }
          });

          if (!userInfo.ok) {
            throw new Error('Failed to fetch user info');
          }

          const userData = await userInfo.json();
          
          const user: GoogleUser = {
            uid: userData.id,
            email: userData.email,
            displayName: userData.name,
            photoURL: userData.picture
          };

          googleUser = user;
          localStorage.setItem('google_user', JSON.stringify(user));
          localStorage.setItem('google_access_token', response.access_token);
          
          // Notify listeners
          authListeners.forEach(listener => listener(user));
          
          resolve(user);
        } catch (error: any) {
          reject(error);
        }
      }
    }).requestAccessToken();
  });
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  googleUser = null;
  localStorage.removeItem('google_user');
  localStorage.removeItem('google_access_token');
  
  // Revoke token if available
  const token = localStorage.getItem('google_access_token');
  if (token && (window as any).google?.accounts?.oauth2) {
    try {
      (window as any).google.accounts.oauth2.revoke(token);
    } catch (error) {
      console.error('Error revoking token:', error);
    }
  }
  
  // Notify listeners
  authListeners.forEach(listener => listener(null));
}

/**
 * Get current user
 */
export function getCurrentUser(): GoogleUser | null {
  if (googleUser) {
    return googleUser;
  }

  // Try to load from localStorage
  const stored = localStorage.getItem('google_user');
  if (stored) {
    try {
      googleUser = JSON.parse(stored);
      return googleUser;
    } catch (error) {
      console.error('Error parsing stored user:', error);
    }
  }

  return null;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChanged(callback: (user: GoogleUser | null) => void): () => void {
  authListeners.push(callback);
  
  // Immediately call with current user
  callback(getCurrentUser());
  
  // Return unsubscribe function
  return () => {
    authListeners = authListeners.filter(listener => listener !== callback);
  };
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}
