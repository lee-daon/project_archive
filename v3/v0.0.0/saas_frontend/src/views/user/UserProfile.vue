<template>
  <div class="user-profile">
    <h2>사용자 프로필</h2>
    
    <!-- 상단 2열 레이아웃 -->
    <div class="profile-top-section">
      <!-- 왼쪽 컬럼 -->
      <div class="profile-left-column">
        <!-- 사용자 정보 섹션 -->
        <div class="profile-card">
          <h3>기본 정보</h3>
          <div v-if="loading" class="loading-section">
            <el-icon class="loading-icon" size="30">
              <Loading />
            </el-icon>
            <p>사용자 정보를 불러오는 중...</p>
          </div>
          <div v-else class="profile-info">
            <div class="info-item">
              <label>이름</label>
              <p>{{ user.name }}</p>
            </div>
            <div class="info-item">
              <label>아이디</label>
              <p>{{ user.id || '미설정' }}</p>
            </div>
            <div class="info-item">
              <label>이메일</label>
              <p>{{ user.email }}</p>
            </div>
            <div class="info-item">
              <label>플랜</label>
              <p>{{ user.plan }}</p>
            </div>
            <div class="info-item" v-if="user.naver_id">
              <label>네이버 연동</label>
              <p class="naver-connected">
                <el-icon><Check /></el-icon> 네이버 계정 연동됨
              </p>
            </div>
          </div>
        </div>
        
        <!-- 아이디&비번으로 로그인 설정 섹션 -->
        <div class="credentials-card">
          <h3>아이디&비번으로 로그인 설정</h3>
          <div class="credentials-description">
            <p v-if="user.naver_id && user.id">네이버 로그인과 아이디&비번 로그인 모두 사용할 수 있습니다.</p>
            <p v-else-if="user.naver_id && !user.id">네이버 로그인 외에도 아이디&비번으로 로그인할 수 있습니다.</p>
            <p v-else>로그인에 사용할 아이디와 비밀번호를 설정하세요.</p>
          </div>
          
          <el-form 
            @submit.prevent="handleSetCredentials" 
            class="credentials-form" 
            :model="formData" 
            ref="formRef"
            label-position="left"
            :label-width="labelWidth"
          >
            <el-form-item label="아이디" prop="id" class="form-group">
              <el-input 
                v-model="formData.id" 
                :placeholder="user.id ? '새로운 아이디를 입력하세요 (4~20자)' : '사용할 아이디를 입력하세요 (4~20자)'" 
                size="large"
                clearable
              />
              <div v-if="errors.id" class="field-error">{{ errors.id }}</div>
            </el-form-item>
            
            <el-form-item label="비밀번호" prop="password" class="form-group">
              <el-input 
                type="password" 
                v-model="formData.password" 
                :placeholder="user.id ? '새로운 비밀번호를 입력하세요 (최소 8자)' : '비밀번호를 입력하세요 (최소 8자)'" 
                size="large"
                show-password
                clearable
              />
              <div v-if="errors.password" class="field-error">{{ errors.password }}</div>
            </el-form-item>
            
            <el-form-item label="비밀번호 확인" prop="confirmPassword" class="form-group">
              <el-input 
                type="password" 
                v-model="confirmPassword" 
                placeholder="비밀번호를 다시 입력하세요" 
                size="large"
                show-password
                clearable
              />
              <div v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</div>
            </el-form-item>
            
            <div v-if="submitError" class="error-message">
              {{ submitError }}
            </div>
            
            <div v-if="successMessage" class="success-message">
              {{ successMessage }}
            </div>
            
            <el-button 
              type="primary" 
              size="large" 
              :loading="credentialLoading"
              @click="handleSetCredentials"
              class="submit-button"
            >
              {{ credentialLoading ? (user.id ? '수정 중...' : '설정 중...') : (user.id ? '아이디&비번 수정' : '아이디&비번 설정') }}
            </el-button>
          </el-form>
        </div>
      </div>
      
      <!-- API 키 발급 섹션 -->
      <div class="api-key-card">
        <h3>API 키 관리</h3>
        <div class="api-key-description">
          <p>API를 통해 서비스에 접근할 수 있는 키를 관리합니다.</p>
          
          <!-- Enterprise 플랜 안내 -->
          <div v-if="user.plan !== 'enterprise'" class="plan-upgrade-notice">
            <p><strong><el-icon><Star /></el-icon> Enterprise 플랜 전용 기능</strong></p>
            <p>API 키 발급 기능은 Enterprise 플랜에서만 이용할 수 있습니다.</p>
          </div>
          
          <div class="api-key-info">
            <p><strong>제한사항:</strong></p>
            <ul>
              <li>24시간에 1회만 발급 가능</li>
              <li>발급 시에만 키 확인 가능</li>
              <li>Enterprise 플랜 전용 기능</li>
              <li>최근 키 1개만 사용 가능</li>
            </ul>
          </div>
        </div>
        
        <div v-if="user.plan === 'enterprise'" class="api-key-status">
          <div class="status-item">
            <label>현재 상태</label>
            <p :class="apiKeyStatus.hasApiKey ? 'status-active' : 'status-inactive'">
              <el-icon><Check v-if="apiKeyStatus.hasApiKey" /><Close v-else /></el-icon>
              {{ apiKeyStatus.hasApiKey ? 'API 키 발급됨' : 'API 키 없음' }}
            </p>
          </div>
          <div class="status-item" v-if="apiKeyStatus.hasApiKey">
            <label>새 키 발급 가능</label>
            <p :class="apiKeyStatus.canIssueNew ? 'status-active' : 'status-inactive'">
              <el-icon><Check v-if="apiKeyStatus.canIssueNew" /><Clock v-else /></el-icon>
              {{ apiKeyStatus.canIssueNew ? '발급 가능' : '24시간 후 가능' }}
            </p>
          </div>
        </div>
        
        <!-- 발급된 API 키 표시 -->
        <div v-if="generatedApiKey" class="api-key-result">
          <label>발급된 API 키</label>
          <div class="api-key-display">
            <code class="api-key-code">{{ generatedApiKey }}</code>
            <el-button 
              type="info" 
              size="small" 
              @click="copyToClipboard(generatedApiKey)"
              class="copy-button"
            >
              복사
            </el-button>
          </div>
          <p class="warning-text">
            <el-icon><Warning /></el-icon> 이 키는 다시 확인할 수 없으니 안전한 곳에 보관하세요!
          </p>
        </div>
        
        <!-- 에러/성공 메시지 -->
        <div v-if="apiKeyError" class="error-message">
          {{ apiKeyError }}
        </div>
        
        <div v-if="apiKeySuccess" class="success-message">
          {{ apiKeySuccess }}
        </div>
        
        <!-- 발급 버튼 -->
        <el-button 
          type="primary" 
          size="large" 
          :loading="apiKeyLoading"
          :disabled="user.plan !== 'enterprise' || !apiKeyStatus.canIssueNew"
          @click="handleGenerateApiKey"
          class="api-key-button"
        >
          {{ 
            apiKeyLoading ? 'API 키 발급 중...' : 
            user.plan !== 'enterprise' ? 'Enterprise 플랜 전용' : 
            'API 키 발급' 
          }}
        </el-button>
      </div>
    </div>

  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import { Loading, Check, Close, Clock, Star, Warning } from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { getCurrentUser, setLocalCredentials, getUser, generateApiKey, getApiKeyStatus } from '../../services/auth';

export default {
  name: 'UserProfile',
  components: {
    Loading,
    Check, 
    Close,
    Clock,
    Star, 
    Warning
  },
  setup() {
    const user = ref({ name: '사용자', id: '', email: 'user@example.com', plan: 'basic' });
    const loading = ref(true);
    const credentialLoading = ref(false);
    
    const formData = reactive({
      id: '',
      password: ''
    });
    
    const confirmPassword = ref('');
    const errors = reactive({
      id: '',
      password: '',
      confirmPassword: ''
    });
    
    const submitError = ref('');
    const successMessage = ref('');
    const formRef = ref(null);
    
    // API 키 관련 상태
    const apiKeyStatus = ref({ hasApiKey: false, canIssueNew: true });
    const apiKeyLoading = ref(false);
    const generatedApiKey = ref('');
    const apiKeyError = ref('');
    const apiKeySuccess = ref('');
    
    const loadUserProfile = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          user.value = currentUser;
          // 기존 아이디가 있으면 폼에 기본값으로 설정
          if (currentUser.id) {
            formData.id = currentUser.id;
          }
          // Enterprise 플랜인 경우 API 키 상태 로드
          if (currentUser.plan === 'enterprise') {
            loadApiKeyStatus();
          }
        }
      } catch (error) {
        console.error('사용자 정보 로딩 실패:', error);
      } finally {
        loading.value = false;
      }
    };

    const fastLoadUserProfile = () => {
      const userData = getUser();
      if (userData) {
        user.value = userData;
        // 기존 아이디가 있으면 폼에 기본값으로 설정
        if (userData.id) {
          formData.id = userData.id;
        }
        // Enterprise 플랜인 경우 API 키 상태 로드
        if (userData.plan === 'enterprise') {
          loadApiKeyStatus();
        }
      } else {
        console.log('sessionStorage에 사용자 정보가 없습니다.');
      }
      loading.value = false;
    }
    
    const validateForm = () => {
      let isValid = true;
      
      // 모든 에러 초기화
      Object.keys(errors).forEach(key => {
        errors[key] = '';
      });
      
      // 아이디 검증
      if (!/^[a-zA-Z0-9]{4,20}$/.test(formData.id)) {
        errors.id = '아이디는 4~20자의 영문자와 숫자 조합이어야 합니다.';
        isValid = false;
      }
      
      // 비밀번호 검증
      if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(formData.password)) {
        errors.password = '비밀번호는 최소 8자 이상, 영문자, 숫자, 특수문자의 조합이어야 합니다.';
        isValid = false;
      }
      
      // 비밀번호 확인 검증
      if (formData.password !== confirmPassword.value) {
        errors.confirmPassword = '비밀번호가 일치하지 않습니다.';
        isValid = false;
      }
      
      return isValid;
    };
    
    const handleSetCredentials = async () => {
      if (!validateForm()) {
        return;
      }
      
      try {
        credentialLoading.value = true;
        submitError.value = '';
        successMessage.value = '';
        
        const response = await setLocalCredentials(formData.id, formData.password);
        
        if (response.success) {
          const wasUpdate = user.value.id !== null;
          successMessage.value = wasUpdate ? 
            '아이디&비번 로그인 정보가 성공적으로 수정되었습니다!' : 
            '아이디&비번 로그인 정보가 성공적으로 설정되었습니다!';
          
          // 사용자 정보 새로고침
          await loadUserProfile();
          // 비밀번호만 초기화 (아이디는 새로 로드된 값 유지)
          formData.password = '';
          confirmPassword.value = '';
        } else {
          submitError.value = response.message || '아이디&비번 설정에 실패했습니다.';
        }
      } catch (err) {
        submitError.value = err.response?.data?.message || '설정 중 오류가 발생했습니다.';
      } finally {
        credentialLoading.value = false;
      }
    };
    
    // API 키 상태 확인
    const loadApiKeyStatus = async () => {
      try {
        const response = await getApiKeyStatus();
        if (response.success) {
          apiKeyStatus.value = response;
        }
      } catch (error) {
        console.error('API 키 상태 확인 실패:', error);
      }
    };
    
    // API 키 발급
    const handleGenerateApiKey = async () => {
      // Enterprise 플랜 확인
      if (user.value.plan !== 'enterprise') {
        apiKeyError.value = 'API 키는 Enterprise 플랜에서만 사용할 수 있습니다.';
        return;
      }
      
      // 경고 확인
      const confirmed = await ElMessageBox.confirm(
        'API 키는 24시간에 1회만 발급 가능하며, 발급 시에만 확인할 수 있습니다.\n\n발급된 키는 반드시 안전한 곳에 보관해 주세요.\n\n계속 진행하시겠습니까?',
        'API 키 발급 확인',
        {
          confirmButtonText: '발급하기',
          cancelButtonText: '취소',
          type: 'warning'
        }
      ).catch(() => false);
      
      if (!confirmed) return;
      
      try {
        apiKeyLoading.value = true;
        apiKeyError.value = '';
        apiKeySuccess.value = '';
        generatedApiKey.value = '';
        
        const response = await generateApiKey();
        
        if (response.success) {
          generatedApiKey.value = response.apiKey;
          apiKeySuccess.value = 'API 키가 성공적으로 발급되었습니다! 키를 안전한 곳에 보관해 주세요.';
          // API 키 상태 새로고침
          await loadApiKeyStatus();
        } else {
          apiKeyError.value = response.message || 'API 키 발급에 실패했습니다.';
        }
      } catch (err) {
        apiKeyError.value = err.response?.data?.message || 'API 키 발급 중 오류가 발생했습니다.';
      } finally {
        apiKeyLoading.value = false;
      }
    };
    
    // 클립보드 복사
    const copyToClipboard = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        ElMessage.success('클립보드에 복사되었습니다!');
      } catch (err) {
        ElMessage.error('복사에 실패했습니다.');
      }
    };
    
    // 반응형 label-width 계산
    const labelWidth = computed(() => {
      if (window.innerWidth <= 480) return '100px';
      if (window.innerWidth <= 768) return '110px';
      return '120px';
    });
    
    onMounted(() => {
      fastLoadUserProfile();
    });
    
    return {
      labelWidth,
      user,
      loading,
      credentialLoading,
      formData,
      confirmPassword,
      errors,
      submitError,
      successMessage,
      formRef,
      handleSetCredentials,
      // API 키 관련
      apiKeyStatus,
      apiKeyLoading,
      generatedApiKey,
      apiKeyError,
      apiKeySuccess,
      handleGenerateApiKey,
      copyToClipboard
    };
  }
}
</script>

<style scoped>
.user-profile {
  padding: var(--spacing-md);
  max-width: 1200px;
  margin: 0 auto;
}

.profile-top-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.profile-left-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

h2 {
  margin-bottom: var(--spacing-lg);
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-extra-large);
  font-weight: var(--el-font-weight-bold);
}

h3 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
}

.profile-card, .credentials-card, .api-key-card {
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-lg);
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-lighter);
}

.credentials-card {
  margin-bottom: var(--spacing-lg);
}

.profile-top-section .profile-card,
.profile-top-section .api-key-card {
  margin-bottom: 0;
}

.profile-info {
  display: grid;
  gap: var(--spacing-md);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.info-item label {
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
}

.info-item p {
  font-size: var(--el-font-size-medium);
  color: var(--el-text-color-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.naver-connected {
  color: var(--el-color-success) !important;
  font-weight: var(--el-font-weight-medium);
}

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl) 0;
  gap: var(--spacing-md);
}

.loading-icon {
  color: var(--el-color-primary);
  animation: rotate 2s linear infinite;
}

.loading-section p {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
  margin: 0;
}

.credentials-description {
  margin-bottom: var(--spacing-lg);
  text-align: center;
}

.credentials-description p {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-base);
  margin: 0;
  line-height: 1.5;
}

.credentials-form {
  max-width: 400px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.credentials-form :deep(.el-form-item__label) {
  color: var(--el-text-color-primary);
  font-weight: var(--el-font-weight-medium);
  width: 120px;
  text-align: left !important;
  justify-content: flex-start !important;
  margin-right: var(--spacing-sm);
}

.field-error {
  color: var(--el-color-danger);
  font-size: var(--el-font-size-extra-small);
  margin-top: var(--spacing-xs);
}

.submit-button {
  width: 100%;
  margin-top: var(--spacing-sm);
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-medium);
}

.error-message {
  color: var(--el-color-danger);
  margin-bottom: var(--spacing-md);
  font-size: var(--el-font-size-small);
  text-align: center;
  padding: var(--spacing-sm);
  background-color: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
  border-radius: var(--el-border-radius-base);
}

.success-message {
  color: var(--el-color-success);
  margin-bottom: var(--spacing-md);
  font-size: var(--el-font-size-small);
  text-align: center;
  padding: var(--spacing-sm);
  background-color: var(--el-color-success-light-9);
  border: 1px solid var(--el-color-success-light-7);
  border-radius: var(--el-border-radius-base);
}

.credentials-status {
  text-align: center;
  padding: 20px 0;
}

.status-message {
  color: var(--el-color-success);
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 15px;
}

.info-text {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin: 8px 0;
  line-height: 1.5;
}

/* API 키 관련 스타일 */
.api-key-description {
  margin-bottom: var(--spacing-lg);
  text-align: center;
}

.plan-upgrade-notice {
  margin: var(--spacing-md) 0;
  padding: var(--spacing-md);
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-7) 100%);
  border: 1px solid var(--el-color-primary-light-5);
  border-radius: var(--el-border-radius-base);
  text-align: center;
}

.plan-upgrade-notice p {
  margin: 0;
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
}

.plan-upgrade-notice p:first-child {
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-semibold);
  margin-bottom: var(--spacing-xs);
}

.plan-upgrade-notice p:last-child {
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-medium);
}

.api-key-info {
  margin-top: var(--spacing-md);
  text-align: left;
  background-color: var(--el-bg-color-page);
  padding: var(--spacing-sm);
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color-light);
}

.api-key-info p {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--el-text-color-primary);
  font-weight: var(--el-font-weight-medium);
}

.api-key-info ul {
  margin: 0;
  padding-left: var(--spacing-lg);
  color: var(--el-text-color-secondary);
}

.api-key-info li {
  margin-bottom: var(--spacing-xs);
  font-size: var(--el-font-size-small);
  line-height: 1.4;
}

.api-key-status {
  display: grid;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm);
  background-color: var(--el-bg-color-page);
  border-radius: var(--el-border-radius-base);
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.status-item label {
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
}

.status-item p {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.status-active {
  color: var(--el-color-success) !important;
  font-weight: var(--el-font-weight-medium);
}

.status-inactive {
  color: var(--el-color-warning) !important;
  font-weight: var(--el-font-weight-medium);
}

.api-key-result {
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm);
  background-color: var(--el-color-success-light-9);
  border: 1px solid var(--el-color-success-light-7);
  border-radius: var(--el-border-radius-base);
}

.api-key-result label {
  display: block;
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-small);
  margin-bottom: var(--spacing-sm);
}

.api-key-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.api-key-code {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  font-family: 'Courier New', monospace;
  font-size: var(--el-font-size-extra-small);
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.copy-button {
  flex-shrink: 0;
}

.warning-text {
  margin: 0;
  color: var(--el-color-warning);
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-medium);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
}

.api-key-button {
  width: 100%;
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-medium);
}

.api-key-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  .user-profile {
    padding: var(--spacing-sm);
    max-width: 700px;
  }
  
  .profile-top-section {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  h2 {
    font-size: var(--el-font-size-large);
    margin-bottom: var(--spacing-md);
  }
  
  h3 {
    font-size: var(--el-font-size-medium);
    margin-bottom: var(--spacing-sm);
  }
  
  .profile-card, .credentials-card, .api-key-card {
    padding: var(--spacing-md);
  }
  
  .credentials-card {
    margin-bottom: var(--spacing-md);
  }
  
  .profile-top-section .profile-card,
  .profile-top-section .api-key-card {
    margin-bottom: 0;
  }
  
  .api-key-display {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-xs);
  }
  
  .api-key-code {
    font-size: var(--el-font-size-extra-small);
  }
  
  .credentials-form :deep(.el-form-item__label) {
    width: 110px;
    font-size: var(--el-font-size-small);
  }
  
  .submit-button {
    font-size: var(--el-font-size-base);
  }
}

/* 모바일 */
@media (max-width: 480px) {
  .user-profile {
    padding: var(--spacing-xs);
    max-width: 500px;
  }
  
  .profile-top-section {
    gap: var(--spacing-sm);
  }
  
  h2 {
    font-size: var(--el-font-size-large);
    margin-bottom: var(--spacing-md);
  }
  
  h3 {
    font-size: var(--el-font-size-base);
    margin-bottom: var(--spacing-sm);
  }
  
  .profile-card, .credentials-card, .api-key-card {
    padding: var(--spacing-sm);
  }
  
  .credentials-card {
    margin-bottom: var(--spacing-sm);
  }
  
  .profile-top-section .profile-card,
  .profile-top-section .api-key-card {
    margin-bottom: 0;
  }
  
  .api-key-info {
    padding: var(--spacing-sm);
  }
  
  .api-key-status {
    padding: var(--spacing-sm);
  }
  
  .api-key-code {
    font-size: var(--el-font-size-extra-small);
    padding: var(--spacing-xs);
  }
  
  .plan-upgrade-notice {
    padding: var(--spacing-sm);
  }
  
  .plan-upgrade-notice p:first-child {
    font-size: var(--el-font-size-base);
  }
  
  .plan-upgrade-notice p:last-child {
    font-size: var(--el-font-size-small);
  }
  
  .credentials-form :deep(.el-form-item__label) {
    width: 100px;
    font-size: var(--el-font-size-small);
  }
  
  .submit-button {
    font-size: var(--el-font-size-small);
  }
  
  .error-message, .success-message, .field-error {
    font-size: var(--el-font-size-extra-small);
  }
  
  .credentials-description p {
    font-size: var(--el-font-size-small);
  }
}
</style> 