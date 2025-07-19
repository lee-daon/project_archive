import { getUserBannedWords } from '../../setting/repository/banWordSetting.js';
import bannedWords from '../../../common/config/bannedWords.js';
import settings from '../../../common/config/settings.js';

// 사용자 금지어 캐시
const userBanWordsCache = new Map();

/**
 * 캐시에서 만료된 항목들을 정리하는 함수
 */
function cleanExpiredCache() {
  const now = Date.now();
  const expireTime = settings.userBanWords.cacheExpireTime;
  
  for (const [userid, data] of userBanWordsCache.entries()) {
    if (now - data.timestamp > expireTime) {
      userBanWordsCache.delete(userid);
    }
  }
}

/**
 * 캐시 크기 제한을 적용하는 함수
 */
function enforcesCacheLimit() {
  const cacheLimit = settings.userBanWords.cacheLimit;
  
  if (userBanWordsCache.size > cacheLimit) {
    // 가장 오래된 항목들을 제거
    const entries = Array.from(userBanWordsCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const itemsToRemove = userBanWordsCache.size - cacheLimit;
    for (let i = 0; i < itemsToRemove; i++) {
      userBanWordsCache.delete(entries[i][0]);
    }
  }
}

/**
 * 사용자의 모든 금지어 목록을 반환 (공통 금지어 + 사용자 개별 금지어)
 * @param {number} userid - 사용자 ID
 * @returns {Array<string>} 모든 금지어 배열
 */
export async function getAllBannedWords(userid) {
  try {
    // 만료된 캐시 정리
    cleanExpiredCache();
    
    let userBannedWords = [];
    
    // 캐시에서 확인
    const cached = userBanWordsCache.get(userid);
    if (cached) {
      userBannedWords = cached.words;
    } else {
      // DB에서 조회
      const userBannedWordsStr = await getUserBannedWords(userid);
      
      if (userBannedWordsStr) {
        userBannedWords = userBannedWordsStr
          .split(',')
          .map(word => word.trim())
          .filter(word => word.length > 0);
      }
      
      // 캐시에 저장
      userBanWordsCache.set(userid, {
        words: userBannedWords,
        timestamp: Date.now()
      });
      
      // 캐시 크기 제한 적용
      enforcesCacheLimit();
    }
    
    // 공통 금지어와 사용자 금지어를 합쳐서 반환
    return [...bannedWords, ...userBannedWords];
    
  } catch (error) {
    console.error('getAllBannedWords 오류:', error);
    // 오류 발생 시 공통 금지어만 반환
    return bannedWords;
  }
}

/**
 * 특정 사용자의 캐시를 무효화
 * @param {number} userid - 사용자 ID
 */
export function invalidateUserCache(userid) {
  userBanWordsCache.delete(userid);
}
