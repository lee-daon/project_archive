import express from 'express';
import { 
    getCategoryMappingInfoService, 
    getCategoryProductSamplesService, 
    updateCategoryMappingService,
    getCompletedCategoryMappingService
} from '../service/categorymapping.js';

const router = express.Router();

/**
 * 카테고리 매핑 정보 조회 컨트롤러
 * GET /api/postprocessing/categorymapping
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.get('/', async (req, res) => {
    try {
        // 실제 구현에서는 인증 미들웨어를 통해 userid를 획득
        // 여기서는 쿼리 파라미터나 헤더에서 userid를 가져온다고 가정
        const userid = req.user.userid;
        
        if (!userid) {
            return res.status(400).json({
                success: false,
                message: '사용자 ID가 필요합니다.',
                code: 'MISSING_USER_ID'
            });
        }

        // 숫자로 변환 및 유효성 검사
        const userIdNum = parseInt(userid);
        if (isNaN(userIdNum) || userIdNum <= 0) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 사용자 ID입니다.',
                code: 'INVALID_USER_ID'
            });
        }

        // 페이지네이션 파라미터 추출
        const { page, limit } = req.query;

        // 서비스 호출
        const result = await getCategoryMappingInfoService(userIdNum, page, limit);
        
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(500).json(result);
        }
        
    } catch (error) {
        console.error('카테고리 매핑 컨트롤러 오류:', error);
        return res.status(500).json({
            success: false,
            message: '서버 내부 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * 매핑 완료된 카테고리 정보 조회 컨트롤러
 * GET /api/postprocessing/categorymapping/completed
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.get('/completed', async (req, res) => {
    try {
        // 인증 미들웨어를 통해 userid 획득
        const userid = req.user.userid;
        
        if (!userid) {
            return res.status(400).json({
                success: false,
                message: '사용자 ID가 필요합니다.',
                error_code: 'MISSING_USER_ID'
            });
        }

        // 숫자로 변환 및 유효성 검사
        const userIdNum = parseInt(userid);
        if (isNaN(userIdNum) || userIdNum <= 0) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 사용자 ID입니다.',
                error_code: 'INVALID_USER_ID'
            });
        }

        // 페이지네이션 파라미터 추출
        const { page, limit } = req.query;

        // 서비스 호출
        const result = await getCompletedCategoryMappingService(userIdNum, page, limit);
        
        if (result.success) {
            return res.status(200).json({
                success: true,
                message: '매핑 완료된 카테고리 정보 조회 성공',
                categories: result.categories,
                ...(result.total !== undefined && {
                    total: result.total,
                    page: result.page,
                    limit: result.limit
                })
            });
        } else {
            return res.status(500).json({
                success: false,
                message: result.message || '서버 내부 오류가 발생했습니다.',
                error_code: result.code || 'SERVICE_ERROR'
            });
        }
        
    } catch (error) {
        console.error('매핑 완료된 카테고리 조회 컨트롤러 오류:', error);
        return res.status(500).json({
            success: false,
            message: '서버 내부 오류가 발생했습니다.',
            error_code: 'INTERNAL_SERVER_ERROR'
        });
    }
});

/**
 * 카테고리별 상품 샘플 조회 컨트롤러
 * GET /api/postprocessing/categorymapping/samples
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.get('/samples', async (req, res) => {
    try {
        // 사용자 ID 획득 및 검증
        const userid = req.user.userid;
        
        if (!userid) {
            return res.status(400).json({
                success: false,
                message: '사용자 ID가 필요합니다.',
                code: 'MISSING_USER_ID'
            });
        }

        const userIdNum = parseInt(userid);
        if (isNaN(userIdNum) || userIdNum <= 0) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 사용자 ID입니다.',
                code: 'INVALID_USER_ID'
            });
        }

        // 파라미터 추출
        const { catid, limit } = req.query;

        if (!catid) {
            return res.status(400).json({
                success: false,
                message: '카테고리 ID가 필요합니다.',
                code: 'MISSING_CATID'
            });
        }

        // 서비스 호출
        const result = await getCategoryProductSamplesService(userIdNum, catid, limit);
        
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
        
    } catch (error) {
        console.error('카테고리 상품 샘플 조회 컨트롤러 오류:', error);
        return res.status(500).json({
            success: false,
            message: '서버 내부 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * 카테고리 매핑 업데이트 컨트롤러
 * POST /api/postprocessing/categorymapping/update
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.post('/update', async (req, res) => {
    try {
        // 사용자 ID 획득 및 검증
        const userid = req.user.userid;
        
        if (!userid) {
            return res.status(400).json({
                success: false,
                message: '사용자 ID가 필요합니다.',
                code: 'MISSING_USER_ID'
            });
        }

        const userIdNum = parseInt(userid);
        if (isNaN(userIdNum) || userIdNum <= 0) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 사용자 ID입니다.',
                code: 'INVALID_USER_ID'
            });
        }

        // 요청 본문에서 mappings 추출
        const { mappings } = req.body;

        if (!mappings) {
            return res.status(400).json({
                success: false,
                message: '매핑 정보가 필요합니다.',
                code: 'MISSING_MAPPINGS'
            });
        }

        // 서비스 호출
        const result = await updateCategoryMappingService(userIdNum, mappings);
        
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
        
    } catch (error) {
        console.error('카테고리 매핑 업데이트 컨트롤러 오류:', error);
        return res.status(500).json({
            success: false,
            message: '서버 내부 오류가 발생했습니다.',
            error: error.message
        });
    }
});

export default router;
