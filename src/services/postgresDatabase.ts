// src/services/postgresDatabase.ts
// PostgreSQL database service using PGlite (PostgreSQL in the browser/Node.js)

import { PGlite } from '@electric-sql/pglite';

// Database instance - initialized lazily
let db: PGlite | null = null;
let initPromise: Promise<void> | null = null;

interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Initialize the PostgreSQL database
 */
async function initDatabase(): Promise<void> {
  if (db) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Clear corrupted IndexedDB if it exists
      try {
        const deleteReq = indexedDB.deleteDatabase('tower-defense-db');
        await new Promise<void>((resolve, reject) => {
          deleteReq.onsuccess = () => {
            console.log('Cleared corrupted IndexedDB database');
            setTimeout(resolve, 200); // Wait for cleanup
          };
          deleteReq.onerror = () => {
            console.warn('Could not delete IndexedDB (may not exist):', deleteReq.error);
            resolve(); // Continue anyway
          };
          deleteReq.onblocked = () => {
            console.warn('IndexedDB delete blocked, continuing anyway...');
            resolve();
          };
        });
      } catch (e) {
        console.warn('Error clearing IndexedDB:', e);
        // Continue anyway
      }

      // Initialize PGlite - uses IndexedDB for persistence in browser
      db = new PGlite('idb://tower-defense-db');

      // Create tables if they don't exist
      await db.exec(`
        CREATE TABLE IF NOT EXISTS questions (
          id SERIAL PRIMARY KEY,
          question TEXT NOT NULL,
          options JSONB NOT NULL,
          correct TEXT NOT NULL,
          question_set_id TEXT NOT NULL,
          difficulty TEXT,
          category TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_questions_set_id ON questions(question_set_id);

        CREATE TABLE IF NOT EXISTS students (
          user_id TEXT PRIMARY KEY,
          total_games INTEGER DEFAULT 0,
          total_waves INTEGER DEFAULT 0,
          total_enemies_killed INTEGER DEFAULT 0,
          total_money_earned INTEGER DEFAULT 0,
          highest_wave INTEGER DEFAULT 0,
          credits INTEGER DEFAULT 0,
          unlocked_towers JSONB DEFAULT '[]',
          last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS question_sets (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          name_zh TEXT,
          description TEXT,
          description_zh TEXT,
          created_by TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (error: any) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Get the database instance (initializes if needed)
 */
async function getDb(): Promise<PGlite> {
  await initDatabase();
  if (!db) throw new Error('Database not initialized');
  return db;
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
  createdAt?: string;
}

export async function addQuestion(question: Omit<Question, 'id' | 'createdAt'>): Promise<DatabaseResult<number>> {
  try {
    const database = await getDb();
    const result = await database.query(
      `INSERT INTO questions (question, options, correct, question_set_id, difficulty, category)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        question.question,
        JSON.stringify(question.options),
        question.correct,
        question.questionSetId,
        question.difficulty || null,
        question.category || null
      ]
    );
    // PGlite returns { rows: any[] } structure
    const rows = (result as any).rows || result || [];
    
    return { success: true, data: rows[0]?.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getQuestion(questionId: number): Promise<DatabaseResult<Question>> {
  try {
    const database = await getDb();
    const result = await database.query(
      'SELECT * FROM questions WHERE id = $1',
      [questionId]
    );
    
    // PGlite returns { rows: any[] } structure
    const rows = (result as any).rows || result || [];
    if (!Array.isArray(rows) || rows.length === 0) {
      return { success: false, error: 'Question not found' };
    }
    
    const row = rows[0];
    return {
      success: true,
      data: {
        id: row.id,
        question: row.question,
        options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
        correct: row.correct,
        questionSetId: row.question_set_id,
        difficulty: row.difficulty,
        category: row.category,
        createdAt: row.created_at
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAllQuestions(): Promise<DatabaseResult<Question[]>> {
  try {
    const database = await getDb();
    const result = await database.query('SELECT * FROM questions ORDER BY created_at DESC');
    // PGlite returns { rows: any[] } structure
    const rows = (result as any).rows || result || [];
    
    if (!Array.isArray(rows)) {
      return { success: true, data: [] };
    }
    
    return {
      success: true,
      data: rows.map((row: any) => ({
        id: row.id,
        question: row.question,
        options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
        correct: row.correct,
        questionSetId: row.question_set_id,
        difficulty: row.difficulty,
        category: row.category,
        createdAt: row.created_at
      }))
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getQuestionsBySet(questionSetId: string): Promise<DatabaseResult<Question[]>> {
  try {
    const database = await getDb();
    const result = await database.query(
      'SELECT * FROM questions WHERE question_set_id = $1 ORDER BY created_at DESC',
      [questionSetId]
    );
    // PGlite returns { rows: any[] } structure
    const rows = (result as any).rows || result || [];
    
    if (!Array.isArray(rows)) {
      return { success: true, data: [] };
    }
    
    return {
      success: true,
      data: rows.map((row: any) => ({
        id: row.id,
        question: row.question,
        options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
        correct: row.correct,
        questionSetId: row.question_set_id,
        difficulty: row.difficulty,
        category: row.category,
        createdAt: row.created_at
      }))
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateQuestion(questionId: number, updates: Partial<Question>): Promise<DatabaseResult<void>> {
  try {
    const database = await getDb();
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.question !== undefined) {
      setClauses.push(`question = $${paramIndex++}`);
      values.push(updates.question);
    }
    if (updates.options !== undefined) {
      setClauses.push(`options = $${paramIndex++}`);
      values.push(JSON.stringify(updates.options));
    }
    if (updates.correct !== undefined) {
      setClauses.push(`correct = $${paramIndex++}`);
      values.push(updates.correct);
    }
    if (updates.questionSetId !== undefined) {
      setClauses.push(`question_set_id = $${paramIndex++}`);
      values.push(updates.questionSetId);
    }
    if (updates.difficulty !== undefined) {
      setClauses.push(`difficulty = $${paramIndex++}`);
      values.push(updates.difficulty);
    }
    if (updates.category !== undefined) {
      setClauses.push(`category = $${paramIndex++}`);
      values.push(updates.category);
    }

    if (setClauses.length === 0) {
      return { success: true };
    }

    values.push(questionId);
    await database.query(
      `UPDATE questions SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteQuestion(questionId: number): Promise<DatabaseResult<void>> {
  try {
    const database = await getDb();
    await database.query('DELETE FROM questions WHERE id = $1', [questionId]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function bulkImportQuestions(
  questions: Omit<Question, 'id' | 'createdAt'>[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    const database = await getDb();
    
    // Use a transaction for better performance
    await database.exec('BEGIN');
    
    try {
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        
        // Validate question
        if (!question.question || !question.options || !question.correct || !question.questionSetId) {
          failed++;
          errors.push(`Invalid question at index ${i}: Missing required fields`);
          continue;
        }

        if (!question.options.includes(question.correct)) {
          failed++;
          errors.push(`Invalid question at index ${i}: Correct answer "${question.correct}" not in options`);
          continue;
        }

        const result = await addQuestion(question);
        if (result.success) {
          success++;
        } else {
          failed++;
          errors.push(`Failed to add question at index ${i}: ${result.error}`);
        }
      }
      
      await database.exec('COMMIT');
    } catch (error) {
      await database.exec('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    return { success, failed, errors: [...errors, `Transaction failed: ${error.message}`] };
  }

  return { success, failed, errors };
}

// ==================== STUDENT METHODS ====================

export interface StudentStatus {
  userId: string;
  totalGames: number;
  totalWaves: number;
  totalEnemiesKilled: number;
  totalMoneyEarned: number;
  highestWave: number;
  credits: number;
  unlockedTowers: string[];
  lastPlayed: string;
}

export async function getStudentStatus(userId: string): Promise<DatabaseResult<StudentStatus>> {
  try {
    const database = await getDb();
    const result = await database.query(
      'SELECT * FROM students WHERE user_id = $1',
      [userId]
    );
    // PGlite returns { rows: any[] } structure
    const rows = (result as any).rows || result || [];
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return { success: false, error: 'Student not found' };
    }
    
    const row = rows[0];
    return {
      success: true,
      data: {
        userId: row.user_id,
        totalGames: row.total_games || 0,
        totalWaves: row.total_waves || 0,
        totalEnemiesKilled: row.total_enemies_killed || 0,
        totalMoneyEarned: row.total_money_earned || 0,
        highestWave: row.highest_wave || 0,
        credits: row.credits || 0,
        unlockedTowers: typeof row.unlocked_towers === 'string' 
          ? JSON.parse(row.unlocked_towers) 
          : (row.unlocked_towers || []),
        lastPlayed: row.last_played
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createStudentStatus(userId: string, initialData: Partial<StudentStatus> = {}): Promise<DatabaseResult<void>> {
  try {
    const database = await getDb();
    await database.query(
      `INSERT INTO students (
        user_id, total_games, total_waves, total_enemies_killed,
        total_money_earned, highest_wave, credits, unlocked_towers
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id) DO NOTHING`,
      [
        userId,
        initialData.totalGames || 0,
        initialData.totalWaves || 0,
        initialData.totalEnemiesKilled || 0,
        initialData.totalMoneyEarned || 0,
        initialData.highestWave || 0,
        initialData.credits || 0,
        JSON.stringify(initialData.unlockedTowers || [])
      ]
    );
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateStudentStatus(
  userId: string,
  updates: Partial<StudentStatus & { increment?: Partial<StudentStatus> }>
): Promise<DatabaseResult<void>> {
  try {
    const database = await getDb();
    
    // Handle increments separately
    if (updates.increment) {
      const incrementClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.increment.totalGames) {
        incrementClauses.push(`total_games = total_games + $${paramIndex++}`);
        values.push(updates.increment.totalGames);
      }
      if (updates.increment.totalWaves) {
        incrementClauses.push(`total_waves = total_waves + $${paramIndex++}`);
        values.push(updates.increment.totalWaves);
      }
      if (updates.increment.totalEnemiesKilled) {
        incrementClauses.push(`total_enemies_killed = total_enemies_killed + $${paramIndex++}`);
        values.push(updates.increment.totalEnemiesKilled);
      }
      if (updates.increment.totalMoneyEarned) {
        incrementClauses.push(`total_money_earned = total_money_earned + $${paramIndex++}`);
        values.push(updates.increment.totalMoneyEarned);
      }
      if (updates.increment.credits) {
        incrementClauses.push(`credits = credits + $${paramIndex++}`);
        values.push(updates.increment.credits);
      }
      if (updates.increment.highestWave) {
        incrementClauses.push(`highest_wave = GREATEST(highest_wave, $${paramIndex++})`);
        values.push(updates.increment.highestWave);
      }

      if (incrementClauses.length > 0) {
        values.push(userId);
        await database.query(
          `UPDATE students SET ${incrementClauses.join(', ')}, last_played = CURRENT_TIMESTAMP WHERE user_id = $${paramIndex}`,
          values
        );
      }
    }

    // Handle regular updates
    const { increment, ...regularUpdates } = updates;
    if (Object.keys(regularUpdates).length > 0) {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (regularUpdates.totalGames !== undefined) {
        setClauses.push(`total_games = $${paramIndex++}`);
        values.push(regularUpdates.totalGames);
      }
      if (regularUpdates.totalWaves !== undefined) {
        setClauses.push(`total_waves = $${paramIndex++}`);
        values.push(regularUpdates.totalWaves);
      }
      if (regularUpdates.totalEnemiesKilled !== undefined) {
        setClauses.push(`total_enemies_killed = $${paramIndex++}`);
        values.push(regularUpdates.totalEnemiesKilled);
      }
      if (regularUpdates.totalMoneyEarned !== undefined) {
        setClauses.push(`total_money_earned = $${paramIndex++}`);
        values.push(regularUpdates.totalMoneyEarned);
      }
      if (regularUpdates.highestWave !== undefined) {
        setClauses.push(`highest_wave = $${paramIndex++}`);
        values.push(regularUpdates.highestWave);
      }
      if (regularUpdates.credits !== undefined) {
        setClauses.push(`credits = $${paramIndex++}`);
        values.push(regularUpdates.credits);
      }
      if (regularUpdates.unlockedTowers !== undefined) {
        setClauses.push(`unlocked_towers = $${paramIndex++}`);
        values.push(JSON.stringify(regularUpdates.unlockedTowers));
      }

      if (setClauses.length > 0) {
        setClauses.push('last_played = CURRENT_TIMESTAMP');
        values.push(userId);
        await database.query(
          `UPDATE students SET ${setClauses.join(', ')} WHERE user_id = $${paramIndex}`,
          values
        );
      }
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
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

export async function addQuestionSet(questionSet: Omit<QuestionSet, 'id' | 'createdAt' | 'updatedAt'>): Promise<DatabaseResult<number>> {
  try {
    const database = await getDb();
    const result = await database.query(
      `INSERT INTO question_sets (name, name_zh, description, description_zh, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        questionSet.name,
        questionSet.nameZh || null,
        questionSet.description || null,
        questionSet.descriptionZh || null,
        questionSet.createdBy || null
      ]
    );
    // PGlite returns { rows: any[] } structure
    const rows = (result as any).rows || result || [];
    
    return { success: true, data: rows[0]?.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAllQuestionSets(): Promise<DatabaseResult<QuestionSet[]>> {
  try {
    const database = await getDb();
    const result = await database.query('SELECT * FROM question_sets ORDER BY created_at DESC');
    // PGlite returns { rows: any[] } structure
    const rows = (result as any).rows || result || [];
    
    if (!Array.isArray(rows)) {
      return { success: true, data: [] };
    }
    
    return {
      success: true,
      data: rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        nameZh: row.name_zh,
        description: row.description,
        descriptionZh: row.description_zh,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateQuestionSet(id: number, updates: Partial<QuestionSet>): Promise<DatabaseResult<void>> {
  try {
    const database = await getDb();
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.nameZh !== undefined) {
      setClauses.push(`name_zh = $${paramIndex++}`);
      values.push(updates.nameZh);
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.descriptionZh !== undefined) {
      setClauses.push(`description_zh = $${paramIndex++}`);
      values.push(updates.descriptionZh);
    }

    if (setClauses.length === 0) {
      return { success: true };
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    await database.query(
      `UPDATE question_sets SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteQuestionSet(id: number): Promise<DatabaseResult<void>> {
  try {
    const database = await getDb();
    await database.query('DELETE FROM question_sets WHERE id = $1', [id]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==================== BACKUP/RESTORE ====================

export async function exportAllData(): Promise<DatabaseResult<any>> {
  try {
    const [questions, studentsResult, questionSets] = await Promise.all([
      getAllQuestions(),
      getDb().then(async database => {
        const result = await database.query('SELECT * FROM students');
        // PGlite returns { rows: any[] } structure
        return (result as any).rows || result || [];
      }),
      getAllQuestionSets()
    ]);

    if (!questions.success || !questionSets.success) {
      return { success: false, error: 'Failed to export data' };
    }

    const students = Array.isArray(studentsResult) ? studentsResult : [];
    
    return {
      success: true,
      data: {
        questions: questions.data || [],
        students: students.map((row: any) => ({
          userId: row.user_id,
          totalGames: row.total_games,
          totalWaves: row.total_waves,
          totalEnemiesKilled: row.total_enemies_killed,
          totalMoneyEarned: row.total_money_earned,
          highestWave: row.highest_wave,
          credits: row.credits,
          unlockedTowers: typeof row.unlocked_towers === 'string' ? JSON.parse(row.unlocked_towers) : row.unlocked_towers,
          lastPlayed: row.last_played
        })),
        questionSets: questionSets.data || [],
        exportDate: new Date().toISOString()
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function importAllData(data: any): Promise<DatabaseResult<void>> {
  try {
    const database = await getDb();
    
    await database.exec('BEGIN');
    
    try {
      // Clear existing data
      await database.exec('TRUNCATE TABLE questions, students, question_sets RESTART IDENTITY CASCADE');
      
      // Import questions
      if (data.questions && Array.isArray(data.questions)) {
        for (const question of data.questions) {
          await addQuestion(question);
        }
      }
      
      // Import students
      if (data.students && Array.isArray(data.students)) {
        for (const student of data.students) {
          await createStudentStatus(student.userId, student);
        }
      }
      
      // Import question sets
      if (data.questionSets && Array.isArray(data.questionSets)) {
        for (const set of data.questionSets) {
          await addQuestionSet(set);
        }
      }
      
      await database.exec('COMMIT');
      return { success: true };
    } catch (error) {
      await database.exec('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
