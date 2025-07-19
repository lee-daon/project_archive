import { checkRegistrationLimit } from '../repository/checkLimit.js';
import { 
  insertOrUpdateNaverRegisterStatus, 
  insertOrUpdateCoopangRegisterStatus,
  insertOrUpdateElevenstoreRegisterStatus,
  insertOrUpdateEsmRegisterStatus
} from '../repository/registerStatus.js';
import { 
  addNaverRegisterJob, 
  addCoopangRegisterJob,
  addElevenstoreRegisterJob
} from './queueManager.js';
import { createEsmExcel } from './esmExleCreate/operator.js';
import { updateTotalRegisteredProducts } from '../../../common/QuotaUsageLimit/Usage/updateUsage.js';

/**
 * 상품 등록 서비스
 * @param {number} userid - 사용자 ID
 * @param {Array} productIds - 등록할 상품 ID 배열
 * @param {string} tabInfo - 탭 정보 (common, naver, coopang, elevenstore)
 * @param {object} settings - 등록 설정
 * @returns {Promise<object>} - 등록 결과
 */
export const registerProducts = async (userid, productIds, tabInfo, settings) => {
  try {
    const results = [];
    let successCount = 0;
    let failCount = 0;

    // tabInfo에 따라 등록할 마켓 결정
    const marketsToRegister = [];
    
    if (tabInfo === 'common') {
      // 공통 탭인 경우 네이버, 쿠팡, 11번가, ESM 등록
      if (settings.naverMarket) {
        marketsToRegister.push('naver');
      }
      if (settings.coopangMarket) {
        marketsToRegister.push('coopang');
      }
      if (settings.elevenstoreMarket) {
        marketsToRegister.push('elevenstore');
      }
      if (settings.esmMarket) {
        marketsToRegister.push('esm');
      }
    } else if (tabInfo === 'naver') {
      // 네이버 탭인 경우 네이버 마켓 설정 확인
      if (settings.naverMarket) {
        marketsToRegister.push('naver');
      }
    } else if (tabInfo === 'coopang' || tabInfo === 'coupang') {
      // 쿠팡 탭인 경우 쿠팡 마켓 설정 확인 (coopang, coupang 둘 다 지원)
      if (settings.coopangMarket) {
        marketsToRegister.push('coopang');
      }
    } else if (tabInfo === 'elevenstore') {
      // 11번가 탭인 경우 11번가 마켓 설정 확인
      if (settings.elevenstoreMarket) {
        marketsToRegister.push('elevenstore');
      }
    } else if (tabInfo === 'esm') {
      // ESM 탭인 경우 ESM 마켓 설정 확인
      if (settings.esmMarket) {
        marketsToRegister.push('esm');
      }
    }

    if (marketsToRegister.length === 0) {
      let errorMessage = '등록할 마켓이 지정되지 않았습니다. ';
      
      if (tabInfo === 'common') {
        errorMessage += 'naverMarket, coopangMarket, elevenstoreMarket 또는 esmMarket 설정이 필요합니다.';
      } else if (tabInfo === 'naver') {
        errorMessage += 'naverMarket 설정이 필요합니다.';
      } else if (tabInfo === 'coopang' || tabInfo === 'coupang') {
        errorMessage += 'coopangMarket 설정이 필요합니다.';
      } else if (tabInfo === 'elevenstore') {
        errorMessage += 'elevenstoreMarket 설정이 필요합니다.';
      } else if (tabInfo === 'esm') {
        errorMessage += 'esmMarket 설정이 필요합니다.';
      } else {
        errorMessage += `지원하지 않는 tabInfo: ${tabInfo}`;
      }
      
      throw new Error(errorMessage);
    }

    // 각 마켓별로 등록 제한 확인
    for (const marketType of marketsToRegister) {
      let marketNumber;
      if (marketType === 'naver') {
        marketNumber = settings.naverMarket;
      } else if (marketType === 'coopang') {
        marketNumber = settings.coopangMarket;
      } else if (marketType === 'elevenstore') {
        marketNumber = settings.elevenstoreMarket;
      } else if (marketType === 'esm') {
        marketNumber = settings.esmMarket;
      }
      
      const limitCheck = await checkRegistrationLimit(
        userid, 
        marketType, 
        marketNumber, 
        productIds.length
      );

      if (!limitCheck.canRegister) {
        throw new Error(`${marketType} ${limitCheck.message}`);
      }
    }

    // 각 상품에 대해 등록 처리
    for (const productId of productIds) {
      try {
        const productResult = {
          productId,
          success: true,
          message: '등록 요청이 완료되었습니다.',
          markets: []
        };

        // 각 마켓별로 등록 상태 업데이트 및 큐 추가
        for (const marketType of marketsToRegister) {
          try {
            // 등록 상태 테이블 업데이트
            if (marketType === 'naver') {
              await insertOrUpdateNaverRegisterStatus(userid, productId, settings);
            } else if (marketType === 'coopang') {
              await insertOrUpdateCoopangRegisterStatus(userid, productId, settings);
            } else if (marketType === 'elevenstore') {
              await insertOrUpdateElevenstoreRegisterStatus(userid, productId, settings);
            } else if (marketType === 'esm') {
              await insertOrUpdateEsmRegisterStatus(userid, productId, settings);
            }

            // 큐에 작업 추가 (ESM은 제외 - 엑셀 생성 방식)
            if (marketType === 'naver') {
              await addNaverRegisterJob(userid, productId);
            } else if (marketType === 'coopang') {
              await addCoopangRegisterJob(userid, productId);
            } else if (marketType === 'elevenstore') {
              await addElevenstoreRegisterJob(userid, productId);
            }

            // ESM은 큐가 아닌 다른 방식으로 처리
            if (marketType === 'esm') {
              productResult.markets.push({
                market: marketType,
                status: 'prepared',
                message: '엑셀 생성 준비가 완료되었습니다.'
              });
            } else {
              productResult.markets.push({
                market: marketType,
                status: 'queued',
                message: '큐에 등록되었습니다.'
              });
            }

          } catch (marketError) {
            console.error(`${marketType} 등록 처리 중 오류:`, marketError);
            productResult.markets.push({
              market: marketType,
              status: 'failed',
              message: `${marketType} 등록 실패: ${marketError.message}`
            });
          }
        }

        // 모든 마켓에서 성공했는지 확인 (ESM은 'prepared', 나머지는 'queued')
        const allMarketsSucceeded = productResult.markets.every(m => 
          m.status === 'queued' || m.status === 'prepared'
        );
        
        if (allMarketsSucceeded) {
          successCount++;
        } else {
          failCount++;
          productResult.success = false;
          productResult.message = '일부 마켓 등록에 실패했습니다.';
        }

        results.push(productResult);

      } catch (productError) {
        console.error(`상품 ${productId} 등록 처리 중 오류:`, productError);
        failCount++;
        results.push({
          productId,
          success: false,
          message: `등록 실패: ${productError.message}`,
          markets: []
        });
      }
    }

    // 누적 등록 상품수 업데이트
    if (successCount > 0) {
      let multiplier = 1;
      if (tabInfo === 'common') {
        multiplier = marketsToRegister.length; // 실제 등록된 마켓 수
      } else {
        multiplier = 1; // 개별 마켓
      }
      
      await updateTotalRegisteredProducts(userid, successCount * multiplier);
    }

    // ESM이 포함된 경우 엑셀 파일 생성 (esm 탭 또는 common 탭에서 ESM 포함)
    let excelFile = null;
    if (successCount > 0 && marketsToRegister.includes('esm')) {
      try {
        const successfulProductIds = results
          .filter(r => r.success)
          .map(r => r.productId);
        
        excelFile = await createEsmExcel(userid, successfulProductIds, settings);
      } catch (excelError) {
        console.error('ESM 엑셀 생성 중 오류:', excelError);
        // 엑셀 생성 실패해도 등록 자체는 성공으로 처리
      }
    }

    const response = {
      success: successCount > 0,
      message: `등록 요청이 처리되었습니다. 성공: ${successCount}개, 실패: ${failCount}개`,
      successCount,
      failCount,
      results
    };

    // ESM 엑셀 파일이 있는 경우 응답에 포함
    if (excelFile) {
      response.excelFile = excelFile;
      response.message += ' ESM 엑셀 파일이 생성되었습니다.';
    }

    return response;

  } catch (error) {
    console.error('상품 등록 서비스 오류:', error);
    throw error;
  }
};
