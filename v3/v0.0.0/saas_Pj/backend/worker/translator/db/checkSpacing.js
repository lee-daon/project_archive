import { getCache, setCache } from '../../../common/utils/cacheClient.js';
import { promisePool } from '../../../common/utils/connectDB.js';
import { CACHE_KEYS, CACHE_TTL } from '../../../common/config/settings.js';

/**
 * 사용자의 키워드 뛰어쓰기 허용 여부 확인
 * 캐시 우선 조회, 없으면 DB 조회 후 캐시에 저장
 * 
 * @param {number} userid - 사용자 ID
 * @returns {Promise<boolean>} - 뛰어쓰기 허용 여부 (true: 허용, false: 비허용)
 */
export async function isKeywordSpacingAllowed(userid) {
  const cacheKey = CACHE_KEYS.SPACING_SETTING(userid);
  
  try {
    // 1. 캐시에서 먼저 조회
    const cachedValue = await getCache(cacheKey, false);
    
    if (cachedValue !== null) {
      return cachedValue === 'true';
    }
    
    // 2. 캐시에 없으면 DB에서 조회
    const [rows] = await promisePool.execute(
      'SELECT allow_keyword_spacing FROM extra_setting WHERE userid = ?',
      [userid]
    );
    
    let allowSpacing;
    
    if (rows.length === 0) {
      // 설정이 없으면 기본값 true (허용)
      allowSpacing = true;
    } else {
      // DB에서 조회한 값 사용
      allowSpacing = Boolean(rows[0].allow_keyword_spacing);
    }
    
    // 3. 조회 결과를 캐시에 저장
    await setCache(cacheKey, allowSpacing.toString(), CACHE_TTL.SPACING_SETTING);
    
    return allowSpacing;
    
  } catch (error) {
    console.error(`[${userid}] 뛰어쓰기 설정 조회 중 오류:`, error);
    
    // 오류 발생 시 기본값 true 반환
    return true;
  }
}

