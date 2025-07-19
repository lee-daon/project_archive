<template>
  <div class="admin-controller">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <h2 class="page-title">데이터베이스 백업</h2>
      <p class="page-description">데이터베이스를 백업하고 Cloudflare R2에 업로드합니다.</p>
    </div>

    <!-- 메인 콘텐츠 -->
    <div class="content-container">
      <!-- 백업 실행 카드 -->
      <div class="backup-card">
        <div class="card-header">
          <h3 class="card-title">데이터베이스 백업 실행</h3>
        </div>
        <div class="card-content">
          <p class="card-description">
            전체 데이터베이스를 백업하고 클라우드 스토리지에 안전하게 저장합니다.
          </p>
          <el-button 
            type="primary" 
            size="large"
            :loading="isBackupLoading"
            @click="executeBackup"
            :icon="Upload"
            class="backup-button"
          >
            {{ isBackupLoading ? '백업 진행 중...' : '백업 실행' }}
          </el-button>
        </div>
      </div>

      <!-- 백업 결과 카드 -->
      <div v-if="backupResult" class="result-card">
        <div class="card-header">
          <el-icon class="success-icon"><CircleCheck /></el-icon>
          <h3 class="card-title">백업 완료</h3>
        </div>
        <div class="card-content">
          <div class="result-item">
            <span class="result-label">백업 완료 시간:</span>
            <span class="result-value">{{ formatDate(new Date()) }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">백업 파일명:</span>
            <span class="result-value">{{ backupResult.backupFileName }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">저장 위치:</span>
            <span class="result-value">{{ backupResult.bucket }} (비공개 버킷)</span>
          </div>
          <div class="result-message">
            <el-icon class="message-icon"><InfoFilled /></el-icon>
            <span>{{ backupResult.message }}</span>
          </div>
        </div>
      </div>

      <!-- 에러 카드 -->
      <div v-if="error" class="error-card">
        <el-alert
          :title="error"
          type="error"
          :closable="true"
          show-icon
          @close="clearError"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { Upload, CircleCheck, InfoFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { createDatabaseBackup } from '@/services/admin';

export default {
  name: 'AdminController',
  setup() {
    const isBackupLoading = ref(false);
    const backupResult = ref(null);
    const error = ref('');

    // 백업 실행
    const executeBackup = async () => {
      if (isBackupLoading.value) return;
      
      isBackupLoading.value = true;
      error.value = '';
      backupResult.value = null;

      try {
        const response = await createDatabaseBackup();
        
        if (response.success) {
          backupResult.value = response;
          ElMessage.success('데이터베이스 백업이 완료되었습니다.');
        } else {
          throw new Error(response.error || '백업 실행 중 오류가 발생했습니다.');
        }
      } catch (err) {
        console.error('백업 실행 실패:', err);
        error.value = err.message || '백업 실행 중 오류가 발생했습니다.';
        ElMessage.error(error.value);
      } finally {
        isBackupLoading.value = false;
      }
    };

    // 날짜 포맷팅
    const formatDate = (date) => {
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };

    // 에러 초기화
    const clearError = () => {
      error.value = '';
    };

    return {
      isBackupLoading,
      backupResult,
      error,
      executeBackup,
      formatDate,
      clearError,
      Upload,
      CircleCheck,
      InfoFilled
    };
  }
}
</script>

<style scoped>
.admin-controller {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color-page);
}

/* 페이지 헤더 */
.page-header {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
  margin-bottom: var(--spacing-xs);
}

.page-title {
  font-size: var(--el-font-size-extra-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  margin: 0;
}

.page-description {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-base);
  margin: 0;
}

/* 콘텐츠 컨테이너 */
.content-container {
  flex: 1;
  padding: var(--spacing-md);
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* 카드 공통 스타일 */
.backup-card,
.result-card,
.error-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
  overflow: hidden;
}

.card-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.card-title {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-primary);
  margin: 0;
}

.success-icon {
  color: var(--el-color-success);
  font-size: var(--el-font-size-large);
}

.card-content {
  padding: var(--spacing-lg);
}

/* 백업 카드 */
.card-description {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-base);
  margin: 0 0 var(--spacing-lg) 0;
  line-height: 1.5;
}

.backup-button {
  width: 100%;
  height: 50px;
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-medium);
}

/* 결과 카드 */
.result-card {
  border-left: 4px solid var(--el-color-success);
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.result-label {
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
}

.result-value {
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-base);
}





.result-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--el-color-success-light-9);
  border: 1px solid var(--el-color-success-light-7);
  border-radius: var(--el-border-radius-base);
  color: var(--el-color-success-dark-2);
  margin-top: var(--spacing-md);
}

.message-icon {
  color: var(--el-color-success);
  flex-shrink: 0;
}

/* 에러 카드 */
.error-card {
  border-left: 4px solid var(--el-color-danger);
}

.error-card .el-alert {
  border: none;
  background: transparent;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .content-container {
    padding: var(--spacing-sm);
    max-width: none;
  }
  
  .card-header,
  .card-content {
    padding: var(--spacing-md);
  }
  
  .result-item {
    margin-bottom: var(--spacing-sm);
  }
}
</style>
