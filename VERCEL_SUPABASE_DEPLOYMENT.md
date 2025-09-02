# 🚀 Vercel + Supabase 배포 가이드

PDF 퀴즈 생성기를 Vercel과 Supabase로 배포하는 완전한 가이드입니다.

## 📋 사전 준비

### 1. Supabase 프로젝트 설정
1. [Supabase.com](https://supabase.com) 가입
2. "New project" 생성
3. 데이터베이스 스키마 설정:
   ```sql
   -- supabase/schema.sql 파일의 내용을 SQL Editor에서 실행
   ```

### 2. GitHub 저장소 준비
```bash
git init
git add .
git commit -m "Initial commit - Vercel + Supabase ready"
git remote add origin https://github.com/yourusername/pdf-quiz-generator.git
git push -u origin main
```

---

## 🌐 Vercel 배포

### 1단계: Vercel 프로젝트 생성
1. [Vercel.com](https://vercel.com) 가입
2. "New Project" 클릭
3. GitHub 저장소 연결
4. 프로젝트 설정:
   - **Framework Preset**: Create React App
   - **Root Directory**: `./` (루트)
   - **Build Command**: `cd client && npm run build`
   - **Output Directory**: `client/build`

### 2단계: 환경 변수 설정
Vercel 대시보드에서 Settings > Environment Variables:

```bash
# Supabase 설정 (API Routes용)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# OpenAI API (선택사항)
OPENAI_API_KEY=sk-your_openai_key

# 클라이언트용 (React App)
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

### 3단계: 배포 확인
- Vercel이 자동으로 빌드 및 배포
- `https://your-project.vercel.app`에서 확인

---

## 🗄️ Supabase 설정

### 1. 데이터베이스 스키마 생성
Supabase Dashboard > SQL Editor에서 실행:

```sql
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

-- RLS 정책 설정
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read quiz sessions" ON quiz_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert quiz sessions" ON quiz_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read quiz results" ON quiz_results FOR SELECT USING (true);
CREATE POLICY "Anyone can insert quiz results" ON quiz_results FOR INSERT WITH CHECK (true);
```

### 2. API 키 확인
- Settings > API에서 `anon` 키와 `service_role` 키 확인
- `anon` 키는 클라이언트에서 사용 (공개 가능)
- 프로젝트 URL: `https://your-project.supabase.co`

---

## 🔧 로컬 개발 환경

### 1. 환경 변수 파일 생성
루트 디렉토리에 `.env.local`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=sk-your_openai_key
```

클라이언트 디렉토리에 `client/.env.local`:
```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

### 2. 로컬 개발 서버 실행
```bash
# Vercel CLI 설치
npm install -g vercel

# 로컬 개발 서버 실행
vercel dev
```

---

## 📊 기능 확인

### ✅ 배포 후 테스트할 기능들:
1. **PDF 업로드**: 파일 드래그 앤 드롭
2. **퀴즈 생성**: API Routes 동작 확인
3. **데이터 저장**: Supabase 테이블에 데이터 저장 확인
4. **퀴즈 풀기**: 결과 저장 확인
5. **반응형 디자인**: 모바일/데스크톱 확인

### 🔍 문제 해결
- **빌드 오류**: Vercel Functions > 로그 확인
- **API 오류**: Supabase Dashboard > Logs 확인
- **환경 변수**: Vercel Settings에서 재확인

---

## 📈 성능 최적화

### Vercel 설정:
```json
{
  "functions": {
    "api/*.js": {
      "maxDuration": 30
    }
  }
}
```

### Supabase 최적화:
- 인덱스 생성으로 쿼리 성능 향상
- RLS 정책으로 보안 강화
- Connection Pooling 활용

---

## 💰 비용 예상

### 무료 티어:
- **Vercel**: 100GB 대역폭/월
- **Supabase**: 500MB 데이터베이스, 2GB 대역폭/월
- 월 1000+ 사용자까지 무료로 운영 가능

### 업그레이드 시점:
- Vercel Pro: $20/월 (팀 기능, 더 많은 대역폭)
- Supabase Pro: $25/월 (8GB 데이터베이스, 100GB 대역폭)

---

## 🎯 다음 단계

배포 후 추가할 수 있는 기능들:
1. **사용자 인증**: Supabase Auth
2. **퀴즈 공유**: 고유 URL 생성
3. **통계 대시보드**: 퀴즈 사용량 분석
4. **OpenAI 통합**: 더 정교한 퀴즈 생성
5. **이미지 PDF 지원**: OCR 기능 추가

---

## 📞 지원

### 유용한 링크:
- [Vercel 문서](https://vercel.com/docs)
- [Supabase 문서](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

### 일반적인 문제:
1. **CORS 오류**: API Routes에서 헤더 설정 확인
2. **환경 변수**: 클라이언트용은 `REACT_APP_` 접두사 필요
3. **빌드 실패**: 패키지 의존성 확인
