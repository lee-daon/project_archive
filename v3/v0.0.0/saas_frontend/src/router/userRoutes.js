const userRoutes = {
  path: 'user',
  name: 'UserMain',
  component: () => import('../views/user/UserMain.vue'),
  meta: { module: 'user' },
  children: [
    {
      path: 'profile',
      name: 'UserProfile',
      component: () => import('../views/user/UserProfile.vue')
    },
    {
      path: 'payment',
      name: 'UserPayment',
      component: () => import('../views/user/Payment.vue')
    }
  ]
};

export default userRoutes; 