<template>
  <div class="admin-health">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <h2 class="page-title">시스템 상태 확인</h2>
      <p class="page-description">서버 및 서비스의 상태를 실시간으로 모니터링합니다.</p>
    </div>

    <!-- 메인 콘텐츠 -->
    <div class="content-container">
      <!-- 로딩 상태 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="6" animated />
      </div>

      <!-- 에러 상태 -->
      <div v-else-if="error" class="error-container">
        <el-alert
          :title="error"
          type="error"
          :closable="false"
          show-icon
        />
        <el-button @click="checkHealth" type="primary" :icon="Refresh" class="retry-button">
          다시 시도
        </el-button>
      </div>

      <!-- 정상 상태 -->
      <div v-else class="health-content">
        <!-- 새로고침 버튼 -->
        <div class="action-bar">
          <el-button @click="checkHealth" type="primary" :icon="Refresh" :loading="loading">
            새로고침
          </el-button>
        </div>

        <!-- 상태 카드들 -->
        <div v-if="healthData" class="status-grid">
          <div class="status-card">
            <div class="card-header">
              <el-icon :class="['card-icon', healthData.data.server.status === 'running' ? 'healthy' : 'error']">
                <CircleCheck v-if="healthData.data.server.status === 'running'" />
                <Warning v-else />
              </el-icon>
              <h3 class="card-title">서버 상태</h3>
            </div>
            <div class="card-content">
              <div :class="['status-indicator', healthData.data.server.status === 'running' ? 'healthy' : 'error']">
                {{ healthData.data.server.status === 'running' ? '정상' : '오류' }}
              </div>
              <p class="status-description">
                {{ healthData.data.server.status === 'running' ? '서버가 정상적으로 작동 중입니다.' : '서버에 문제가 있습니다.' }}
              </p>
              <div class="server-details">
                <div class="detail-item">
                  <span class="detail-label">Node.js:</span>
                  <span class="detail-value">{{ healthData.data.server.nodeVersion }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">플랫폼:</span>
                  <span class="detail-value">{{ healthData.data.server.platform }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="status-card">
            <div class="card-header">
              <el-icon :class="['card-icon', dbHealthData && dbHealthData.data.database.connected ? 'healthy' : 'error']">
                <DataBoard />
              </el-icon>
              <h3 class="card-title">데이터베이스</h3>
            </div>
            <div class="card-content">
              <div v-if="dbHealthData" :class="['status-indicator', dbHealthData.data.database.connected ? 'healthy' : 'error']">
                {{ dbHealthData.data.database.connected ? '연결됨' : '연결 실패' }}
              </div>
              <div v-else class="status-indicator warning">확인 중...</div>
              <p class="status-description">
                <span v-if="dbHealthData">
                  {{ dbHealthData.data.database.connected ? '데이터베이스 연결이 정상입니다.' : '데이터베이스 연결에 문제가 있습니다.' }}
                </span>
                <span v-else>데이터베이스 상태를 확인하고 있습니다.</span>
              </p>
              <div v-if="dbHealthData" class="server-details">
                <div class="detail-item">
                  <span class="detail-label">응답 시간:</span>
                  <span class="detail-value">{{ dbHealthData.data.database.responseTime || '-' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">상태:</span>
                  <span class="detail-value">{{ dbHealthData.data.database.status }}</span>
                </div>
                <div v-if="dbHealthData.data.database.connected" class="detail-item">
                  <span class="detail-label">연결 수:</span>
                  <span class="detail-value">{{ dbHealthData.data.database.threadsConnected || '-' }}</span>
                </div>
                <div v-if="dbHealthData.data.database.connected" class="detail-item">
                  <span class="detail-label">가동 시간:</span>
                  <span class="detail-value">{{ dbHealthData.data.database.uptime || '-' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="status-card">
            <div class="card-header">
              <el-icon :class="['card-icon', getMemoryStatus(healthData.data.memory.system.usagePercent)]">
                <Monitor />
              </el-icon>
              <h3 class="card-title">메모리 사용량</h3>
            </div>
            <div class="card-content">
              <div :class="['status-indicator', getMemoryStatus(healthData.data.memory.system.usagePercent)]">
                {{ healthData.data.memory.system.usagePercent }}
              </div>
              <p class="status-description">
                시스템 메모리: {{ healthData.data.memory.system.used }} / {{ healthData.data.memory.system.total }}
              </p>
              <div class="server-details">
                <div class="detail-item">
                  <span class="detail-label">프로세스:</span>
                  <span class="detail-value">{{ healthData.data.memory.process.heapUsed }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">힙 사용률:</span>
                  <span class="detail-value">{{ healthData.data.memory.process.heapUsagePercent }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="status-card">
            <div class="card-header">
              <el-icon class="card-icon healthy"><Monitor /></el-icon>
              <h3 class="card-title">CPU 정보</h3>
            </div>
            <div class="card-content">
              <div class="status-indicator healthy">{{ healthData.data.cpu.cores }}코어</div>
              <p class="status-description">{{ healthData.data.cpu.model }}</p>
              <div class="server-details">
                <div class="detail-item">
                  <span class="detail-label">1분 평균:</span>
                  <span class="detail-value">{{ healthData.data.cpu.loadAverage['1min'] }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">5분 평균:</span>
                  <span class="detail-value">{{ healthData.data.cpu.loadAverage['5min'] }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 시스템 정보 -->
        <div v-if="healthData" class="system-info">
          <h3 class="section-title">가동 시간 정보</h3>
          <div class="info-table">
            <div class="info-row">
              <span class="info-label">마지막 확인 시간</span>
              <span class="info-value">{{ formatDate(healthData.data.timestamp) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">프로세스 가동 시간</span>
              <span class="info-value">{{ healthData.data.server.uptime.process }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">시스템 가동 시간</span>
              <span class="info-value">{{ healthData.data.server.uptime.system }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { Refresh, CircleCheck, DataBoard, Warning, Monitor } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { checkSystemHealth, checkDatabaseHealth } from '@/services/admin';

export default {
  name: 'AdminHealth',
  setup() {
    const loading = ref(false);
    const error = ref('');
    const healthData = ref(null);
    const dbHealthData = ref(null);

    // 메모리 사용량에 따른 상태 반환
    const getMemoryStatus = (usagePercent) => {
      const usage = parseFloat(usagePercent.replace('%', ''));
      if (usage < 70) return 'healthy';
      if (usage < 85) return 'warning';
      return 'error';
    };

    // 날짜 포맷팅
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };

    // 시스템 상태 확인
    const checkHealth = async () => {
      loading.value = true;
      error.value = '';
      healthData.value = null;
      dbHealthData.value = null;

      try {
        // 두 API를 동시에 호출
        const [systemResponse, dbResponse] = await Promise.allSettled([
          checkSystemHealth(),
          checkDatabaseHealth()
        ]);

        // 시스템 상태 처리
        if (systemResponse.status === 'fulfilled' && systemResponse.value.success) {
          healthData.value = systemResponse.value;
        } else {
          console.error('시스템 상태 확인 실패:', systemResponse.reason || systemResponse.value);
        }

        // 데이터베이스 상태 처리
        if (dbResponse.status === 'fulfilled') {
          // DB health는 success가 false여도 데이터를 표시할 수 있음 (연결 실패 상태도 정보이므로)
          dbHealthData.value = dbResponse.value;
        } else {
          console.error('데이터베이스 상태 확인 실패:', dbResponse.reason);
        }

        // 최소 하나의 API가 성공했으면 성공 메시지
        if (healthData.value || dbHealthData.value) {
          ElMessage.success('상태 확인이 완료되었습니다.');
        } else {
          throw new Error('모든 상태 확인이 실패했습니다.');
        }
      } catch (err) {
        console.error('상태 확인 실패:', err);
        error.value = err.message || '상태 확인 중 오류가 발생했습니다.';
        ElMessage.error(error.value);
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      checkHealth();
    });

    return {
      loading,
      error,
      healthData,
      dbHealthData,
      getMemoryStatus,
      formatDate,
      checkHealth,
      Refresh,
      CircleCheck,
      DataBoard,
      Warning,
      Monitor
    };
  }
}
</script>

<style scoped>
.admin-health {
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
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* 로딩 컨테이너 */
.loading-container {
  padding: var(--spacing-xl);
}

/* 에러 컨테이너 */
.error-container {
  text-align: center;
  padding: var(--spacing-xl);
}

.retry-button {
  margin-top: var(--spacing-md);
}

/* 액션 바 */
.action-bar {
  margin-bottom: var(--spacing-lg);
  display: flex;
  justify-content: flex-end;
}

/* 상태 그리드 */
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.status-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-lg);
  box-shadow: var(--el-box-shadow-light);
  transition: all 0.2s ease;
}

.status-card:hover {
  box-shadow: var(--el-box-shadow-base);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.card-icon {
  font-size: var(--el-font-size-large);
}

.card-icon.healthy {
  color: var(--el-color-success);
}

.card-icon.warning {
  color: var(--el-color-warning);
}

.card-icon.error {
  color: var(--el-color-danger);
}

.card-title {
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-primary);
  margin: 0;
}

.status-indicator {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--el-border-radius-round);
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-medium);
  margin-bottom: var(--spacing-sm);
}

.status-indicator.healthy {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.status-indicator.warning {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

.status-indicator.error {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.status-description {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
  margin: 0 0 var(--spacing-sm) 0;
  line-height: 1.4;
}

.server-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs);
  background: var(--el-bg-color-page);
  border-radius: var(--el-border-radius-small);
  border: 1px solid var(--el-border-color-extra-light);
}

.detail-label {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
  font-weight: var(--el-font-weight-medium);
}

.detail-value {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-primary);
  font-family: monospace;
  font-weight: var(--el-font-weight-medium);
}

/* 시스템 정보 */
.system-info {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-lg);
  box-shadow: var(--el-box-shadow-light);
}

.section-title {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-md) 0;
  padding-left: var(--spacing-xs);
  border-left: 4px solid var(--el-color-primary);
}

.info-table {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-secondary);
}

.info-value {
  color: var(--el-text-color-primary);
  font-family: monospace;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .content-container {
    padding: var(--spacing-sm);
  }
  
  .status-grid {
    grid-template-columns: 1fr;
  }
  
  .action-bar {
    justify-content: center;
  }
}
</style>
