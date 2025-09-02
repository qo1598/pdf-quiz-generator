export interface MultipleChoiceQuiz {
  type: 'multiple';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface SubjectiveQuiz {
  type: 'subjective';
  question: string;
  sampleAnswer: string;
}

export type Quiz = MultipleChoiceQuiz | SubjectiveQuiz;

export interface QuizResponse {
  success: boolean;
  quizzes: Quiz[];
  totalQuestions: number;
  quizId?: string;
}

export interface UploadResponse {
  success: boolean;
  text: string;
  textLength: number;
  message: string;
}
