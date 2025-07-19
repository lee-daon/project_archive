<template>
  <div class="shop-collection-page">
    <div class="page-header">
      <h2 class="page-title">쇼핑몰 소싱</h2>
      <p class="page-description">쇼핑몰 상품 URL 또는 쇼핑몰 URL을 입력하세요.</p>
    </div>
    
    <div class="content-container">
      <div class="shop-form-card card">
        <div class="card-header">
          <h3 class="card-title">소싱 설정</h3>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label for="shop-url" class="form-label">URL 입력</label>
            <input 
              type="url" 
              id="shop-url" 
              class="form-input" 
              v-model="shopUrl" 
              placeholder="https://item.taobao.com/item.htm?id=... 또는 https://shop1234.taobao.com/..." 
            />
            <p class="input-help">타오바오, 티몰 또는 알리익스프레스 URL을 입력하세요</p>
          </div>
          
          <div class="form-group">
            <label for="item-count" class="form-label">수집 개수</label>
            <input 
              type="number" 
              id="item-count" 
              class="form-input" 
              v-model="itemCount" 
              min="1" 
              max="200" 
            />
            <p class="input-help">수집할 상품의 개수를 입력하세요 (최대 200개)</p>
          </div>
          
          <div v-if="shopUrl.trim()" class="url-type-display">
            <div class="url-type-badge" :class="{ 'shop-type': isShop, 'product-type': !isShop }">
              <span class="type-icon">{{ isShop ? '🏪' : '📦' }}</span>
              <span class="type-text">{{ isShop ? '쇼핑몰 URL' : '상품 URL' }}</span>
            </div>
          </div>
          
          <div class="button-group">
            <button 
              class="primary-button"
              @click="startSourcing"
              :disabled="isLoading || !isValidUrl"
            >
              <span v-if="isLoading" class="loading-spinner"></span>
              {{ isLoading ? '수집 중...' : '수집 시작' }}
            </button>
            <button 
              class="secondary-button"
              @click="resetForm"
              :disabled="isLoading"
            >
              초기화
            </button>
          </div>
        </div>
      </div>
      

    </div>
    
    <!-- 경고 모달 -->
    <div v-if="showWarningModal" class="modal-overlay">
      <div class="modal-container card">
        <div class="modal-header">
          <div class="modal-title-section">
            <span class="modal-icon" :class="{ 'danger': isBannedShop, 'warning': !isBannedShop }">
              {{ isBannedShop ? '🚫' : '⚠️' }}
            </span>
            <h3 class="modal-title">
              {{ isBannedShop ? '금지된 소싱 대상' : '소싱 확인 필요' }}
            </h3>
          </div>
          <button class="close-button" @click="closeWarningModal">
            <span>✕</span>
          </button>
        </div>
        
        <div class="modal-body">
          <p class="warning-message">{{ warningMessage }}</p>
          <div v-if="warningType" class="warning-detail">
            <span class="detail-label">유형:</span>
            <span class="detail-value">{{ warningType === 'shop' ? '쇼핑몰' : '판매자' }}</span>
          </div>
        </div>
        
        <div class="modal-footer">
          <button 
            v-if="needsConfirmation" 
            class="danger-button"
            @click="proceedAnyway"
          >
            계속 진행하기
          </button>
          <button 
            class="secondary-button"
            @click="closeWarningModal"
          >
            {{ needsConfirmation ? '취소' : '확인' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { shopSourcing } from '../../../../services/sourcing';
import { isShopUrl } from '../../../../services/sourcing_service/parseIdList';

export default {
  name: 'ShopCollection',
  setup() {
    const router = useRouter();
    const shopUrl = ref('');
    const itemCount = ref(20);
    const isLoading = ref(false);
    const showWarningModal = ref(false);
    const warningMessage = ref('');
    const warningType = ref(null); // 'shop' 또는 'seller'
    const isBannedShop = ref(false);
    const needsConfirmation = ref(false);
    
    // 현재 소싱 중인 상점/판매자 정보
    const currentShopId = ref(null);
    const currentSellerId = ref(null);
    
    // URL 유형이 쇼핑몰인지 계산
    const isShop = computed(() => {
      return isShopUrl(shopUrl.value);
    });
    
    // URL이 유효한지 계산
    const isValidUrl = computed(() => {
      const url = shopUrl.value.trim();
      if (!url) return false;
      
      // 타오바오, 티몰, 알리익스프레스 URL 검증
      return (
        url.includes('item.taobao.com') || 
        url.includes('detail.tmall.com') || 
        url.includes('aliexpress.com/item') ||
        isShop.value
      );
    });
    
    // 모달 창 닫기
    const closeWarningModal = () => {
      showWarningModal.value = false;
      warningMessage.value = '';
      warningType.value = null;
      currentShopId.value = null;
      currentSellerId.value = null;
      isBannedShop.value = false;
      needsConfirmation.value = false;
    };
    
    // 경고 무시하고 계속 진행
    const proceedAnyway = async () => {
      closeWarningModal();
      await startCollectionProcess(true);
    };
    
    // 폼 초기화
    const resetForm = () => {
      shopUrl.value = '';
      itemCount.value = 20;
    };
    
    // 성공 시 상품 목록 확인 페이지로 이동
    const navigateToProductListCheck = () => {
      setTimeout(() => {
        router.push('/product/sourcing/list');
      }, 300); // 1.5초 후 이동하여 메시지를 볼 수 있도록 함
    };
    
    // 소싱 시작 처리 함수
    const startCollectionProcess = async (ignoreBan = false) => {
      try {
        isLoading.value = true;
        
        // API 호출
        const response = await shopSourcing(
          shopUrl.value,
          parseInt(itemCount.value),
          isShop.value,
          ignoreBan
        );
        
        // 경고가 있는 경우 모달 표시
        if (response.warning) {
          currentShopId.value = response.shopId;
          currentSellerId.value = response.sellerId;
          
          warningMessage.value = response.warning.message || '이 쇼핑몰 또는 판매자는 금지 목록에 있습니다.';
          warningType.value = response.warning.type || null;
          isBannedShop.value = response.warning.banned || false;
          needsConfirmation.value = response.needsConfirmation || false;
          
          showWarningModal.value = true;
          return;
        }
        
        // 성공 메시지 표시
        if (response.success) {
          // 수집된 상품이 없는 경우
          if (response.itemCount === 0) {
            ElMessage.warning('수집된 상품이 없습니다.');
          } else {
            ElMessage.success(response.message || '수집이 성공적으로 완료되었습니다.');
            // 상품 목록 확인 페이지로 이동
            navigateToProductListCheck();
          }
        } else {
          ElMessage.error(response.message || '수집 처리 중 문제가 발생했습니다.');
        }
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '쇼핑몰 소싱 중 오류가 발생했습니다.');
      } finally {
        isLoading.value = false;
      }
    };
    
    // 소싱 시작 핸들러
    const startSourcing = async () => {
      if (!isValidUrl.value) {
        ElMessage.warning('유효한 URL을 입력해주세요.');
        return;
      }
      
      if (!itemCount.value || itemCount.value < 1 || itemCount.value > 200) {
        ElMessage.warning('수집 개수는 1~200 사이의 값을 입력해주세요.');
        return;
      }
      
      await startCollectionProcess(false);
    };

    return {
      shopUrl,
      itemCount,
      isLoading,
      isShop,
      isValidUrl,
      showWarningModal,
      warningMessage,
      warningType,
      isBannedShop,
      needsConfirmation,
      startSourcing,
      resetForm,
      closeWarningModal,
      proceedAnyway
    };
  }
};
</script>

<style scoped>
.shop-collection-page {
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
  font-size: var(--el-font-size-base);
  margin: 0;
}

.content-container {
  flex: 1;
  padding: var(--spacing-md);
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.card {
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-base);
  border: 1px solid var(--el-border-color-lighter);
  transition: box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: var(--el-box-shadow-light);
}

.shop-form-card {
  flex-shrink: 0;
}

.card-header {
  padding: var(--spacing-md) var(--spacing-md) 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: var(--spacing-md);
}

.card-title {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-primary);
  margin: 0;
  padding-bottom: var(--spacing-sm);
}

.card-body {
  padding: 0 var(--spacing-md) var(--spacing-md);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-base);
}

.form-input {
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-primary);
  background-color: var(--el-bg-color);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input:focus {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
  outline: none;
}

.form-input::placeholder {
  color: var(--el-text-color-placeholder);
}

.input-help {
  margin-top: var(--spacing-xs);
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
}

.url-type-display {
  margin-bottom: var(--spacing-md);
}

.url-type-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--el-border-radius-round);
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-medium);
}

.url-type-badge.shop-type {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border: 1px solid var(--el-color-primary-light-7);
}

.url-type-badge.product-type {
  background-color: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
}

.type-icon {
  font-size: var(--el-font-size-base);
}

.button-group {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}

.primary-button {
  background-color: var(--el-color-primary);
  color: var(--el-color-white);
  border: none;
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--el-font-size-base);
  font-weight: var(--el-font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 120px;
  justify-content: center;
}

.primary-button:hover:not(:disabled) {
  background-color: var(--el-color-primary-light-3);
  box-shadow: var(--el-box-shadow-dark);
}

.primary-button:disabled {
  background-color: var(--el-text-color-placeholder);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.secondary-button {
  background-color: var(--el-bg-color);
  color: var(--el-text-color-regular);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--el-font-size-base);
  font-weight: var(--el-font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-button:hover:not(:disabled) {
  background-color: var(--el-bg-color-page);
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.secondary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: var(--el-color-white);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}



/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-md);
}

.modal-container {
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.modal-icon {
  font-size: var(--el-font-size-large);
}

.modal-icon.danger {
  color: var(--el-color-danger);
}

.modal-icon.warning {
  color: var(--el-color-warning);
}

.modal-title {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-primary);
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: var(--el-font-size-large);
  cursor: pointer;
  color: var(--el-text-color-secondary);
  padding: var(--spacing-xs);
  border-radius: var(--el-border-radius-base);
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: var(--el-bg-color-page);
  color: var(--el-text-color-primary);
}

.modal-body {
  padding: var(--spacing-md);
  overflow-y: auto;
}

.warning-message {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-base);
  line-height: 1.5;
}

.warning-detail {
  padding: var(--spacing-sm);
  background-color: var(--el-bg-color-page);
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color-lighter);
}

.detail-label {
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-secondary);
  margin-right: var(--spacing-xs);
}

.detail-value {
  color: var(--el-text-color-primary);
}

.modal-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

.danger-button {
  background-color: var(--el-color-danger);
  color: var(--el-color-white);
  border: none;
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--el-font-size-base);
  font-weight: var(--el-font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.danger-button:hover {
  background-color: #dc2626;
  box-shadow: var(--el-box-shadow-dark);
}
</style> 