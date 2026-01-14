// src/utils/testDatabase.ts
// Test script for PostgreSQL database

import * as db from '../services/postgresDatabase';

export async function testDatabase() {
  console.log('🧪 Testing PostgreSQL Database...\n');

  try {
    // Test 1: Add a question
    console.log('Test 1: Adding a test question...');
    const addResult = await db.addQuestion({
      question: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correct: '4',
      questionSetId: 'math-basics',
      difficulty: 'easy',
      category: 'arithmetic'
    });
    
    if (!addResult.success) {
      throw new Error(`Failed to add question: ${addResult.error}`);
    }
    console.log('✅ Question added with ID:', addResult.data);

    // Test 2: Get question by ID
    console.log('\nTest 2: Getting question by ID...');
    const getResult = await db.getQuestion(addResult.data!);
    if (!getResult.success || !getResult.data) {
      throw new Error(`Failed to get question: ${getResult.error}`);
    }
    console.log('✅ Retrieved question:', getResult.data.question);

    // Test 3: Get questions by set
    console.log('\nTest 3: Getting questions by set...');
    const setResult = await db.getQuestionsBySet('math-basics');
    if (!setResult.success) {
      throw new Error(`Failed to get questions by set: ${setResult.error}`);
    }
    console.log(`✅ Found ${setResult.data?.length || 0} questions in set`);

    // Test 4: Create student status
    console.log('\nTest 4: Creating student status...');
    const createStudentResult = await db.createStudentStatus('test-user-123', {
      totalGames: 0,
      totalWaves: 0,
      totalEnemiesKilled: 0,
      totalMoneyEarned: 0,
      highestWave: 0,
      credits: 0,
      unlockedTowers: []
    });
    if (!createStudentResult.success) {
      throw new Error(`Failed to create student: ${createStudentResult.error}`);
    }
    console.log('✅ Student status created');

    // Test 5: Get student status
    console.log('\nTest 5: Getting student status...');
    const getStudentResult = await db.getStudentStatus('test-user-123');
    if (!getStudentResult.success || !getStudentResult.data) {
      throw new Error(`Failed to get student: ${getStudentResult.error}`);
    }
    console.log('✅ Student status retrieved:', {
      userId: getStudentResult.data.userId,
      credits: getStudentResult.data.credits
    });

    // Test 6: Update student status with increment
    console.log('\nTest 6: Updating student status with increment...');
    const updateResult = await db.updateStudentStatus('test-user-123', {
      increment: {
        totalGames: 1,
        totalWaves: 5,
        totalEnemiesKilled: 10,
        totalMoneyEarned: 100,
        credits: 10
      }
    });
    if (!updateResult.success) {
      throw new Error(`Failed to update student: ${updateResult.error}`);
    }
    console.log('✅ Student status updated');

    // Test 7: Verify update
    console.log('\nTest 7: Verifying update...');
    const verifyResult = await db.getStudentStatus('test-user-123');
    if (!verifyResult.success || !verifyResult.data) {
      throw new Error(`Failed to verify: ${verifyResult.error}`);
    }
    console.log('✅ Updated values:', {
      totalGames: verifyResult.data.totalGames,
      credits: verifyResult.data.credits
    });

    // Test 8: Add question set
    console.log('\nTest 8: Adding question set...');
    const addSetResult = await db.addQuestionSet({
      name: 'Test Set',
      nameZh: '測試集合',
      description: 'A test question set',
      descriptionZh: '一個測試問題集合',
      createdBy: 'test-teacher'
    });
    if (!addSetResult.success) {
      throw new Error(`Failed to add question set: ${addSetResult.error}`);
    }
    console.log('✅ Question set added with ID:', addSetResult.data);

    // Test 9: Get all question sets
    console.log('\nTest 9: Getting all question sets...');
    const getAllSetsResult = await db.getAllQuestionSets();
    if (!getAllSetsResult.success) {
      throw new Error(`Failed to get question sets: ${getAllSetsResult.error}`);
    }
    console.log(`✅ Found ${getAllSetsResult.data?.length || 0} question sets`);

    // Test 10: Export all data
    console.log('\nTest 10: Exporting all data...');
    const exportResult = await db.exportAllData();
    if (!exportResult.success || !exportResult.data) {
      throw new Error(`Failed to export: ${exportResult.error}`);
    }
    console.log('✅ Data exported:', {
      questions: exportResult.data.questions?.length || 0,
      students: exportResult.data.students?.length || 0,
      questionSets: exportResult.data.questionSets?.length || 0
    });

    // Cleanup: Delete test question
    console.log('\n🧹 Cleaning up test data...');
    await db.deleteQuestion(addResult.data!);
    console.log('✅ Test question deleted');

    console.log('\n🎉 All database tests passed!');
    return { success: true };
  } catch (error: any) {
    console.error('\n❌ Database test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Auto-run test if this file is imported in development
if (import.meta.env.DEV) {
  // Only run if explicitly called
  // testDatabase().catch(console.error);
}
