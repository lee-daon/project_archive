import { getCommitCount, getCommitCodeCounts } from '../repository/controlSrcStatus.js';

/**
 * commit 상태인 상품의 정보를 조회하는 서비스 함수
 * @param {number} userid - 사용자 ID
 * @returns {Promise<Object>} - commit 상태 상품 정보
 */
const getCommitStatusInfo = async (userid) => {
  try {
    // commit 상태인 상품의 총 개수 조회
    const totalCount = await getCommitCount(userid);
    
    // commit 상태인 상품의 commitcode별 id와 개수 조회
    const commitGroups = await getCommitCodeCounts(userid);
    
    // 포맷 변환
    const formattedGroups = commitGroups.map(group => {
      // productids가 이미 JSON 문자열인지 확인하고 적절히 처리
      let productids = [];
      try {
        // 문자열이면 파싱, 이미 객체면 그대로 사용
        productids = typeof group.productids === 'string' ? 
          JSON.parse(group.productids) : group.productids;
      } catch (error) {
        console.error('productids 파싱 오류:', error, '값:', group.productids);
        // 파싱 실패 시 빈 배열 사용
        productids = [];
      }
      
      return {
        commitcode: group.commitcode,
        count: group.count,
        productids: productids
      };
    });
    
    return {
      total_commit_count: totalCount,
      commit_groups: formattedGroups
    };
  } catch (error) {
    console.error('getCommitStatusInfo 오류:', error);
    throw error;
  }
};

export {
  getCommitStatusInfo
};
