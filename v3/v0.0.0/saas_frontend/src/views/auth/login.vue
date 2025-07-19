<template>
  <div class="login-container">
    <h2 class="login-title">로그인</h2>
    <el-form 
      @submit.prevent="handleLogin" 
      class="login-form" 
      :model="loginForm" 
      ref="loginFormRef"
      label-position="left"
      :label-width="labelWidth"
    >
      <el-form-item label="아이디" prop="id" class="form-group">
        <el-input 
          ref="idInputRef"
          v-model="loginForm.id" 
          placeholder="아이디를 입력하세요" 
          size="large"
          clearable
          @keyup.enter="focusPassword"
        />
      </el-form-item>
      
      <el-form-item label="비밀번호" prop="password" class="form-group">
        <el-input 
          ref="passwordInputRef"
          type="password" 
          v-model="loginForm.password" 
          placeholder="비밀번호를 입력하세요" 
          size="large"
          show-password
          clearable
          @keyup.enter="handleLogin"
        />
      </el-form-item>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <el-button 
        ref="loginButtonRef"
        type="primary" 
        size="large" 
        :loading="loading"
        @click="handleLogin"
        class="login-button"
      >
        {{ loading ? '로그인 중...' : '로그인' }}
      </el-button>
    </el-form>
    
    <!-- 소셜 로그인 구분선 -->
    <div class="divider">
      <span>또는</span>
    </div>
    
    <!-- 네이버 소셜 로그인 버튼 -->
    <el-button 
      @click="handleNaverLogin"
      :loading="naverLoading"
      class="naver-login-button"
      size="large"
    >
      {{ naverLoading ? '네이버 로그인 중...' : '네이버로 로그인' }}
    </el-button>
    
    <div class="signup-link">
      계정이 없으신가요? <router-link to="/signup">회원가입</router-link>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { login, getNaverLoginUrl } from '../../services/auth';

export default {
  name: 'LoginView',
  setup() {
    const loginForm = reactive({
      id: '',
      password: ''
    });
    const error = ref('');
    const loading = ref(false);
    const naverLoading = ref(false);
    const router = useRouter();
    const loginFormRef = ref(null);
    const idInputRef = ref(null);
    const passwordInputRef = ref(null);
    const loginButtonRef = ref(null);
    
    const focusPassword = () => {
      passwordInputRef.value.focus();
    };
    
    const handleLogin = async () => {
      try {
        loading.value = true;
        error.value = '';
        
        const response = await login(loginForm.id, loginForm.password);
        
        if (response.success) {
          router.push('/');
        } else {
          error.value = response.message || '로그인에 실패했습니다.';
        }
      } catch (err) {
        error.value = err.message || '로그인 중 오류가 발생했습니다.';
      } finally {
        loading.value = false;
      }
    };
    
    const handleNaverLogin = async () => {
      try {
        naverLoading.value = true;
        error.value = '';
        
        const response = await getNaverLoginUrl();
        
        if (response.success) {
          window.location.href = response.loginUrl;
        } else {
          error.value = response.message || '네이버 로그인 URL을 가져올 수 없습니다.';
        }
      } catch (err) {
        error.value = err.message || '네이버 로그인 중 오류가 발생했습니다.';
      } finally {
        naverLoading.value = false;
      }
    };
    
    // 반응형 label-width 계산
    const labelWidth = computed(() => {
      if (window.innerWidth <= 480) return '60px';
      if (window.innerWidth <= 768) return '70px';
      return '80px';
    });
    
    // 페이지 로드 시 아이디 입력란에 포커스
    onMounted(() => {
      idInputRef.value.focus();
    });
    
    return {
      labelWidth,
      loginForm,
      error,
      loading,
      naverLoading,
      loginFormRef,
      idInputRef,
      passwordInputRef,
      loginButtonRef,
      focusPassword,
      handleLogin,
      handleNaverLogin
    };
  }
}
</script>

<style scoped>
.login-container {
  width: 100%;
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: var(--el-text-color-primary);
  font-size: 24px;
  font-weight: var(--el-font-weight-bold);
}

.login-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.login-form :deep(.el-form-item__label) {
  color: var(--el-text-color-primary);
  font-weight: var(--el-font-weight-medium);
  width: 80px;
  text-align: left !important;
  justify-content: flex-start !important;
  margin-right: 12px;
}

.login-button {
  width: 100%;
  margin-top: 15px;
  font-size: 16px;
  font-weight: var(--el-font-weight-medium);
}

.divider {
  text-align: center;
  margin: 25px 0;
  position: relative;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: var(--el-border-color);
}

.divider span {
  background-color: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  padding: 0 15px;
  font-size: 14px;
}

.naver-login-button {
  width: 100%;
  background-color: #03c75a;
  border-color: #03c75a;
  color: white;
  font-size: 16px;
  font-weight: var(--el-font-weight-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.naver-login-button:hover {
  background-color: #02b151;
  border-color: #02b151;
}

.error-message {
  color: var(--el-color-danger);
  margin-bottom: 15px;
  font-size: 14px;
  text-align: center;
  padding: 10px;
  background-color: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
  border-radius: var(--el-border-radius-base);
}

.signup-link {
  text-align: center;
  font-size: 14px;
  margin-top: 20px;
  color: var(--el-text-color-secondary);
}

.signup-link a {
  color: var(--el-color-primary);
  text-decoration: none;
  font-weight: var(--el-font-weight-medium);
}

.signup-link a:hover {
  color: var(--el-color-primary-light-3);
  text-decoration: underline;
}

/* 태블릿 */
@media (max-width: 768px) {
  .login-title {
    font-size: 20px;
    margin-bottom: 25px;
  }
  
  .form-group {
    margin-bottom: 18px;
  }
  
  .login-form :deep(.el-form-item__label) {
    width: 70px;
    font-size: 14px;
  }
  
  .login-button, .naver-login-button {
    font-size: 15px;
  }
}

/* 모바일 */
@media (max-width: 480px) {
  .login-title {
    font-size: 18px;
    margin-bottom: 20px;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  .login-form :deep(.el-form-item__label) {
    width: 60px;
    font-size: 13px;
  }
  
  .login-button, .naver-login-button {
    font-size: 14px;
  }
  
  .error-message {
    font-size: 12px;
    padding: 8px;
  }
  
  .signup-link {
    font-size: 13px;
    margin-top: 15px;
  }
  
  .divider {
    margin: 20px 0;
  }
  
  .divider span {
    font-size: 13px;
  }
}
</style>
