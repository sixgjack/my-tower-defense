// src/components/TeacherQuestionSetManager.tsx
// Component for teachers to manage their question sets
import React, { useState, useEffect } from 'react';
import { 
  getAllQuestionSets, 
  createQuestionSet, 
  updateQuestionSet, 
  deleteQuestionSet,
  type QuestionSet 
} from '../services/questionSetService';
import { getQuestionsBySet } from '../services/questionService';
import { useLanguage } from '../i18n/useTranslation';

interface TeacherQuestionSetManagerProps {
  teacherUid: string;
}

export const TeacherQuestionSetManager: React.FC<TeacherQuestionSetManagerProps> = ({ teacherUid }) => {
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSet, setEditingSet] = useState<QuestionSet | null>(null);
  const { language, t } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    nameZh: '',
    description: '',
    descriptionZh: '',
    questionSetId: '',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    icon: '📚',
    color: '#3b82f6'
  });

  useEffect(() => {
    loadQuestionSets();
  }, [teacherUid]);

  const loadQuestionSets = async () => {
    setLoading(true);
    try {
      // Load all question sets (teachers can see all, but only edit their own)
      const allSets = await getAllQuestionSets();
      
      // Get question counts for each set
      const setsWithCounts = await Promise.all(
        allSets.map(async (set) => {
          try {
            const questions = await getQuestionsBySet(set.questionSetId);
            return { ...set, questionCount: questions.length };
          } catch {
            return { ...set, questionCount: 0 };
          }
        })
      );
      
      setQuestionSets(setsWithCounts);
    } catch (error) {
      console.error('Error loading question sets:', error);
      alert('Failed to load question sets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.questionSetId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await createQuestionSet({
        ...formData,
        createdBy: teacherUid
      });
      await loadQuestionSets();
      setShowCreateForm(false);
      resetForm();
      alert('Question set created successfully!');
    } catch (error) {
      console.error('Error creating question set:', error);
      alert('Failed to create question set');
    }
  };

  const handleUpdate = async () => {
    if (!editingSet) return;

    try {
      await updateQuestionSet(editingSet.id, formData);
      await loadQuestionSets();
      setEditingSet(null);
      resetForm();
      alert('Question set updated successfully!');
    } catch (error) {
      console.error('Error updating question set:', error);
      alert('Failed to update question set');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question set?')) return;

    try {
      await deleteQuestionSet(id);
      await loadQuestionSets();
      alert('Question set deleted successfully!');
    } catch (error) {
      console.error('Error deleting question set:', error);
      alert('Failed to delete question set');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameZh: '',
      description: '',
      descriptionZh: '',
      questionSetId: '',
      difficulty: 'easy',
      icon: '📚',
      color: '#3b82f6'
    });
  };

  const startEdit = (set: QuestionSet) => {
    setEditingSet(set);
    setFormData({
      name: set.name,
      nameZh: set.nameZh || '',
      description: set.description,
      descriptionZh: set.descriptionZh || '',
      questionSetId: set.questionSetId,
      difficulty: set.difficulty,
      icon: set.icon,
      color: set.color
    });
    setShowCreateForm(true);
  };

  const isOwner = (set: QuestionSet) => {
    return set.createdBy === teacherUid || set.createdBy === 'system';
  };

  if (loading) {
    return <div className="text-center text-white py-8">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          {t('teacher.questionSets')} / Question Sets
        </h2>
        <button
          onClick={() => {
            resetForm();
            setEditingSet(null);
            setShowCreateForm(true);
          }}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all"
        >
          {t('teacher.createSet')} / Create Set
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl p-6 border border-purple-500/50">
          <h3 className="text-xl font-bold text-white mb-4">
            {editingSet ? t('teacher.editSet') : t('teacher.createSet')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm mb-2">
                {t('teacher.setName')} (EN) *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="Math Basics"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-2">
                {t('teacher.setName')} (中文) *
              </label>
              <input
                type="text"
                value={formData.nameZh}
                onChange={(e) => setFormData({ ...formData, nameZh: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="數學基礎"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-2">
                Description (EN)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="Basic arithmetic questions"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-2">
                Description (中文)
              </label>
              <input
                type="text"
                value={formData.descriptionZh}
                onChange={(e) => setFormData({ ...formData, descriptionZh: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="基礎算術題目"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-2">
                Question Set ID *
              </label>
              <input
                type="text"
                value={formData.questionSetId}
                onChange={(e) => setFormData({ ...formData, questionSetId: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="math-basics"
                disabled={!!editingSet}
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-2">
                {t('teacher.difficulty')}
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-2">
                {t('teacher.icon')}
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="🔢"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-2">
                {t('teacher.color')}
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-10 bg-slate-700 border border-slate-600 rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <button
              onClick={editingSet ? handleUpdate : handleCreate}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all"
            >
              {editingSet ? t('common.save') : 'Create'}
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingSet(null);
                resetForm();
              }}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Question Sets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {questionSets.map((set) => (
          <div
            key={set.id}
            className="bg-slate-800/90 backdrop-blur-lg rounded-xl p-6 border-2"
            style={{ borderColor: set.color + '80' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-4xl">{set.icon}</div>
              {isOwner(set) && (
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(set)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-all"
                  >
                    {t('common.edit')}
                  </button>
                  {set.createdBy === teacherUid && (
                    <button
                      onClick={() => handleDelete(set.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-all"
                    >
                      {t('common.delete')}
                    </button>
                  )}
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {language === 'zh-TW' && set.nameZh ? set.nameZh : set.name}
            </h3>
            <p className="text-slate-300 text-sm mb-4">
              {language === 'zh-TW' && set.descriptionZh ? set.descriptionZh : set.description}
            </p>
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded text-xs font-bold ${
                set.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                set.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {set.difficulty.toUpperCase()}
              </span>
              <span className="text-slate-400 text-sm">
                {set.questionCount || 0} {t('admin.questions')}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              ID: {set.questionSetId}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
