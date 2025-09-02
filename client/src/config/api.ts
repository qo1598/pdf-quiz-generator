// API 기본 URL 설정 (Vercel API Routes 사용)
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // 프로덕션에서는 Vercel API Routes 사용
  : ''; // 개발 환경에서도 Vercel dev 서버 사용

export const API_ENDPOINTS = {
  GENERATE_QUIZ: `${API_BASE_URL}/api/generate-quiz`,
  GET_QUIZ: `${API_BASE_URL}/api/get-quiz`,
  SAVE_RESULTS: `${API_BASE_URL}/api/save-results`
};
