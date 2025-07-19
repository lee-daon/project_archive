<template>
  <div class="signup-container">
    
    <!-- 네이버 소셜 로그인으로만 회원가입 -->
    <div class="social-signup-section">
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <!-- 네이버 회원가입 버튼 -->
      <el-button 
        @click="handleNaverSignup"
        :loading="naverLoading"
        class="naver-signup-button"
        size="large"
      >
        {{ naverLoading ? '네이버 회원가입 중...' : '네이버로 회원가입' }}
      </el-button>
    </div>
    
    <!-- 로그인 링크와 툴팁 -->
    <div class="login-section">
      <div class="login-link">
        이미 계정이 있으신가요? <router-link to="/login">로그인</router-link>
      </div>
      
      <el-tooltip 
        content="아이디 비밀번호는 로그인 후 프로필에서 설정할 수 있어요."
        placement="top"
        effect="light"
      >
        <el-icon class="tip-icon" size="20">
          <InfoFilled />
        </el-icon>
      </el-tooltip>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { InfoFilled } from '@element-plus/icons-vue';
import { getNaverLoginUrl } from '../../services/auth';

export default {
  name: 'SignupView',
  components: {
    InfoFilled
  },
  setup() {
    const error = ref('');
    const naverLoading = ref(false);
    
    // 네이버 회원가입 (로그인과 동일한 플로우)
    const handleNaverSignup = async () => {
      try {
        naverLoading.value = true;
        error.value = '';
        
        const response = await getNaverLoginUrl();
        
        if (response.success) {
          // 네이버 로그인 페이지로 리다이렉트 (회원가입도 동일한 플로우)
          window.location.href = response.loginUrl;
        } else {
          error.value = response.message || '네이버 회원가입 URL을 가져올 수 없습니다.';
        }
      } catch (err) {
        error.value = err.message || '네이버 회원가입 중 오류가 발생했습니다.';
      } finally {
        naverLoading.value = false;
      }
    };
    
    return {
      error,
      naverLoading,
      handleNaverSignup
    };
  }
}
</script>

<style scoped>
.signup-container {
  width: 100%;
}

.signup-title {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-extra-large);
  font-weight: var(--el-font-weight-bold);
}

.social-signup-section {
  margin-bottom: var(--spacing-sm);
}

.naver-signup-button {
  width: 100%;
  margin: 0 auto;
  display: block;
  background-color: #03c75a;
  border-color: #03c75a;
  color: white;
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-medium);
  height: 40px;
  transition: all 0.2s ease;
}

.naver-signup-button:hover {
  background-color: #02b151;
  border-color: #02b151;
  transform: translateY(-1px);
  box-shadow: var(--el-box-shadow-base);
}

.login-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.login-link {
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-secondary);
}

.login-link a {
  color: var(--el-color-primary);
  text-decoration: none;
  font-weight: var(--el-font-weight-medium);
  transition: all 0.2s ease;
}

.login-link a:hover {
  color: var(--el-color-primary-light-3);
  text-decoration: underline;
}

.tip-icon {
  color: var(--el-color-primary);
  cursor: help;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.tip-icon:hover {
  color: var(--el-color-primary-light-3);
  transform: scale(1.1);
}

.error-message {
  color: var(--el-color-danger);
  margin-bottom: var(--spacing-md);
  font-size: var(--el-font-size-base);
  text-align: center;
  padding: var(--spacing-md);
  background-color: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
  border-radius: var(--el-border-radius-base);
}

/* 태블릿 */
@media (max-width: 768px) {
  .signup-title {
    font-size: var(--el-font-size-large);
    margin-bottom: var(--spacing-lg);
  }
  
  .naver-signup-button {
    font-size: var(--el-font-size-base);
    height: 44px;
  }
  
  .login-section {
    gap: var(--spacing-sm);
  }
  
  .tip-icon {
    size: 18px;
  }
}

/* 모바일 */
@media (max-width: 480px) {
  .signup-title {
    font-size: var(--el-font-size-medium);
    margin-bottom: var(--spacing-md);
  }
  
  .naver-signup-button {
    font-size: var(--el-font-size-small);
    height: 42px;
    max-width: 100%;
  }
  
  .login-section {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .tip-icon {
    size: 16px;
  }
  
  .login-link {
    font-size: var(--el-font-size-small);
  }
  
  .error-message {
    font-size: var(--el-font-size-small);
  }
}
</style>
