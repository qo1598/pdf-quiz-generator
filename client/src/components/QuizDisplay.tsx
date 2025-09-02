import React, { useState } from 'react';
import { Quiz, MultipleChoiceQuiz, SubjectiveQuiz } from '../types/Quiz';
import { API_ENDPOINTS } from '../config/api';

interface QuizDisplayProps {
  quizzes: Quiz[];
  quizId?: string;
}

const QuizDisplay: React.FC<QuizDisplayProps> = ({ quizzes, quizId }) => {
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: number}>({});
  const [subjectiveAnswers, setSubjectiveAnswers] = useState<{[key: number]: string}>({});
  const [showResults, setShowResults] = useState(false);

  const currentQuiz = quizzes[currentQuizIndex];

  const handleMultipleChoiceAnswer = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: answerIndex
    });
  };

  const handleSubjectiveAnswer = (questionIndex: number, answer: string) => {
    setSubjectiveAnswers({
      ...subjectiveAnswers,
      [questionIndex]: answer
    });
  };

  const nextQuiz = () => {
    if (currentQuizIndex < quizzes.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
    }
  };

  const prevQuiz = () => {
    if (currentQuizIndex > 0) {
      setCurrentQuizIndex(currentQuizIndex - 1);
    }
  };

  const finishQuiz = async () => {
    setShowResults(true);
    
    // 결과를 Supabase에 저장
    if (quizId) {
      try {
        const { correct, total } = calculateScore();
        const allAnswers = {
          selectedAnswers,
          subjectiveAnswers
        };

        await fetch(API_ENDPOINTS.SAVE_RESULTS, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quizId,
            answers: allAnswers,
            score: correct,
            totalQuestions: total,
            completedAt: new Date().toISOString()
          }),
        });
      } catch (error) {
        console.error('결과 저장 오류:', error);
      }
    }
  };

  const resetQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedAnswers({});
    setSubjectiveAnswers({});
    setShowResults(false);
  };

  const calculateScore = () => {
    let correct = 0;
    let total = 0;

    quizzes.forEach((quiz, index) => {
      if (quiz.type === 'multiple') {
        total++;
        if (selectedAnswers[index] === quiz.correctAnswer) {
          correct++;
        }
      }
    });

    return { correct, total };
  };

  if (showResults) {
    const { correct, total } = calculateScore();
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          퀴즈 결과
        </h2>
        
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-blue-600 mb-2">
            {percentage}%
          </div>
          <p className="text-lg text-gray-600">
            객관식 {correct}/{total} 정답
          </p>
        </div>

        <div className="space-y-6">
          {quizzes.map((quiz, index) => (
            <div key={index} className="border-b pb-4">
              <h3 className="font-medium text-gray-800 mb-2">
                문제 {index + 1}: {quiz.question}
              </h3>
              
              {quiz.type === 'multiple' ? (
                <div>
                  <div className="space-y-2 mb-3">
                    {quiz.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className={`p-2 rounded ${
                          optionIndex === quiz.correctAnswer
                            ? 'bg-green-100 text-green-800'
                            : selectedAnswers[index] === optionIndex
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-50'
                        }`}
                      >
                        {optionIndex + 1}. {option}
                        {optionIndex === quiz.correctAnswer && ' ✓'}
                        {selectedAnswers[index] === optionIndex && optionIndex !== quiz.correctAnswer && ' ✗'}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    <strong>설명:</strong> {quiz.explanation}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="bg-gray-50 p-3 rounded mb-3">
                    <strong>내 답변:</strong>
                    <p>{subjectiveAnswers[index] || '답변하지 않음'}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <strong>모범 답안:</strong>
                    <p>{quiz.sampleAnswer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={resetQuiz}
            className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            다시 풀기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          퀴즈 풀기
        </h2>
        <div className="text-sm text-gray-500">
          {currentQuizIndex + 1} / {quizzes.length}
        </div>
      </div>

      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentQuizIndex + 1) / quizzes.length) * 100}%`
            }}
          ></div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          문제 {currentQuizIndex + 1}: {currentQuiz.question}
        </h3>

        {currentQuiz.type === 'multiple' ? (
          <div className="space-y-3">
            {(currentQuiz as MultipleChoiceQuiz).options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedAnswers[currentQuizIndex] === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuizIndex}`}
                  value={index}
                  checked={selectedAnswers[currentQuizIndex] === index}
                  onChange={() => handleMultipleChoiceAnswer(currentQuizIndex, index)}
                  className="mr-3"
                />
                <span>{index + 1}. {option}</span>
              </label>
            ))}
          </div>
        ) : (
          <div>
            <textarea
              value={subjectiveAnswers[currentQuizIndex] || ''}
              onChange={(e) => handleSubjectiveAnswer(currentQuizIndex, e.target.value)}
              placeholder="답변을 입력하세요..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={prevQuiz}
          disabled={currentQuizIndex === 0}
          className={`py-2 px-4 rounded-lg transition-colors ${
            currentQuizIndex === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          이전 문제
        </button>

        {currentQuizIndex === quizzes.length - 1 ? (
          <button
            onClick={finishQuiz}
            className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            퀴즈 완료
          </button>
        ) : (
          <button
            onClick={nextQuiz}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            다음 문제
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizDisplay;
