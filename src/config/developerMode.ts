/**
 * Developer mode: unlimited in-game money and bosses always visible (no invisibility).
 *
 * Enable any of:
 * - `.env`: `VITE_DEVELOPER_MODE=true`
 * - URL: `?dev=1` or `?dev=true` on the game page
 * - After load, in DevTools console: `localStorage.setItem('NEON_DEVELOPER_MODE','1'); location.reload()`
 *
 * Disable: `localStorage.removeItem('NEON_DEVELOPER_MODE'); location.reload()`
 */

const LS_KEY = 'NEON_DEVELOPER_MODE';

export function isDeveloperMode(): boolean {
  if (import.meta.env.VITE_DEVELOPER_MODE === 'true') return true;
  if (typeof window === 'undefined') return false;
  try {
    if (window.localStorage.getItem(LS_KEY) === '1') return true;
    const q = new URLSearchParams(window.location.search).get('dev');
    if (q === '1' || q === 'true' || q === 'yes') return true;
  } catch {
    /* private mode / blocked storage */
  }
  return false;
}

export function setDeveloperMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) window.localStorage.setItem(LS_KEY, '1');
    else window.localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
}

export const DEV_STARTING_MONEY = 99_999_999;
