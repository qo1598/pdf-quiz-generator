import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import QuizDisplay from './components/QuizDisplay';
import { Quiz } from './types/Quiz';

function App() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizId, setQuizId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleQuizGenerated = (generatedQuizzes: Quiz[], id?: string) => {
    setQuizzes(generatedQuizzes);
    if (id) setQuizId(id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            PDF 퀴즈 생성기
          </h1>
          <p className="text-lg text-gray-600">
            PDF 문서를 업로드하여 자동으로 퀴즈를 생성해보세요
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          <FileUpload 
            onQuizGenerated={handleQuizGenerated}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
          
          {quizzes.length > 0 && (
            <QuizDisplay quizzes={quizzes} quizId={quizId} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
