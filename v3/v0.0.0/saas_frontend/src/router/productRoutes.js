// 상품수집 페이지
import UrlCollection from '../views/main/product/sourcing/UrlCollection.vue';
import CategoryCollection from '../views/main/product/sourcing/CategoryCollection.vue';
import ShopCollection from '../views/main/product/sourcing/ShopCollection.vue';
import ProductListCheck from '../views/main/product/sourcing/ProductListCheck.vue';


// 수집결과확인 페이지
import ResultsCheck from '../views/main/product/ResultsCheck.vue';

// 상품가공 페이지
import ProcessingSettings from '../views/main/product/processing/ProcessingSettings.vue';
import ForbiddenBrand from '../views/main/product/processing/ForbiddenBrand.vue';
import CategoryMapping from '../views/main/product/processing/CategoryMapping.vue';
import ProgressCheck from '../views/main/product/processing/ProgressCheck.vue';

// 상품검수 페이지
import Inspection from '../views/main/product/Inspection.vue';

// 상품등록 페이지
import ProductRegistration from '../views/main/product/registration/ProductRegistration.vue';
import CoopangMapping from '../views/main/product/registration/coopangMapping.vue';



const productRoutes = {
  children: [
    // 상품수집
    {
      path: 'sourcing/url',
      name: 'UrlCollection',
      component: UrlCollection
    },
    {
      path: 'sourcing/category',
      name: 'CategoryCollection',
      component: CategoryCollection
    },
    {
      path: 'sourcing/shop',
      name: 'ShopCollection',
      component: ShopCollection
    },
    {
      path: 'sourcing/list',
      name: 'ProductListCheck',
      component: ProductListCheck
    },
    
    // 수집결과확인
    {
      path: 'results',
      name: 'ResultsCheck',
      component: ResultsCheck
    },
    
    // 상품가공
    {
      path: 'processing/settings',
      name: 'ProcessingSettings',
      component: ProcessingSettings
    },
    {
      path: 'processing/brand',
      name: 'ForbiddenBrand',
      component: ForbiddenBrand
    },
    {
      path: 'processing/category-mapping',
      name: 'CategoryMapping',
      component: CategoryMapping
    },
    {
      path: 'processing/progress',
      name: 'ProgressCheck',
      component: ProgressCheck
    },
    
    // 상품검수
    {
      path: 'inspection',
      name: 'Inspection',
      component: Inspection
    },
    
    // 상품등록
    {
      path: 'registration',
      name: 'ProductRegistration',
      component: ProductRegistration
    },
    {
      path: 'registration/coopang-mapping',
      name: 'CoopangMapping',
      component: CoopangMapping
    }
  ]
};

export default productRoutes; 