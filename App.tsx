import React, { useState, useCallback } from 'react';
import { TeacherView } from './components/TeacherView';
import { StudentView } from './components/StudentView';
import type { Question } from './types';

type AppMode = 'TEACHER' | 'STUDENT';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('TEACHER');
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentGroupNumber, setCurrentGroupNumber] = useState(1);
  const [totalGroups, setTotalGroups] = useState(1);


  const startQuiz = useCallback((questions: Question[], numGroups: number) => {
    if (questions.length > 0) {
      setActiveQuestions(questions);
      setTotalGroups(numGroups > 0 ? numGroups : 1);
      setCurrentGroupNumber(1);
      setMode('STUDENT');
    } else {
      alert('Please add at least one question to the set before starting.');
    }
  }, []);

  const exitStudentMode = useCallback(() => {
    setMode('TEACHER');
    setActiveQuestions([]);
    setTotalGroups(1);
    setCurrentGroupNumber(1);
  }, []);
  
  const handleNextGroup = useCallback(() => {
    if (currentGroupNumber < totalGroups) {
        setCurrentGroupNumber(prev => prev + 1);
    }
  }, [currentGroupNumber, totalGroups]);


  return (
    <div className="min-h-screen font-sans text-slate-800 flex items-center justify-center p-4">
      {mode === 'TEACHER' ? (
        <TeacherView onStartQuiz={startQuiz} />
      ) : (
        <StudentView
          questions={activeQuestions}
          currentGroupNumber={currentGroupNumber}
          totalGroups={totalGroups}
          onExit={exitStudentMode}
          onNextGroup={handleNextGroup}
        />
      )}
    </div>
  );
};

export default App;