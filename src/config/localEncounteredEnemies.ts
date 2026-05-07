const LS_KEY = 'neon_encountered_enemies_v1';

export function readLocalEncountered(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/** Merge new names into persisted list; returns full sorted unique list. */
export function mergeIntoLocalEncountered(newNames: string[]): string[] {
  if (typeof window === 'undefined') return [...new Set(newNames.map(String))];
  const prev = readLocalEncountered();
  const merged = [...new Set([...prev, ...newNames.map(String).filter(Boolean)])];
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(merged));
  } catch {
    /* quota / private mode */
  }
  return merged;
}
