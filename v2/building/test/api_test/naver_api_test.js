import { getCategoryInfo } from '../../src/services/connect_naver/api_assist/category_search.js';
import { getRecommendTags } from '../../src/services/connect_naver/api_assist/recommend_tag.js';
import { getRestrictedTags } from '../../src/services/connect_naver/api_assist/restricted_tag.js';
import { getProductsForProvidedNotice } from '../../src/services/connect_naver/api_assist/products-for-provided-notice.js';
import checkMainCategory from '../../src/services/connect_naver/checkMainCategory.js';

let result = await getCategoryInfo('50000821');
console.log(result);

// 추천 태그 조회
let result2 = await getRecommendTags('여성 의류');
console.log(result2);

// 태그들을 배열로 묶어서 제한여부 조회
let result3 = await getRestrictedTags(['가방', '지갑', '명품']);
console.log(result3);

// 상품 정보 제공 고시 조회
let result4 = await getProductsForProvidedNotice(checkMainCategory('50000814'));
console.log(result4);
