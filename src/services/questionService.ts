// src/services/questionService.ts
// Service for managing questions in PostgreSQL
import * as db from './postgresDatabase';

// Re-export the Question type from postgresDatabase for consistency
export type Question = db.Question & { id?: number | string }; // Allow string for backward compatibility

/**
 * Add a single question to PostgreSQL
 */
export const addQuestion = async (question: Omit<Question, 'id' | 'createdAt'>): Promise<string> => {
  const result = await db.addQuestion(question);
  if (!result.success || result.data === undefined) {
    throw new Error(result.error || 'Failed to add question');
  }
  return String(result.data);
};

/**
 * Bulk import questions to PostgreSQL
 */
export const bulkImportQuestions = async (questions: Omit<Question, 'id' | 'createdAt'>[]): Promise<{ success: number; failed: number; errors: string[] }> => {
  return db.bulkImportQuestions(questions);
};

/**
 * Get all questions from PostgreSQL
 */
export const getAllQuestions = async (): Promise<Question[]> => {
  const result = await db.getAllQuestions();
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch questions');
  }
  return result.data || [];
};

/**
 * Get questions by questionSetId
 */
export const getQuestionsBySet = async (questionSetId: string): Promise<Question[]> => {
  const result = await db.getQuestionsBySet(questionSetId);
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch questions');
  }
  return result.data || [];
};

/**
 * Update a question
 */
export const updateQuestion = async (questionId: string | number, updates: Partial<Question>): Promise<void> => {
  const id = typeof questionId === 'string' ? parseInt(questionId, 10) : questionId;
  const result = await db.updateQuestion(id, updates);
  if (!result.success) {
    throw new Error(result.error || 'Failed to update question');
  }
};

/**
 * Delete a question
 */
export const deleteQuestion = async (questionId: string | number): Promise<void> => {
  const id = typeof questionId === 'string' ? parseInt(questionId, 10) : questionId;
  const result = await db.deleteQuestion(id);
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete question');
  }
};

/**
 * Delete all questions (use with caution!)
 */
export const deleteAllQuestions = async (): Promise<void> => {
  const allQuestions = await getAllQuestions();
  await Promise.all(allQuestions.map(q => deleteQuestion(q.id!)));
};
