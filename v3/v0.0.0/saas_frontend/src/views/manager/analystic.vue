<template>
  <div class="analystic-page">
    <!-- 권한 차단 메시지 -->
    <EnterpriseBlock 
      v-if="!isEnterprisePlan"
      title="상품 분석"
      description="상품 분석 기능은 Enterprise 플랜에서만 사용할 수 있습니다."
    />

    <!-- 기존 콘텐츠 (Enterprise 사용자만) -->
    <template v-else>
      <!-- 전체 화면 로딩 -->
      <AppLoading 
        v-if="actionLoading" 
        :overlay="true"
        text="작업을 처리하는 중입니다..."
      />
      
      <!-- 페이지 헤더 -->
      <div class="page-header">
        <h2 class="page-title">상품 분석</h2>
        <p class="page-description">등록된 상품들의 조회수 통계를 확인하고 관리할 수 있습니다</p>
      </div>

      <!-- 필터링 옵션 -->
      <div class="filter-row">
        <div class="filter-item">
          <label class="filter-label">조회 기간:</label>
          <el-select v-model="filters.days" size="default" style="width: 120px" @change="loadData">
            <el-option label="1일" :value="1" />
            <el-option label="3일" :value="3" />
            <el-option label="7일" :value="7" />
            <el-option label="15일" :value="15" />
            <el-option label="30일" :value="30" />
            <el-option label="45일" :value="45" />
            <el-option label="60일" :value="60" />
            <el-option label="90일" :value="90" />
          </el-select>
        </div>
        
        <div class="filter-item">
          <label class="filter-label">정렬 기준:</label>
          <el-select v-model="filters.market" size="default" style="width: 140px" @change="loadData">
            <el-option label="전체" value="total" />
            <el-option label="쿠팡" value="cou" />
            <el-option label="네이버" value="nav" />
            <el-option label="11번가" value="ele" />
            <el-option label="ESM" value="esm" />
          </el-select>
        </div>

        <div class="filter-item">
          <label class="filter-label">정렬 순서:</label>
          <el-select v-model="filters.sortOrder" size="default" style="width: 100px" @change="loadData">
            <el-option label="내림차순" value="desc" />
            <el-option label="오름차순" value="asc" />
          </el-select>
        </div>

        <div class="filter-item">
          <el-input
            v-model="filters.productId"
            placeholder="상품 ID 검색"
            size="default"
            style="width: 150px"
            clearable
            @keyup.enter="loadData"
            @clear="loadData"
          />
        </div>

        <div class="filter-item">
          <el-input
            v-model="filters.groupId"
            placeholder="관리코드 ID 검색"
            size="default"
            style="width: 150px"
            clearable
            @keyup.enter="loadData"
            @clear="loadData"
          />
        </div>

        <div class="filter-item">
          <label class="filter-label">최소 조회수:</label>
          <el-input
            v-model.number="filters.minViews"
            placeholder="0"
            size="default"
            style="width: 100px"
            type="number"
            :min="0"
            clearable
            @keyup.enter="loadData"
            @clear="loadData"
          />
        </div>

        <div class="filter-item">
          <label class="filter-label">최대 조회수:</label>
          <el-input
            v-model.number="filters.maxViews"
            placeholder="1000"
            size="default"
            style="width: 100px"
            type="number"
            :min="0"
            clearable
            @keyup.enter="loadData"
            @clear="loadData"
          />
        </div>

        <el-button type="primary" :icon="Search" @click="loadData" :loading="loading">
          조회
        </el-button>
        <el-tooltip content="조회수가0인 상품은 집계되지 않습니다" placement="top">
          <el-icon class="info-icon"><InfoFilled /></el-icon>
        </el-tooltip>
      </div>

      <!-- 데이터 테이블 -->
      <el-table
        ref="tableRef"
        :data="tableData"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        empty-text="조회된 데이터가 없습니다"
        class="data-table"
      >
          <el-table-column type="selection" width="55" />
          
          <el-table-column label="상품 정보" min-width="180">
            <template #default="{ row }">
              <div class="product-info">
                <div class="product-image">
                  <img 
                    :src="row.imageUrl?.startsWith('//') ? 'https:' + row.imageUrl : row.imageUrl" 
                    :alt="row.productName"
                    @error="handleImageError"
                  />
                </div>
                <div class="product-details">
                  <div class="product-name">{{ row.productName }}</div>
                  <div class="product-meta">
                    <span class="product-id">ID: {{ row.productId }}</span>
                    <span v-if="row.groupCode" class="group-code">관리코드: {{ row.groupCode }}</span>
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="쿠팡" min-width="120" align="center">
            <template #default="{ row }">
              <div 
                class="platform-card"
                :data-product-number="row.platforms.coopang?.productNumber"
              >
                <div class="platform-info-layer">
                  <div v-if="row.platforms.coopang" class="platform-data">
                    <div class="margin-display">
                      마진률: {{ row.platforms.coopang.currentMargin }}%
                    </div>
                  </div>
                  <div v-else class="platform-empty">-</div>
                </div>
                <div class="views-layer">
                  <div class="views-display">
                    조회수: {{ row.couViews || 0 }}
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="네이버" min-width="120" align="center">
            <template #default="{ row }">
              <div 
                class="platform-card"
                :data-product-number="row.platforms.naver?.productNumber"
              >
                <div class="platform-info-layer">
                  <div v-if="row.platforms.naver" class="platform-data">
                    <div class="margin-display">
                      마진률: {{ row.platforms.naver.currentMargin }}%
                    </div>
                  </div>
                  <div v-else class="platform-empty">-</div>
                </div>
                <div class="views-layer">
                  <div class="views-display">
                    조회수: {{ row.navViews || 0 }}
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="11번가" min-width="120" align="center">
            <template #default="{ row }">
              <div 
                class="platform-card"
                :data-product-number="row.platforms.elevenstore?.productNumber"
              >
                <div class="platform-info-layer">
                  <div v-if="row.platforms.elevenstore" class="platform-data">
                    <div class="margin-display">
                      마진률: {{ row.platforms.elevenstore.currentMargin }}%
                    </div>
                  </div>
                  <div v-else class="platform-empty">-</div>
                </div>
                <div class="views-layer">
                  <div class="views-display">
                    조회수: {{ row.eleViews || 0 }}
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="ESM" min-width="120" align="center">
            <template #default="{ row }">
              <div 
                class="platform-card"
                :data-product-number="row.platforms.esm?.productNumber"
              >
                <div class="platform-info-layer">
                  <div v-if="row.platforms.esm" class="platform-data">
                    <div class="margin-display">
                      마진률: {{ row.platforms.esm.currentMargin }}%
                    </div>
                  </div>
                  <div v-else class="platform-empty">-</div>
                </div>
                <div class="views-layer">
                  <div class="views-display">
                    조회수: {{ row.esmViews || 0 }}
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="전체 조회수" min-width="100" align="center">
            <template #default="{ row }">
              <div class="total-views">
                <div class="total-views-number">{{ row.totalViews || 0 }}</div>
              </div>
            </template>
          </el-table-column>

          <el-table-column min-width="110" align="center">
            <template #header>
              <div class="header-with-count">
                <span class="product-count">총 {{ tableData.length }}개 상품</span>
              </div>
            </template>
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small"
                :icon="View"
                @click="showDetailModal(row)"
              >
                상세보기
              </el-button>
            </template>
          </el-table-column>
      </el-table>

      <!-- 선택된 상품 액션 -->
      <div v-if="selectedProducts.length > 0" class="action-container">
        <div class="action-header">
          <h3 class="action-title">선택된 상품 관리</h3>
          <span class="selected-info">{{ selectedProducts.length }}개 선택됨</span>
        </div>
        
        <div class="action-buttons">
          <!-- 영구 삭제 -->
          <el-tooltip content="모든 마켓 + 루프톤에서 상품을 영구 삭제하는 기능입니다" placement="top">
            <el-button 
              type="danger" 
              :icon="Delete" 
              :loading="actionLoading"
              @click="handleDeleteProducts"
            >
              영구 삭제
            </el-button>
          </el-tooltip>

          <!-- 마켓에서 내리기 -->
          <div class="market-remove-action">
            <el-select v-model="selectedMarket" placeholder="마켓 선택" size="default" class="market-select">
              <el-option label="쿠팡" value="coopang" />
              <el-option label="네이버" value="naver" />
              <el-option label="11번가" value="elevenstore" />
              <el-option label="ESM" value="esm" />
            </el-select>
            <el-tooltip content="해당하는 마켓에서 상품을 내리는 기능이며, 재등록 가능합니다" placement="top">
              <el-button 
                type="primary" 
                :icon="Remove" 
                :loading="actionLoading"
                :disabled="!selectedMarket"
                @click="handleRemoveFromMarket"
              >
                마켓에서 내리기
              </el-button>
            </el-tooltip>
          </div>

          <!-- 가격 인하 -->
          <div class="price-change-action">
            <el-input
              v-model.number="discountPercent"
              placeholder="할인율(%)"
              size="default"
              class="discount-input"
              type="number"
              :min="1"
              :max="90"
            />
            <el-select v-model="priceChangeMarket" placeholder="마켓 선택" size="default" class="market-select">
              <el-option label="쿠팡" value="coopang" />
              <el-option label="네이버" value="naver" />
              <el-option label="11번가" value="elevenstore" />
            </el-select>
            <el-tooltip content="상품가격은 설정한 최저수익률 아래로 내려가지 않습니다. ESM은 가격 변경을 지원하지 않습니다." placement="top">
              <el-button 
                type="primary" 
                :icon="EditPen" 
                :loading="actionLoading"
                :disabled="!discountPercent || !priceChangeMarket"
                @click="handleChangePrice"
              >
                가격 인하
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </div>

      <!-- 상세정보 모달 -->
      <viewDetailModal
        :visible="detailModalVisible"
        :product-data="detailData"
        @close="handleCloseDetailModal"
      />
    </template>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { 
  Search, 
  View, 
  Delete, 
  Remove, 
  EditPen,
  InfoFilled
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  getTrackingStats, 
  deleteProductsPermanently,
  removeFromMarket,
  changePrice
} from '@/services/manager';
import { getUser } from '@/services/auth';
import viewDetailModal from '@/components/manager/viewDetailModal.vue';
import EnterpriseBlock from '@/components/block/enterpriseBlock.vue';
import AppLoading from '@/components/app/loading.vue';

export default {
  name: 'AnalysticPage',
  components: {
    viewDetailModal,
    EnterpriseBlock,
    AppLoading
  },
  setup() {
    // 사용자 권한 확인
    const user = ref(null);
    const isEnterprisePlan = ref(false);
    
    // 기본 상태
    const loading = ref(false);
    const actionLoading = ref(false);
    
    // 필터링
    const filters = ref({
      days: 30,
      market: 'total',
      sortOrder: 'desc',
      productId: '',
      groupId: '',
      minViews: null,
      maxViews: null
    });

    // 테이블 데이터
    const tableData = ref([]);
    const selectedProducts = ref([]);
    
    // 선택 관련
    const allSelected = ref(false);
    const isIndeterminate = computed(() => {
      const selected = selectedProducts.value.length;
      const total = tableData.value.length;
      return selected > 0 && selected < total;
    });

    // 액션 관련
    const selectedMarket = ref('');
    const priceChangeMarket = ref('');
    const discountPercent = ref(null);

    // 상세 모달
    const detailModalVisible = ref(false);
    const detailData = ref(null);

    // 데이터 로드
    const loadData = async () => {
      loading.value = true;
      try {
        const params = {
          days: filters.value.days,
          market: filters.value.market,
          sortOrder: filters.value.sortOrder
        };
        
        if (filters.value.productId) {
          params.productId = filters.value.productId;
        }
        
        if (filters.value.groupId) {
          params.groupId = filters.value.groupId;
        }
        
        if (filters.value.minViews !== null && filters.value.minViews !== '') {
          params.minViews = filters.value.minViews;
        }
        
        if (filters.value.maxViews !== null && filters.value.maxViews !== '') {
          params.maxViews = filters.value.maxViews;
        }

        const response = await getTrackingStats(params);
        
        if (response.success) {
          tableData.value = response.data || [];
          ElMessage.success(response.message || '데이터를 성공적으로 불러왔습니다.');
        } else {
          throw new Error(response.message || '데이터 로드 실패');
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        ElMessage.error(error.response?.data?.message || '데이터 로드 중 오류가 발생했습니다.');
        tableData.value = [];
      } finally {
        loading.value = false;
        // 선택 초기화
        selectedProducts.value = [];
        allSelected.value = false;
      }
    };

    // 선택 관련 함수들
    const handleSelectAll = (checked) => {
      if (checked) {
        selectedProducts.value = [...tableData.value];
      } else {
        selectedProducts.value = [];
      }
    };

    const handleSelectionChange = (selection) => {
      selectedProducts.value = selection;
      allSelected.value = selection.length === tableData.value.length && tableData.value.length > 0;
    };

    // 상세 모달 관련
    const showDetailModal = (row) => {
      detailData.value = row;
      detailModalVisible.value = true;
    };

    const handleCloseDetailModal = () => {
      detailModalVisible.value = false;
      detailData.value = null;
    };

    // 액션 함수들
    const handleDeleteProducts = async () => {
      if (selectedProducts.value.length === 0) return;
      
      try {
        await ElMessageBox.confirm(
          `선택한 ${selectedProducts.value.length}개 상품을 영구적으로 삭제하시겠습니까? 상품은 모든 마켓과 루프톤에서 삭제되며 되돌릴 수 없습니다.`,
          '영구 삭제',
          {
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
            type: 'warning',
          }
        );

        actionLoading.value = true;

        const productsToDelete = selectedProducts.value.map(product => ({
          productid: product.productId
        }));

        if (productsToDelete.length === 0) {
          ElMessage.warning('삭제할 상품이 없습니다.');
          return;
        }

        const response = await deleteProductsPermanently({
          products: productsToDelete
        });

        ElMessage.success(response.message || '삭제 요청이 성공적으로 처리되었습니다.');
        await loadData();
      } catch (error) {
        if (error !== 'cancel') {
          console.error('상품 삭제 실패:', error);
          ElMessage.error(error.response?.data?.message || '상품 삭제 중 오류가 발생했습니다.');
        }
      } finally {
        actionLoading.value = false;
      }
    };

    const handleRemoveFromMarket = async () => {
      if (selectedProducts.value.length === 0 || !selectedMarket.value) return;
      
      const marketNames = {
        coopang: '쿠팡',
        naver: '네이버',
        elevenstore: '11번가',
        esm: 'ESM'
      };

      try {
        const baseMessage = `선택한 ${selectedProducts.value.length}개 상품을 ${marketNames[selectedMarket.value]}에서 내리시겠습니까?`;
        let additionalInfo = '';
        
        if (selectedMarket.value === 'elevenstore') {
          additionalInfo = '\n\n상품의 완전한 삭제는 11번가 셀러오피스에 로그인해 판매중지상품->모든상품 선택을 통해 삭제해 주세요';
        } else if (selectedMarket.value === 'esm') {
          additionalInfo = '\n\nESM은 서버에서만 처리되며 외부 API 호출 없이 즉시 처리됩니다.';
        }
        
        await ElMessageBox.confirm(
          baseMessage + additionalInfo,
          '마켓에서 내리기',
          {
            confirmButtonText: '확인',
            cancelButtonText: '취소',
            type: 'info',
          }
        );

        actionLoading.value = true;
        
        const products = selectedProducts.value
          .filter(product => product.platforms[selectedMarket.value])
          .map(product => ({
            productid: product.productId
          }));

        if (products.length === 0) {
          ElMessage.warning('선택된 마켓에 등록된 상품이 없습니다.');
          return;
        }

        const response = await removeFromMarket({
          platform: selectedMarket.value,
          products: products
        });

        if (response.success) {
          ElMessage.success(response.message || '선택된 상품들이 마켓에서 내려졌습니다.');
          selectedMarket.value = '';
          await loadData();
        } else {
          ElMessage.info(response.message || '마켓에서 내리기에 실패했습니다.');
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('마켓에서 내리기 실패:', error);
          ElMessage.error(error.response?.data?.message || '마켓에서 내리기 중 오류가 발생했습니다.');
        }
      } finally {
        actionLoading.value = false;
      }
    };

    const handleChangePrice = async () => {
      if (selectedProducts.value.length === 0 || !discountPercent.value || !priceChangeMarket.value) return;
      
      const marketNames = {
        coopang: '쿠팡',
        naver: '네이버',
        elevenstore: '11번가'
      };

      try {
        await ElMessageBox.confirm(
          `선택한 ${selectedProducts.value.length}개 상품의 가격을 ${discountPercent.value}% 인하하시겠습니까? (${marketNames[priceChangeMarket.value]}) 가격은 최저수익률 아래로 내려가지 않습니다.`,
          '가격 인하',
          {
            confirmButtonText: '확인',
            cancelButtonText: '취소',
            type: 'info',
          }
        );

        actionLoading.value = true;
        
        const productIds = selectedProducts.value
          .filter(product => product.platforms[priceChangeMarket.value])
          .map(product => product.productId);
          
        if (productIds.length === 0) {
          ElMessage.warning('선택된 마켓에 등록된 상품이 없습니다.');
          return;
        }

        const response = await changePrice({
          productIds: productIds,
          platform: priceChangeMarket.value,
          discountPercent: discountPercent.value
        });

        if (response.success) {
          ElMessage.success(response.message || '가격이 성공적으로 변경되었습니다.');
          discountPercent.value = null;
          priceChangeMarket.value = '';
          await loadData();
        } else {
          ElMessage.info(response.message || '가격 변경에 실패했습니다.');
          await loadData();
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('가격 변경 실패:', error);
          ElMessage.error(error.response?.data?.message || '가격 변경 중 오류가 발생했습니다.');
        }
      } finally {
        actionLoading.value = false;
      }
    };

    // 유틸리티 함수들
    const handleImageError = (event) => {
      event.target.src = '/src/assets/option.png'; // 기본 이미지로 대체
    };

    // 컴포넌트 마운트 시 사용자 권한 확인 및 데이터 로드
    onMounted(() => {
      // 사용자 정보 확인
      user.value = getUser();
      isEnterprisePlan.value = user.value?.plan === 'enterprise';
      
      // Enterprise 플랜인 경우에만 데이터 로드
      if (isEnterprisePlan.value) {
        loadData();
      }
    });

    return {
      // 권한
      user,
      isEnterprisePlan,
      
      // 상태
      loading,
      actionLoading,
      
      // 필터링
      filters,
      
      // 테이블
      tableData,
      selectedProducts,
      allSelected,
      isIndeterminate,
      
      // 액션
      selectedMarket,
      priceChangeMarket,
      discountPercent,
      
      // 상세 모달
      detailModalVisible,
      detailData,
      
      // 함수들
      loadData,
      handleSelectAll,
      handleSelectionChange,
      showDetailModal,
      handleCloseDetailModal,
      handleDeleteProducts,
      handleRemoveFromMarket,
      handleChangePrice,
      handleImageError,
      
      // 아이콘들
      Search,
      View,
      Delete,
      Remove,
      EditPen,
      InfoFilled
    };
  }
};
</script>

<style scoped>
.analystic-page {
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
  margin: 0 0 var(--spacing-xs) 0;
}

.page-description {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-base);
  margin: 0;
}

/* 필터링 */

.filter-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--el-border-color-lighter);
  margin-bottom: var(--spacing-sm);
}

.filter-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.filter-label {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

/* 테이블 */
.data-table {
  flex: 1;
  overflow: auto;
}

.header-with-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.product-count {
  font-size: var(--el-font-size-extra-small);
  color: var(--el-text-color-secondary);
  font-weight: var(--el-font-weight-normal);
}

/* 상품 정보 */
.product-info {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.product-image img {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: var(--el-border-radius-small);
  border: 1px solid var(--el-border-color-lighter);
}

.product-details {
  flex: 1;
}

.product-name {
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-primary);
  margin-bottom: var(--spacing-xs);
  line-height: 1.4;
}

.product-meta {
  display: flex;
  gap: var(--spacing-sm);
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
}

/* 플랫폼 카드 (2층 구조) */
.platform-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs);
  min-height: 60px;
  justify-content: center;
}

.platform-info-layer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.platform-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.margin-display {
  font-size: var(--el-font-size-small);
  color: var(--el-color-success);
  font-weight: var(--el-font-weight-bold);
  text-align: center;
  line-height: 1.2;
}

.platform-empty {
  color: var(--el-text-color-placeholder);
  font-size: var(--el-font-size-base);
  font-weight: var(--el-font-weight-medium);
}

.views-layer {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: var(--spacing-xs);
  border-top: 1px solid var(--el-border-color-extra-light);
}

.views-display {
  font-size: var(--el-font-size-small);
  color: var(--el-color-primary);
  font-weight: var(--el-font-weight-bold);
  text-align: center;
  line-height: 1.2;
}

/* 전체 조회수 */
.total-views {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
}

.total-views-number {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-color-primary-dark-2);
  line-height: 1;
}

.total-views-label {
  font-size: var(--el-font-size-extra-small);
  color: var(--el-text-color-secondary);
  font-weight: var(--el-font-weight-medium);
}



/* 액션 컨테이너 */
.action-container {
  background-color: var(--el-bg-color);
  padding: var(--spacing-sm) var(--spacing-md);
  border-top: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
  margin-top: var(--spacing-xs);
}

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.action-title {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  margin: 0;
}

.selected-info {
  color: var(--el-color-primary);
  font-weight: var(--el-font-weight-medium);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  flex-wrap: wrap;
}

/* 영구 삭제 버튼 (1 비율) */
.action-buttons > .el-tooltip {
  flex: 1;
}

.market-remove-action,
.price-change-action {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

/* 마켓에서 내리기 (2 비율) */
.market-remove-action {
  flex: 2;
}

/* 가격 인하 (3 비율) */
.price-change-action {
  flex: 3;
}

/* 인풋 요소 자동 크기 조정 */
.market-select {
  flex: 1;
  min-width: 80px;
}

.discount-input {
  flex: 1;
  min-width: 60px;
}

/* 모든 액션 버튼 크기 통일 */
.action-buttons .el-button {
  min-width: 120px;
  flex-shrink: 0;
}

/* 툴팁 아이콘 */
.info-icon {
  color: var(--el-color-info);
  cursor: pointer;
  margin-left: var(--spacing-xs);
  font-size: var(--el-font-size-base);
  transition: color 0.2s ease;
}

.info-icon:hover {
  color: var(--el-color-info-dark-2);
}



/* 반응형 디자인 */
@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }
  
  .action-buttons > .el-tooltip,
  .market-remove-action,
  .price-change-action {
    flex: none;
    width: 100%;
    justify-content: flex-start;
  }
  
  .market-select,
  .discount-input {
    flex: 1;
    min-width: unset;
  }
  
  .action-buttons .el-button {
    min-width: unset;
    width: 100%;
  }
  

}

@media (max-width: 480px) {
  .page-header {
    padding: var(--spacing-sm);
  }
  
  .action-container {
    padding: var(--spacing-xs);
  }
  
  .product-info {
    flex-direction: column;
    text-align: center;
  }
  
  .platform-card {
    min-height: 50px;
    padding: var(--spacing-xs);
  }
  
  .margin-display,
  .views-display {
    font-size: var(--el-font-size-extra-small);
  }

  .total-views-number {
    font-size: var(--el-font-size-medium);
  }

  .total-views-label {
    font-size: var(--el-font-size-extra-small);
  }
}
</style>
