# PDF 퀴즈 생성기

PDF 문서를 업로드하여 자동으로 객관식 및 주관식 퀴즈를 생성하는 웹 애플리케이션입니다.

## 기능

- 📄 PDF 파일 업로드 (드래그 앤 드롭 지원)
- 🤖 AI 기반 퀴즈 자동 생성
- ✅ 객관식 퀴즈 (4지 선다)
- ✏️ 주관식 퀴즈
- 📊 실시간 점수 계산
- 🎨 모던하고 반응형 UI

## 기술 스택

### 프론트엔드
- React 18 + TypeScript
- Tailwind CSS
- 반응형 디자인

### 백엔드
- Node.js + Express
- PDF-parse (PDF 텍스트 추출)
- Multer (파일 업로드)
- OpenAI API (퀴즈 생성)

## 설치 및 실행

### 1. 의존성 설치
```bash
# 루트 디렉토리에서
npm install

# 클라이언트 의존성 설치
cd client
npm install
cd ..
```

### 2. 환경 변수 설정 (선택사항)
`.env` 파일을 생성하고 다음을 추가하세요:
```
OPENAI_API_KEY=your_openai_api_key_here
PORT=5000
CLIENT_URL=http://localhost:3000
```

### 3. 개발 서버 실행
```bash
# 개발 모드 (서버 + 클라이언트 동시 실행)
npm run dev

# 또는 개별 실행
npm run server  # 백엔드만
npm run client  # 프론트엔드만
```

### 4. 애플리케이션 접속
브라우저에서 `http://localhost:3000`으로 접속하세요.

## 사용 방법

1. **PDF 업로드**: 문서나 교재 PDF 파일을 드래그 앤 드롭하거나 클릭하여 업로드
2. **퀴즈 타입 선택**: 혼합, 객관식만, 주관식만 중 선택
3. **퀴즈 생성**: "퀴즈 생성하기" 버튼 클릭
4. **퀴즈 풀기**: 생성된 퀴즈를 순서대로 풀기
5. **결과 확인**: 점수 및 정답 해설 확인

## 프로젝트 구조

```
pdf-quiz-generator/
├── server/
│   └── server.js          # Express 서버
├── client/
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   ├── types/         # TypeScript 타입 정의
│   │   └── App.tsx        # 메인 앱 컴포넌트
│   └── public/
├── package.json           # 서버 의존성
└── README.md
```

## API 엔드포인트

### POST `/api/upload-pdf`
PDF 파일을 업로드하고 텍스트를 추출합니다.

### POST `/api/generate-quiz`
PDF 파일을 기반으로 퀴즈를 생성합니다.

**Parameters:**
- `pdf`: PDF 파일 (multipart/form-data)
- `quizType`: 'mixed' | 'multiple' | 'subjective'

## 주의사항

- PDF 파일은 최대 10MB까지 업로드 가능
- 텍스트 추출이 가능한 PDF 파일만 지원 (이미지 기반 PDF는 제한적)
- OpenAI API 키가 없어도 기본적인 퀴즈 생성 가능 (품질은 제한적)

## 🚀 웹 배포

### 🟢 추천: Vercel + Supabase
최고의 성능과 확장성을 위한 조합입니다.

**빠른 배포:**
1. [Supabase.com](https://supabase.com)에서 프로젝트 생성
2. GitHub에 코드 업로드  
3. [Vercel.com](https://vercel.com)에서 저장소 연결
4. 환경 변수 설정 후 자동 배포!

상세한 가이드: `VERCEL_SUPABASE_DEPLOYMENT.md` 참고

### 기타 지원 플랫폼:
- ✅ **Vercel + Supabase** (추천)
- ✅ Railway (단순 배포)
- ✅ Render
- ✅ Heroku

## 📁 프로덕션 파일

- `api/` - Vercel API Routes (서버리스 함수)
- `vercel.json` - Vercel 배포 설정
- `supabase/schema.sql` - 데이터베이스 스키마
- `VERCEL_SUPABASE_DEPLOYMENT.md` - 상세 배포 가이드
- `Dockerfile` - Docker 컨테이너용 (선택사항)

## 개발자 정보

이 프로젝트는 교육 목적으로 개발되었습니다.
