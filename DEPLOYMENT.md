# 🚀 배포 가이드

PDF 퀴즈 생성기를 웹에 호스팅하는 방법을 설명합니다.

## 📋 배포 옵션

### 1. 🟢 **추천: Railway (풀스택 배포)**
가장 간단하고 무료 티어가 있는 옵션입니다.

#### 단계:
1. [Railway.app](https://railway.app) 가입
2. GitHub 저장소 연결
3. 자동 배포 완료!

#### 환경 변수 설정:
```
NODE_ENV=production
OPENAI_API_KEY=your_key_here (선택사항)
```

---

### 2. 🔵 **Render (풀스택 배포)**
Railway와 비슷한 무료 호스팅 서비스입니다.

#### 단계:
1. [Render.com](https://render.com) 가입
2. "New Web Service" 선택
3. GitHub 저장소 연결
4. 빌드 명령: `npm install && npm run build`
5. 시작 명령: `npm start`

---

### 3. 🟡 **분리 배포 (프론트엔드 + 백엔드)**

#### 프론트엔드 - Vercel:
1. [Vercel.com](https://vercel.com) 가입
2. `client` 폴더를 별도 저장소로 분리
3. Vercel에 연결하여 자동 배포

#### 백엔드 - Heroku:
1. [Heroku.com](https://heroku.com) 가입
2. Heroku CLI 설치
3. 명령어 실행:
```bash
heroku create your-app-name
git push heroku main
```

---

### 4. 🟠 **Docker 컨테이너 배포**
Docker를 지원하는 모든 플랫폼에서 사용 가능합니다.

#### 로컬 테스트:
```bash
docker build -t pdf-quiz-generator .
docker run -p 5000:5000 pdf-quiz-generator
```

#### 클라우드 배포:
- Google Cloud Run
- AWS ECS
- Azure Container Instances

---

## 🔧 배포 전 체크리스트

### ✅ **필수 사항:**
- [ ] `.env` 파일에 환경 변수 설정
- [ ] 프로덕션 빌드 테스트: `npm run build`
- [ ] Git 저장소에 코드 푸시
- [ ] `.gitignore`에 민감한 파일 추가

### ⚙️ **환경 변수:**
```bash
NODE_ENV=production
PORT=5000
OPENAI_API_KEY=sk-... (선택사항)
CLIENT_URL=https://your-domain.com
```

### 🧪 **로컬 프로덕션 테스트:**
```bash
# 프로덕션 빌드
npm run build

# 프로덕션 모드로 서버 실행
NODE_ENV=production npm start
```

---

## 🌟 **추천 배포 순서**

### 1단계: Railway 배포 (가장 쉬움)
```bash
# 1. GitHub에 코드 푸시
git add .
git commit -m "Initial commit"
git push origin main

# 2. Railway.app에서 GitHub 저장소 연결
# 3. 자동 배포 완료!
```

### 2단계: 도메인 설정 (선택사항)
- Railway에서 커스텀 도메인 설정
- 또는 제공되는 `.railway.app` 도메인 사용

### 3단계: 모니터링
- Railway 대시보드에서 로그 확인
- 에러 발생 시 환경 변수 재확인

---

## 🔍 **문제 해결**

### 빌드 실패:
```bash
# 로컬에서 빌드 테스트
npm run build
```

### 서버 오류:
- 환경 변수 확인
- 로그에서 오류 메시지 확인
- PDF 파일 크기 제한 (10MB) 확인

### CORS 오류:
- `CLIENT_URL` 환경 변수를 올바른 도메인으로 설정

---

## 📊 **성능 최적화**

### 권장사항:
1. **CDN 사용**: 정적 파일 캐싱
2. **압축 활성화**: gzip 압축
3. **파일 크기 제한**: 대용량 PDF 처리 시간 고려
4. **캐싱 전략**: 자주 사용되는 퀴즈 캐싱

---

## 💰 **비용 예상**

### 무료 티어:
- **Railway**: 월 5$ 크레딧 (충분함)
- **Render**: 750시간/월 무료
- **Vercel**: 무제한 프론트엔드 호스팅

### 유료 업그레이드 시점:
- 월 1000+ 사용자
- 대용량 파일 처리 필요
- 24/7 가동 필요

---

## 🎯 **다음 단계**

배포 후 추가할 수 있는 기능들:
1. **분석**: Google Analytics 추가
2. **모니터링**: Sentry 오류 추적
3. **데이터베이스**: 퀴즈 저장 기능
4. **인증**: 사용자 계정 시스템
5. **API 최적화**: OpenAI API 통합

---

## 📞 **지원**

배포 중 문제가 발생하면:
1. 로그 파일 확인
2. 환경 변수 재검토
3. 로컬 환경에서 프로덕션 모드 테스트
