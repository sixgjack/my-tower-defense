/**
 * Set VITE_DISABLE_GOOGLE_AUTH=true in `.env` to skip Google SSO and play locally.
 * Progress / lucky draw / DB writes are skipped — Tower Defense gameplay still runs.
 */
export function isGoogleAuthDisabled(): boolean {
  return import.meta.env.VITE_DISABLE_GOOGLE_AUTH === 'true';
}

export const DEMO_LOCAL_USER_ID = 'local-demo';
