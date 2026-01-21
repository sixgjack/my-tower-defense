// src/services/questionSetService.ts
// Service for managing question sets (game modes) dynamically - using PostgreSQL
import * as db from './postgresDatabase';
import type { GameMode } from '../components/ModeSelection';

// Re-export for convenience
export type { GameMode };

export interface QuestionSet extends GameMode {
  id: string | number;
  createdBy: string; // Teacher UID
  createdAt?: string;
  updatedAt?: string;
  questionCount?: number; // Number of questions in this set
}

/**
 * Get all question sets
 */
export const getAllQuestionSets = async (): Promise<QuestionSet[]> => {
  try {
    const result = await db.getAllQuestionSets();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch question sets');
    }
    
    // Handle empty or undefined data
    const data = result.data || [];
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    // Get question counts for each set
    const setsWithCounts = await Promise.all(
      data.map(async (set) => {
        const questionsResult = await db.getQuestionsBySet(set.name || '');
        const questionCount = questionsResult.success && questionsResult.data && Array.isArray(questionsResult.data)
          ? questionsResult.data.length 
          : 0;
        
        return {
          id: String(set.id),
          name: set.name,
          nameZh: set.nameZh,
          description: set.description || '',
          descriptionZh: set.descriptionZh || '',
          questionSetId: set.name?.toLowerCase().replace(/\s+/g, '-') || '',
          difficulty: 'easy' as const,
          icon: '📚',
          color: '#3b82f6',
          createdBy: set.createdBy || 'system',
          createdAt: set.createdAt,
          updatedAt: set.updatedAt,
          questionCount
        } as QuestionSet;
      })
    );
    
    return setsWithCounts;
  } catch (error) {
    console.error('Error fetching question sets:', error);
    throw error;
  }
};

/**
 * Get question sets created by a specific teacher
 */
export const getQuestionSetsByTeacher = async (teacherUid: string): Promise<QuestionSet[]> => {
  try {
    const allSets = await getAllQuestionSets();
    return allSets.filter(set => set.createdBy === teacherUid);
  } catch (error) {
    console.error('Error fetching question sets by teacher:', error);
    throw error;
  }
};

/**
 * Get a question set by ID
 */
export const getQuestionSet = async (id: string): Promise<QuestionSet | null> => {
  try {
    const allSets = await getAllQuestionSets();
    return allSets.find(set => String(set.id) === id) || null;
  } catch (error) {
    console.error('Error fetching question set:', error);
    throw error;
  }
};

/**
 * Create a new question set
 */
export const createQuestionSet = async (questionSet: Omit<QuestionSet, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const result = await db.addQuestionSet({
      name: questionSet.name,
      nameZh: questionSet.nameZh,
      description: questionSet.description,
      descriptionZh: questionSet.descriptionZh,
      createdBy: questionSet.createdBy || 'system'
    });
    
    if (!result.success || result.data === undefined) {
      throw new Error(result.error || 'Failed to create question set');
    }
    
    return String(result.data);
  } catch (error) {
    console.error('Error creating question set:', error);
    throw error;
  }
};

/**
 * Update a question set
 */
export const updateQuestionSet = async (id: string, updates: Partial<QuestionSet>): Promise<void> => {
  try {
    const setId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(setId)) {
      throw new Error('Invalid question set ID');
    }
    
    const result = await db.updateQuestionSet(setId, {
      name: updates.name,
      nameZh: updates.nameZh,
      description: updates.description,
      descriptionZh: updates.descriptionZh,
      createdBy: updates.createdBy
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update question set');
    }
  } catch (error) {
    console.error('Error updating question set:', error);
    throw error;
  }
};

/**
 * Delete a question set
 */
export const deleteQuestionSet = async (id: string): Promise<void> => {
  try {
    const setId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(setId)) {
      throw new Error('Invalid question set ID');
    }
    
    const result = await db.deleteQuestionSet(setId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete question set');
    }
  } catch (error) {
    console.error('Error deleting question set:', error);
    throw error;
  }
};

/**
 * Initialize default question sets if they don't exist
 */
export const initializeDefaultQuestionSets = async (): Promise<void> => {
  try {
    const existingSets = await getAllQuestionSets();
    if (existingSets.length > 0) {
      return; // Already initialized
    }

    const defaultSets: Omit<QuestionSet, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Math Basics',
        nameZh: '數學基礎',
        description: 'Basic arithmetic and algebra questions',
        descriptionZh: '基礎算術和代數題目',
        questionSetId: 'math-basics',
        difficulty: 'easy',
        icon: '🔢',
        color: '#3b82f6',
        createdBy: 'system'
      },
      {
        name: 'Science Fundamentals',
        nameZh: '科學基礎',
        description: 'Physics, chemistry, and biology basics',
        descriptionZh: '物理、化學和生物基礎',
        questionSetId: 'science-fundamentals',
        difficulty: 'easy',
        icon: '🔬',
        color: '#10b981',
        createdBy: 'system'
      },
      {
        name: 'Programming',
        nameZh: '程式設計',
        description: 'Coding concepts and logic questions',
        descriptionZh: '編程概念和邏輯題目',
        questionSetId: 'programming',
        difficulty: 'medium',
        icon: '💻',
        color: '#8b5cf6',
        createdBy: 'system'
      },
      {
        name: 'Advanced Math',
        nameZh: '進階數學',
        description: 'Calculus, trigonometry, and complex equations',
        descriptionZh: '微積分、三角函數和複雜方程式',
        questionSetId: 'advanced-math',
        difficulty: 'hard',
        icon: '📐',
        color: '#f59e0b',
        createdBy: 'system'
      },
      {
        name: 'Mixed Challenge',
        nameZh: '混合挑戰',
        description: 'Random questions from all categories',
        descriptionZh: '所有類別的隨機題目',
        questionSetId: 'mixed',
        difficulty: 'hard',
        icon: '🎯',
        color: '#ec4899',
        createdBy: 'system'
      }
    ];

    // Create all default sets
    for (const set of defaultSets) {
      await createQuestionSet(set);
    }
  } catch (error) {
    console.error('Error initializing default question sets:', error);
    // Don't throw - allow app to continue even if initialization fails
  }
};
