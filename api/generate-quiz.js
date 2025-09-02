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

// PDF 텍스트 및 페이지 정보 추출 함수
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer, {
      // 페이지별 텍스트 추출을 위한 옵션
      pagerender: render_page
    });
    
    return {
      fullText: data.text,
      totalPages: data.numpages,
      pages: data.pages || []
    };
  } catch (error) {
    throw new Error('PDF 텍스트 추출 중 오류가 발생했습니다.');
  }
}

// 페이지별 텍스트 추출을 위한 렌더 함수
function render_page(pageData) {
  let render_options = {
    normalizeWhitespace: false,
    disableCombineTextItems: false
  };

  return pageData.getTextContent(render_options)
    .then(function(textContent) {
      let lastY, text = '';
      for (let item of textContent.items) {
        if (lastY == item.transform[5] || !lastY){
          text += item.str;
        } else {
          text += '\n' + item.str;
        }    
        lastY = item.transform[5];
      }
      return text;
    });
}

// OpenAI를 사용한 퀴즈 생성 함수
async function generateQuizWithAI(textData, quizType = 'mixed', questionCount = 10, difficulty = 'medium') {
  try {
    const prompt = createQuizPrompt(textData, quizType, questionCount, difficulty);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "당신은 교육 전문가입니다. 주어진 텍스트를 바탕으로 고품질의 퀴즈를 생성해주세요. 응답은 반드시 JSON 형태로 해주세요. 주관식 문제는 반드시 ㅁㅁ 형태로 빈칸을 만들어주세요."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    return JSON.parse(response);
  } catch (error) {
    console.error('OpenAI API 오류:', error);
    // 폴백: 간단한 퀴즈 생성
    return generateFallbackQuiz(textData, quizType, questionCount, difficulty);
  }
}

// 퀴즈 생성 프롬프트 작성
function createQuizPrompt(textData, quizType, questionCount, difficulty) {
  const difficultyInstructions = {
    easy: "기초적이고 명확한 내용 위주로 출제하세요. 문서에서 직접 언급된 내용을 중심으로 하세요.",
    medium: "표준적인 수준으로 출제하세요. 문서의 핵심 개념과 중요한 정보를 중심으로 하세요.",
    hard: "심화적이고 응용력을 요구하는 문제로 출제하세요. 문서 내용을 바탕으로 한 추론과 분석이 필요한 문제를 포함하세요."
  };

  const basePrompt = `다음 PDF 문서 텍스트를 바탕으로 ${questionCount}개의 퀴즈를 생성해주세요:

텍스트:
${textData.fullText.substring(0, 2000)}...
(총 ${textData.totalPages}페이지)

난이도: ${difficulty} - ${difficultyInstructions[difficulty]}

요구사항:
- 정확히 ${questionCount}개의 문제를 생성해주세요
- 응답은 반드시 JSON 형태로 해주세요
- quizzes 배열 안에 문제들을 포함해주세요
- 각 문제에는 pageReference 필드를 포함하여 "페이지 X" 형태로 출처를 명시해주세요
`;

  const multipleCount = quizType === 'multiple' ? questionCount : 
                        quizType === 'mixed' ? Math.ceil(questionCount * 0.6) : 0;
  const subjectiveCount = quizType === 'subjective' ? questionCount : 
                         quizType === 'mixed' ? Math.floor(questionCount * 0.4) : 0;

  let detailPrompt = '';

  if (multipleCount > 0) {
    detailPrompt += `
객관식 문제 ${multipleCount}개를 생성해주세요:
- type: "multiple"
- question: "문제"
- options: ["선택지1", "선택지2", "선택지3", "선택지4"]
- correctAnswer: 정답 인덱스 (0-3)
- explanation: "해설"
- pageReference: "페이지 X"
`;
  }

  if (subjectiveCount > 0) {
    detailPrompt += `
주관식 문제 ${subjectiveCount}개를 생성해주세요:
- type: "subjective"
- question: "문장에서 중요한 단어를 ㅁㅁ로 바꾼 빈칸 문제 (예: '인공지능은 ㅁㅁ 기술의 핵심이다')"
- correctAnswer: "빈칸에 들어갈 정답 단어"
- explanation: "해설"
- pageReference: "페이지 X"

주관식 문제 작성 규칙:
1. 원문에서 핵심 단어 하나를 선택하여 ㅁㅁ로 바꿔주세요
2. ㅁㅁ는 명사, 형용사, 동사 등 의미있는 단어여야 합니다
3. 문맥상 답이 명확하게 유추 가능해야 합니다
`;
  }

  return basePrompt + detailPrompt + `
JSON 형태:
{
  "quizzes": [
    // 정확히 ${questionCount}개의 퀴즈 배열
  ]
}`;
}

// 폴백 퀴즈 생성 (OpenAI 실패 시)
function generateFallbackQuiz(textData, quizType, questionCount = 10, difficulty = 'medium') {
  const text = typeof textData === 'string' ? textData : textData.fullText;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const quizzes = [];
  const multipleCount = quizType === 'multiple' ? questionCount : 
                        quizType === 'mixed' ? Math.ceil(questionCount * 0.6) : 0;
  const subjectiveCount = quizType === 'subjective' ? questionCount : 
                         quizType === 'mixed' ? Math.floor(questionCount * 0.4) : 0;

  // 객관식 퀴즈 생성
  if (multipleCount > 0) {
    for (let i = 0; i < Math.min(multipleCount, sentences.length); i++) {
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
          explanation: `정답은 "${keyWord}"입니다. 본문에서 이에 대해 설명하고 있습니다.`,
          pageReference: `페이지 ${Math.floor(Math.random() * (textData.totalPages || 10)) + 1}`
        });
      }
    }
  }

  // 주관식 퀴즈 생성 (ㅁㅁ 빈칸 채우기 형태)
  if (subjectiveCount > 0) {
    for (let i = 0; i < Math.min(subjectiveCount, sentences.length); i++) {
      const sentence = sentences[i].trim();
      if (sentence.length > 30) {
        // 문장에서 핵심 단어를 ㅁㅁ으로 만들기
        const words = sentence.split(' ').filter(word => word.length > 2);
        if (words.length > 0) {
          const keyWord = words[Math.floor(Math.random() * words.length)];
          const questionSentence = sentence.replace(keyWord, 'ㅁㅁ');
          
          quizzes.push({
            type: 'subjective',
            question: `다음 빈칸(ㅁㅁ)에 들어갈 알맞은 단어를 쓰세요: "${questionSentence.substring(0, 100)}${questionSentence.length > 100 ? '...' : ''}"`,
            correctAnswer: keyWord,
            explanation: `정답은 "${keyWord}"입니다.`,
            pageReference: `페이지 ${Math.floor(Math.random() * (textData.totalPages || 10)) + 1}`
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

    const { 
      quizType = 'mixed',
      questionCount = 10,
      difficulty = 'medium'
    } = req.body;

    // PDF에서 텍스트 추출
    console.log('PDF 텍스트 추출 중...');
    const extractedData = await extractTextFromPDF(req.file.buffer);
    
    if (!extractedData.fullText || extractedData.fullText.trim().length < 100) {
      return res.status(400).json({ 
        error: '텍스트를 충분히 추출할 수 없습니다. 다른 PDF를 시도해보세요.' 
      });
    }

    console.log(`추출된 텍스트 길이: ${extractedData.fullText.length}자, 총 ${extractedData.totalPages}페이지`);

    // AI를 사용한 퀴즈 생성
    console.log(`AI 퀴즈 생성 중... (문항수: ${questionCount}, 난이도: ${difficulty})`);
    const quizResult = await generateQuizWithAI(extractedData, quizType, parseInt(questionCount), difficulty);
    const quizzes = quizResult.quizzes || [];

    if (quizzes.length === 0) {
      return res.status(500).json({ error: '퀴즈 생성에 실패했습니다.' });
    }

    // Supabase에 저장
    const savedQuiz = await saveQuizToDatabase({
      quizzes,
      quiz_type: quizType,
      question_count: questionCount,
      difficulty: difficulty,
      text_length: extractedData.fullText.length,
      total_pages: extractedData.totalPages
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