<template>
  <div class="register-check">
    <!-- 전체 화면 로딩 -->
    <AppLoading 
      v-if="actionLoading" 
      :overlay="true"
      text="작업을 처리하는 중입니다..."
    />
    
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <h2 class="page-title">등록 상품 관리</h2>
      <p class="page-description">플랫폼별 등록된 상품을 조회하고 관리하세요</p>
    </div>

    <!-- 플랫폼 선택 -->
    <div class="platform-section">
      <el-tabs v-model="selectedPlatform" @tab-change="handlePlatformChange" class="platform-tabs">
        <el-tab-pane label="쿠팡" name="coopang">
          <template #label>
            <span class="tab-label">
              <el-icon><ShoppingCart /></el-icon>
              쿠팡
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="네이버" name="naver">
          <template #label>
            <span class="tab-label">
              <el-icon><Search /></el-icon>
              네이버
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="11번가" name="elevenstore">
          <template #label>
            <span class="tab-label">
              <el-icon><Shop /></el-icon>
              11번가
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="ESM" name="esm">
          <template #label>
            <span class="tab-label">
              <el-icon><Shop /></el-icon>
              ESM
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 상태별 통계 -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card pending">
          <div class="stat-icon">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ statusCounts.pending }}</div>
            <div class="stat-label">등록 중</div>
          </div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon">
            <el-icon><Check /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ statusCounts.success }}</div>
            <div class="stat-label">등록 성공</div>
          </div>
        </div>
        <div class="stat-card fail">
          <div class="stat-icon">
            <el-icon><Close /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ statusCounts.fail }}</div>
            <div class="stat-label">등록 실패</div>
          </div>
        </div>
        <div class="stat-card total">
          <div class="stat-icon">
            <el-icon><Postcard /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ statusCounts.pending + statusCounts.success + statusCounts.fail }}</div>
            <div class="stat-label">총 갯수</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 검색 및 필터 -->
    <div class="filter-section">
      <div class="filter-content">
        <div class="filter-row">
          <div class="search-group">
            <el-input
              v-model="filters.productName"
              placeholder="상품명으로 검색"
              :prefix-icon="Search"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="search-group">
            <el-input
              v-model="filters.groupCode"
              placeholder="관리코드로 검색"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="search-group">
            <el-input
              v-model="filters.marketNumber"
              placeholder="마켓번호로 검색"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="filter-group">
            <el-select v-model="filters.sortOrder" placeholder="정렬">
              <el-option label="최신순" value="desc" />
              <el-option label="과거순" value="asc" />
            </el-select>
          </div>
          <div class="action-group">
            <el-button type="primary" :icon="Search" @click="handleSearch">
              검색
            </el-button>
            <el-button :icon="Refresh" @click="handleReset">
              초기화
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 선택된 상품 액션 -->
    <div v-if="selectedProducts.length > 0" class="action-section">
      <div class="action-bar">
        <div class="selected-info">
          <span class="selected-count">{{ selectedProducts.length }}개 선택됨</span>
        </div>
        <div class="action-buttons">
          <el-button 
            type="warning" 
            :icon="Download"
            @click="handleRemoveFromMarket"
            :disabled="actionLoading"
          >
            마켓에서 내리기
          </el-button>
          <el-button 
            type="danger" 
            :icon="Delete"
            @click="handleDeletePermanently"
            :disabled="actionLoading"
          >
            영구 삭제
          </el-button>
        </div>
      </div>
    </div>

    <!-- 상품 목록 -->
    <div class="content-section">
      <div class="content-container">
        <!-- 로딩 상태 -->
        <AppLoading v-if="loading" text="등록 상품 정보를 불러오는 중..." />

        <!-- 상품 테이블 -->
        <div v-else-if="products.length > 0" class="table-container">
          <el-table
            :data="products"
            height="100%"
            @selection-change="handleSelectionChange"
            class="product-table"
            stripe
          >
            <el-table-column type="selection" width="55" />
            <el-table-column label="상품 이미지" width="100">
              <template #default="scope">
                <div class="product-image">
                  <img 
                    :src="scope.row.imageUrl" 
                    :alt="scope.row.productName"
                  />
                </div>
              </template>
            </el-table-column>
            <el-table-column label="상품명" min-width="200">
              <template #default="scope">
                <div class="product-name">
                  <div class="name-text">{{ scope.row.productName }}</div>
                  <div class="product-id">ID: {{ scope.row.productid }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="상태" width="120">
              <template #default="scope">
                <el-tag
                  :type="getStatusType(scope.row.status)"
                  :effect="scope.row.status === 'pending' ? 'light' : 'dark'"
                  :class="{ 'status-pending': scope.row.status === 'pending' }"
                >
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="상품번호" width="140">
              <template #default="scope">
                <div class="product-number">
                  {{ scope.row.productNumber || '-' }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="관리코드" width="120">
              <template #default="scope">
                <div class="group-code">
                  {{ scope.row.groupCode || '-' }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="등록일" width="180">
              <template #default="scope">
                <div class="date-info">
                  <div class="created-date">{{ formatDate(scope.row.createdAt) }}</div>
                  <div class="updated-date">수정: {{ formatDate(scope.row.updatedAt) }}</div>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <!-- 페이지네이션 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="pagination.currentPage"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[20, 50, 100]"
              :total="pagination.totalCount"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>

        <!-- 빈 결과 -->
        <div v-else class="empty-result">
          <div class="empty-icon">
            <el-icon size="48"><Box /></el-icon>
          </div>
          <h3 class="empty-title">등록된 상품이 없습니다</h3>
          <p class="empty-description">선택한 플랫폼에 등록된 상품이 없습니다.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { 
  Search, 
  Refresh, 
  Download, 
  Delete, 
  ShoppingCart, 
  Shop, 
  Clock, 
  Check, 
  Close, 
  Postcard,
  Tools,
  Box
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getRegisteringInfo, removeFromMarket, deleteProductsPermanently } from '@/services/manager';
import AppLoading from '@/components/app/loading.vue';

export default {
  name: 'RegisterCheck',
  components: {
    AppLoading
  },
  setup() {
    const selectedPlatform = ref('coopang');
    const loading = ref(false);
    const actionLoading = ref(false);

    const products = ref([]);
    const selectedProducts = ref([]);
    
    const statusCounts = reactive({
      pending: 0,
      success: 0,
      fail: 0
    });

    const filters = reactive({
      productName: '',
      sortOrder: 'desc',
      groupCode: '',
      marketNumber: ''
    });

    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      totalCount: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    });

    // 상태 타입 매핑
    const getStatusType = (status) => {
      const typeMap = {
        pending: 'warning',
        success: 'success',
        fail: 'danger',
        optionMapRequired: 'info'
      };
      return typeMap[status] || 'info';
    };

    // 상태 텍스트 매핑
    const getStatusText = (status) => {
      const textMap = {
        pending: '등록 중',
        success: '등록 성공',
        fail: '등록 실패',
        optionMapRequired: '옵션 매핑 필요'
      };
      return textMap[status] || status;
    };

    // 날짜 포맷팅
    const formatDate = (dateString) => {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // 데이터 로드
    const loadData = async () => {
      loading.value = true;

      try {
        const params = {
          platform: selectedPlatform.value,
          page: pagination.currentPage,
          pageSize: pagination.pageSize,
          sortOrder: filters.sortOrder,
          ...(filters.productName && { productName: filters.productName }),
          ...(filters.groupCode && { groupCode: filters.groupCode }),
          ...(filters.marketNumber && { marketNumber: filters.marketNumber })
        };

        const response = await getRegisteringInfo(params);
        
        if (response.success) {
          products.value = response.data || [];
          
          // 페이지네이션 정보 업데이트
          if (response.pagination) {
            Object.assign(pagination, response.pagination);
          }
          
          // 상태별 통계 업데이트
          if (response.statusCounts) {
            Object.assign(statusCounts, response.statusCounts);
          }
        }
      } catch (err) {
        ElMessage.error(err.response?.data?.message || '데이터를 불러오는데 실패했습니다.');
        console.error('등록 상품 조회 실패:', err);
      } finally {
        loading.value = false;
      }
    };

    // 플랫폼 변경
    const handlePlatformChange = () => {
      selectedProducts.value = [];
      pagination.currentPage = 1;
      loadData();
    };

    // 검색
    const handleSearch = () => {
      pagination.currentPage = 1;
      selectedProducts.value = [];
      loadData();
    };

    // 초기화
    const handleReset = () => {
      filters.productName = '';
      filters.sortOrder = 'desc';
      filters.groupCode = '';
      filters.marketNumber = '';
      pagination.currentPage = 1;
      selectedProducts.value = [];
      loadData();
    };

    // 선택 변경
    const handleSelectionChange = (selection) => {
      selectedProducts.value = selection;
    };

    // 페이지 크기 변경
    const handleSizeChange = (size) => {
      pagination.pageSize = size;
      pagination.currentPage = 1;
      selectedProducts.value = [];
      loadData();
    };

    // 페이지 변경
    const handleCurrentChange = (page) => {
      pagination.currentPage = page;
      selectedProducts.value = [];
      loadData();
    };

    // 마켓에서 내리기
    const handleRemoveFromMarket = async () => {
      try {
        const baseMessage = `선택한 ${selectedProducts.value.length}개 상품을 마켓에서 내리시겠습니까?`;
        let additionalInfo = '';
        
        if (selectedPlatform.value === 'esm') {
          additionalInfo = '\n\nESM은 서버에서만 처리되며 외부 API 호출 없이 즉시 처리됩니다.';
        }
        
        await ElMessageBox.confirm(
          baseMessage + additionalInfo,
          '마켓에서 내리기',
          {
            confirmButtonText: '확인',
            cancelButtonText: '취소',
            type: 'warning',
          }
        );

        actionLoading.value = true;
        
        const products = selectedProducts.value.map(p => ({
          productid: p.productid,
          productNumber: p.productNumber
        }));
        
        const response = await removeFromMarket({
          platform: selectedPlatform.value,
          products: products
        });

        if (response.success) {
          ElMessage.success('선택한 상품을 마켓에서 내렸습니다.');
          selectedProducts.value = [];
          loadData();
        }else{
          ElMessage.info(response.message);
          loadData();
        }
      } catch (err) {
        if (err !== 'cancel') {
          ElMessage.error(err.response?.data?.message || '알 수 없는 오류');
        }
      } finally {
        actionLoading.value = false;
      }
    };

    // 영구 삭제
    const handleDeletePermanently = async () => {
      try {
        await ElMessageBox.confirm(
          `선택한 ${selectedProducts.value.length}개 상품을 영구적으로 삭제하시겠습니까? 상품은 모든 마켓과 루프톤에서 삭제되며 되돌릴 수 없습니다.`,
          '영구 삭제',
          {
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
            type: 'error',
          }
        );

        actionLoading.value = true;
        
        const products = selectedProducts.value.map(p => ({
          productid: p.productid,
          productNumber: p.productNumber
        }));
        
        const response = await deleteProductsPermanently({
          platform: selectedPlatform.value,
          products: products
        });

        if (response.success) {
          ElMessage.success('선택한 상품을 영구 삭제했습니다.');
          selectedProducts.value = [];
          loadData();
        }else{
          ElMessage.info(response.message);
          loadData();
        }
      } catch (err) {
        if (err !== 'cancel') {
          ElMessage.error('영구 삭제 실패: ' + (err.response?.data?.message || '알 수 없는 오류'));
        }
      } finally {
        actionLoading.value = false;
      }
    };

    onMounted(() => {
      loadData();
    });

    return {
      selectedPlatform,
      loading,
      actionLoading,
      products,
      selectedProducts,
      statusCounts,
      filters,
      pagination,
      getStatusType,
      getStatusText,
      formatDate,
      handlePlatformChange,
      handleSearch,
      handleReset,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      handleRemoveFromMarket,
      handleDeletePermanently,
      Search,
      Refresh,
      Download,
      Delete,
      ShoppingCart,
      Shop,
      Clock,
      Check,
      Close,
      Postcard,
      Tools,
      Box
    };
  }
}
</script>

<style scoped>
.register-check {
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

/* 플랫폼 선택 */
.platform-section {
  padding: 0 var(--spacing-sm);
  background-color: var(--el-bg-color);
  margin-bottom: var(--spacing-xs);
}

.platform-tabs {
  border-bottom: none;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: var(--el-font-weight-medium);
}

/* 상태별 통계 */
.stats-section {
  padding: 0 var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.stat-card {
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.2s ease;
  margin-top: var(--spacing-xs);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow-base);
}

.stat-card.pending {
  border-left: 4px solid var(--el-color-primary-light-9);
}

.stat-card.success {
  border-left: 4px solid var(--el-color-success);
}

.stat-card.fail {
  border-left: 4px solid var(--el-color-danger);
}

.stat-card.total {
  border-left: 4px solid var(--el-color-primary);
}

.stat-icon {
  font-size: var(--el-font-size-large);
  color: var(--el-text-color-secondary);
}

.stat-number {
  font-size: var(--el-font-size-extra-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  line-height: 1;
}

.stat-label {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
  margin-top: var(--spacing-xs);
}

/* 필터 섹션 */
.filter-section {
  padding: 0 var(--spacing-sm) 0 var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.filter-content {
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--el-border-color-lighter);
}

.filter-row {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  flex-wrap: wrap;
}

.search-group {
  flex: 1;
  min-width: 200px;
}

.filter-group {
  min-width: 120px;
}

.action-group {
  display: flex;
  gap: var(--spacing-sm);
}

/* 액션 바 */
.action-section {
  padding: 0 var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.action-bar {
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-sm);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-info {
  color: var(--el-color-primary);
  font-weight: var(--el-font-weight-medium);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

/* 콘텐츠 영역 */
.content-section {
  flex: 1;
  overflow: hidden;
  padding: 0 var(--spacing-sm) 0 var(--spacing-sm);
}

.content-container {
  height: 100%;
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  color: var(--el-text-color-primary);
}



.not-implemented {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.not-implemented-content {
  text-align: center;
  color: var(--el-text-color-secondary);
}

.not-implemented-icon {
  color: var(--el-text-color-placeholder);
  margin-bottom: var(--spacing-md);
}

.table-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.product-table {
  flex: 1;
}

.product-image img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: var(--el-border-radius-small);
  border: 1px solid var(--el-border-color-lighter);
}

.product-name {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.name-text {
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-primary);
  line-height: 1.4;
}

.product-id {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
  font-family: monospace;
}

.product-number,
.group-code {
  font-family: monospace;
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-regular);
}

.date-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.created-date {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-primary);
}

.updated-date {
  font-size: var(--el-font-size-extra-small);
  color: var(--el-text-color-secondary);
}

.pagination-container {
  padding: var(--spacing-sm) 0 0 0;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-page);
  display: flex;
  justify-content: center;
}

/* 빈 결과 */
.empty-result {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.empty-icon {
  color: var(--el-text-color-placeholder);
  margin-bottom: var(--spacing-lg);
}

.empty-title {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.empty-description {
  color: var(--el-text-color-secondary);
  margin: 0;
}

/* Element Plus 커스터마이징 */
:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.el-tabs__header) {
  margin: 0;
}

:deep(.el-tabs__content) {
  display: none;
}

:deep(.el-table) {
  border: none;
}

:deep(.el-table__header) {
  background-color: var(--el-bg-color-page);
}

:deep(.el-table th) {
  background-color: var(--el-bg-color-page);
  color: var(--el-text-color-primary);
  font-weight: var(--el-font-weight-medium);
}

/* 등록중 상태 태그 커스텀 스타일 */
:deep(.status-pending.el-tag) {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .page-header {
    padding: var(--spacing-sm);
  }
  
  .platform-section,
  .stats-section,
  .filter-section,
  .action-section,
  .content-section {
    padding: 0 var(--spacing-sm);
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .stat-card {
    padding: var(--spacing-md);
    flex-direction: column;
    text-align: center;
  }
  
  .filter-row {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }
  
  .search-group,
  .filter-group {
    min-width: unset;
  }
  
  .action-bar {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: stretch;
  }
  
  .action-buttons {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: var(--el-font-size-large);
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .tab-label {
    font-size: var(--el-font-size-small);
  }
}
</style>
