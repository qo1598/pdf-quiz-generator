const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메소드입니다.' });
  }

  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { 
      quizId, 
      answers, 
      score, 
      totalQuestions, 
      completedAt 
    } = req.body;

    if (!quizId) {
      return res.status(400).json({ error: '퀴즈 ID가 필요합니다.' });
    }

    // 퀴즈 결과를 Supabase에 저장
    const { data, error } = await supabase
      .from('quiz_results')
      .insert({
        quiz_session_id: quizId,
        answers: answers,
        score: score,
        total_questions: totalQuestions,
        completed_at: completedAt || new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Supabase 저장 오류:', error);
      return res.status(500).json({ error: '결과 저장 중 오류가 발생했습니다.' });
    }

    res.json({
      success: true,
      resultId: data[0].id,
      message: '퀴즈 결과가 저장되었습니다.'
    });

  } catch (error) {
    console.error('결과 저장 오류:', error);
    res.status(500).json({ error: error.message });
  }
}
