import { 
    getProductById, 
    getProductImage, 
    searchProductsByName, 
    getProductImages 
} from '../repository/findProduct.js';

/**
 * 문자열이 Product ID 형식(숫자)인지 확인하는 함수
 * @param {string} str - 확인할 문자열
 * @returns {boolean} Product ID 형식이면 true
 */
function isProductId(str) {
    return /^[0-9]+$/.test(str);
}

/**
 * Product ID로 상품 정보를 조회하는 서비스
 * @param {number} userid - 사용자 ID
 * @param {string} productId - 상품 ID
 * @returns {Promise<object>} 상품 정보 결과
 */
async function findProductByProductId(userid, productId) {
    try {
        console.log(`상품 조회 시작 - userid: ${userid}, productId: ${productId}`);
        
        // 입력값 검증
        if (!userid || !productId) {
            throw new Error('userid와 productId가 모두 필요합니다.');
        }

        // 1. 기본 상품 정보 조회
        const productInfo = await getProductById(userid, productId);
        if (!productInfo) {
            return {
                success: false,
                error: '상품을 찾을 수 없습니다.',
                data: null
            };
        }

        console.log(`기본 상품 정보 조회 완료 - ${productInfo.title_raw}`);

        // 2. 상품 이미지 조회
        const image = await getProductImage(productId);
        console.log(`이미지 조회 완료 - ${image ? '1개' : '없음'}`);
        
        // 3. 최종 결과 구성
        const result = {
            success: true,
            data: {
                userid: productInfo.userid,
                productId: productInfo.productid,
                titleRaw: productInfo.title_raw,
                detailUrl: productInfo.detail_url,
                image: image,
                hasOptions: false,
                options: []
            }
        };

        console.log(`상품 조회 완료 - productId: ${productId}`);
        return result;

    } catch (error) {
        console.error('상품 조회 중 오류 발생:', error.message);
        return {
            success: false,
            error: error.message,
            data: null
        };
    }
}

/**
 * 상품명으로 상품을 검색하는 서비스
 * @param {number} userid - 사용자 ID
 * @param {string} productName - 상품명
 * @returns {Promise<object>} 상품 정보 결과
 */
async function findProductByName(userid, productName) {
    try {
        console.log(`상품명 검색 시작 - userid: ${userid}, productName: ${productName}`);

        // 상품 검색
        const productRows = await searchProductsByName(userid, productName);
        
        if (productRows.length === 0) {
            return {
                success: false,
                error: '해당 상품명으로 상품을 찾을 수 없습니다.',
                data: null
            };
        }

        console.log(`상품명 검색 결과 - ${productRows.length}개 상품 발견`);

        // 모든 상품의 이미지를 한 번에 조회
        const productIds = productRows.map(product => product.productid);
        const imageMap = await getProductImages(productIds);

        // 첫 번째 결과만 반환
        const firstProduct = productRows[0];
        const result = {
            userid: firstProduct.userid,
            productId: firstProduct.productid,
            titleRaw: firstProduct.title_raw,
            productTitle: firstProduct.product_title,
            detailUrl: firstProduct.detail_url,
            image: imageMap[firstProduct.productid] || null,
            hasOptions: false, // 상품명 검색에서는 옵션 정보 제공하지 않음
            options: []
        };

        return {
            success: true,
            data: result
        };

    } catch (error) {
        console.error('상품명 검색 중 오류 발생:', error.message);
        return {
            success: false,
            error: error.message,
            data: null
        };
    }
}

/**
 * 통합 상품 검색 서비스
 * @param {number} userid - 사용자 ID
 * @param {string} searchTerm - 검색어 (상품 ID 또는 상품명)
 * @returns {Promise<object>} 검색 결과
 */
export async function searchProduct(userid, searchTerm) {
    try {
        console.log(`상품 검색 요청 - userid: ${userid}, searchTerm: ${searchTerm}`);

        // 입력값 검증
        if (!userid || !searchTerm) {
            throw new Error('userid와 검색어가 모두 필요합니다.');
        }

        // 검색어가 상품 ID 형식이면 ID로 처리
        if (isProductId(searchTerm)) {
            console.log('상품 ID로 인식하여 검색');
            const result = await findProductByProductId(userid, searchTerm);
            
            if (result.success) {
                return {
                    ...result,
                    searchType: 'productId'
                };
            }
            return result;
        } else {
            console.log('상품명으로 인식하여 검색');
            const result = await findProductByName(userid, searchTerm);
            
            if (result.success) {
                return {
                    ...result,
                    searchType: 'productName'
                };
            }
            return result;
        }

    } catch (error) {
        console.error('상품 검색 서비스 오류:', error.message);
        return {
            success: false,
            error: error.message,
            data: null
        };
    }
}


