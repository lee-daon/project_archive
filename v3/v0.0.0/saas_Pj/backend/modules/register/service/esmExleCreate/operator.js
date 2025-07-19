import path from 'path';
import { fileURLToPath } from 'url';
import { createInitialJson } from './service/createInitailJson.js';
import { getConfig } from './db/getConfig.js';
import { getBaseData } from './db/getBaseData.js';
import { saveBulkStatus } from './db/saveStatus.js';
import { createExcelFile } from './service/XlsxMapping.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ESM 엑셀 생성 메인 오퍼레이터
 * 여러 상품을 일괄 처리하고 엑셀 파일을 생성합니다.
 * @param {number} userid - 사용자 ID
 * @param {Array} productIds - 상품 ID 배열
 * @returns {Promise<object>} - 생성된 엑셀 파일 정보 및 처리 결과
 */
export const createEsmExcel = async (userid, productIds) => {
  const successProducts = [];
  const failedProducts = [];
  const processedDataForExcel = [];

  try {
    if (productIds.length === 0) {
      throw new Error('생성할 상품이 없습니다.');
    }

    console.log(`ESM 엑셀 생성 프로세스 시작 - userid: ${userid}, 상품 수: ${productIds.length}`);

    // 1. 설정 정보 조회
    const config = await getConfig(userid, productIds);
    console.log('ESM 설정 데이터 로드 완료');

    // 2. 상품 기본 데이터 조회
    const baseDataArray = await getBaseData(userid, productIds);
    console.log(`상품 기본 데이터 로드 완료 - ${baseDataArray.length}개 상품`);

    if (baseDataArray.length === 0) {
      throw new Error('상품 정보를 찾을 수 없습니다.');
    }

    // 3. 각 상품별로 createInitialJson 처리
    for (const baseData of baseDataArray) {
      const productid = baseData.productid;
      try {
        const productManagement = config.productManagementMap[productid];
        const accountInfo = config.accountInfoMap[productManagement?.market_number];

        if (!accountInfo) {
          throw new Error(`계정 정보를 찾을 수 없습니다. market_number: ${productManagement?.market_number}`);
        }

        // productManagement에서 상품별 이익률·배송비 등 추출하여 priceConfig에 주입
        const mergedPriceConfig = {
          ...config.priceConfig,
          profitMargin: productManagement?.profit_margin ?? config.priceConfig.profitMargin ?? 20,
          minimumProfitMargin: productManagement?.minimum_profit_margin ?? 0,
          deliveryFee: productManagement?.delivery_fee ?? config.priceConfig.basicDeliveryFee ?? 0
        };

        // createInitialJson으로 상품 데이터 처리
        const initialJsonResult = await createInitialJson(
          baseData.jsonData,              // JSON 형태의 상품 데이터
          baseData.esmCatId,              // ESM 카테고리 ID
          baseData.gmarketCatId,          // G마켓 카테고리 ID
          baseData.auctionCatId,          // 옥션 카테고리 ID
          mergedPriceConfig,              // 상품별 가격 설정 데이터
          config.esmConfig,               // ESM 설정 데이터
          config.detailPageConfig,        // 상세페이지 설정 데이터
          accountInfo,                    // ESM 계정 정보
          userid,                         // 사용자 ID
          productid,                      // 상품 ID
          baseData.productGroupCode       // 상품 그룹 코드
        );

        processedDataForExcel.push({
          productid: productid,
          initialJson: initialJsonResult.initialJson,
          accountInfo: accountInfo
        });

        successProducts.push({
          productid: productid,
          finalMainPrice: initialJsonResult.initialJson.variants[0]?.calculatedPrice || 0,
          marketNumber: accountInfo.esm_market_number
        });

        console.log(`상품 ${productid} 처리 완료`);

      } catch (error) {
        console.error(`상품 ${productid} 처리 실패:`, error);
        failedProducts.push({
          productid: productid,
          errorMessage: error.message
        });
      }
    }
    
    // 엑셀 생성을 위한 데이터가 없으면 모든 상품을 실패 처리하고 종료
    if (processedDataForExcel.length === 0) {
        console.log('엑셀로 생성할 성공 상품이 없습니다. 모든 상품을 실패 처리합니다.');
        if (failedProducts.length > 0) {
            await saveBulkStatus(userid, [], failedProducts);
        }
        return {
            success: true, // 프로세스는 성공했으나 생성할 파일이 없음
            fileName: null,
            filePath: null,
            downloadUrl: null,
            productCount: 0,
            createdAt: new Date().toISOString()
        };
    }

    try {
        // 4. 엑셀 파일 생성 시도
        const excelFileInfo = await createExcelFile(processedDataForExcel, userid, config.esmConfig);
        
        // 5. 엑셀 생성 성공 시, 모든 관련 상품 상태를 'success' 또는 'fail'로 일괄 저장
        console.log('엑셀 파일 생성 성공. DB 상태를 업데이트합니다.');
        await saveBulkStatus(userid, successProducts, failedProducts);

        const result = {
            success: true,
            fileName: excelFileInfo.fileName,
            filePath: excelFileInfo.filePath,
            downloadUrl: excelFileInfo.downloadUrl,
            productCount: processedDataForExcel.length,
            successCount: successProducts.length,
            failureCount: failedProducts.length,
            successProductIds: successProducts.map(p => p.productid),
            failedProducts,
            createdAt: new Date().toISOString()
        };

        console.log(`ESM 엑셀 생성 완료 - 성공: ${successProducts.length}, 실패: ${failedProducts.length}`);
        return result;

    } catch (excelError) {
        // 엑셀 생성 실패 시, 모든 상품을 'fail' 상태로 처리
        console.error('엑셀 파일 생성 실패:', excelError);
        console.log('엑셀 생성에 실패했으므로, 관련된 모든 상품을 실패 처리합니다.');
        
        const allProductIds = productIds.map(id => ({
            productid: id,
            errorMessage: `엑셀 생성 실패: ${excelError.message}`
        }));

        await saveBulkStatus(userid, [], allProductIds);

        // 실패 결과 반환
        return {
            success: false,
            message: '엑셀 파일 생성에 실패했습니다.',
            productCount: 0,
            successCount: 0,
            failureCount: productIds.length,
            successProductIds: [],
            failedProducts: allProductIds,
            createdAt: new Date().toISOString()
        };
    }

  } catch (error) {
    console.error('ESM 데이터 처리 중 심각한 오류 발생:', error);
    
    // 데이터 처리 과정 자체에서 심각한 오류 발생 시 모든 상품 실패 처리
    const allFailed = productIds.map(id => ({
        productid: id,
        errorMessage: `처리 중 오류 발생: ${error.message}`
    }));
    await saveBulkStatus(userid, [], allFailed);

    throw error; // 상위 핸들러로 에러 전파
  }
};