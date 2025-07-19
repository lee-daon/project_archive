import { findProductByIdentifier } from '../../backend/modules/registeredManaging/repository/findProduct.js';

// 단일 조회
const result = await findProductByIdentifier(2, "634000489390;1627207:12374481498:테스트1:테스트2;1627207:14542271387:테스트1:테스트7");

console.log(result);