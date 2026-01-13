// src/components/AdminPanel.tsx
// Admin panel for bulk importing and managing questions
import React, { useState, useEffect } from 'react';
import {
  bulkImportQuestions,
  getAllQuestions,
  getQuestionsBySet,
  deleteQuestion,
  deleteAllQuestions,
  type Question
} from '../services/questionService';

interface AdminPanelProps {
  onBack: () => void;
  showSignOut?: boolean; // Whether to show sign out button instead of back button
}

const QUESTION_SETS = [
  { id: 'math-basics', name: 'Math Basics', color: '#3b82f6' },
  { id: 'science-fundamentals', name: 'Science Fundamentals', color: '#10b981' },
  { id: 'programming', name: 'Programming', color: '#8b5cf6' },
  { id: 'advanced-math', name: 'Advanced Math', color: '#f59e0b' },
  { id: 'mixed', name: 'Mixed', color: '#ec4899' }
];

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack, showSignOut = false }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [selectedSet, setSelectedSet] = useState<string>('all');
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correct: '',
    questionSetId: 'math-basics',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    category: ''
  });

  useEffect(() => {
    loadQuestions();
  }, [selectedSet]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      if (selectedSet === 'all') {
        const allQuestions = await getAllQuestions();
        setQuestions(allQuestions);
      } else {
        const setQuestions = await getQuestionsBySet(selectedSet);
        setQuestions(setQuestions);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      alert('Failed to load questions: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async () => {
    if (!jsonInput.trim()) {
      alert('Please enter JSON data');
      return;
    }

    setLoading(true);
    setImportResult(null);

    try {
      const parsed = JSON.parse(jsonInput);
      const questionsArray = Array.isArray(parsed) ? parsed : [parsed];

      // Validate and transform questions
      const validQuestions = questionsArray.map((q: any) => ({
        question: q.question,
        options: q.options,
        correct: q.correct,
        questionSetId: q.questionSetId || 'mixed',
        difficulty: q.difficulty || 'medium',
        category: q.category || ''
      }));

      const result = await bulkImportQuestions(validQuestions);
      setImportResult(result);
      setJsonInput('');
      await loadQuestions();

      alert(`Import complete!\nSuccess: ${result.success}\nFailed: ${result.failed}`);
    } catch (error: any) {
      alert('Import failed: ' + error.message);
      console.error('Import error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.question || !newQuestion.correct) {
      alert('Please fill in all required fields');
      return;
    }

    if (!newQuestion.options.includes(newQuestion.correct)) {
      alert('Correct answer must be one of the options');
      return;
    }

    setLoading(true);
    try {
      await bulkImportQuestions([{
        question: newQuestion.question,
        options: newQuestion.options.filter(opt => opt.trim() !== ''),
        correct: newQuestion.correct,
        questionSetId: newQuestion.questionSetId,
        difficulty: newQuestion.difficulty,
        category: newQuestion.category || undefined
      }]);
      
      setNewQuestion({
        question: '',
        options: ['', '', '', ''],
        correct: '',
        questionSetId: 'math-basics',
        difficulty: 'easy',
        category: ''
      });
      setShowAddForm(false);
      await loadQuestions();
      alert('Question added successfully!');
    } catch (error: any) {
      alert('Failed to add question: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    setLoading(true);
    try {
      await deleteQuestion(questionId);
      await loadQuestions();
      alert('Question deleted successfully!');
    } catch (error: any) {
      alert('Failed to delete question: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('⚠️ WARNING: This will delete ALL questions! Are you absolutely sure?')) return;
    if (!confirm('This action cannot be undone. Type "DELETE ALL" to confirm.')) return;

    setLoading(true);
    try {
      await deleteAllQuestions();
      await loadQuestions();
      alert('All questions deleted!');
    } catch (error: any) {
      alert('Failed to delete questions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        question: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        correct: "4",
        questionSetId: "math-basics",
        difficulty: "easy",
        category: "arithmetic"
      },
      {
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correct: "Paris",
        questionSetId: "science-fundamentals",
        difficulty: "easy",
        category: "geography"
      }
    ];

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions-template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 mb-2">
                ADMIN PANEL
              </h1>
              <p className="text-slate-300 text-sm md:text-base">Manage questions database</p>
            </div>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all backdrop-blur-sm border border-slate-600"
            >
              {showSignOut ? 'Sign Out' : '← Back'}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {QUESTION_SETS.map((set) => {
              const count = questions.filter(q => q.questionSetId === set.id).length;
              return (
                <div key={set.id} className="bg-black/40 rounded-lg p-4 border border-white/10">
                  <div className="text-sm text-slate-400 mb-1">{set.name}</div>
                  <div className="text-2xl font-bold text-white">{count}</div>
                </div>
              );
            })}
            <div className="bg-black/40 rounded-lg p-4 border border-white/10">
              <div className="text-sm text-slate-400 mb-1">Total</div>
              <div className="text-2xl font-bold text-white">{questions.length}</div>
            </div>
          </div>

          {/* Filter */}
          <div className="mb-6">
            <label className="block text-white mb-2">Filter by Question Set:</label>
            <select
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value)}
              className="px-4 py-2 bg-black/60 border border-white/20 rounded-lg text-white"
            >
              <option value="all">All Questions</option>
              {QUESTION_SETS.map((set) => (
                <option key={set.id} value={set.id}>{set.name}</option>
              ))}
            </select>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-white/20">
            <button
              onClick={() => setShowAddForm(false)}
              className={`px-4 py-2 ${!showAddForm ? 'border-b-2 border-yellow-400 text-yellow-400' : 'text-slate-400'}`}
            >
              Bulk Import
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className={`px-4 py-2 ${showAddForm ? 'border-b-2 border-yellow-400 text-yellow-400' : 'text-slate-400'}`}
            >
              Add Single Question
            </button>
          </div>

          {/* Bulk Import Section */}
          {!showAddForm && (
            <div className="bg-black/60 rounded-xl p-6 mb-8 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Bulk Import Questions</h2>
                <button
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                >
                  Download Template
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-white mb-2">JSON Format:</label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='[{"question": "What is 2+2?", "options": ["3", "4", "5", "6"], "correct": "4", "questionSetId": "math-basics", "difficulty": "easy", "category": "arithmetic"}]'
                  className="w-full h-64 p-4 bg-black/80 border border-white/20 rounded-lg text-white font-mono text-sm"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleBulkImport}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Importing...' : 'Import Questions'}
                </button>
                <button
                  onClick={() => setJsonInput('')}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
                >
                  Clear
                </button>
              </div>

              {importResult && (
                <div className="mt-4 p-4 bg-black/80 rounded-lg border border-white/20">
                  <div className="text-green-400 mb-2">✓ Success: {importResult.success}</div>
                  {importResult.failed > 0 && (
                    <div className="text-red-400 mb-2">✗ Failed: {importResult.failed}</div>
                  )}
                  {importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <div className="text-red-400 mb-1">Errors:</div>
                      <ul className="list-disc list-inside text-sm text-red-300">
                        {importResult.errors.slice(0, 10).map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Add Single Question Form */}
          {showAddForm && (
            <div className="bg-black/60 rounded-xl p-6 mb-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Add Single Question</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white mb-2">Question:</label>
                  <textarea
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                    className="w-full p-3 bg-black/80 border border-white/20 rounded-lg text-white"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">Options (4 options):</label>
                  {newQuestion.options.map((opt, i) => (
                    <input
                      key={i}
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...newQuestion.options];
                        newOptions[i] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: newOptions });
                      }}
                      placeholder={`Option ${i + 1}`}
                      className="w-full mb-2 p-3 bg-black/80 border border-white/20 rounded-lg text-white"
                    />
                  ))}
                </div>

                <div>
                  <label className="block text-white mb-2">Correct Answer (must match one option exactly):</label>
                  <input
                    type="text"
                    value={newQuestion.correct}
                    onChange={(e) => setNewQuestion({ ...newQuestion, correct: e.target.value })}
                    className="w-full p-3 bg-black/80 border border-white/20 rounded-lg text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white mb-2">Question Set:</label>
                    <select
                      value={newQuestion.questionSetId}
                      onChange={(e) => setNewQuestion({ ...newQuestion, questionSetId: e.target.value })}
                      className="w-full p-3 bg-black/80 border border-white/20 rounded-lg text-white"
                    >
                      {QUESTION_SETS.map((set) => (
                        <option key={set.id} value={set.id}>{set.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-white mb-2">Difficulty:</label>
                    <select
                      value={newQuestion.difficulty}
                      onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                      className="w-full p-3 bg-black/80 border border-white/20 rounded-lg text-white"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-white mb-2">Category (optional):</label>
                  <input
                    type="text"
                    value={newQuestion.category}
                    onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                    placeholder="e.g., arithmetic, algorithms, chemistry"
                    className="w-full p-3 bg-black/80 border border-white/20 rounded-lg text-white"
                  />
                </div>

                <button
                  onClick={handleAddQuestion}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add Question'}
                </button>
              </div>
            </div>
          )}

          {/* Questions List */}
          <div className="bg-black/60 rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">
                Questions ({questions.length})
              </h2>
              <button
                onClick={handleDeleteAll}
                disabled={loading || questions.length === 0}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete All
              </button>
            </div>

            {loading && questions.length === 0 ? (
              <div className="text-center py-8 text-white">Loading questions...</div>
            ) : questions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No questions found. Import some questions to get started!</div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {questions.map((q) => (
                  <div key={q.id} className="bg-black/80 rounded-lg p-4 border border-white/10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-white font-semibold mb-2">{q.question}</div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {q.options.map((opt, i) => (
                            <span
                              key={i}
                              className={`px-2 py-1 rounded text-sm ${
                                opt === q.correct
                                  ? 'bg-green-600 text-white'
                                  : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              {opt} {opt === q.correct && '✓'}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-4 text-sm text-slate-400">
                          <span>Set: {q.questionSetId}</span>
                          {q.difficulty && <span>Difficulty: {q.difficulty}</span>}
                          {q.category && <span>Category: {q.category}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => q.id && handleDelete(q.id)}
                        disabled={loading}
                        className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-all disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
