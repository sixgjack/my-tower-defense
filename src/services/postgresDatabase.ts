// src/services/postgresDatabase.ts
// Talks to the Node API (server/index.ts), which connects to PostgreSQL.
// Set VITE_API_BASE_URL when the API is on another host/port (home lab ↔ office).

function apiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return raw?.replace(/\/$/, '') ?? '';
}

function apiUrl(path: string): string {
  const base = apiBase();
  if (!base) return path.startsWith('/') ? path : `/${path}`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

let readyPromise: Promise<void> | null = null;

async function ensureApiReady(): Promise<void> {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    try {
      const res = await fetch(apiUrl('/api/health'));
      if (!res.ok) throw new Error(`API health check failed: ${res.status}`);
    } catch (e) {
      console.warn('Tower Defense API unreachable — progress/questions may not save:', e);
    }
  })();
  return readyPromise;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  await ensureApiReady();
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string>),
    },
  });
  const body = (await res.json().catch(() => ({}))) as T & {
    success?: boolean;
    error?: string;
  };
  return body as T;
}

interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==================== QUESTION METHODS ====================

export interface Question {
  id?: number;
  question: string;
  options: string[];
  correct: string;
  questionSetId: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  imageUrl?: string;
  createdAt?: string;
}

export async function addQuestion(
  question: Omit<Question, 'id' | 'createdAt'>,
): Promise<DatabaseResult<number>> {
  try {
    const body = await apiFetch<DatabaseResult<number>>('/api/questions', {
      method: 'POST',
      body: JSON.stringify(question),
    });
    return body;
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getQuestion(questionId: number): Promise<DatabaseResult<Question>> {
  try {
    await ensureApiReady();
    const res = await fetch(apiUrl(`/api/questions/${questionId}`));
    const body = (await res.json()) as DatabaseResult<Question>;
    if (res.status === 404) return { success: false, error: body.error || 'Question not found' };
    return body;
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getAllQuestions(): Promise<DatabaseResult<Question[]>> {
  try {
    return await apiFetch<DatabaseResult<Question[]>>('/api/questions');
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getQuestionsBySet(questionSetId: string): Promise<DatabaseResult<Question[]>> {
  try {
    return await apiFetch<DatabaseResult<Question[]>>(
      `/api/questions/by-set/${encodeURIComponent(questionSetId)}`,
    );
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function updateQuestion(
  questionId: number,
  updates: Partial<Question>,
): Promise<DatabaseResult<void>> {
  try {
    const body = await apiFetch<DatabaseResult<void>>(`/api/questions/${questionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return body;
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function deleteQuestion(questionId: number): Promise<DatabaseResult<void>> {
  try {
    return await apiFetch<DatabaseResult<void>>(`/api/questions/${questionId}`, {
      method: 'DELETE',
    });
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function bulkImportQuestions(
  questions: Omit<Question, 'id' | 'createdAt'>[],
): Promise<{ success: number; failed: number; errors: string[] }> {
  try {
    await ensureApiReady();
    const res = await fetch(apiUrl('/api/questions/bulk-import'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions }),
    });
    const body = (await res.json()) as { success: number; failed: number; errors: string[] } & {
      error?: string;
    };
    if (!res.ok) {
      return {
        success: 0,
        failed: questions.length,
        errors: [body.error || `HTTP ${res.status}`],
      };
    }
    return body;
  } catch (error: unknown) {
    return {
      success: 0,
      failed: questions.length,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

// ==================== STUDENT METHODS ====================

export interface StudentStatus {
  userId: string;
  displayName: string;
  totalGames: number;
  totalWaves: number;
  totalEnemiesKilled: number;
  totalMoneyEarned: number;
  highestWave: number;
  credits: number;
  unlockedTowers: string[];
  encounteredEnemies: string[];
  towerExp: Record<string, number>;
  lastPlayed: string;
}

export async function getStudentStatus(userId: string): Promise<DatabaseResult<StudentStatus>> {
  try {
    await ensureApiReady();
    const res = await fetch(apiUrl(`/api/students/${encodeURIComponent(userId)}`));
    const body = (await res.json()) as DatabaseResult<StudentStatus>;
    if (res.status === 404) return { success: false, error: body.error || 'Student not found' };
    return body;
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function createStudentStatus(
  userId: string,
  initialData: Partial<StudentStatus> = {},
): Promise<DatabaseResult<void>> {
  try {
    return await apiFetch<DatabaseResult<void>>('/api/students', {
      method: 'POST',
      body: JSON.stringify({ userId, initialData }),
    });
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function updateStudentStatus(
  userId: string,
  updates: Partial<StudentStatus & { increment?: Partial<StudentStatus> }>,
): Promise<DatabaseResult<void>> {
  try {
    return await apiFetch<DatabaseResult<void>>(
      `/api/students/${encodeURIComponent(userId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
    );
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getAllStudentsForLeaderboard(): Promise<DatabaseResult<StudentStatus[]>> {
  try {
    await ensureApiReady();
    const res = await fetch(apiUrl('/api/students/leaderboard/top'));
    const body = (await res.json()) as DatabaseResult<StudentStatus[]>;
    if (!res.ok) return { success: false, error: body.error || `HTTP ${res.status}` };
    return body;
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function updateStudentDisplayName(
  userId: string,
  displayName: string,
): Promise<DatabaseResult<void>> {
  try {
    return await apiFetch<DatabaseResult<void>>(`/api/students/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ displayName }),
    });
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// ==================== QUESTION SET METHODS ====================

export interface QuestionSet {
  id?: number;
  name: string;
  nameZh?: string;
  description?: string;
  descriptionZh?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function addQuestionSet(
  questionSet: Omit<QuestionSet, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<DatabaseResult<number>> {
  try {
    return await apiFetch<DatabaseResult<number>>('/api/question-sets', {
      method: 'POST',
      body: JSON.stringify(questionSet),
    });
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getAllQuestionSets(): Promise<DatabaseResult<QuestionSet[]>> {
  try {
    return await apiFetch<DatabaseResult<QuestionSet[]>>('/api/question-sets');
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function updateQuestionSet(
  id: number,
  updates: Partial<QuestionSet>,
): Promise<DatabaseResult<void>> {
  try {
    return await apiFetch<DatabaseResult<void>>(`/api/question-sets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function deleteQuestionSet(id: number): Promise<DatabaseResult<void>> {
  try {
    return await apiFetch<DatabaseResult<void>>(`/api/question-sets/${id}`, {
      method: 'DELETE',
    });
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// ==================== BACKUP/RESTORE ====================

export async function exportAllData(): Promise<DatabaseResult<unknown>> {
  try {
    return await apiFetch<DatabaseResult<unknown>>('/api/backup/export');
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function importAllData(data: unknown): Promise<DatabaseResult<void>> {
  try {
    return await apiFetch<DatabaseResult<void>>('/api/backup/import', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
