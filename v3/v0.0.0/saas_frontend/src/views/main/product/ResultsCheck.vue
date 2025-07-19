<template>
  <div class="results-check">
    <div class="page-header">
      <h2 class="page-title">수집 결과 확인</h2>
      <p class="page-description">소싱된 상품의 상태를 확인하고 그룹 코드를 지정하여 승인할 수 있습니다.</p>
    </div>
    
    <!-- 로딩 상태 표시 -->
    <AppLoading v-if="loading" text="상품 정보를 불러오는 중입니다..." />
    
    <div v-else class="content-container">
      <!-- 상세 상태 정보 -->
      <el-card class="status-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <h3 class="card-title">총 상품 수: {{ sourcingStatus.totalCount || 0 }}</h3>
          </div>
        </template>
        
        <div class="status-grid">
          <!-- 첫 번째 줄: 주요 상태 -->
          <div class="status-item success">
            <span class="status-label">처리중:</span>
            <span class="status-value">{{ sourcingStatus.pendingCount || 0 }}</span>
          </div>
          <div class="status-item warning">
            <span class="status-label">승인대기중:</span>
            <span class="status-value">{{ sourcingStatus.successCount || 0 }}</span>
          </div>
          <div class="status-item info">
            <span class="status-label">승인완료 및 가공대기중:</span>
            <span class="status-value">{{ (sourcingStatus.totalCount || 0) - ((sourcingStatus.successCount || 0) + (sourcingStatus.pendingCount || 0) + (sourcingStatus.failApiCount || 0) + (sourcingStatus.failSaveCount || 0) + (sourcingStatus.banShopCount || 0) + (sourcingStatus.banSellerCount || 0)) }}</span>
          </div>
          
          <!-- 두 번째 줄: 실패 및 금지 상태 -->
          <div class="status-item danger">
            <span class="status-label">API 실패:</span>
            <span class="status-value">{{ sourcingStatus.failApiCount || 0 }}</span>
          </div>
          <div class="status-item danger-light">
            <span class="status-label">저장 실패:</span>
            <span class="status-value">{{ sourcingStatus.failSaveCount || 0 }}</span>
          </div>
          <div class="status-item danger-lighter">
            <span class="status-label">금지된 상점:</span>
            <span class="status-value">{{ sourcingStatus.banShopCount || 0 }}</span>
          </div>
          <div class="status-item danger-lightest">
            <span class="status-label">금지된 판매자:</span>
            <span class="status-value">{{ sourcingStatus.banSellerCount || 0 }}</span>
          </div>
        </div>
      </el-card>
      
      <!-- 그룹코드 및 처리대기 상품 영역 -->
      <el-card class="products-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <h3 class="card-title">처리 대기 상품 목록</h3>
            
            <div class="action-controls">
              <div class="code-group">
                <el-input 
                  v-model="commitCode" 
                  type="number" 
                  placeholder="그룹코드 입력"
                  :min="0"
                  style="width: 250px;"
                >
                  <template #prepend>그룹코드</template>
                </el-input>
              </div>
              
              <el-button 
                type="info" 
                @click="fetchSourcingStatus" 
                :loading="loading"
              >
                <el-icon><RefreshRight /></el-icon>
                상태 새로고침
              </el-button>
              
              <el-button 
                type="warning" 
                @click="fetchSourcingStatus" 
                :loading="loading"
                :disabled="!commitCode"
              >
                <el-icon><Search /></el-icon>
                그룹코드로 조회
              </el-button>
              
              <el-button 
                type="primary" 
                @click="approveProducts" 
                :disabled="selectedProductIds.length === 0"
                :loading="submitting"
              >
                <el-icon><Check /></el-icon>
                선택 상품 승인
              </el-button>
            </div>
          </div>
        </template>
        
        <!-- 처리 대기 상품 목록 -->
        <div class="table-container">
                      <el-table 
              v-if="sourcingStatus.productIds && sourcingStatus.productIds.length > 0"
              :data="tableData"
              style="width: 100%"
              height="500"
              empty-text="처리 대기 중인 상품이 없습니다."
              :border="false"
              stripe
              row-key="productId"
              @selection-change="handleSelectionChange"
            >
              <el-table-column type="selection" width="55" />
              
              <el-table-column prop="productId" label="상품 ID" />
              
              <el-table-column label="상태" width="120">
                <template #default="{ row }">
                  <el-tag 
                    :type="getTagType(row.productId)"
                    size="small"
                  >
                    {{ getProductStatus(row.productId) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          
          <el-empty 
            v-else 
            description="처리 대기 중인 상품이 없습니다."
            :image-size="100"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { getSourcingStatus, updateProductStatus } from '../../../services/sourcing';
import { RefreshRight, Check, Search } from '@element-plus/icons-vue';
import AppLoading from '@/components/app/loading.vue';

export default {
  name: 'ResultsCheck',
  components: {
    RefreshRight,
    Check,
    Search,
    AppLoading
  },
  data() {
    return {
      loading: true,
      submitting: false,
      sourcingStatus: {},
      selectedProductIds: [],
      commitCode: '', // 기본값 0으로 설정

    };
  },
  computed: {
    tableData() {
      if (this.sourcingStatus && this.sourcingStatus.productIds) {
        return this.sourcingStatus.productIds.map(id => ({ productId: id }));
      }
      return [];
    }
  },
  methods: {
    async fetchSourcingStatus() {
      try {
        this.loading = true;
        // commitCode가 입력되어 있으면 그룹코드로 조회, 없으면 전체 조회
        const commitCodeParam = this.commitCode ? this.commitCode : null;
        const response = await getSourcingStatus(commitCodeParam);
        
        // 응답 처리 전에 콘솔에 로그 출력 (디버깅용)
        const logMessage = commitCodeParam 
          ? `그룹코드 ${commitCodeParam}로 소싱 상태 응답:` 
          : '전체 소싱 상태 응답:';
        console.log(logMessage, response);
        
        // 응답이 유효한지 확인
        if (response && typeof response === 'object') {
          this.sourcingStatus = response;
          
          // productIds가 없거나 배열이 아닌 경우를 대비해 빈 배열로 초기화
          if (!this.sourcingStatus.productIds || !Array.isArray(this.sourcingStatus.productIds)) {
            console.log('productIds가 유효하지 않아 빈 배열로 초기화합니다.');
            this.sourcingStatus.productIds = [];
          }
          
          // 성공 메시지 표시
          if (commitCodeParam) {
            this.$message.success(`그룹코드 ${commitCodeParam}로 새로고침이 완료되었습니다.`);
          } else {
            this.$message.success('전체 상태 새로고침이 완료되었습니다.');
          }
        } else {
          console.error('API 응답이 유효하지 않습니다:', response);
          this.sourcingStatus = {
            totalCount: 0,
            successCount: 0,
            pendingCount: 0,
            failApiCount: 0,
            failSaveCount: 0,
            banShopCount: 0,
            banSellerCount: 0,
            productIds: [],
            uncommitIds: [],
            pendingIds: [],
            failIds: [],
            banIds: []
          };
          this.$message.error('소싱 상태 정보를 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('소싱 상태 정보 조회 중 오류 발생:', error);
        // 오류 발생 시 기본 상태 초기화
        this.sourcingStatus = {
          totalCount: 0,
          successCount: 0,
          pendingCount: 0,
          failApiCount: 0,
          failSaveCount: 0,
          banShopCount: 0,
          banSellerCount: 0,
          productIds: [],
          uncommitIds: [],
          pendingIds: [],
          failIds: [],
          banIds: []
        };
        // 서버로부터 받은 에러 메시지 사용
        const errorMessage = error.response?.data?.message || '소싱 상태 정보를 불러오는데 실패했습니다.';
        this.$message.error(errorMessage);
      } finally {
        this.loading = false;
      }
    },

    handleSelectionChange(selection) {
      this.selectedProductIds = selection.map(item => item.productId);
    },
    
    getProductStatus(productId) {
      if (!productId) {
        return '상태 정보 없음';
      }
      
      // uncommitIds에 있으면 승인대기중
      if (this.sourcingStatus.uncommitIds && this.sourcingStatus.uncommitIds.includes(productId)) {
        return '승인대기중';
      }
      // pendingIds에 있으면 처리중
      else if (this.sourcingStatus.pendingIds && this.sourcingStatus.pendingIds.includes(productId)) {
        return '처리중';
      }
      // failIds에 있으면 실패
      else if (this.sourcingStatus.failIds && this.sourcingStatus.failIds.includes(productId)) {
        return '실패';
      }
      // banIds에 있으면 금지됨
      else if (this.sourcingStatus.banIds && this.sourcingStatus.banIds.includes(productId)) {
        return '금지됨';
      }
      
      return '상태 정보 없음';
    },
    
    getTagType(productId) {
      if (!productId) {
        return 'info';
      }
      
      // uncommitIds에 있으면 승인대기중 (success 색상)
      if (this.sourcingStatus.uncommitIds && this.sourcingStatus.uncommitIds.includes(productId)) {
        return 'success';
      }
      // pendingIds에 있으면 처리중 (info 색상)
      else if (this.sourcingStatus.pendingIds && this.sourcingStatus.pendingIds.includes(productId)) {
        return 'info';
      }
      // failIds에 있으면 실패 (danger 색상)
      else if (this.sourcingStatus.failIds && this.sourcingStatus.failIds.includes(productId)) {
        return 'danger';
      }
      // banIds에 있으면 금지됨 (warning 색상)
      else if (this.sourcingStatus.banIds && this.sourcingStatus.banIds.includes(productId)) {
        return 'warning';
      }
      // 기본값
      return 'info';
    },
    
    async approveProducts() {
      if (this.selectedProductIds.length === 0) {
        this.$message.warning('상품을 선택해주세요.');
        return;
      }
      
      let commitCodeValue = 0;
      if (this.commitCode !== null && this.commitCode !== '') {
        commitCodeValue = Number(this.commitCode);
      }
      
      try {
        this.submitting = true;
        const response = await updateProductStatus(commitCodeValue, this.selectedProductIds);
        
        const successMessage = response.message || '상품 상태가 성공적으로 업데이트되었습니다.';
        
        await this.fetchSourcingStatus();
        this.selectedProductIds = [];
        
        this.$message.success(successMessage);
      } catch (error) {
        console.error('상태 업데이트 중 오류 발생:', error);
        // 서버로부터 받은 에러 메시지 사용
        const errorMessage = error.response?.data?.message || '상태 업데이트에 실패했습니다.';
        this.$message.error(errorMessage);
      } finally {
        this.submitting = false;
      }
    }
  },
  mounted() {
    this.fetchSourcingStatus();
    
    // ResizeObserver 에러 무시 (개발 환경에서만 발생하는 알려진 이슈)
    const resizeObserverErr = window.console.error;
    window.console.error = (...args) => {
      const resizeObserverMessage = args[0];
      if (typeof resizeObserverMessage === 'string' && resizeObserverMessage.includes('ResizeObserver loop completed')) {
        return;
      }
      resizeObserverErr(...args);
    };
  }
};
</script>

<style scoped>
.results-check {
  height: 100%;
  overflow-y: auto;
  background-color: var(--el-bg-color-page);
  display: flex;
  flex-direction: column;
}

.page-header {
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-xs);
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
  margin-bottom: var(--spacing-xs);
}

.page-title {
  font-size: var(--el-font-size-extra-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  margin-bottom: var(--spacing-xs);
}

.page-description {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-base);
  margin: 0;
}



.content-container {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-md) var(--spacing-sm);
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.status-card {
  --el-card-padding: var(--spacing-md);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0;
}

.card-title {
  margin: 0;
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-primary);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-sm);
}

.status-item {
  background: var(--el-bg-color);
  padding: var(--spacing-sm);
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.2s ease;
}

.status-item:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: 0 2px 8px rgba(91, 108, 242, 0.1);
}

.status-item.success {
  border-left: 3px solid var(--el-color-primary-light-5);
}

.status-item.warning {
  border-left: 3px solid var(--el-color-primary-light-3);
}

.status-item.info {
  border-left: 3px solid var(--el-color-primary);
}

.status-item.danger {
  border-left: 3px solid var(--el-color-danger);
}

.status-item.danger-light {
  border-left: 3px solid var(--el-color-danger-light-3);
}

.status-item.danger-lighter {
  border-left: 3px solid var(--el-color-danger-light-5);
}

.status-item.danger-lightest {
  border-left: 3px solid var(--el-color-danger-light-7);
}

.status-label {
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-regular);
  margin-right: var(--spacing-xs);
}

.status-value {
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-medium);
}

.products-card {
  flex: 1;
  overflow: hidden;
  --el-card-padding: var(--spacing-md);
}

.action-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.select-all-checkbox {
  margin-right: var(--spacing-sm);
}

.code-group {
  display: flex;
  align-items: center;
}

.table-container {
  height: 550px;
  overflow: hidden;
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color-lighter);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .content-container {
    padding: var(--spacing-md);
  }
  
  .page-header {
    padding: var(--spacing-md);
  }
  
  .status-grid {
    grid-template-columns: 1fr;
  }
  
  .action-controls {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }
  
  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }
  
  .table-container {
    height: 400px;
  }
}

@media (max-width: 992px) {
  .status-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style> 