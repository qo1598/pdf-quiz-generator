-- PDF 퀴즈 생성기를 위한 Supabase 스키마

-- 퀴즈 세션 테이블
CREATE TABLE quiz_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pdf_name VARCHAR(255) NOT NULL,
  quiz_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 퀴즈 결과 테이블
CREATE TABLE quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_quiz_sessions_created_at ON quiz_sessions(created_at DESC);
CREATE INDEX idx_quiz_results_quiz_session_id ON quiz_results(quiz_session_id);
CREATE INDEX idx_quiz_results_created_at ON quiz_results(created_at DESC);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능하도록 설정 (공개 앱이므로)
CREATE POLICY "Anyone can read quiz sessions" ON quiz_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert quiz sessions" ON quiz_sessions FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read quiz results" ON quiz_results FOR SELECT USING (true);
CREATE POLICY "Anyone can insert quiz results" ON quiz_results FOR INSERT WITH CHECK (true);

-- 통계 뷰 생성 (선택사항)
CREATE VIEW quiz_stats AS
SELECT 
  DATE(qs.created_at) as date,
  COUNT(qs.id) as total_quizzes,
  COUNT(qr.id) as completed_quizzes,
  AVG(qr.score::float / qr.total_questions * 100) as avg_score_percentage
FROM quiz_sessions qs
LEFT JOIN quiz_results qr ON qs.id = qr.quiz_session_id
GROUP BY DATE(qs.created_at)
ORDER BY date DESC;
