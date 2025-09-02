const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어 설정
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// 프로덕션에서 React 앱 서빙
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// 파일 업로드 설정
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('PDF 파일만 업로드 가능합니다.'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  }
});

// PDF 텍스트 추출 함수
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error('PDF 텍스트 추출 중 오류가 발생했습니다.');
  }
}

// 퀴즈 생성 함수 (OpenAI API 사용)
async function generateQuiz(text, quizType = 'mixed') {
  // OpenAI API가 없을 경우를 위한 기본 퀴즈 생성 로직
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const quizzes = [];

  // 객관식 퀴즈 생성
  if (quizType === 'multiple' || quizType === 'mixed') {
    for (let i = 0; i < Math.min(3, sentences.length); i++) {
      const sentence = sentences[i].trim();
      if (sentence.length > 30) {
        quizzes.push({
          type: 'multiple',
          question: `다음 중 "${sentence.substring(0, 50)}..."에 대한 설명으로 올바른 것은?`,
          options: [
            '정답 옵션 (실제로는 AI가 생성)',
            '오답 옵션 1',
            '오답 옵션 2',
            '오답 옵션 3'
          ],
          correctAnswer: 0,
          explanation: '실제로는 AI가 설명을 생성합니다.'
        });
      }
    }
  }

  // 주관식 퀴즈 생성
  if (quizType === 'subjective' || quizType === 'mixed') {
    for (let i = 0; i < Math.min(2, sentences.length); i++) {
      const sentence = sentences[i].trim();
      if (sentence.length > 30) {
        quizzes.push({
          type: 'subjective',
          question: `"${sentence.substring(0, 50)}..."에 대해 설명하세요.`,
          sampleAnswer: '실제로는 AI가 모범 답안을 생성합니다.'
        });
      }
    }
  }

  return quizzes;
}

// API 라우트
app.post('/api/upload-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF 파일이 필요합니다.' });
    }

    // PDF에서 텍스트 추출
    const extractedText = await extractTextFromPDF(req.file.buffer);
    
    if (!extractedText || extractedText.trim().length < 100) {
      return res.status(400).json({ 
        error: '텍스트를 충분히 추출할 수 없습니다. 다른 PDF를 시도해보세요.' 
      });
    }

    res.json({
      success: true,
      text: extractedText.substring(0, 1000) + '...', // 미리보기용
      textLength: extractedText.length,
      message: 'PDF 업로드 및 텍스트 추출이 완료되었습니다.'
    });

  } catch (error) {
    console.error('PDF 처리 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate-quiz', upload.single('pdf'), async (req, res) => {
  try {
    const { quizType = 'mixed' } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'PDF 파일이 필요합니다.' });
    }

    // PDF에서 텍스트 추출
    const extractedText = await extractTextFromPDF(req.file.buffer);
    
    // 퀴즈 생성
    const quizzes = await generateQuiz(extractedText, quizType);

    res.json({
      success: true,
      quizzes: quizzes,
      totalQuestions: quizzes.length
    });

  } catch (error) {
    console.error('퀴즈 생성 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 프로덕션에서 모든 요청을 React 앱으로 리다이렉트
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`환경: ${process.env.NODE_ENV || 'development'}`);
});
