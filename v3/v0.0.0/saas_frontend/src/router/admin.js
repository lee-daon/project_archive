export default {
  path: '/admin',
  children: [
    {
      path: 'health',
      name: 'AdminHealth',
      component: () => import('../views/admin/checkHealth.vue'),
      meta: { 
        requiresAuth: true, 
        requiresAdmin: true,
        title: '시스템 상태 확인'
      }
    },
    {
      path: 'controller', 
      name: 'AdminController',
      component: () => import('../views/admin/controller.vue'),
      meta: { 
        requiresAuth: true, 
        requiresAdmin: true,
        title: '시스템 제어'
      }
    },
    {
      path: 'logs', 
      name: 'AdminLogs',
      component: () => import('../views/admin/logManagement.vue'),
      meta: { 
        requiresAuth: true, 
        requiresAdmin: true,
        title: '로그 관리'
      }
    },
    {
      path: 'users', 
      name: 'AdminUsers',
      component: () => import('../views/admin/userManagement.vue'),
      meta: { 
        requiresAuth: true, 
        requiresAdmin: true,
        title: '사용자 관리'
      }
    },
    {
      path: 'notices', 
      name: 'AdminNotices',
      component: () => import('../views/admin/noticeManagement.vue'),
      meta: { 
        requiresAuth: true, 
        requiresAdmin: true,
        title: '공지사항 관리'
      }
    }
  ]
};
