# Node.js 18 이미지 사용
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json 복사 및 서버 의존성 설치
COPY package*.json ./
RUN npm install

# 클라이언트 의존성 설치 및 빌드
COPY client/package*.json ./client/
RUN cd client && npm install

# 소스 코드 복사
COPY . .

# 클라이언트 빌드
RUN cd client && npm run build

# 포트 노출
EXPOSE 5000

# 환경 변수 설정
ENV NODE_ENV=production

# 서버 실행
CMD ["npm", "start"]
