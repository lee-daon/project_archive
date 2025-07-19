/*{
    "options": {
      "brandFiltering": true,
      "optionTranslation": true,
      "attributeTranslation": true,
      "imageTranslation": {
        "main": true,
        "detail": true,
        "option": true
      },
      "keyword": {
        "type": "basic", //basic advanced있음 
        "include": ["키워드1", "키워드2"] // 문자열에서 배열로 변환
      },
      "seo": {
        "type": "basic", //basic advanced있음 
        "include": ["키워드1", "키워드2"], // 문자열에서 배열로 변환
        "category": "카테고리1,카테고리2",
        "includeBrand": false
      },
      "nukkiImages": {
        "enabled": true,
        "order": 1 // 5보다 작은 값
      }
    },
    "targets": {
      // 다음 중 하나의 형식
      // 1. 전체 상품
      "type": "all"
      // 2. 최신/과거 상품
      "type": "recent", // 또는 "past"
      "count": 10
      // 3. 테스트 코드 상품
      "type": "commit",
      "commitCode": 0,
      "productIds": [622706981192, 721963707226]
    }
  }*/

import express from 'express';
import axios from 'axios';
import { getTargetIds } from '../repository/getTargetIds.js';
import { initProcessingStatus } from '../repository/controlPrcStatus.js';
import { filterBannedBrands } from '../service/brandfiltering.js';
import { saveToTempTable, getFromTempTable } from '../../../common/utils/assistDb/temp.js';
import { deleteSourceStatusByUserIdAndProductIds } from '../repository/controlSrcStatus.js';
import { checkTranslationQueueStatus, formatWaitTime } from '../service/checkqueueLength.js';
import { checkProcessingLimit } from '../../../common/QuotaUsageLimit/Quota/checkProcessingLimit.js';

const router = express.Router();
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

/**
 * 가공 작업 시작 엔드포인트
 * 대상 상품 ID를 조회하고 가공 상태를 초기화한 후 브랜드 필터링 혹은 번역 작업을 시작
 */
router.post('/', async (req, res) => {
  try {
    const { options, targets } = req.body;
    const userId = req.user.userid; // JWT 토큰에서 추출한 사용자 ID (미들웨어에서 설정됨)

    // 1. 대상 상품 ID 배열 조회
    let productIds;
    try {
      productIds = await getTargetIds(userId, targets);
      
      if (!productIds || productIds.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: '처리할 상품이 없습니다.' 
        });
      }
    } catch (error) {
      console.error('대상 상품 ID 조회 중 오류 발생:', error);
      return res.status(500).json({ 
        success: false, 
        message: '대상 상품 ID 조회 중 오류가 발생했습니다.', 
        error: error.message 
      });
    }

    // 2. 가공 제한 검사 및 할당량 차감
    try {
      const limitCheckResult = await checkProcessingLimit({
        userId,
        productCount: productIds.length,
        brandFiltering: options.brandFiltering || false,
        mainImageTranslation: options.imageTranslation?.main || false,
        optionImageTranslation: options.imageTranslation?.option || false,
        detailImageTranslation: options.imageTranslation?.detail || false,
        nukkiImages: options.nukkiImages?.enabled || false
      });
      
      if (!limitCheckResult.success) {
        return res.status(limitCheckResult.statusCode).json({
          success: false,
          message: limitCheckResult.error
        });
      }
      
      console.log('가공 제한 검사 통과:', limitCheckResult.usedQuota);
    } catch (error) {
      console.error('가공 제한 검사 중 오류 발생:', error);
      return res.status(500).json({ 
        success: false, 
        message: '가공 제한 검사 중 오류가 발생했습니다.', 
        error: error.message 
      });
    }

    // 3. 가공 상태 초기화 (processing_status 테이블 업데이트)
    try {
      await initProcessingStatus(userId, productIds, options);
      
      // 가공이 시작된 상품들은 소싱 상태 테이블에서 삭제
      await deleteSourceStatusByUserIdAndProductIds(userId, productIds);
    } catch (error) {
      console.error('가공 상태 초기화 중 오류 발생:', error);
      return res.status(500).json({ 
        success: false, 
        message: '가공 상태 초기화 중 오류가 발생했습니다.', 
        error: error.message 
      });
    }

    // 4. 번역 큐 상태 확인 (대기시간 계산)
    let queueStatus;
    try {
      queueStatus = await checkTranslationQueueStatus();
    } catch (error) {
      console.error('큐 상태 확인 중 오류 발생:', error);
      // 큐 상태 확인 실패 시 기본값 사용
      queueStatus = {
        maxWaitingTasks: 0,
        maxEstimatedWaitTimeMs: 0,
        selectedQueue: 'text'
      };
    }

    // 5. 옵션에 따라 브랜드 필터링 또는 번역 작업 시작
    if (options.brandFiltering) {
      // 브랜드 필터링 옵션이 활성화된 경우
      try {
        // 임시 저장을 위한 데이터
        const tempData = {
          options,
          targets,
          productIds,
          created_at: new Date()
        };

        // temp 테이블에 type_number=2로 저장
        await saveToTempTable(userId, 2, tempData);
        
        // 브랜드 필터링 수행
        const filterResult = await filterBannedBrands(userId, productIds);
        
        console.log('브랜드 필터링 결과:', {
          bannedCount: filterResult.bannedItems.length,
          nonBannedCount: filterResult.nonBannedItems.length
        });
        
        // 금지된 브랜드 아이템을 temp 테이블에 저장 (type_number=3)
        if (filterResult.bannedItems.length > 0) {
          const bannedItemsData = filterResult.bannedItems.map(item => ({
            userId,
            productId: item.productId,
            options
          }));
          
          // 기존 데이터 조회
          const existingResult = await getFromTempTable(userId, 3);
          
          // 기존 데이터에 새 데이터 추가하기
          let combinedData;
          if (existingResult.success && existingResult.data) {
            // 기존 데이터가 배열인지 확인
            const existingData = Array.isArray(existingResult.data) 
              ? existingResult.data 
              : [existingResult.data];
              
            combinedData = [...existingData, ...bannedItemsData];
          } else {
            combinedData = bannedItemsData;
          }
          
          await saveToTempTable(userId, 3, combinedData);
        }
        
        // 클라이언트에 응답 (가공 시작됨을 알림) - 대기 상황 정보 포함
        const responseMessage = queueStatus.maxWaitingTasks > 0 
          ? `${productIds.length}개 상품 가공 작업이 시작되었습니다. 현재 ${queueStatus.maxWaitingTasks}개의 작업이 대기중이며, 예상 대기시간은 ${formatWaitTime(queueStatus.maxEstimatedWaitTimeMs)}입니다.`
          : `${productIds.length}개 상품 가공 작업이 시작되었습니다.`;

        res.status(200).json({ 
          success: true, 
          message: responseMessage,
          count: productIds.length,
          queueInfo: {
            waitingTasks: queueStatus.maxWaitingTasks,
            estimatedWaitTime: formatWaitTime(queueStatus.maxEstimatedWaitTimeMs),
            queueType: queueStatus.selectedQueue
          }
        });
        
        // 금지어가 없는 상품들에 대해서는 번역 작업 진행
        if (filterResult.nonBannedItems.length > 0) {
          const nonBannedProductIds = filterResult.nonBannedItems.map(item => item.productId);
          await sendToTranslateDetail(userId, nonBannedProductIds, options);
        }
      } catch (error) {
        console.error('브랜드 필터링 중 오류 발생:', error);
        // 응답이 이미 전송된 경우 무시
        if (!res.headersSent) {
          res.status(500).json({ 
            success: false, 
            message: '브랜드 필터링 중 오류가 발생했습니다.', 
            error: error.message 
          });
        }
      }
    } else {
      // 브랜드 필터링 옵션이 비활성화된 경우, 바로 번역 작업 시작
      // 클라이언트에 응답 (가공 시작됨을 알림) - 대기 상황 정보 포함
      const responseMessage = queueStatus.maxWaitingTasks > 0 
        ? `${productIds.length}개 상품 가공 작업이 시작되었습니다. 현재 ${queueStatus.maxWaitingTasks}개의 작업이 대기중이며, 예상 대기시간은 ${formatWaitTime(queueStatus.maxEstimatedWaitTimeMs)}입니다.`
        : `${productIds.length}개 상품 가공 작업이 시작되었습니다.`;

      res.status(200).json({ 
        success: true, 
        message: responseMessage,
        count: productIds.length,
        queueInfo: {
          waitingTasks: queueStatus.maxWaitingTasks,
          estimatedWaitTime: formatWaitTime(queueStatus.maxEstimatedWaitTimeMs),
          queueType: queueStatus.selectedQueue
        }
      });
      
      await sendToTranslateDetail(userId, productIds, options);
    }
  } catch (error) {
    console.error('가공 작업 시작 중 오류 발생:', error);
    // 응답이 이미 전송된 경우 무시 (비동기 작업 중 오류)
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: '가공 작업 시작 중 오류가 발생했습니다.', 
        error: error.message 
      });
    }
  }
});

/**
 * 번역 작업을 위해 translatedetail 엔드포인트로 요청을 보내는 함수
 */
async function sendToTranslateDetail(userId, productIds, options) {
  try {
    // 요청할 데이터 구성
    const requestData = productIds.map(productId => ({
      userId,
      productId,
      options
    }));

    // 내부 API 호출 (상대 경로 사용)
    const response = await axios.post(
      `${API_BASE_URL}/prc/translatedetail?userid=${userId}`,
      requestData,
      {
        headers: {
          'x-api-key': process.env.INTERNAL_API_KEY
        }
      }
    );

    console.log('번역 작업 요청 완료:', response.data);
    return response.data;
  } catch (error) {
    console.error('번역 작업 요청 중 오류 발생:', error);
    throw error;
  }
}

export default router;