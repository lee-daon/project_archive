<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">상품 목록 확인</h2>
      <p class="page-description">소싱된 상품 목록을 확인하고 금지어를 체크하세요.</p>
    </div>
    
    <div class="product-list-check">
      <AppLoading v-if="isLoading" text="로딩 중..." />
      
      <div v-else-if="error" class="error-message">
        <p>{{ error }}</p>
        <button class="retry-button" @click="fetchProductData">다시 시도</button>
      </div>
      
      <div v-else-if="showSuccessMessage" class="success-container">
        <div class="success-icon">✓</div>
        <h3 class="success-title">요청이 성공적으로 처리되었습니다</h3>
        <p class="success-message">{{ apiSuccessMessage }}</p>
        <p class="success-guide">소싱진행상황은 수집결과확인에서 볼 수 있습니다.</p>
        <button class="action-button restart-button" @click="fetchProductData">
          새로운 소싱 시작하기
        </button>
      </div>
      
      <div v-else class="content-container">
        <!-- 상품 통계 정보 -->
        <div class="stats-container">
          <div class="stat-item">
            <span class="stat-label">전체상품</span>
            <span class="stat-value">{{ totalCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">중복상품</span>
            <span class="stat-value">{{ duplicationCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">금지어포함</span>
            <span class="stat-value">{{ includeBanCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">목표개수</span>
            <span class="stat-value target-count">{{ finalTargetCount }}</span>
          </div>
          
          <div class="button-container">
            <div class="code-group">
              <label class="code-label">그룹코드</label>
              <input 
                v-model.number="commitCode" 
                type="number" 
                placeholder="그룹코드 입력"
                min="0"
                class="code-input"
              />
            </div>
            
            <div class="toggle-group">
              <label class="toggle-label">동일 카테고리로 묶기</label>
              <el-tooltip
                content="동일 카테고리로 묶기 사용시 해당 상품은 하나의 카테고리로 판단되며, 카테고리 매핑시 일괄로 매핑할 수 있습니다."
                placement="top"
              >
                <el-switch
                  v-model="sameCategory"
                  class="category-toggle"
                  active-color="var(--el-color-primary)"
                  inactive-color="var(--el-color-info-light-7)"
                />
              </el-tooltip>
            </div>
            
            <button 
              class="action-button start-button" 
              @click="handleStartButtonClick"
              :disabled="isProcessing || productList.length === 0 || finalTargetCount === 0"
            >
              <span v-if="isProcessing" class="loading-spinner small"></span>
              {{ isProcessing ? '처리 중...' : '시작하기' }}
            </button>
            <button 
              class="action-button restart-button" 
              @click="handleRestartButtonClick"
              :disabled="isProcessing"
            >
              새로고침
            </button>
          </div>
        </div>
        
        <!-- 상품 목록 테이블 -->
        <div class="table-container">
          <table v-if="productList.length > 0" class="product-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>이미지</th>
                <th>상품명</th>
                <th>가격</th>
                <th>판매량</th>
                <th>금지어</th>
                <th>금지상태</th>
                <th>URL</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(product, index) in productList" 
                :key="product.productId"
                :class="{ 'banned-item': product.ban }"
              >
                <td class="product-id">{{ product.productId }}</td>
                <td class="product-image">
                  <img 
                    v-if="product.image_url" 
                    :src="product.image_url" 
                    :alt="product.productName"
                  />
                  <span v-else>이미지 없음</span>
                </td>
                <td class="product-name" :title="product.productName">{{ product.productName }}</td>
                <td class="product-price">{{ product.price ? `¥${product.price}` : '-' }}</td>
                <td class="product-sales">
                  {{ (product.sales_count && product.sales_count > 0) ? product.sales_count : '-' }}
                </td>
                <td class="product-banwords">
                  <template v-if="Array.isArray(product.banwords) && product.banwords.length > 0">
                    <div class="banword-container">
                      {{ product.banwords.join(', ') }}
                    </div>
                  </template>
                  <template v-else-if="product.banwords">
                    <div class="banword-container">
                      {{ product.banwords }}
                    </div>
                  </template>
                  <template v-else>-</template>
                </td>
                <td class="product-ban-status">
                  <label class="checkbox-container">
                    <input 
                      type="checkbox" 
                      :checked="product.ban" 
                      @change="toggleBanStatus(index, $event)"
                      class="large-checkbox"
                    />
                    <span class="checkmark"></span>
                  </label>
                </td>
                <td class="product-url">
                  <a 
                    v-if="product.url" 
                    :href="product.url" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >링크</a>
                  <span v-else>-</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-table">
            <p>데이터가 없습니다.</p>
            <p>소싱을 진행한 후 다시 확인해주세요.</p>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { getProductList, updateBanStatus, requestDetailParsing } from '@/services/sourcing';
import AppLoading from '@/components/app/loading.vue';

export default {
  name: 'ProductListCheck',
  components: {
    AppLoading
  },
  setup() {
    // 상태 변수
    const isLoading = ref(true);
    const error = ref(null);
    const isProcessing = ref(false);
    const showSuccessMessage = ref(false);
    const apiSuccessMessage = ref('');
    const commitCode = ref(null);
    const sameCategory = ref(false);
    
    // 상품 데이터
    const productList = ref([]);
    const totalCount = ref(0);
    const duplicationCount = ref(0);
    const includeBanCount = ref(0);
    
    // computed 속성으로 변경하여 실시간 계산
    const finalTargetCount = computed(() => {
      return productList.value.filter(product => !product.ban).length;
    });
    

    
    // 상품 목록 가져오기
    const fetchProductData = async () => {
      isLoading.value = true;
      error.value = null;
      showSuccessMessage.value = false;
      
      try {
        // 서비스 함수를 사용하여 데이터 가져오기
        const data = await getProductList();
        
        if (!data || !data.dataReady) {
          throw new Error('데이터가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
        }
        
        // 데이터 설정
        productList.value = data.bancheckedTarget || [];
        totalCount.value = data.totalCount || 0;
        duplicationCount.value = data.duplicationCount || 0;
        includeBanCount.value = data.includeBanCount || 0;
      } catch (err) {
        console.error('데이터 로드 중 오류 발생:', err);
        error.value = err.response?.data?.message || '데이터를 가져오는 중 오류가 발생했습니다.';
      } finally {
        isLoading.value = false;
      }
    };
    
    // 상품 금지 상태 토글 (finalTargetCount는 이제 computed로 자동 계산됨)
    const toggleBanStatus = (index, event) => {
      productList.value[index].ban = event.target.checked;
    };
    
    // 시작하기 버튼 클릭 핸들러
    const handleStartButtonClick = async () => {
      if (isProcessing.value) {
        ElMessage.warning('이미 처리 중입니다. 잠시만 기다려주세요.');
        return;
      }
      
      // 그룹코드 유효성 검증
      if (!commitCode.value) {
        ElMessage.warning('그룹코드를 입력해주세요.');
        return;
      }
      
      if (isNaN(commitCode.value) || !Number.isInteger(commitCode.value) || commitCode.value <= 0) {
        ElMessage.warning('그룹코드는 1 이상의 정수를 입력해주세요.');
        return;
      }
      
      isProcessing.value = true;
      isLoading.value = true;
      
      try {
        // 금지 상태 업데이트 데이터 준비
        const updatedData = productList.value.map(product => ({
          productId: product.productId,
          ban: product.ban
        }));
        
        // 서비스 함수를 사용하여 금지 상태 업데이트
        const updateResult = await updateBanStatus(updatedData);
        
        if (!updateResult.success) {
          throw new Error(updateResult.message || '금지 상태 업데이트에 실패했습니다.');
        }
        
        // 금지되지 않은 상품만 필터링
        const nonBannedProducts = productList.value
          .filter(product => !product.ban)
          .map(({ productId, productName }) => ({
            productId,
            productName
          }));
        
        // 서비스 함수를 사용하여 상세 페이지 파싱 요청
        const parseResult = await requestDetailParsing(nonBannedProducts, commitCode.value, sameCategory.value);
        
        if (!parseResult.success && !parseResult.message) {
          console.warn('상세 페이지 파싱 요청 응답에 메시지가 없습니다.');
        }
        
        // API 응답 메시지 표시 및 성공 처리
        apiSuccessMessage.value = parseResult.message || `${nonBannedProducts.length}개 상품의 상세 정보 파싱 요청이 접수되었습니다.`;
        showSuccessMessage.value = true;
        
        // 상품 목록 정리 (상품 처리가 완료되었으므로 화면에서 숨김)
        productList.value = [];
        
        // 완료 알림
        ElMessage.success('상품 처리가 성공적으로 완료되었습니다.');
      } catch (err) {
        console.error('시작하기 처리 중 오류 발생:', err);
        error.value = err.response?.data?.message || '작업 처리 중 오류가 발생했습니다.';
        ElMessage.error(error.value);
      } finally {
        isProcessing.value = false;
        isLoading.value = false;
      }
    };
    
    // 새로고침 버튼 클릭 핸들러
    const handleRestartButtonClick = () => {
      if (isProcessing.value) {
        ElMessage.warning('이미 처리 중입니다. 잠시만 기다려주세요.');
        return;
      }
      
      if (confirm('정말로 다시 시작하시겠습니까? 현재 상태가 초기화됩니다.')) {
        fetchProductData();
        ElMessage.info('페이지가 새로고침되었습니다.');
      }
    };
    
    // 컴포넌트 마운트 시 데이터 로드
    onMounted(() => {
      fetchProductData();
    });
    
    return {
      isLoading,
      error,
      isProcessing,
      productList,
      totalCount,
      duplicationCount,
      includeBanCount,
      finalTargetCount,
      showSuccessMessage,
      apiSuccessMessage,
      commitCode,
      sameCategory,
      fetchProductData,
      toggleBanStatus,
      handleStartButtonClick,
      handleRestartButtonClick
    };
  }
}
</script>

<style scoped>
.page-container {
  height: 100%;
  overflow-y: auto;
  background-color: var(--el-bg-color-page);
  display: flex;
  flex-direction: column;
}

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
  margin-bottom: var(--spacing-xs);
}

.page-description {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
  margin: 0;
}

.product-list-check {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-md);
  font-family: 'Noto Sans KR', sans-serif;
  flex: 1;
  height: 100%;
}



/* 오류 메시지 */
.error-message {
  background-color: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  color: var(--el-color-danger);
}

.retry-button {
  background-color: var(--el-color-danger);
  color: var(--el-color-white);
  border: none;
  border-radius: var(--el-border-radius-small);
  padding: var(--spacing-xs) var(--spacing-md);
  margin-top: var(--spacing-xs);
  cursor: pointer;
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-medium);
}

.retry-button:hover {
  background-color: var(--el-color-danger-light-3);
}

/* 성공 화면 스타일 */
.success-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl) var(--spacing-md);
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
  text-align: center;
  flex-grow: 1;
}

.success-icon {
  width: 60px;
  height: 60px;
  background-color: var(--el-color-success);
  color: var(--el-color-white);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  margin-bottom: var(--spacing-md);
}

.success-title {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-primary);
  margin-bottom: var(--spacing-sm);
}

.success-message {
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-regular);
  margin-bottom: var(--spacing-xs);
}

.success-guide {
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-medium);
  color: var(--el-color-primary);
  margin-bottom: var(--spacing-lg);
}

/* 컨텐츠 레이아웃 */
.content-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-grow: 1;
}

/* 통계 정보 */
.stats-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-md);
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-md);
  box-shadow: var(--el-box-shadow-light);
}

.stat-item {
  display: flex;
  align-items: center;
}

.stat-label {
  font-weight: var(--el-font-weight-medium);
  margin-right: var(--spacing-xs);
  color: var(--el-text-color-regular);
  font-size: var(--el-font-size-small);
}

.stat-value {
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-primary);
  font-weight: var(--el-font-weight-semibold);
}

.target-count {
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-color-primary);
  animation: highlight 0.5s ease-out;
}

@keyframes highlight {
  0% {
    background-color: var(--el-color-primary-light-9);
  }
  100% {
    background-color: transparent;
  }
}

/* 버튼 컨테이너 */
.button-container {
  margin-left: auto;
  display: flex;
  gap: 8px;
  align-items: center;
}

.code-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.code-input {
  width: 180px;
  padding: 8px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  font-size: 14px;
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.code-input:focus {
  outline: none;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
}

.code-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
  font-weight: var(--el-font-weight-medium);
  white-space: nowrap;
}

.action-button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.start-button {
  background-color: var(--el-color-primary);
  color: var(--el-color-white);
}

.start-button:hover:not(:disabled) {
  background-color: var(--el-color-primary-light-3);
}

.start-button:disabled {
  background-color: var(--el-text-color-placeholder);
  cursor: not-allowed;
}

.restart-button {
  background-color: var(--el-bg-color-page);
  color: var(--el-text-color-regular);
}

.restart-button:hover:not(:disabled) {
  background-color: var(--el-border-color-lighter);
}

/* 테이블 스타일 */
.table-container {
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
  box-shadow: var(--el-box-shadow-light);
  flex-grow: 1;
  max-height: calc(100vh - 280px);
  overflow-y: auto;
}

.product-table {
  width: 100%;
  border-collapse: collapse;
}

.product-table th,
.product-table td {
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.product-table th {
  background-color: var(--el-bg-color-page);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-regular);
  font-size: var(--el-font-size-small);
  position: sticky;
  top: 0;
  z-index: 10;
}

.product-table tr:hover {
  background-color: var(--el-bg-color-page);
}

/* 금지된 아이템 스타일 */
.banned-item {
  background-color: var(--el-color-danger-light-9);
}

.banned-item:hover {
  background-color: var(--el-color-danger-light-8);
}

/* 셀 스타일 */
.product-id {
  font-family: monospace;
  font-size: var(--el-font-size-extra-small);
  color: var(--el-text-color-secondary);
}

.product-image {
  position: relative;
}

.product-image img {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: var(--el-border-radius-small);
  border: 1px solid var(--el-border-color-lighter);
  transition: transform 0.2s;
  cursor: zoom-in;
}

.product-image img:hover {
  position: absolute;
  transform: scale(3);
  z-index: 10;
  box-shadow: var(--el-box-shadow-dark);
}

.product-name {
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--el-font-size-small);
}

.product-price, .product-sales, .product-banwords {
  font-size: var(--el-font-size-small);
}

.banword-container {
  color: var(--el-color-danger);
  font-size: var(--el-font-size-small);
  line-height: 1.5;
  display: flex;
  align-items: center;
}

.product-banwords {
  padding: var(--spacing-sm) var(--spacing-md);
  vertical-align: middle;
}

.product-ban-status {
  text-align: center;
  vertical-align: middle;
}

/* 커스텀 체크박스 */
.checkbox-container {
  position: relative;
  display: inline-block;
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 24px;
  width: 24px;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-small);
}

.checkbox-container:hover input ~ .checkmark {
  background-color: var(--el-bg-color-page);
}

.checkbox-container input:checked ~ .checkmark {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container .checkmark:after {
  left: 9px;
  top: 5px;
  width: 6px;
  height: 10px;
  border: solid var(--el-color-white);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* 빈 테이블 메시지 */
.empty-table {
  padding: var(--spacing-xl) 0;
  text-align: center;
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  color: var(--el-text-color-secondary);
}

.empty-table p {
  margin: var(--spacing-xs) 0;
  font-size: var(--el-font-size-small);
}

.empty-table p:first-child {
  font-weight: var(--el-font-weight-medium);
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-regular);
  margin-bottom: var(--spacing-xs);
}


</style> 