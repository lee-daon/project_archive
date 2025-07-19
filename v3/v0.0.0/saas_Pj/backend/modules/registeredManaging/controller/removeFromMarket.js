import express from 'express';
import { addToQueue } from '../../../common/utils/redisClient.js';
import { QUEUE_NAMES } from '../../../common/config/settings.js';
import { checkRequestLimit } from '../../../common/QuotaUsageLimit/Limit/requestLimit.js';
import { makeRegisterable } from '../repository/makeRegisterable.js';
import { findAccountInfo } from '../repository/findaccountInfo.js';

const router = express.Router();

/**
 * 마켓에서 상품 내리기 컨트롤러 (DB 선-업데이트, 큐 방식)
 * POST /regmng/remove-from-market
 */
router.post('/', async (req, res) => {
    try {
        const { platform, products } = req.body;
        const userid = req.user.userid;

        // 입력값 검증
        if (!platform) {
            return res.status(400).json({ success: false, message: '플랫폼이 필요합니다.' });
        }
        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ success: false, message: '상품 정보가 필요합니다.' });
        }
        if (!['coopang', 'naver', 'elevenstore', 'esm'].includes(platform.toLowerCase())) {
            return res.status(400).json({ success: false, message: `지원하지 않는 플랫폼입니다: ${platform}` });
        }

        // 요청 개수 제한
        const limitResult = checkRequestLimit(products.length, 100);
        if (!limitResult.success) {
            return res.status(limitResult.statusCode).json({ success: false, message: limitResult.message });
        }
        
        let processedCount = 0;
        const failedTasks = [];

        for (const product of products) {
            const { productid } = product; // productNumber는 사용하지 않음

            if (!productid) {
                failedTasks.push({ product, error: '상품 ID가 필요합니다.' });
                continue;
            }
            
            try {
                // 1. ESM이 아닌 경우에만 API 호출을 위한 계정 정보 조회 및 큐 등록 (productNumber가 필요하므로 DB 변경 전에 실행)
                if (platform.toLowerCase() !== 'esm') {
                    const accountInfo = await findAccountInfo(userid, productid, platform);
                    
                    // 큐에 작업 추가 (조회 성공 시에만)
                    if (accountInfo.success) { // 성공 시 productNumber, apiKeys가 모두 존재
                        const task = {
                            userid,
                            productid,
                            productNumber: accountInfo.productNumber, // DB에서 조회한 상품번호 사용
                            platform,
                            apiKeys: accountInfo.data
                        };
                        await addToQueue(QUEUE_NAMES.MARKET_PRODUCT_REMOVAL_QUEUE, task);
                    }
                }
                // 2. DB 상태를 '재등록 가능'으로 변경 (모든 플랫폼 공통) - productNumber NULL 설정
                await makeRegisterable(userid, productid, platform);
                
                processedCount++;
            } catch (error) {
                console.error(`상품 내리기 처리 실패:`, { productid, error: error.message });
                failedTasks.push({ product, error: error.message });
            }
        }
        
        const totalCount = products.length;
        const message = platform.toLowerCase() === 'esm' 
            ? `${processedCount}개 ESM 상품이 서버에서 내려졌습니다.`
            : `${processedCount}개 상품에 대한 내리기 요청이 처리되었습니다.`;

        res.status(202).json({ // 202 Accepted: 요청이 접수되었으나 처리는 완료되지 않음
            success: true,
            message,
            totalCount,
            processedCount,
            failedCount: failedTasks.length,
            failedTasks,
        });

    } catch (error) {
        console.error('removeFromMarket 컨트롤러 오류:', error.message);
        res.status(500).json({
            success: false,
            message: '서버 내부 오류가 발생했습니다.',
            error: error.message
        });
    }
});

export default router;
