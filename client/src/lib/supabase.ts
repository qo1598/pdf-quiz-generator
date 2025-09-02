import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 타입 정의
export interface QuizSession {
  id: string;
  pdf_name: string;
  quiz_data: {
    quizzes: any[];
    quiz_type: string;
    text_length: number;
  };
  created_at: string;
  updated_at: string;
}

export interface QuizResult {
  id: string;
  quiz_session_id: string;
  answers: any;
  score: number;
  total_questions: number;
  completed_at: string;
  created_at: string;
}
