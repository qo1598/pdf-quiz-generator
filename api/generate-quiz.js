const multer = require('multer');
const pdfParse = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

// OpenAI를 사용한 퀴즈 생성 함수
async function generateQuizWithAI(text, quizType = 'mixed') {
  try {
    const prompt = createQuizPrompt(text, quizType);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "당신은 교육 전문가입니다. 주어진 텍스트를 바탕으로 고품질의 퀴즈를 생성해주세요. 응답은 반드시 JSON 형태로 해주세요."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    return JSON.parse(response);
  } catch (error) {
    console.error('OpenAI API 오류:', error);
    // 폴백: 간단한 퀴즈 생성
    return generateFallbackQuiz(text, quizType);
  }
}

// 퀴즈 생성 프롬프트 작성
function createQuizPrompt(text, quizType) {
  const basePrompt = `다음 텍스트를 바탕으로 퀴즈를 생성해주세요:

텍스트:
${text.substring(0, 1500)}...

요구사항:
- 응답은 반드시 JSON 형태로 해주세요
- quizzes 배열 안에 문제들을 포함해주세요
`;

  if (quizType === 'multiple' || quizType === 'mixed') {
    return basePrompt + `
객관식 문제 3개를 생성해주세요:
- type: "multiple"
- question: "문제"
- options: ["선택지1", "선택지2", "선택지3", "선택지4"]
- correctAnswer: 정답 인덱스 (0-3)
- explanation: "해설"

${quizType === 'mixed' ? '주관식 문제 2개도 함께 생성해주세요:' : ''}
${quizType === 'mixed' ? `- type: "subjective"
- question: "핵심 단어에 빈칸을 넣은 문제 (예: '___은/는 중요한 개념이다')"
- correctAnswer: "빈칸에 들어갈 정답"
- explanation: "해설"` : ''}

JSON 형태:
{
  "quizzes": [
    // 퀴즈 배열
  ]
}`;
  }

  if (quizType === 'subjective') {
    return basePrompt + `
주관식 문제 5개를 생성해주세요:
- type: "subjective"
- question: "핵심 단어에 빈칸을 넣은 문제 (예: '___은/는 중요한 개념이다')"
- correctAnswer: "빈칸에 들어갈 정답"
- explanation: "해설"

JSON 형태:
{
  "quizzes": [
    // 퀴즈 배열
  ]
}`;
  }

  return basePrompt;
}

// 폴백 퀴즈 생성 (OpenAI 실패 시)
function generateFallbackQuiz(text, quizType) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const quizzes = [];

  // 객관식 퀴즈 생성
  if (quizType === 'multiple' || quizType === 'mixed') {
    for (let i = 0; i < Math.min(3, sentences.length); i++) {
      const sentence = sentences[i].trim();
      if (sentence.length > 30) {
        // 문장에서 핵심 단어 추출
        const words = sentence.split(' ').filter(word => word.length > 3);
        const keyWord = words[Math.floor(Math.random() * words.length)] || '중요한 내용';
        
        quizzes.push({
          type: 'multiple',
          question: `다음 중 "${sentence.substring(0, 50)}..."에서 언급된 핵심 내용은 무엇입니까?`,
          options: [
            keyWord,
            '다른 선택지 1',
            '다른 선택지 2',
            '다른 선택지 3'
          ],
          correctAnswer: 0,
          explanation: `정답은 "${keyWord}"입니다. 본문에서 이에 대해 설명하고 있습니다.`
        });
      }
    }
  }

  // 주관식 퀴즈 생성 (빈칸 채우기 형태)
  if (quizType === 'subjective' || quizType === 'mixed') {
    for (let i = 0; i < Math.min(2, sentences.length); i++) {
      const sentence = sentences[i].trim();
      if (sentence.length > 30) {
        // 문장에서 핵심 단어를 빈칸으로 만들기
        const words = sentence.split(' ').filter(word => word.length > 3);
        if (words.length > 0) {
          const keyWord = words[Math.floor(Math.random() * words.length)];
          const questionSentence = sentence.replace(keyWord, '___');
          
          quizzes.push({
            type: 'subjective',
            question: `다음 빈칸에 들어갈 알맞은 단어를 쓰세요: "${questionSentence.substring(0, 100)}${questionSentence.length > 100 ? '...' : ''}"`,
            correctAnswer: keyWord,
            explanation: `정답은 "${keyWord}"입니다.`
          });
        }
      }
    }
  }

  return { quizzes };
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
    console.log('PDF 텍스트 추출 중...');
    const extractedText = await extractTextFromPDF(req.file.buffer);
    
    if (!extractedText || extractedText.trim().length < 100) {
      return res.status(400).json({ 
        error: '텍스트를 충분히 추출할 수 없습니다. 다른 PDF를 시도해보세요.' 
      });
    }

    console.log(`추출된 텍스트 길이: ${extractedText.length}자`);

    // AI를 사용한 퀴즈 생성
    console.log('AI 퀴즈 생성 중...');
    const quizResult = await generateQuizWithAI(extractedText, quizType);
    const quizzes = quizResult.quizzes || [];

    if (quizzes.length === 0) {
      return res.status(500).json({ error: '퀴즈 생성에 실패했습니다.' });
    }

    // Supabase에 저장
    const savedQuiz = await saveQuizToDatabase({
      quizzes,
      quiz_type: quizType,
      text_length: extractedText.length
    }, req.file.originalname);

    console.log(`퀴즈 생성 완료: ${quizzes.length}개 문제`);

    res.json({
      success: true,
      quizzes: quizzes,
      totalQuestions: quizzes.length,
      quizId: savedQuiz?.id
    });

  } catch (error) {
    console.error('퀴즈 생성 오류:', error);
    res.status(500).json({ error: error.message || '퀴즈 생성 중 오류가 발생했습니다.' });
  }
}