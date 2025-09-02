const multer = require('multer');
const pdfParse = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Multer 설정
const upload = multer({
  storage: multer.memoryStorage(),
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

// 퀴즈 생성 함수
async function generateQuiz(text, quizType = 'mixed') {
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

// 퀴즈를 Supabase에 저장
async function saveQuizToDatabase(quizData, pdfName) {
  const { data, error } = await supabase
    .from('quiz_sessions')
    .insert({
      pdf_name: pdfName,
      quiz_data: quizData,
      created_at: new Date().toISOString()
    })
    .select();

  if (error) {
    console.error('Supabase 저장 오류:', error);
    return null;
  }

  return data[0];
}

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메소드입니다.' });
  }

  try {
    // Multer를 Promise로 래핑
    const uploadPromise = new Promise((resolve, reject) => {
      upload.single('pdf')(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await uploadPromise;

    if (!req.file) {
      return res.status(400).json({ error: 'PDF 파일이 필요합니다.' });
    }

    const { quizType = 'mixed' } = req.body;

    // PDF에서 텍스트 추출
    const extractedText = await extractTextFromPDF(req.file.buffer);
    
    if (!extractedText || extractedText.trim().length < 100) {
      return res.status(400).json({ 
        error: '텍스트를 충분히 추출할 수 없습니다. 다른 PDF를 시도해보세요.' 
      });
    }

    // 퀴즈 생성
    const quizzes = await generateQuiz(extractedText, quizType);

    // Supabase에 저장
    const savedQuiz = await saveQuizToDatabase({
      quizzes,
      quiz_type: quizType,
      text_length: extractedText.length
    }, req.file.originalname);

    res.json({
      success: true,
      quizzes: quizzes,
      totalQuestions: quizzes.length,
      quizId: savedQuiz?.id
    });

  } catch (error) {
    console.error('퀴즈 생성 오류:', error);
    res.status(500).json({ error: error.message });
  }
}
