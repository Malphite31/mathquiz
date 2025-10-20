import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Question } from '../types';
import { EnterFullscreenIcon, ExitFullscreenIcon } from './icons';

interface StudentViewProps {
  questions: Question[];
  currentGroupNumber: number;
  totalGroups: number;
  onExit: () => void;
  onNextGroup: () => void;
}

type Feedback = 'CORRECT' | 'INCORRECT' | null;

export const StudentView: React.FC<StudentViewProps> = ({ questions, currentGroupNumber, totalGroups, onExit, onNextGroup }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  
  const answerInputRef = useRef<HTMLInputElement>(null);
  const groupName = `GROUP ${currentGroupNumber}`;
  const isLastGroup = currentGroupNumber >= totalGroups;

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const studentAnswer = e.target.value.trim();
    setCurrentAnswer(studentAnswer);
    setFeedback(null); // Clear feedback on new input

    const correctAnswer = questions[currentQuestionIndex].answer.trim();
    if (studentAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
      setFeedback('CORRECT');
      setScore(s => s + 1);
      setTimeout(() => {
        setIsTransitioning(true);
        setTimeout(() => {
            if (currentQuestionIndex + 1 < questions.length) {
                setCurrentQuestionIndex(prev => prev + 1);
                setCurrentAnswer('');
                setFeedback(null);
            } else {
                setIsFinished(true);
            }
            setIsTransitioning(false);
        }, 300);
      }, 1500);
    }
  };
  
  const handleIncorrectGuess = (e: React.FormEvent) => {
      e.preventDefault();
      if (feedback !== 'CORRECT') {
          setFeedback('INCORRECT');
          answerInputRef.current?.select();
      }
  };

  useEffect(() => {
    answerInputRef.current?.focus();
  }, [currentQuestionIndex, isFinished]);
  
  const handleNextGroupClick = () => {
    onNextGroup();
    setCurrentQuestionIndex(0);
    setCurrentAnswer('');
    setFeedback(null);
    setScore(0);
    setIsFinished(false);
  };
  
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const feedbackClasses = 
    feedback === 'CORRECT' ? 'text-green-700' :
    feedback === 'INCORRECT' ? 'text-red-700' :
    'text-transparent';

  return (
    <div className="fixed inset-0 bg-[#e6dcc9] flex flex-col items-center justify-center p-4 text-center">
        <div className="absolute top-4 right-4 flex gap-4 items-center">
            <button onClick={toggleFullscreen} className="text-slate-800/50 hover:text-slate-800 transition">
                {isFullscreen ? <ExitFullscreenIcon className="w-8 h-8"/> : <EnterFullscreenIcon className="w-8 h-8"/>}
            </button>
             <button onClick={onExit} className="text-sm px-3 py-1 bg-slate-800/10 text-slate-800 font-semibold rounded-full hover:bg-slate-800/20 transition">Teacher Mode</button>
        </div>
      
      <div className="absolute top-4 left-4 text-left">
          <h2 className="text-4xl font-bold text-slate-800 text-shadow">{groupName}</h2>
          <p className="text-3xl text-slate-800 font-bold text-shadow">Score: {score}</p>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center w-full max-w-4xl">
        {isFinished ? (
          <div className="flex flex-col items-center justify-center space-y-8 animate-fade-in">
            <h1 className="text-8xl text-shadow">🎉</h1>
            <h2 className="text-6xl font-bold text-shadow">
                {isLastGroup ? 'All Groups Finished!' : 'Finished!'}
            </h2>
            <p className="text-4xl text-shadow">Great job, {groupName}!</p>
            <p className="text-3xl text-shadow">Final Score: {score} / {questions.length}</p>
            
            {isLastGroup ? (
                 <button
                    onClick={onExit}
                    className="mt-8 px-8 py-4 bg-blue-600 text-white text-2xl font-bold rounded-lg shadow-lg hover:bg-blue-700 transition transform hover:scale-105"
                    >
                    Back to Dashboard
                </button>
            ) : (
                <button
                    onClick={handleNextGroupClick}
                    className="mt-8 px-8 py-4 bg-amber-600 text-white text-2xl font-bold rounded-lg shadow-lg hover:bg-amber-700 transition transform hover:scale-105"
                >
                    Next Group
                </button>
            )}
          </div>
        ) : (
          <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            <p className="text-8xl font-black text-slate-900 mb-8 text-shadow">
              {questions[currentQuestionIndex]?.text}
            </p>
            <form onSubmit={handleIncorrectGuess}>
              <input
                ref={answerInputRef}
                type="text"
                value={currentAnswer}
                onChange={handleAnswerChange}
                disabled={feedback === 'CORRECT'}
                className="text-8xl font-black bg-transparent border-b-4 border-slate-700/50 w-full max-w-md text-center outline-none focus:border-slate-700 transition text-shadow"
                autoFocus
              />
            </form>
            <p className={`text-5xl font-bold mt-8 h-16 transition-colors duration-300 text-shadow ${feedbackClasses}`}>
              {feedback === 'CORRECT' && '✅ Correct!'}
              {feedback === 'INCORRECT' && '❌ Try again.'}
            </p>
          </div>
        )}
      </div>
       <style>{`
          .text-shadow {
            text-shadow: 3px 3px 5px rgba(0, 0, 0, 0.15);
          }
          @keyframes fade-in {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
          }
      `}</style>
    </div>
  );
};