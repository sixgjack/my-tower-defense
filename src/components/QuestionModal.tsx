import { useEffect, useState } from 'react';
import { getQuestionsBySet, getAllQuestions } from '../services/questionService';

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  theme: string; // 'theme-rhine' or 'theme-kazdel'
  questionSetId?: string; // Question set identifier (e.g., 'math-basics', 'programming', 'mixed')
}

export const QuestionModal = ({ isOpen, onClose, onSuccess, theme, questionSetId = 'mixed' }: QuestionModalProps) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. Load questions from PostgreSQL filtered by questionSetId
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        let filteredQuestions;
        
        if (questionSetId === 'mixed') {
          // Get all questions
          filteredQuestions = await getAllQuestions();
        } else {
          // Get questions by set
          filteredQuestions = await getQuestionsBySet(questionSetId);
        }
        
        // If no questions found for the set, fallback to all questions
        if (filteredQuestions.length === 0 && questionSetId !== 'mixed') {
          filteredQuestions = await getAllQuestions();
        }
        
        setQuestions(filteredQuestions);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching questions:", error);
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [questionSetId]);

  // 2. Pick a random question every time the modal opens
  useEffect(() => {
    if (isOpen && questions.length > 0) {
      const randomIndex = Math.floor(Math.random() * questions.length);
      setCurrentQ(questions[randomIndex]);
    }
  }, [isOpen, questions]);

  if (!isOpen) return null;

  const handleAnswer = (option: string) => {
    if (option === currentQ.correct) {
      onSuccess(); // Correct! Tell the GameBoard to proceed.
      onClose();
    } else {
      alert("⚠️ ACCESS DENIED: Incorrect Answer! (Security clearance failed)"); 
      // Optional: You could deduct lives here if you wanted!
      onClose();
    }
  };

  // --- Dynamic Styling based on Theme ---
  const isRhine = theme === 'theme-rhine';
  
  // Rhine = Blue/Tech, Kazdel = Orange/Rust
  const modalBg = isRhine ? 'bg-slate-900 border-cyan-500' : 'bg-stone-900 border-orange-700';
  const textTitle = isRhine ? 'text-cyan-400' : 'text-orange-500';
  const btnStyle = isRhine 
    ? 'hover:bg-cyan-900/40 border-cyan-800 text-cyan-100 hover:border-cyan-400' 
    : 'hover:bg-orange-900/40 border-orange-800 text-orange-100 hover:border-orange-400';

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4">
      <div className={`w-full max-w-lg p-8 border-2 rounded-lg shadow-2xl relative ${modalBg}`}>
        
        {/* Header */}
        <h2 className={`text-xl font-bold mb-6 uppercase tracking-widest border-b border-gray-700 pb-2 ${textTitle}`}>
          {isRhine ? '/// SYSTEM ACCESS REQUIRED ///' : '/// ANCIENT RITUAL REQUIRED ///'}
        </h2>

        {loading ? (
          <div className="text-white animate-pulse font-mono">Connecting to neural network...</div>
        ) : currentQ ? (
          <>
            <p className="text-white text-lg mb-8 font-mono border-l-4 border-gray-500 pl-4 leading-relaxed">
              {currentQ.question}
            </p>
            
            <div className="grid grid-cols-1 gap-3">
              {currentQ.options.map((opt: string) => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  className={`p-4 border text-left font-mono transition-all duration-200 uppercase tracking-wide text-sm ${btnStyle}`}
                >
                  [ {opt} ]
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="text-red-500 font-mono">ERROR: Database connection lost. No questions found.</div>
        )}

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white font-bold"
        >
          ✕
        </button>
      </div>
    </div>
  );
};