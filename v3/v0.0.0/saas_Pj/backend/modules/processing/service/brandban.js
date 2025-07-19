/**
 * 브랜드 필터링 결과를 처리하는 서비스 함수
 * 
 * @param {number} userId - 사용자 ID
 * @param {Array<Object>} filterResults - 필터링 결과 배열 [{productid: number, ban: boolean}, ...]
 * @param {Array<Object>} tempData - temp 테이블에서 가져온 브랜드 필터링 데이터
 * @returns {Object} - 처리 결과 객체 (bannedItems, nonBannedItems)
 */
export async function processBrandFilterResults(userId, filterResults, tempData) {
  try {
    // tempData가 배열이 아닌 경우 배열로 변환
    const tempItems = Array.isArray(tempData) ? tempData : [tempData];
    
    // 금지된 상품과 허용된 상품을 분류할 배열
    const bannedItems = [];
    const nonBannedItems = [];
    
    // 결과를 순회하면서 분류
    for (const result of filterResults) {
      // temp 데이터에서 해당 productId 찾기
      const productId = result.productid;
      const tempItem = tempItems.find(item => 
        item.productId === productId || item.productId === Number(productId)
      );
      
      if (!tempItem) {
        console.warn(`상품 ID ${productId}에 대한 임시 데이터를 찾을 수 없습니다.`);
        continue;
      }
      
      // ban 여부에 따라 분류
      if (result.ban === true) {
        bannedItems.push({
          productId,
          options: tempItem.options
        });
      } else {
        nonBannedItems.push({
          productId,
          options: tempItem.options
        });
      }
    }
    
    // 결과 반환
    return {
      bannedItems,
      nonBannedItems
    };
  } catch (error) {
    console.error('브랜드 필터링 결과 처리 중 오류:', error);
    throw error;
  }
}
