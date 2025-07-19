import AuthLayout from '../layouts/AuthLayout.vue';

const authRoutes = {
  path: '/',
  component: AuthLayout,
  children: [
    {
      path: 'login',
      name: 'Login',
      component: () => import('../views/auth/login.vue')
    },
    {
      path: 'signup',
      name: 'Signup',
      component: () => import('../views/auth/signup.vue')
    },
    {
      path: 'naver-callback',
      name: 'NaverCallback',
      component: () => import('../views/auth/NaverCallback.vue')
    }
  ]
};

export default authRoutes; 