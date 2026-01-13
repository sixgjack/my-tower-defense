// src/services/questionSetService.ts
// Service for managing question sets (game modes) dynamically
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import type { GameMode } from '../components/ModeSelection';

// Re-export for convenience
export type { GameMode };

export interface QuestionSet extends GameMode {
  id: string;
  createdBy: string; // Teacher UID
  createdAt?: any;
  updatedAt?: any;
  questionCount?: number; // Number of questions in this set
}

/**
 * Get all question sets
 */
export const getAllQuestionSets = async (): Promise<QuestionSet[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'questionSets'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as QuestionSet));
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
    const q = query(collection(db, 'questionSets'), where('createdBy', '==', teacherUid));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as QuestionSet));
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
    const docRef = doc(db, 'questionSets', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as QuestionSet;
    }
    return null;
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
    const docRef = await addDoc(collection(db, 'questionSets'), {
      ...questionSet,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
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
    const docRef = doc(db, 'questionSets', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });
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
    const docRef = doc(db, 'questionSets', id);
    await deleteDoc(docRef);
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

    const batch = writeBatch(db);
    defaultSets.forEach((set) => {
      const docRef = doc(collection(db, 'questionSets'));
      batch.set(docRef, {
        ...set,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
    await batch.commit();
  } catch (error) {
    console.error('Error initializing default question sets:', error);
    throw error;
  }
};
