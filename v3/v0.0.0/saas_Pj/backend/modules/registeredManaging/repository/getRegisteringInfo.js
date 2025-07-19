import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 등록된 상품 정보를 조회하는 함수 (안정성 및 호환성 개선 버전)
 * @param {Object} params - 검색 파라미터
 * @returns {Promise<Object>} 조회 결과
 */
export async function getRegisteringProducts(params) {
    try {
        const { userid, page, pageSize, platform, groupCode, sortOrder, productName, marketNumber } = params;
        

        // 1. 전체 플랫폼 상태별 개수 조회 (개별 쿼리 병렬 실행 - ESM 포함)
        const coopangStatusQuery = `
            SELECT SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                   SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
                   SUM(CASE WHEN status = 'fail' THEN 1 ELSE 0 END) as fail
            FROM coopang_register_management WHERE userid = ? AND status IN ('pending', 'success', 'fail')`;
        
        const naverStatusQuery = `
            SELECT SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                   SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
                   SUM(CASE WHEN status = 'fail' THEN 1 ELSE 0 END) as fail
            FROM naver_register_management WHERE userid = ? AND status IN ('pending', 'success', 'fail')`;

        const elevenstoreStatusQuery = `
            SELECT SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                   SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
                   SUM(CASE WHEN status = 'fail' THEN 1 ELSE 0 END) as fail
            FROM elevenstore_register_management WHERE userid = ? AND status IN ('pending', 'success', 'fail')`;

        const esmStatusQuery = `
            SELECT SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                   SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
                   SUM(CASE WHEN status = 'fail' THEN 1 ELSE 0 END) as fail
            FROM esm_register_management WHERE userid = ? AND status IN ('pending', 'success', 'fail')`;

        const [[coopangResult], [naverResult], [elevenstoreResult], [esmResult]] = await Promise.all([
            promisePool.execute(coopangStatusQuery, [userid]),
            promisePool.execute(naverStatusQuery, [userid]),
            promisePool.execute(elevenstoreStatusQuery, [userid]),
            promisePool.execute(esmStatusQuery, [userid])
        ]);

        const coopangCounts = coopangResult[0] || { pending: 0, success: 0, fail: 0 };
        const naverCounts = naverResult[0] || { pending: 0, success: 0, fail: 0 };
        const elevenstoreCounts = elevenstoreResult[0] || { pending: 0, success: 0, fail: 0 };
        const esmCounts = esmResult[0] || { pending: 0, success: 0, fail: 0 };
        
        const statusCounts = {
            pending: Number(coopangCounts.pending) + Number(naverCounts.pending) + Number(elevenstoreCounts.pending) + Number(esmCounts.pending),
            success: Number(coopangCounts.success) + Number(naverCounts.success) + Number(elevenstoreCounts.success) + Number(esmCounts.success),
            fail: Number(coopangCounts.fail) + Number(naverCounts.fail) + Number(elevenstoreCounts.fail) + Number(esmCounts.fail)
        };

        // 2. 메인 쿼리 구성 (이미지 제외)
        let mainTable, productNumberField;
        if (platform === 'coopang') {
            mainTable = 'coopang_register_management';
            productNumberField = 'registered_product_number';
        } else if (platform === 'naver') {
            mainTable = 'naver_register_management';
            productNumberField = 'originProductNo';
        } else if (platform === 'elevenstore') {
            mainTable = 'elevenstore_register_management';
            productNumberField = 'originProductNo';
        } else if (platform === 'esm') {
            mainTable = 'esm_register_management';
            productNumberField = 'originProductNo';
        } else {
            return { success: false, error: `지원하지 않는 플랫폼입니다: ${platform}` };
        }

        let baseQuery = `
            SELECT rm.userid, rm.productid, rm.market_number, rm.status,
                   rm.${productNumberField} as product_number, rm.created_at, rm.updated_at,
                   pr.product_group_code,
                   COALESCE(pd.title_optimized, pd.title_translated, pd.title_raw) as product_name
            FROM ${mainTable} rm
            LEFT JOIN pre_register pr ON rm.userid = pr.userid AND rm.productid = pr.productid
            LEFT JOIN products_detail pd ON rm.userid = pd.userid AND rm.productid = pd.productid
            WHERE rm.userid = ? AND rm.status IN ('pending', 'success', 'fail')`;
        
        const queryParams = [userid];
        
        if (groupCode) {
            baseQuery += ` AND pr.product_group_code = ?`;
            queryParams.push(groupCode);
        }
        if (productName) {
            baseQuery += ` AND COALESCE(pd.title_optimized, pd.title_translated, pd.title_raw) LIKE ?`;
            queryParams.push(`%${productName}%`);
        }
        if (marketNumber) {
            baseQuery += ` AND rm.market_number = ?`;
            queryParams.push(marketNumber);
        }

        // 3. 전체 개수 조회
        const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as count_query`;
        const [countRows] = await promisePool.execute(countQuery, [...queryParams]);
        const totalCount = countRows[0].total;

        // 4. 페이징 및 정렬 적용 후 메인 데이터 조회
        baseQuery += ` ORDER BY rm.updated_at ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`;
        
        const safePageSize = parseInt(pageSize, 10);
        const safeOffset = parseInt((page - 1) * pageSize, 10);
        if (isNaN(safePageSize) || isNaN(safeOffset)) {
            throw new Error(`잘못된 페이징 값입니다: page=${page}, pageSize=${pageSize}`);
        }
        baseQuery += ` LIMIT ${safePageSize} OFFSET ${safeOffset}`;
        

        const [rows] = await promisePool.execute(baseQuery, queryParams);
        
        // 5. 이미지 별도 조회 (안정적인 방식)
        let imageMap = {};
        if (rows.length > 0) {
            const productIds = rows.map(row => row.productid);
            const imageQuery = `
                SELECT productid, imageurl FROM private_main_image
                WHERE userid = ? AND productid IN (?) AND imageorder = 0`;
            try {
                const [imageRows] = await promisePool.query(imageQuery, [userid, productIds]);
                imageRows.forEach(row => {
                    imageMap[row.productid] = row.imageurl;
                });
            } catch (e) {
                console.warn("이미지 조회 실패 (무시하고 계속)", e.message);
            }
        }

        // 6. 결과 조합 및 반환
        const products = rows.map(row => ({
            userid: row.userid,
            productid: row.productid,
            productName: row.product_name,
            marketNumber: row.market_number,
            status: row.status,
            productNumber: row.product_number,
            groupCode: row.product_group_code,
            imageUrl: imageMap[row.productid] || null,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
        
        return {
            success: true,
            data: products,
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                totalCount: totalCount,
                totalPages: Math.ceil(totalCount / pageSize)
            },
            statusCounts: statusCounts,
            message: `${platform} 플랫폼 등록 상품 조회 완료`
        };

    } catch (error) {
        console.error('등록된 상품 조회 중 오류 발생:', error);
        return { success: false, error: error.message, message: '등록된 상품 조회 실패', data: [] };
    }
} 