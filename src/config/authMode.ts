/**
 * Set VITE_DISABLE_GOOGLE_AUTH=true in `.env` to skip Google SSO and play locally.
 * Or use the "Skip Google sign-in" button on the menu — stored for this browser tab only.
 * Progress / lucky draw / DB writes are skipped — Tower Defense gameplay still runs.
 */
export const SKIP_GOOGLE_AUTH_SESSION_KEY = 'neon_skip_google_auth';

export function isGoogleAuthDisabledByEnv(): boolean {
  return import.meta.env.VITE_DISABLE_GOOGLE_AUTH === 'true';
}

export function isGoogleAuthSkippedInSession(): boolean {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SKIP_GOOGLE_AUTH_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function isGoogleAuthDisabled(): boolean {
  return isGoogleAuthDisabledByEnv() || isGoogleAuthSkippedInSession();
}

/** Persist skip for this tab; Lobby/LuckyDraw treat it like env demo (no DB sync). */
export function setSkipGoogleAuthSession(enabled: boolean): void {
  try {
    if (enabled) sessionStorage.setItem(SKIP_GOOGLE_AUTH_SESSION_KEY, '1');
    else sessionStorage.removeItem(SKIP_GOOGLE_AUTH_SESSION_KEY);
  } catch {
    /* private mode / SSR */
  }
}

export const DEMO_LOCAL_USER_ID = 'local-demo';
