// 관리자 페이지
import Analytics from '../views/manager/analystic.vue';
import ProductSearch from '../views/manager/productSearch.vue';
import RegisterCheck from '../views/manager/registerCheck.vue';

const managerRoutes = {
  children: [
    // 애널리틱스
    {
      path: 'analytics',
      name: 'Analytics',
      component: Analytics
    },
    
    // 등록현황
    {
      path: 'register-check',
      name: 'RegisterCheck',
      component: RegisterCheck
    },
    
    // 상품검색
    {
      path: 'product-search',
      name: 'ProductSearch',
      component: ProductSearch
    }
  ]
};

export default managerRoutes;
