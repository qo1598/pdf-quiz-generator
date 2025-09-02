const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메소드입니다.' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: '퀴즈 ID가 필요합니다.' });
    }

    // Supabase에서 퀴즈 데이터 조회
    const { data, error } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase 조회 오류:', error);
      return res.status(404).json({ error: '퀴즈를 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      quiz: data
    });

  } catch (error) {
    console.error('퀴즈 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
}
