/**
 * Set VITE_DISABLE_GOOGLE_AUTH=true in `.env` only for local demo mode.
 * Default behavior keeps Google SSO enabled.
 */

export function isGoogleAuthDisabledByEnv(): boolean {
  return import.meta.env.VITE_DISABLE_GOOGLE_AUTH === 'true';
}

export function isGoogleAuthDisabled(): boolean {
  return isGoogleAuthDisabledByEnv();
}

export const DEMO_LOCAL_USER_ID = 'local-demo';
