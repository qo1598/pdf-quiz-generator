import React, { useState, useRef } from 'react';
import { Quiz, QuizResponse } from '../types/Quiz';
import { API_ENDPOINTS } from '../config/api';

interface FileUploadProps {
  onQuizGenerated: (quizzes: Quiz[], quizId?: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onQuizGenerated, 
  isLoading, 
  setIsLoading 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [quizType, setQuizType] = useState<string>('mixed');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('PDF 파일만 업로드 가능합니다.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const generateQuiz = async () => {
    if (!selectedFile) {
      alert('먼저 PDF 파일을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      formData.append('quizType', quizType);
      formData.append('questionCount', questionCount.toString());
      formData.append('difficulty', difficulty);

      const response = await fetch(API_ENDPOINTS.GENERATE_QUIZ, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('퀴즈 생성에 실패했습니다.');
      }

      const data: QuizResponse = await response.json();
      onQuizGenerated(data.quizzes, data.quizId);
    } catch (error) {
      console.error('퀴즈 생성 오류:', error);
      alert('퀴즈 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        PDF 파일 업로드
      </h2>
      
      {/* 드래그 앤 드롭 영역 */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="text-4xl text-gray-400">📄</div>
          
          {selectedFile ? (
            <div className="space-y-2">
              <p className="text-lg font-medium text-green-600">
                선택된 파일: {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500">
                크기: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-lg text-gray-600">
                PDF 파일을 여기에 드래그하거나 클릭하여 선택하세요
              </p>
              <p className="text-sm text-gray-500">
                최대 10MB까지 업로드 가능합니다
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 퀴즈 타입 선택 */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          퀴즈 타입 선택
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="mixed"
              checked={quizType === 'mixed'}
              onChange={(e) => setQuizType(e.target.value)}
              className="mr-2"
            />
            <span>혼합 (객관식 + 주관식)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="multiple"
              checked={quizType === 'multiple'}
              onChange={(e) => setQuizType(e.target.value)}
              className="mr-2"
            />
            <span>객관식만</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="subjective"
              checked={quizType === 'subjective'}
              onChange={(e) => setQuizType(e.target.value)}
              className="mr-2"
            />
            <span>주관식만</span>
          </label>
        </div>
      </div>

      {/* 문항 수 선택 */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          출제 문항 수
        </label>
        <div className="flex space-x-4">
          {[5, 10, 15, 20].map((count) => (
            <label key={count} className="flex items-center">
              <input
                type="radio"
                value={count}
                checked={questionCount === count}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="mr-2"
              />
              <span>{count}문제</span>
            </label>
          ))}
        </div>
      </div>

      {/* 난이도 선택 */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          문제 난이도
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="easy"
              checked={difficulty === 'easy'}
              onChange={(e) => setDifficulty(e.target.value)}
              className="mr-2"
            />
            <span className="text-green-600">하 (기초)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="medium"
              checked={difficulty === 'medium'}
              onChange={(e) => setDifficulty(e.target.value)}
              className="mr-2"
            />
            <span className="text-yellow-600">중 (표준)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="hard"
              checked={difficulty === 'hard'}
              onChange={(e) => setDifficulty(e.target.value)}
              className="mr-2"
            />
            <span className="text-red-600">상 (심화)</span>
          </label>
        </div>
      </div>

      {/* 퀴즈 생성 버튼 */}
      <button
        onClick={generateQuiz}
        disabled={!selectedFile || isLoading}
        className={`mt-6 w-full py-3 px-6 rounded-lg font-medium transition-colors ${
          !selectedFile || isLoading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            퀴즈 생성 중...
          </div>
        ) : (
          '퀴즈 생성하기'
        )}
      </button>
    </div>
  );
};

export default FileUpload;
