import { createRouter, createWebHistory } from 'vue-router';
import { isAuthenticated } from '../services/auth';
import { isAdmin } from '../services/admin';

// 레이아웃 컴포넌트
import DefaultLayout from '../layouts/DefaultLayout.vue';
import ProductsLayout from '../layouts/ProductsLayout.vue';
import SettingLayout from '../layouts/SettingLayout.vue';
import ManagerLayout from '../layouts/managerLayout.vue';
import AdminLayout from '../layouts/adminLayout.vue';

// 모듈화된 라우트 가져오기
import productRoutes from './productRoutes';
import userRoutes from './userRoutes';
import authRoutes from './authRoutes';
import settingRoutes from './settingRoutes';
import managerRoutes from './managerRoutes';
import adminRoutes from './admin';

const routes = [
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/main/Home.vue'),
        meta: { module: 'home' }
      },
      // 사용자 관련 라우트
      userRoutes
    ]
  },
  // 상품 관련 라우트
  {
    path: '/product',
    component: ProductsLayout,
    meta: { requiresAuth: true, module: 'product' },
    children: [
      {
        path: '',
        name: 'ProductMain',
        component: () => import('../views/main/ProductMain.vue')
      },
      ...productRoutes.children
    ]
  },
  // 관리자 관련 라우트
  {
    path: '/manager',
    component: ManagerLayout,
    meta: { requiresAuth: true, module: 'manager' },
    children: [
      {
        path: '',
        name: 'ManagerMain',
        component: () => import('../views/manager/manager.vue')
      },
      ...managerRoutes.children
    ]
  },
  // 설정 관련 라우트
  {
    path: '/settings',
    component: SettingLayout,
    meta: { requiresAuth: true, module: 'settings' },
    children: settingRoutes.children
  },
  // 관리자 관련 라우트
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true, module: 'admin' },
    children: [
      {
        path: '',
        name: 'AdminMain',
        component: () => import('../views/admin/main.vue')
      },
      ...adminRoutes.children
    ]
  },
  // 인증 관련 라우트
  authRoutes,
  // 존재하지 않는 모든 경로를 처리하는 catch-all 라우트
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: () => {
      // 이 부분은 navigation guard에서 처리할 것이므로 임시 리다이렉트
      return { path: '/' };
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 네비게이션 가드 설정
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
  const isUserAuthenticated = isAuthenticated();
  const isUserAdmin = isAdmin();
  
  // NotFound 라우트 처리
  if (to.name === 'NotFound') {
    if (isUserAuthenticated) {
      return next('/'); // 로그인된 경우 메인 페이지로
    } else {
      return next('/login'); // 로그인되지 않은 경우 로그인 페이지로
    }
  }

  // 인증이 필요한 페이지
  if (requiresAuth && !isUserAuthenticated) {
    next('/login');
    return;
  }

  // 관리자 권한이 필요한 페이지
  if (requiresAdmin && !isUserAdmin) {
    // 로그인은 되어있지만 관리자가 아닌 경우
    if (isUserAuthenticated) {
      next('/'); // 메인 페이지로 리다이렉트
    } else {
      next('/login'); // 로그인 페이지로 리다이렉트
    }
    return;
  }

  next();
});

export default router; 