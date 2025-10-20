import React, { useState, useMemo, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { Question, QuestionSet } from '../types';
import { PlusIcon, TrashIcon, PencilIcon } from './icons';

interface TeacherViewProps {
  onStartQuiz: (questions: Question[], numberOfGroups: number) => void;
}

const evaluateMath = (text: string): string | null => {
    try {
      const sanitizedText = text
        .replace(/=/g, '')
        .replace(/\s/g, '')
        .replace(/x/gi, '*')
        .replace(/×/g, '*')
        .replace(/÷/g, '/');
      
      if (!/^[0-9.+\-*/()]+$/.test(sanitizedText) || !/[\+\-\*\/]/.test(sanitizedText)) {
        return null;
      }

      const result = new Function('return ' + sanitizedText)();
      
      if (typeof result === 'number' && isFinite(result)) {
        return String(result);
      }
    } catch (error) {
      // Silently fail if evaluation is not possible
    }
    return null;
  };

const TeacherDashboard: React.FC<{ onStartQuiz: (questions: Question[], numberOfGroups: number) => void }> = ({ onStartQuiz }) => {
  const [sets, setSets] = useLocalStorage<QuestionSet[]>('quiz-question-sets', []);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [newSetName, setNewSetName] = useState('');
  
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionAnswer, setNewQuestionAnswer] = useState('');

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editedText, setEditedText] = useState('');
  const [editedAnswer, setEditedAnswer] = useState('');
  const [numberOfGroups, setNumberOfGroups] = useState(1);
  
  const activeSet = useMemo(() => sets.find(s => s.id === activeSetId), [sets, activeSetId]);

  useEffect(() => {
    if (editingQuestion) {
      setEditedText(editingQuestion.text);
      setEditedAnswer(editingQuestion.answer);
    }
  }, [editingQuestion]);
  
  const handleNewQuestionTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setNewQuestionText(text);
    const result = evaluateMath(text);
    if (result !== null) {
      setNewQuestionAnswer(result);
    }
  };

  const handleEditedQuestionTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setEditedText(text);
    const result = evaluateMath(text);
    if (result !== null) {
        setEditedAnswer(result);
    }
  };

  const handleCreateSet = () => {
    if (newSetName.trim()) {
      const newSet: QuestionSet = {
        id: Date.now().toString(),
        name: newSetName.trim(),
        questions: []
      };
      setSets(prev => [...prev, newSet]);
      setActiveSetId(newSet.id);
      setNewSetName('');
    }
  };

  const handleDeleteSet = () => {
    if (activeSetId && window.confirm(`Are you sure you want to delete the set "${activeSet?.name}"?`)) {
      setSets(prev => prev.filter(s => s.id !== activeSetId));
      setActiveSetId(null);
    }
  };

  const handleAddQuestion = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeSetId) return;

    if (newQuestionText.trim() && newQuestionAnswer.trim()) {
      const newQuestion: Question = { id: Date.now().toString(), text: newQuestionText.trim(), answer: newQuestionAnswer.trim() };
      setSets(prev => prev.map(s => s.id === activeSetId ? { ...s, questions: [...s.questions, newQuestion] } : s));
      setNewQuestionText('');
      setNewQuestionAnswer('');
    }
  };

  const handleUpdateQuestion = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeSetId || !editingQuestion) return;

    if (editedText.trim() && editedAnswer.trim()) {
        const updatedQuestion = { ...editingQuestion, text: editedText.trim(), answer: editedAnswer.trim() };
        setSets(prev => prev.map(s => s.id === activeSetId ? { ...s, questions: s.questions.map(q => q.id === editingQuestion.id ? updatedQuestion : q) } : s));
        setEditingQuestion(null);
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!activeSetId) return;
    setSets(prev => prev.map(s => s.id === activeSetId ? { ...s, questions: s.questions.filter(q => q.id !== questionId) } : s));
  };

  return (
    <div className="w-full max-w-4xl bg-white/50 backdrop-blur-sm shadow-2xl rounded-lg p-8 space-y-6 border-2 border-amber-800/20">
      <h1 className="text-4xl font-bold text-center text-slate-900">Teacher Dashboard</h1>
      
      <div className="bg-amber-50/50 p-4 rounded-md border border-amber-800/10 space-y-4">
        <h2 className="text-2xl font-semibold text-slate-800">Question Sets</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-grow">
            <label htmlFor="set-select" className="block text-sm font-medium text-slate-700">Select a Set</label>
            <select id="set-select" value={activeSetId ?? ''} onChange={e => setActiveSetId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white text-slate-800 border-slate-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md">
              <option value="" disabled>-- Select a set --</option>
              {sets.map(set => <option key={set.id} value={set.id}>{set.name}</option>)}
            </select>
          </div>
          <button onClick={handleDeleteSet} disabled={!activeSetId} className="px-4 py-2 bg-red-600 text-white rounded-md disabled:bg-gray-400 hover:bg-red-700 transition">Delete Selected</button>
        </div>
        <div className="flex gap-4 items-end">
            <input type="text" value={newSetName} onChange={e => setNewSetName(e.target.value)} placeholder="New set name..." className="flex-grow mt-1 block w-full px-3 py-2 text-base bg-white text-slate-800 border-slate-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md"/>
            <button onClick={handleCreateSet} className="px-4 py-2 bg-amber-700 text-white rounded-md hover:bg-amber-800 transition">Create Set</button>
        </div>
      </div>

      {activeSet && (
        <>
            <div className="bg-amber-50/50 p-4 rounded-md border border-amber-800/10">
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">Questions for "{activeSet.name}"</h2>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {activeSet.questions.map(q => (
                    <div key={q.id} className="flex items-center gap-2 bg-white p-2 rounded">
                        <p className="flex-grow text-lg"><strong className="font-bold">{q.text}</strong> = <span className="font-bold text-green-700">{q.answer}</span></p>
                        <button onClick={() => setEditingQuestion(q)} className="p-1 text-blue-600 hover:text-blue-800"><PencilIcon className="w-5 h-5"/></button>
                        <button onClick={() => handleDeleteQuestion(q.id)} className="p-1 text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5" /></button>
                    </div>
                ))}
                {activeSet.questions.length === 0 && <p className="text-center text-gray-500">No questions yet. Add one below!</p>}
                </div>
            </div>

            {editingQuestion ? (
                 <div className="bg-blue-50/50 p-4 rounded-md border border-blue-800/10">
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Editing Question</h3>
                    <form onSubmit={handleUpdateQuestion} className="flex items-end gap-4">
                        <div className="flex-grow">
                            <label className="block text-sm font-medium text-slate-700">Question Text</label>
                            <input name="editText" value={editedText} onChange={handleEditedQuestionTextChange} required className="mt-1 w-full px-3 py-2 bg-white text-slate-800 border border-slate-300 rounded-md"/>
                        </div>
                        <div className="flex-grow">
                            <label className="block text-sm font-medium text-slate-700">Answer</label>
                            <input name="editAnswer" value={editedAnswer} onChange={e => setEditedAnswer(e.target.value)} required className="mt-1 w-full px-3 py-2 bg-white text-slate-800 border border-slate-300 rounded-md"/>
                        </div>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Update</button>
                        <button type="button" onClick={() => setEditingQuestion(null)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">Cancel</button>
                    </form>
                </div>
            ) : (
                <div className="bg-green-50/50 p-4 rounded-md border border-green-800/10">
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Add New Question</h3>
                    <form onSubmit={handleAddQuestion} className="flex items-end gap-4">
                        <div className="flex-grow">
                            <label className="block text-sm font-medium text-slate-700">Question Text (e.g., "5 + 3 =")</label>
                            <input name="questionText" placeholder="5 + 3 =" value={newQuestionText} onChange={handleNewQuestionTextChange} required className="mt-1 w-full px-3 py-2 bg-white text-slate-800 border border-slate-300 rounded-md"/>
                        </div>
                        <div className="flex-grow">
                            <label className="block text-sm font-medium text-slate-700">Correct Answer</label>
                            <input name="questionAnswer" placeholder="8" value={newQuestionAnswer} onChange={e => setNewQuestionAnswer(e.target.value)} required className="mt-1 w-full px-3 py-2 bg-white text-slate-800 border border-slate-300 rounded-md"/>
                        </div>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"><PlusIcon className="w-5 h-5"/> Add</button>
                    </form>
                </div>
            )}
            
            <div className="flex items-end gap-4 mt-4">
                <div className="flex-shrink-0">
                    <label className="block text-sm font-medium text-slate-700">Number of Groups</label>
                    <input 
                        type="number"
                        min="1"
                        value={numberOfGroups}
                        onChange={e => setNumberOfGroups(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="mt-1 w-32 px-3 py-3 text-2xl font-bold bg-white text-slate-800 border border-slate-300 rounded-lg text-center"
                    />
                </div>
                <button 
                    onClick={() => onStartQuiz(activeSet.questions, numberOfGroups)} 
                    disabled={activeSet.questions.length === 0}
                    className="flex-grow py-4 text-2xl font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:scale-100"
                >
                    ▶ START QUIZ
                </button>
            </div>
        </>
      )}
    </div>
  );
};

export const TeacherView: React.FC<TeacherViewProps> = ({ onStartQuiz }) => {
  return <TeacherDashboard onStartQuiz={onStartQuiz} />;
};