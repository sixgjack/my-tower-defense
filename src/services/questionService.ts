// src/services/questionService.ts
// Service for managing questions in Firebase
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

export interface Question {
  id?: string; // Document ID (optional, auto-generated if not provided)
  question: string;
  options: string[];
  correct: string;
  questionSetId: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  createdAt?: any; // Firestore Timestamp
}

/**
 * Add a single question to Firestore
 */
export const addQuestion = async (question: Omit<Question, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'questions'), {
      ...question,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding question:', error);
    throw error;
  }
};

/**
 * Bulk import questions to Firestore
 */
export const bulkImportQuestions = async (questions: Omit<Question, 'id' | 'createdAt'>[]): Promise<{ success: number; failed: number; errors: string[] }> => {
  const batch = writeBatch(db);
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  // Process in batches of 500 (Firestore limit)
  const batchSize = 500;
  for (let i = 0; i < questions.length; i += batchSize) {
    const batchQuestions = questions.slice(i, i + batchSize);
    
    try {
      batchQuestions.forEach((question) => {
        // Validate question
        if (!question.question || !question.options || !question.correct || !question.questionSetId) {
          failed++;
          errors.push(`Invalid question at index ${i + batchQuestions.indexOf(question)}: Missing required fields`);
          return;
        }

        if (!question.options.includes(question.correct)) {
          failed++;
          errors.push(`Invalid question: Correct answer "${question.correct}" not in options`);
          return;
        }

        const docRef = doc(collection(db, 'questions'));
        batch.set(docRef, {
          ...question,
          createdAt: new Date()
        });
        success++;
      });

      await batch.commit();
    } catch (error: any) {
      failed += batchQuestions.length;
      errors.push(`Batch error: ${error.message}`);
    }
  }

  return { success, failed, errors };
};

/**
 * Get all questions from Firestore
 */
export const getAllQuestions = async (): Promise<Question[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'questions'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Question));
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

/**
 * Get questions by questionSetId
 */
export const getQuestionsBySet = async (questionSetId: string): Promise<Question[]> => {
  try {
    const q = query(collection(db, 'questions'), where('questionSetId', '==', questionSetId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Question));
  } catch (error) {
    console.error('Error fetching questions by set:', error);
    throw error;
  }
};

/**
 * Update a question
 */
export const updateQuestion = async (questionId: string, updates: Partial<Question>): Promise<void> => {
  try {
    const questionRef = doc(db, 'questions', questionId);
    await updateDoc(questionRef, updates);
  } catch (error) {
    console.error('Error updating question:', error);
    throw error;
  }
};

/**
 * Delete a question
 */
export const deleteQuestion = async (questionId: string): Promise<void> => {
  try {
    const questionRef = doc(db, 'questions', questionId);
    await deleteDoc(questionRef);
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
};

/**
 * Delete all questions (use with caution!)
 */
export const deleteAllQuestions = async (): Promise<void> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'questions'));
    const batch = writeBatch(db);
    
    querySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error deleting all questions:', error);
    throw error;
  }
};
