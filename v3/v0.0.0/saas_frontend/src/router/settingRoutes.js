export default {
  path: '/settings',
  meta: { requiresAuth: true, module: 'settings' },
  children: [
    {
      path: '',
      name: 'SettingsHome',
      component: () => import('../views/settings/Settings.vue'),
      meta: { module: 'settings' }
    },
    {
      path: 'market',
      name: 'MarketSettings',
      component: () => import('../views/settings/market.vue'),
      meta: { module: 'settings' }
    },
    {
      path: 'naver-policy',
      name: 'NaverPolicy',
      component: () => import('../views/settings/NaverPolicy.vue'),
      meta: { module: 'settings' }
    },
    {
      path: 'common-policy',
      name: 'CommonPolicy',
      component: () => import('../views/settings/commonPolicy.vue'),
      meta: { module: 'settings' }
    },
    {
      path: 'coupang-policy',
      name: 'CoupangPolicy',
      component: () => import('../views/settings/coopangPolicy.vue'),
      meta: { module: 'settings' }
    },
    {
      path: 'eleven-store-policy',
      name: 'ElevenStorePolicy',
      component: () => import('../views/settings/elevenStorePolicy.vue'),
      meta: { module: 'settings' }
    },
    {
      path: 'esm-policy',
      name: 'EsmPolicy',
      component: () => import('../views/settings/esmPolicy.vue'),
      meta: { module: 'settings' }
    },
    {
      path: 'ban-words',
      name: 'BanWords',
      component: () => import('../views/settings/banWords.vue'),
      meta: { module: 'settings' }
    },
    {
      path: 'detail-page-setting',
      name: 'DetailPageSetting',
      component: () => import('../views/settings/detailPageSetting.vue'),
      meta: { module: 'settings' }
    },
    {
      path: 'process-setting',
      name: 'ProcessSetting',
      component: () => import('../views/settings/processSetting.vue'),
      meta: { module: 'settings' }
    }
  ]
};
