<template>
  <div class="callback-container">
    <div class="loading-section">
      <el-icon class="loading-icon" size="40">
        <Loading />
      </el-icon>
      <h3>{{ statusMessage }}</h3>
      <p v-if="progress">{{ progress }}</p>
    </div>
    
    <div v-if="error" class="error-section">
      <el-icon class="error-icon" size="40">
        <WarningFilled />
      </el-icon>
      <h3>오류가 발생했습니다</h3>
      <p>{{ error }}</p>
      <el-button @click="goToLogin" type="primary">로그인 페이지로 이동</el-button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Loading, WarningFilled } from '@element-plus/icons-vue';
import { handleNaverCallback } from '../../services/auth';

export default {
  name: 'NaverCallback',
  components: {
    Loading,
    WarningFilled
  },
  setup() {
    const statusMessage = ref('네이버 로그인 처리 중...');
    const progress = ref('');
    const error = ref('');
    const router = useRouter();
    
    const goToLogin = () => {
      router.push('/login');
    };
    
    const handleCallback = async () => {
      try {
        // URL에서 code와 state 파라미터 추출
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const errorParam = urlParams.get('error');
        
        // 네이버 로그인 취소 또는 오류
        if (errorParam) {
          error.value = '네이버 로그인이 취소되었습니다.';
          return;
        }
        
        // 필수 파라미터 확인
        if (!code || !state) {
          error.value = '잘못된 접근입니다. 올바른 네이버 로그인 절차를 거쳐주세요.';
          return;
        }
        
        // 백엔드로 콜백 처리 요청
        progress.value = '서버와 통신 중...';
        const response = await handleNaverCallback(code, state);
        
        if (response.success) {
          // 신규 사용자인 경우 프로필 설정 페이지로, 기존 사용자는 메인 페이지로
          if (response.user && response.user.isNewUser) {
            statusMessage.value = '회원가입 완료!';
            progress.value = '프로필 설정 페이지로 이동 중...';
            setTimeout(() => {
              router.push('/user/profile');
            }, 500);
          } else {
            statusMessage.value = '로그인 성공!';
            progress.value = '메인 페이지로 이동 중...';
            setTimeout(() => {
              router.push('/');
            }, 600);
          }
        } else {
          error.value = response.message || '로그인 처리 중 오류가 발생했습니다.';
        }
      } catch (err) {
        console.error('콜백 처리 오류:', err);
        error.value = err.message || '네트워크 오류가 발생했습니다.';
      }
    };
    
    onMounted(() => {
      handleCallback();
    });
    
    return {
      statusMessage,
      progress,
      error,
      goToLogin
    };
  }
}
</script>

<style scoped>
.callback-container {
  width: 100%;
  text-align: center;
  padding: 40px 0;
}

.loading-section, .error-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loading-icon {
  color: var(--el-color-primary);
  animation: rotate 2s linear infinite;
}

.error-icon {
  color: var(--el-color-danger);
}

h3 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 20px;
  font-weight: var(--el-font-weight-bold);
}

p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.5;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 태블릿 */
@media (max-width: 768px) {
  .callback-container {
    padding: 30px 0;
  }
  
  h3 {
    font-size: 18px;
  }
  
  p {
    font-size: 13px;
  }
}

/* 모바일 */
@media (max-width: 480px) {
  .callback-container {
    padding: 20px 0;
  }
  
  h3 {
    font-size: 16px;
  }
  
  p {
    font-size: 12px;
  }
}
</style> 