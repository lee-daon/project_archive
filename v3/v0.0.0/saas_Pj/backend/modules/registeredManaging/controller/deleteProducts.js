import express from 'express';
import { deleteSpecificTables } from '../repository/deleteAllRows.js';
import { deleteViewsData } from '../service/deleteTrackingPixels.js';
import { addToQueue } from '../../../common/utils/redisClient.js';
import { QUEUE_NAMES } from '../../../common/config/settings.js';
import { delay, API_RATE_LIMITS } from '../../../common/config/detailsetting.js';
import { checkRequestLimit } from '../../../common/QuotaUsageLimit/Limit/requestLimit.js';
import { findAccountInfo } from '../repository/findaccountInfo.js';

const router = express.Router();

/**
 * 상품 영구 삭제 컨트롤러 (DB 선-삭제, 큐 방식)
 */
router.delete('/', async (req, res) => {
    try {
        const { products } = req.body;
        const userid = req.user.userid;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ success: false, message: '상품 정보가 필요합니다.' });
        }
        const limitResult = checkRequestLimit(products.length, 300);
        if (!limitResult.success) {
            return res.status(limitResult.statusCode).json({ success: false, message: limitResult.message });
        }

        let deletedCount = 0;
        let failedCount = 0;
        const results = [];
        const platforms = ['coopang', 'naver', 'elevenstore', 'esm'];

        for (const product of products) {
            const { productid } = product; // 요청에서는 productid만 사용합니다.

            try {
                if (!productid) throw new Error('상품 ID가 필요합니다.');

                // 1. DB 삭제 *전에* API 호출에 필요한 정보(상품번호, API키) 미리 조회
                const tasksToQueue = [];
                for (const marketPlatform of platforms) {
                    // ESM은 API 호출이 필요 없으므로 큐에 추가하지 않음
                    if (marketPlatform === 'esm') {
                        continue;
                    }
                    
                    // findAccountInfo가 이제 플랫폼별 상품번호까지 확인해줍니다.
                    const accountInfo = await findAccountInfo(userid, productid, marketPlatform);
                    if (accountInfo.success) { // 성공 시 productNumber가 반드시 존재함
                        tasksToQueue.push({
                            userid,
                            productid,
                            productNumber: accountInfo.productNumber, // DB에서 직접 조회한 상품번호 사용
                            platform: marketPlatform,
                            apiKeys: accountInfo.data
                        });
                    }
                }

                // 2. 우리 DB에서 데이터 삭제
                const dbDeleteResult = await deleteSpecificTables(userid, productid);
                if (!dbDeleteResult.success) throw new Error(dbDeleteResult.error || '데이터베이스 삭제 중 오류 발생');

                // 3. 조회 데이터 삭제
                await deleteViewsData(userid, productid);

                // 4. 미리 수집한 정보를 바탕으로 큐에 작업 추가 (ESM 제외)
                for (const task of tasksToQueue) {
                    await addToQueue(QUEUE_NAMES.MARKET_PRODUCT_REMOVAL_QUEUE, task);
                }
                
                deletedCount++;
                results.push({
                    productid,
                    success: true,
                    message: 'DB에서 삭제되었으며, 마켓 삭제 요청이 등록되었습니다. (ESM은 서버에서만 삭제됨)',
                });

            } catch (error) {
                failedCount++;
                results.push({ productid, success: false, error: error.message });
            }
            
            await delay(API_RATE_LIMITS.DELETE_PRODUCT_DELAY);
        }

        const totalCount = products.length;
        const message = `${totalCount}개 상품 중 ${deletedCount}개 삭제 완료, ${failedCount}개 실패.`;

        res.json({
            success: failedCount === 0,
            message,
            deletedCount,
            failedCount,
            totalCount,
            results,
        });

    } catch (error) {
        console.error('deleteProducts 컨트롤러 오류:', error.message);
        res.status(500).json({ success: false, message: '서버 내부 오류가 발생했습니다.', error: error.message });
    }
});

export default router;
