<template>
  <div class="category-collection-page">
    <!-- 상품이 없을 때만 헤더 표시 -->
    <div v-if="products.length === 0 && !isLoading" class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">키워드로 수집하기</h1>
          <div class="connection-status" :class="{ 'connected': isConnected }">
            <span class="status-indicator"></span>
            <span class="status-text">
              {{ isConnected ? '수집기와 연결됨' : '수집기 연결 대기 중...' }}
            </span>
            <button v-if="!isConnected" class="help-button" @click="showHelpModal = true">
              <span>?</span>
            </button>
          </div>
        </div>
        <p class="page-description">타오바오에서 크롬 확장 프로그램을 통해 상품을 수집합니다.(미연결시 새로고침 부탁드립니다.)</p>
        <a href="https://www.taobao.com/" target="_blank" class="taobao-link">
          타오바오 바로가기
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/>
          </svg>
        </a>
      </div>
    </div>
    
    <div class="content-container" :class="{ 'full-height': products.length > 0 || isLoading }">
      <!-- 로딩 상태 -->
      <div v-if="isLoading" class="loading-card card">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <p class="loading-text">상품 데이터 처리 중...</p>
        </div>
      </div>
      
      <!-- 상품이 있는 경우 -->
      <div v-else-if="products.length > 0" class="products-section">
        <!-- 상품 헤더 카드 -->
        <div class="products-header-card card">
          <div class="products-header-content">
            <div class="products-summary">
              <h2 class="products-title">수집된 상품</h2>
              <p class="products-count">
                총 {{ products.length }}개 상품 중 {{ selectedProducts.length }}개 선택됨
              </p>
            </div>
            
            <div class="products-actions">
              <el-button 
                @click="toggleAllSelection" 
                type="info"
                size="small"
                :disabled="isSaving"
              >
                {{ selectedProducts.length === products.length ? '전체 해제' : '전체 선택' }}
              </el-button>
              <el-button 
                @click="saveProducts" 
                type="primary"
                :disabled="isSaving || selectedProducts.length === 0"
              >
                <span v-if="isSaving" class="button-loading-spinner"></span>
                {{ isSaving ? '처리중...' : '수집 시작하기' }}
              </el-button>
              <el-button 
                @click="clearProducts" 
                type="danger"
                plain
                :disabled="isSaving"
              >
                초기화
              </el-button>
            </div>
          </div>
        </div>
        
        <!-- 상품 그리드 카드 -->
        <div class="products-grid-card card">
          <div class="products-grid-header">
            <h3 class="grid-title">상품 목록</h3>
          </div>
          <div class="products-grid-container">
            <div class="products-grid">
              <div 
                v-for="(product, index) in products" 
                :key="index" 
                class="product-item"
                :class="{ 'selected': isProductSelected(index) }"
                @click="toggleProductSelection(index)"
              >
                <div class="product-selection-indicator">
                  <div class="selection-checkbox" :class="{ 'checked': isProductSelected(index) }">
                    <el-icon v-if="isProductSelected(index)" :size="12">
                      <Check />
                    </el-icon>
                  </div>
                </div>
                <div class="product-image-container">
                  <img :src="product.image" :alt="product.title" loading="lazy" draggable="false">
                </div>
                <div class="product-info">
                  <h4 class="product-title" :title="product.title">{{ product.title }}</h4>
                  <div class="product-details">
                    <div class="product-price">가격: {{ product.price }}</div>
                    <div class="product-sales">판매량: {{ product.sold }}</div>
                    <div class="product-id">ID: {{ product.id }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 사용 방법 (상품이 없을 때) -->
      <div v-else class="instructions-card card">
        <div class="instructions-content">
          <div class="instructions-icon">
            <el-icon :size="48">
              <Document />
            </el-icon>
          </div>
          <h2 class="instructions-title">사용 방법</h2>
          <ol class="instructions-list">
            <li>타오바오/티몰 상품 목록 페이지에서 크롬 확장 프로그램 실행</li>
            <li>목표 수(페이지 수 또는 상품 수) 입력</li>
            <li>시작 버튼 클릭</li>
            <li>수집 완료 후 수집된 상품 확인 및 저장</li>
          </ol>
        </div>
      </div>
      
      <!-- 에러 메시지 -->
      <div v-if="error" class="error-card card">
        <div class="error-content">
          <div class="error-icon">
            <el-icon :size="30">
              <Warning />
            </el-icon>
          </div>
          <div class="error-message">
            <h3>오류가 발생했습니다</h3>
            <p>{{ error }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 도움말 모달 -->
    <div v-if="showHelpModal" class="modal-overlay">
      <div class="modal-container card">
        <div class="modal-header">
          <div class="modal-title-section">
            <span class="modal-icon">
              <el-icon :size="20">
                <InfoFilled />
              </el-icon>
            </span>
            <h3 class="modal-title">크롬 확장 프로그램 설치 안내</h3>
          </div>
          <button class="close-button" @click="showHelpModal = false">
            <span>✕</span>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="help-content">
            <div class="help-section">
              <h4 class="help-section-title">이미 설치하셨다면 새로고침을 시도해 보세요!!</h4>
            </div>
            
            <div class="help-section">
              <h4 class="help-section-title">아직 설치하지 않으셨다면 설치를 진행해 주세요</h4>
              <ol class="help-steps">
                <li>크롬 확장 프로그램 설치</li>
                <li>웹앱에 접속하여 로그인</li>
                <li>타오바오 상품 목록 페이지 접속</li>
                <li>확장 프로그램 아이콘 클릭</li>
                <li>목표 수(페이지 수 또는 상품 수) 입력</li>
                <li>시작 버튼 클릭</li>
                <li>수집 완료 후 웹앱 탭으로 자동 전환</li>
              </ol>
            </div>
            
            <div class="help-section">
              <h4 class="help-section-title">설치 방법</h4>
              <h5 class="help-subsection-title">개발자 모드로 설치</h5>
              <ol class="help-steps">
                <li>크롬 확장 관리 페이지 접속 (chrome://extensions/)</li>
                <li>개발자 모드 활성화 (우측 상단)</li>
                <li>'압축해제된 확장 프로그램 로드' 클릭</li>
                <li>다운로드한 폴더 선택</li>
              </ol>
            </div>
          </div>
          
          <div class="download-section">
            <el-button 
              type="primary" 
              size="large"
              tag="a"
              href="/chrome_ext_categorySourcing.zip" 
              download
            >
              <el-icon :size="16">
                <Download />
              </el-icon>
              확장 프로그램 다운로드
            </el-button>
            <p class="download-info">최신 버전: v1.0.0 (2023-09-01 업데이트)</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { uploadProducts } from '../../../../services/sourcing';
import { mapProductsForUpload } from '../../../../services/sourcing_service/mapping';
import { Document, Warning, InfoFilled, Download, Check } from '@element-plus/icons-vue';

export default {
  name: 'CategoryCollection',
  
  setup() {
    const router = useRouter();
    
    return { 
      router,
      Document,
      Warning,
      InfoFilled,
      Download,
      Check
    };
  },
  
  data() {
    return {
      isConnected: false,
      isLoading: false,
      isSaving: false,
      products: [],
      selectedProducts: [],
      error: null,
      showHelpModal: false
    };
  },
  
  mounted() {
    // window.postMessage 이벤트 리스너 등록
    window.addEventListener('message', this.handleExternalMessage);
    
    // 컴포넌트 마운트 시 연결되지 않은 상태로 시작
    this.isConnected = false;
    
    console.log('CategoryCollection 컴포넌트가 마운트되었습니다.');
  },
  
  beforeUnmount() {
    // 이벤트 리스너 제거
    window.removeEventListener('message', this.handleExternalMessage);
  },
  
  methods: {
    /**
     * 크롬 확장 프로그램에서 받은 메시지 처리
     */
    handleExternalMessage(event) {
      // 메시지 출처가 타오바오 스크래퍼 확장 프로그램인지 확인
      if (event.data && event.data.source === 'taobao-scraper-extension') {
        console.log('확장 프로그램으로부터 메시지 수신:', event.data);
        
        if (event.data.action === 'importProducts' && Array.isArray(event.data.data)) {
          this.receiveProducts(event.data.data);
          
          // 확장 프로그램에 응답
          window.postMessage({
            source: 'b-web-app-response',
            success: true
          }, '*');
        } 
        
        // 연결 테스트 메시지 처리
        else if (event.data.action === 'connectionTest') {
          this.isConnected = true;
          
          // 연결 확인 응답 보내기
          window.postMessage({
            source: 'b-web-app-response',
            action: 'connectionConfirm',
            success: true,
            data: {
              timestamp: event.data.data.timestamp
            }
          }, '*');
          
          console.log('수집기와 연결됨');
        }
      }
    },
    
    /**
     * 상품 데이터 수신 처리
     */
    async receiveProducts(products) {
      try {
        this.isLoading = true;
        this.error = null;
        
        console.log(`${products.length}개 상품 데이터 수신`);
        
        // 수신한 상품 데이터 설정
        this.products = products;
        
        // 기본값으로 모든 상품 선택
        this.selectedProducts = products.map((product, index) => index);
        
        // 처리가 빨리 끝나면 최소 1초 로딩 표시
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('상품 데이터 처리 오류:', error);
        this.error = '상품 데이터 처리 중 오류가 발생했습니다.';
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 상품 선택/해제 토글
     */
    toggleProductSelection(index) {
      if (this.selectedProducts.includes(index)) {
        this.selectedProducts = this.selectedProducts.filter(i => i !== index);
      } else {
        this.selectedProducts.push(index);
      }
    },

    /**
     * 전체 선택/해제
     */
    toggleAllSelection() {
      if (this.selectedProducts.length === this.products.length) {
        this.selectedProducts = [];
      } else {
        this.selectedProducts = this.products.map((_, index) => index);
      }
    },

    /**
     * 상품이 선택되었는지 확인
     */
    isProductSelected(index) {
      return this.selectedProducts.includes(index);
    },
    
    /**
     * 수집한 상품 저장
     */
    async saveProducts() {
      if (this.selectedProducts.length === 0) {
        ElMessage.warning('선택된 상품이 없습니다.');
        return;
      }
      
      try {
        this.isSaving = true;
        this.error = null;
        
        // 선택된 상품들만 필터링
        const selectedProductsData = this.selectedProducts.map(index => this.products[index]);
        
        // 상품 데이터를 API 형식으로 변환
        const mappedProducts = mapProductsForUpload(selectedProductsData);
        console.log('변환된 상품 데이터:', mappedProducts);
        
        // API로 상품 데이터 전송
        console.log('서버로 상품 데이터 전송 중...');
        const response = await uploadProducts(mappedProducts);
        console.log('상품 데이터 전송 완료:', response);
        
        if (response.success) {
          // 성공 알림
          ElMessage.success(`${this.selectedProducts.length}개 상품이 성공적으로 저장되었습니다.`);
          
          // 상품 목록 확인 페이지로 이동
          setTimeout(() => {
            this.router.push('/product/sourcing/list');
          }, 300);
        } else {
          ElMessage.error(response.message || '상품 저장 중 오류가 발생했습니다.');
        }
      } catch (error) {
        console.error('상품 저장 오류:', error);
        ElMessage.error(error.response?.data?.message || '상품 저장 중 오류가 발생했습니다.');
      } finally {
        this.isSaving = false;
      }
    },
    
    /**
     * 수집한 상품 초기화
     */
    clearProducts() {
      this.products = [];
      this.selectedProducts = [];
      this.error = null;
    }
  }
};
</script>

<style scoped>
.category-collection-page {
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

.header-content {
  margin: 0 auto;
  width: 100%;
}

.title-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.page-title {
  font-size: var(--el-font-size-extra-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  margin: 0;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--el-border-radius-round);
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-medium);
  transition: all 0.2s ease;
}

.connection-status.connected {
  background-color: #dcfce7;
  border-color: #86efac;
  color: #166534;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--el-color-danger);
  animation: pulse 2s infinite;
}

.connection-status.connected .status-indicator {
  background-color: var(--el-color-success);
  animation: none;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.help-button {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: var(--el-color-warning);
  color: var(--el-color-white);
  border: none;
  cursor: pointer;
  font-size: var(--el-font-size-extra-small);
  font-weight: var(--el-font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.help-button:hover {
  background-color: #f59e0b;
  transform: scale(1.1);
}

.page-description {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-base);
  margin: 0 0 var(--spacing-xs) 0;
}

.taobao-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: #ff6a00;
  color: var(--el-color-white);
  text-decoration: none;
  border-radius: var(--el-border-radius-base);
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-medium);
  transition: all 0.2s ease;
}

.taobao-link:hover {
  background-color: #e85d00;
  transform: translateY(-1px);
  box-shadow: var(--el-box-shadow-dark);
  color: var(--el-color-white);
}

.content-container {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.content-container.full-height {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card {
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-base);
  border: 1px solid var(--el-border-color-lighter);
  transition: box-shadow 0.2s ease;
}

/* 로딩 카드 */
.loading-card {
  padding: var(--spacing-lg);
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--el-color-primary-light-9);
  border-radius: 50%;
  border-top-color: var(--el-color-primary);
  animation: spin 1s linear infinite;
}

.button-loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--el-color-white);
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
  margin-right: var(--spacing-xs);
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-base);
  margin: 0;
}

/* 상품 섹션 */
.products-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  height: 100%;
  flex: 1;
}

/* 상품 헤더 카드 */
.products-header-card {
  flex-shrink: 0;
  padding: var(--spacing-sm) var(--spacing-md);
}

.products-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.products-summary {
  flex: 1;
}

.products-title {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.products-count {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-base);
  margin: 0;
}

.products-actions {
  display: flex;
  gap: var(--spacing-xs);
}

/* 상품 그리드 카드 */
.products-grid-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.products-grid-header {
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.grid-title {
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-primary);
  margin: 0;
}

.products-grid-container {
  flex: 1;
  overflow: auto;
  padding: var(--spacing-sm);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--spacing-sm);
}

.product-item {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
  background-color: var(--el-bg-color);
  transition: border-color 0.1s ease, box-shadow 0.1s ease;
  display: flex;
  flex-direction: column;
  height: 280px;
  cursor: pointer;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  touch-action: manipulation;
}

.product-item:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: var(--el-box-shadow-light);
  transform: translateY(-1px);
}

.product-item.selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
  background-color: var(--el-color-primary-light-9);
}

.product-selection-indicator {
  position: absolute;
  top: var(--spacing-xs);
  right: var(--spacing-xs);
  z-index: 2;
}

.selection-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--el-border-color);
  border-radius: var(--el-border-radius-small);
  background-color: var(--el-bg-color);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.selection-checkbox.checked {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: var(--el-color-white);
}

.product-image-container {
  height: 160px;
  overflow: hidden;
  background-color: var(--el-bg-color-page);
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  pointer-events: none;
}

.product-info {
  padding: var(--spacing-xs);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.product-title {
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-xs) 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.product-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.product-details > div {
  font-size: var(--el-font-size-extra-small);
  color: var(--el-text-color-secondary);
}

.product-price {
  font-weight: var(--el-font-weight-medium);
  color: var(--el-color-primary);
}

/* 사용방법 카드 */
.instructions-card {
  padding: var(--spacing-md);
  text-align: center;
}

.instructions-content {
  max-width: 600px;
  margin: 0 auto;
}

.instructions-icon {
  margin-bottom: var(--spacing-sm);
  color: var(--el-text-color-secondary);
}

.instructions-title {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.instructions-list {
  text-align: left;
  padding-left: var(--spacing-md);
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.instructions-list li {
  margin-bottom: var(--spacing-xs);
}

/* 에러 카드 */
.error-card {
  border-left: 4px solid var(--el-color-danger);
  padding: var(--spacing-sm);
}

.error-content {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-xs);
}

.error-icon {
  color: var(--el-color-danger);
  flex-shrink: 0;
}

.error-message h3 {
  font-size: var(--el-font-size-large);
  color: var(--el-color-danger);
  margin: 0 0 var(--spacing-xs) 0;
}

.error-message p {
  color: var(--el-text-color-regular);
  margin: 0;
}

/* Element Plus 버튼 커스터마이징 */
.products-actions {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
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
  max-width: 700px;
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
  flex-shrink: 0;
}

.modal-title-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.modal-icon {
  color: var(--el-text-color-secondary);
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
  overflow-y: auto;
  flex: 1;
}

.help-content {
  padding: var(--spacing-md);
}

.help-section {
  margin-bottom: var(--spacing-md);
}

.help-section.warning {
  background-color: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-sm);
}

.help-section-title {
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.help-subsection-title {
  font-size: var(--el-font-size-base);
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-primary);
  margin: var(--spacing-sm) 0 var(--spacing-xs) 0;
}

.help-steps,
.help-warnings {
  padding-left: var(--spacing-md);
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.help-steps li,
.help-warnings li {
  margin-bottom: var(--spacing-xs);
}

.download-section {
  background-color: var(--el-bg-color-page);
  border-top: 1px solid var(--el-border-color-lighter);
  padding: var(--spacing-md);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.download-info {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
  margin: 0;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .page-header {
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
  
  .connection-status {
    align-self: flex-end;
  }
  
  .content-container {
    padding: var(--spacing-xs) var(--spacing-sm);
  }
  
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
