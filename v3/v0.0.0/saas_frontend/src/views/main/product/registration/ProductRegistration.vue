<template>
  <div class="product-registration">
    <div class="main-container">
      <!-- 좌측 상품 리스트 영역 (2/3) -->
      <div class="left-panel">
        <!-- 탭 메뉴 -->
        <div class="tab-menu">
          <el-button 
            :type="activeTab === 'common' ? 'primary' : 'default'"
            @click="changeTab('common')"
            class="tab-button"
            :class="{ active: activeTab === 'common' }"
          >
            공통등록관리
          </el-button>
          <el-button 
            :type="activeTab === 'naver' ? 'primary' : 'default'"
            @click="changeTab('naver')"
            class="tab-button"
            :class="{ active: activeTab === 'naver' }"
          >
            네이버
          </el-button>
          <el-button 
            :type="activeTab === 'coupang' ? 'primary' : 'default'"
            @click="changeTab('coupang')"
            class="tab-button"
            :class="{ active: activeTab === 'coupang' }"
          >
            쿠팡
          </el-button>
          <el-button 
            :type="activeTab === 'elevenstore' ? 'primary' : 'default'"
            @click="changeTab('elevenstore')"
            class="tab-button"
            :class="{ active: activeTab === 'elevenstore' }"
          >
            11번가
          </el-button>
          <el-button 
            :type="activeTab === 'esm' ? 'primary' : 'default'"
            @click="changeTab('esm')"
            class="tab-button"
            :class="{ active: activeTab === 'esm' }"
          >
            ESM
          </el-button>
        </div>

        <!-- 검색 영역 -->
        <div class="search-area">
          <div class="search-row">
            <select v-model="selectedGroupCode" @change="searchProducts">
              <option value="">관리코드 선택</option>
              <option v-for="group in currentGroupCodes" :key="group.code" :value="group.code">
                {{ group.code }} - {{ group.memo }}
              </option>
            </select>
          </div>
          <div class="selection-controls">
            <label class="checkbox-label">
              <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
              전체선택
            </label>
            <span class="selected-count">선택된 상품: {{ selectedProducts.length }}개</span>
          </div>
        </div>

        <!-- 상품 리스트 -->
        <div class="product-list" ref="productList">
          <AppLoading v-if="loading" text="상품을 불러오는 중..." />
          <div v-else-if="products.length === 0" class="no-products">상품이 없습니다.</div>
          <div v-else>
            <div 
              v-for="product in products" 
              :key="product.id"
              class="product-item"
              @click="toggleProductSelection(product.id)"
            >
              <div class="product-checkbox">
                <input 
                  type="checkbox" 
                  :value="product.id"
                  v-model="selectedProducts"
                  @click.stop
                />
              </div>
              <div class="product-info">
                <div class="product-name">{{ product.name }}</div>
                <div class="product-attempts">
                  <span v-if="activeTab === 'common' || activeTab === 'naver'">
                    네이버: {{ product.naver_attempts }}회
                  </span>
                  <span v-if="activeTab === 'common'"> | </span>
                  <span v-if="activeTab === 'common' || activeTab === 'coupang'">
                    쿠팡: {{ product.coopang_attemts }}회
                  </span>
                  <span v-if="activeTab === 'common'"> | </span>
                  <span v-if="activeTab === 'common' || activeTab === 'elevenstore'">
                    11번가: {{ product.elevenstore_attempts }}회
                  </span>
                  <span v-if="activeTab === 'common'"> | </span>
                  <span v-if="activeTab === 'common' || activeTab === 'esm'">
                    ESM: {{ product.esm_attempts }}회
                  </span>
                </div>
              </div>
              <div class="product-actions">
                <el-button 
                  @click.stop="showProductImage(product.id)"
                  :disabled="loadingImage === product.id"
                  size="small"
                  :icon="Picture"
                >
                  {{ loadingImage === product.id ? '로딩...' : '이미지보기' }}
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 우측 설정 영역 (1/3) -->
      <div class="right-panel">
        <!-- 등록 설정 -->
        <div class="registration-settings">
          <h3>등록 설정</h3>
          
          <div class="setting-group">
            <label>배송비</label>
            <input 
              type="number" 
              v-model="registrationSettings.shippingFee"
              placeholder="8000"
            />
          </div>

          <div class="setting-group">
            <label>최저 마진률 (%)</label>
            <input 
              type="number" 
              v-model="registrationSettings.minMargin"
              placeholder="15"
            />
          </div>

          <div class="setting-group">
            <label>마진률 (%)</label>
            <input 
              type="number" 
              v-model="registrationSettings.defaultMargin"
              placeholder="30"
            />
          </div>

          <!-- 마켓 선택 - 탭에 따라 다르게 표시 -->
          <div class="setting-group" v-if="activeTab === 'common' || activeTab === 'coupang'">
            <label>쿠팡 마켓 선택</label>
            <select v-model="registrationSettings.coopangMarket">
              <option value="">쿠팡 마켓 선택</option>
              <option v-for="market in coopangMarkets" :key="market.market_number" :value="market.market_number">
                {{ market.market_number }} - {{ market.market_memo }}
                ({{ market.maximun_sku_count - market.sku_count }}개 등록 가능)
              </option>
            </select>
          </div>

          <div class="setting-group" v-if="activeTab === 'common' || activeTab === 'naver'">
            <label>네이버 마켓 선택</label>
            <select v-model="registrationSettings.naverMarket">
              <option value="">네이버 마켓 선택</option>
              <option v-for="market in naverMarkets" :key="market.market_number" :value="market.market_number">
                {{ market.market_number }} - {{ market.market_memo }}
                ({{ market.maximun_sku_count - market.sku_count }}개 등록 가능)
              </option>
            </select>
          </div>

          <div class="setting-group" v-if="activeTab === 'common' || activeTab === 'elevenstore'">
            <label>11번가 마켓 선택</label>
            <select v-model="registrationSettings.elevenstoreMarket">
              <option value="">11번가 마켓 선택</option>
              <option v-for="market in elevenstoreMarkets" :key="market.market_number" :value="market.market_number">
                {{ market.market_number }} - {{ market.market_memo }}
                ({{ market.maximun_sku_count - market.sku_count }}개 등록 가능)
              </option>
            </select>
          </div>

          <div class="setting-group" v-if="activeTab === 'common' || activeTab === 'esm'">
            <label>ESM 마켓 선택</label>
            <select v-model="registrationSettings.esmMarket">
              <option value="">ESM 마켓 선택</option>
              <option v-for="market in esmMarkets" :key="market.market_number" :value="market.market_number">
                {{ market.market_number }} - {{ market.market_memo }}
                ({{ market.maximun_sku_count - market.sku_count }}개 등록 가능)
              </option>
            </select>
          </div>

          <!-- 액션 버튼 -->
          <div class="action-buttons">
            <el-button 
              @click="handleRegister"
              :disabled="!canRegister"
              type="primary"
              size="large"
              :icon="Upload"
            >
              {{ submitting ? '처리 중...' : getRegisterButtonText() }}
            </el-button>
            <el-button 
              @click="handleDiscard"
              :disabled="!canDiscard"
              type="danger"
              size="large"
              :icon="Delete"
            >
              {{ submitting ? '처리 중...' : '폐기' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 로딩 오버레이 -->
    <AppLoading 
      v-if="submitting"
      :text="loadingMessage" 
      size="large" 
      overlay 
    />

    <!-- 이미지 모달 -->
    <div v-if="showImageModal" class="modal-overlay" @click="closeImageModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>상품 이미지</h3>
          <el-button @click="closeImageModal" :icon="Close" circle></el-button>
        </div>
        <div class="modal-body">
          <img v-if="currentImageUrl" :src="currentImageUrl" alt="상품 이미지" />
          <AppLoading v-else text="이미지 로딩 중..." size="small" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Picture, Upload, Delete, Close } from '@element-plus/icons-vue';
import AppLoading from '../../../../components/app/loading.vue';
import { 
  getInitialData, 
  searchProducts as searchProductsAPI, 
  getProductImage, 
  registerProducts, 
  discardProducts,
  downloadExcelFile
} from '../../../../services/register.js';

export default {
  name: 'ProductRegistration',
  components: {
    AppLoading
  },
  data() {
    return {
      // 탭 관련
      activeTab: 'common',
      
      // 데이터
      products: [],
      groupCodes: [],
      naverGroupCodes: [],
      coopangGroupCodes: [],
      elevenstoreGroupCodes: [],
      esmGroupCodes: [],
      coopangMarkets: [],
      naverMarkets: [],
      elevenstoreMarkets: [],
      esmMarkets: [],
      
      // 검색 관련
      selectedGroupCode: '',
      
      // 선택 관련
      selectedProducts: [],
      selectAll: false,
      
      // 등록 설정
      registrationSettings: {
        shippingFee: 6000,
        minMargin: 15,
        defaultMargin: 30,
        coopangMarket: '',
        naverMarket: '',
        elevenstoreMarket: '',
        esmMarket: ''
      },
      
      // 상태 관리
      loading: false,
      submitting: false,
      submitAction: '', // 'register' | 'discard' | ''
      loadingImage: null,
      
      // 이미지 모달
      showImageModal: false,
      currentImageUrl: '',
      
      // Element Plus Icons
      Picture,
      Upload,
      Delete,
      Close
    };
  },
  
  computed: {
    currentGroupCodes() {
      switch (this.activeTab) {
        case 'naver':
          return this.naverGroupCodes;
        case 'coupang':
          return this.coopangGroupCodes;
        case 'elevenstore':
          return this.elevenstoreGroupCodes;
        case 'esm':
          return this.esmGroupCodes;
        case 'common':
        default:
          return this.groupCodes;
      }
    },

    canRegister() {
      const hasSelectedProducts = this.selectedProducts.length > 0;
      let hasSelectedMarket = false;
      
      if (this.activeTab === 'common') {
        hasSelectedMarket = this.registrationSettings.coopangMarket || 
                          this.registrationSettings.naverMarket || 
                          this.registrationSettings.elevenstoreMarket ||
                          this.registrationSettings.esmMarket;
      } else if (this.activeTab === 'coupang') {
        hasSelectedMarket = this.registrationSettings.coopangMarket;
      } else if (this.activeTab === 'naver') {
        hasSelectedMarket = this.registrationSettings.naverMarket;
      } else if (this.activeTab === 'elevenstore') {
        hasSelectedMarket = this.registrationSettings.elevenstoreMarket;
      } else if (this.activeTab === 'esm') {
        hasSelectedMarket = this.registrationSettings.esmMarket;
      }
      
      return hasSelectedProducts && hasSelectedMarket && !this.submitting;
    },
    
    canDiscard() {
      const hasSelectedProducts = this.selectedProducts.length > 0;
      return hasSelectedProducts && !this.submitting;
    },

    loadingMessage() {
      if (this.submitting) {
        if (this.submitAction === 'register') {
          // ESM 엑셀 생성인지 확인 (ESM 탭이거나 공통등록관리에서 ESM 마켓이 선택된 경우)
          const hasEsm = this.activeTab === 'esm' || 
                        (this.activeTab === 'common' && this.registrationSettings.esmMarket);
          
          if (hasEsm) {
            return '엑셀 생성중입니다(약 20초 소모)';
          } else {
            return '등록중입니다';
          }
        } else if (this.submitAction === 'discard') {
          return '폐기 중입니다';
        }
      }
      return '로딩 중...';
    }
  },
  
  async mounted() {
    await this.loadInitialData();
  },
  
  methods: {
    // 초기 데이터 로딩
    async loadInitialData() {
      try {
        this.loading = true;
        const data = await getInitialData();
        
        this.products = data.products || [];
        this.groupCodes = data.groupCodes || [];
        this.naverGroupCodes = data.naverGroupCodes || [];
        this.coopangGroupCodes = data.coopangGroupCodes || [];
        this.elevenstoreGroupCodes = data.elevenstoreGroupCodes || [];
        this.esmGroupCodes = data.esmGroupCodes || [];
        this.coopangMarkets = data.coopang_markets || [];
        this.naverMarkets = data.naver_markets || [];
        this.elevenstoreMarkets = data.elevenstore_markets || [];
        this.esmMarkets = data.esm_markets || [];
        
        // 기본 설정값 적용
        if (data.defaultSettings) {
          this.registrationSettings.shippingFee = data.defaultSettings.shippingFee || 6000;
          this.registrationSettings.minMargin = data.defaultSettings.minMargin || 15;
          this.registrationSettings.defaultMargin = data.defaultSettings.defaultMargin || 30;
        }
        
      } catch (error) {
        console.error('초기 데이터 로딩 실패:', error);
        // 서버로부터 받은 에러 메시지 사용
        const errorMessage = error.response?.data?.message || '데이터 로딩에 실패했습니다.';
        this.$message.error(errorMessage);
      } finally {
        this.loading = false;
      }
    },
    
    // 탭 변경
    async changeTab(tabValue) {
      this.activeTab = tabValue;
      this.selectedProducts = [];
      this.selectAll = false;
      this.selectedGroupCode = ''; // 탭 변경 시 관리코드 선택 초기화
      
      // 탭에 따라 마켓 설정 초기화
      if (tabValue === 'coupang') {
        this.registrationSettings.naverMarket = '';
        this.registrationSettings.elevenstoreMarket = '';
        this.registrationSettings.esmMarket = '';
      } else if (tabValue === 'naver') {
        this.registrationSettings.coopangMarket = '';
        this.registrationSettings.elevenstoreMarket = '';
        this.registrationSettings.esmMarket = '';
      } else if (tabValue === 'elevenstore') {
        this.registrationSettings.coopangMarket = '';
        this.registrationSettings.naverMarket = '';
        this.registrationSettings.esmMarket = '';
      } else if (tabValue === 'esm') {
        this.registrationSettings.coopangMarket = '';
        this.registrationSettings.naverMarket = '';
        this.registrationSettings.elevenstoreMarket = '';
      }
      // COMMON 탭에서는 모든 마켓 설정을 유지
      
      await this.searchProducts();
    },
    
    // 상품 검색
    async searchProducts() {
      try {
        this.loading = true;
        const data = await searchProductsAPI(
          this.activeTab, 
          this.selectedGroupCode || null
        );
        this.products = data.products || [];
        this.selectedProducts = [];
        this.selectAll = false;
      } catch (error) {
        console.error('상품 검색 실패:', error);
        // 서버로부터 받은 에러 메시지 사용
        const errorMessage = error.response?.data?.message || '상품 검색에 실패했습니다.';
        this.$message.error(errorMessage);
      } finally {
        this.loading = false;
      }
    },
    
    // 전체 선택/해제
    toggleSelectAll() {
      if (this.selectAll) {
        this.selectedProducts = this.products.map(p => p.id);
      } else {
        this.selectedProducts = [];
      }
    },
    
    // 개별 상품 선택/해제
    toggleProductSelection(productId) {
      const index = this.selectedProducts.indexOf(productId);
      if (index === -1) {
        this.selectedProducts.push(productId);
      } else {
        this.selectedProducts.splice(index, 1);
      }
    },
    
    // 상품 이미지 보기
    async showProductImage(productId) {
      try {
        this.loadingImage = productId;
        const data = await getProductImage(productId);
        this.currentImageUrl = data.imageUrl;
        this.showImageModal = true;
      } catch (error) {
        console.error('이미지 로딩 실패:', error);
        // 서버로부터 받은 에러 메시지 사용
        const errorMessage = error.response?.data?.message || '이미지 로딩에 실패했습니다.';
        this.$message.error(errorMessage);
      } finally {
        this.loadingImage = null;
      }
    },
    
    // 이미지 모달 닫기
    closeImageModal() {
      this.showImageModal = false;
      this.currentImageUrl = '';
    },
    
    // 상품 등록
    async handleRegister() {
      if (!this.canRegister) return;
      
      this.submitAction = 'register';
      // 확인창 표시
      await this.showRegistrationConfirm();
    },
    
        // 등록 확인창 표시
    async showRegistrationConfirm() {
      let message = '';
      let confirmTitle = '';
      let confirmButtonText = '';
      
      if (this.activeTab === 'esm') {
        // ESM 전용 탭에서만 ESM 전용 메시지 사용
        message = `
          ESM 엑셀 파일을 생성합니다.
          마켓정책 설정이 올바른지 확인 부탁드립니다.
          설정이 올바르지 않은 경우 생성에 실패할 수 있습니다.
        `;
        confirmTitle = 'ESM 엑셀 생성 확인';
        confirmButtonText = '엑셀 생성';
      } else {
        // 공통등록관리를 포함한 모든 탭에서 일반 등록 메시지 사용
        message = `
          마켓정책 설정 및 11번가 국내/글로벌 셀러 설정이 올바른지 확인 부탁드립니다.
          설정이 올바르지 않은 경우 등록에 실패할 수 있습니다.
        `;
        confirmTitle = '상품 등록 확인';
        confirmButtonText = '등록 진행';
      }
      
      try {
        await this.$confirm(message, confirmTitle, {
          confirmButtonText,
          cancelButtonText: '취소',
          type: 'warning'
        });
        
        await this.proceedWithRegistration();
        
      } catch (error) {
        if (error === 'cancel') {
          // 취소 시 아무것도 하지 않음
          return;
        }
        throw error;
      }
    },
    
    // 실제 상품 등록 처리
    async proceedWithRegistration() {
      if (!this.canRegister) return;
      
      try {
        this.submitting = true;
        
        const data = {
          ids: this.selectedProducts,
          tabInfo: this.activeTab,
          settings: this.registrationSettings
        };
        
        const result = await registerProducts(data);
        
        // 응답 성공 여부 확인
        if (!result.success) {
          // 실패한 경우 상세 에러 메시지 구성
          let errorMessage = result.message || '등록에 실패했습니다.';
          
          if (result.results && result.results.length > 0) {
            const failedProducts = result.results.filter(r => !r.success);
            if (failedProducts.length > 0) {
              errorMessage += '\n\n실패 상세:';
              failedProducts.forEach(product => {
                errorMessage += `\n- 상품 ID ${product.productId}: ${product.message}`;
                if (product.markets) {
                  product.markets.forEach(market => {
                    if (market.status === 'failed') {
                      errorMessage += `\n  ${market.market}: ${market.message}`;
                    }
                  });
                }
              });
            }
          }
          
          this.$message.error(errorMessage);
          return;
        }
        
        // 성공한 경우 처리
        const hasEsm = this.registrationSettings.esmMarket;
        
        if ((this.activeTab === 'esm' || (this.activeTab === 'common' && hasEsm)) && result.excelFile) {
          this.$message.success('ESM 엑셀 파일이 생성되었습니다. 다운로드를 시작합니다.');
          
          // 엑셀 파일 다운로드 처리
          try {
            await downloadExcelFile(result.excelFile.fileName);
          } catch (downloadError) {
            console.error('엑셀 파일 다운로드 실패:', downloadError);
            this.$message.error('엑셀 파일 다운로드에 실패했습니다.');
          }
        } else {
          // 일반 등록 성공 메시지 (성공/실패 개수 포함)
          let successMessage = `등록이 완료되었습니다.`;
          if (result.successCount !== undefined && result.failCount !== undefined) {
            successMessage = `등록이 완료되었습니다. 성공: ${result.successCount}개, 실패: ${result.failCount}개`;
          }
          this.$message.success(successMessage);
        }
        
        await this.searchProducts(); // 목록 새로고침
        
      } catch (error) {
        console.error('상품 등록 실패:', error);
        // 서버로부터 받은 에러 메시지 사용
        const hasEsm = this.registrationSettings.esmMarket;
        const isEsmOperation = this.activeTab === 'esm' || (this.activeTab === 'common' && hasEsm);
        const errorMessage = error.response?.data?.message || 
          (isEsmOperation ? 'ESM 엑셀 생성에 실패했습니다.' : '상품 등록에 실패했습니다.');
        this.$message.error(errorMessage);
      } finally {
        this.submitting = false;
        this.submitAction = '';
      }
    },
    
    // 상품 폐기
    async handleDiscard() {
      if (!this.canDiscard) return;
      
      if (!confirm('선택한 상품을 폐기하시겠습니까?')) return;
      
      this.submitAction = 'discard';
      try {
        this.submitting = true;
        const data = {
          ids: this.selectedProducts,
          tabInfo: this.activeTab,
          settings: this.registrationSettings
        };
        
        await discardProducts(data);
        this.$message.success('상품이 성공적으로 폐기되었습니다.');
        await this.searchProducts(); // 목록 새로고침
        
      } catch (error) {
        console.error('상품 폐기 실패:', error);
        // 서버로부터 받은 에러 메시지 사용
        const errorMessage = error.response?.data?.message || '상품 폐기에 실패했습니다.';
        this.$message.error(errorMessage);
      } finally {
        this.submitting = false;
        this.submitAction = '';
      }
    },
    
    // 등록 버튼 텍스트 결정
    getRegisterButtonText() {
      // ESM 전용 탭에서만 "엑셀 생성하기", 공통등록관리에서는 "등록"으로 통일
      if (this.activeTab === 'esm') {
        return '엑셀 생성하기';
      }
      return '등록';
    }
  },
  
  watch: {
    selectedProducts() {
      this.selectAll = this.selectedProducts.length === this.products.length && this.products.length > 0;
    }
  }
};
</script>

<style scoped>
.product-registration {
  height: calc(100vh - 60px); /* 상위 헤더나 네비게이션 공간 고려 */
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.main-container {
  display: flex;
  height: 100%;
  flex: 1;
  min-height: 0; /* flexbox에서 overflow 문제 해결 */
}

/* 좌측 패널 (2/3) */
.left-panel {
  width: 66.67%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--el-border-color-light);
  min-height: 0; /* flexbox에서 overflow 문제 해결 */
}

.tab-menu {
  display: flex;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color-page);
  flex-shrink: 0; /* 탭 메뉴가 줄어들지 않도록 */
}

.tab-button {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: var(--el-font-size-base);
  transition: all 0.2s ease;
}

.tab-button:hover {
  background: var(--el-border-color-light);
}

.tab-button.active {
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

.search-area {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color-page);
  flex-shrink: 0; /* 검색 영역이 줄어들지 않도록 */
}

.search-row {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.search-row select {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-sm);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-small);
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
}

.search-row select:focus {
  outline: none;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(91, 108, 242, 0.25);
}

.selection-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  font-weight: var(--el-font-weight-medium);
}

.checkbox-label input {
  accent-color: var(--el-color-primary);
}

.selected-count {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
}

.product-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
  min-height: 0; /* flexbox에서 overflow 문제 해결 */
}

.product-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  margin-bottom: var(--spacing-sm);
  background: var(--el-bg-color);
  transition: all 0.2s ease;
  cursor: pointer;
}

.product-item:hover {
  box-shadow: var(--el-box-shadow-light);
}

.product-checkbox {
  margin-right: var(--spacing-sm);
}

.product-checkbox input {
  accent-color: var(--el-color-primary);
}

.product-info {
  flex: 1;
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: var(--spacing-sm);
}

.product-name {
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-primary);
}

.product-attempts {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
}

.product-actions {
  margin-left: var(--spacing-sm);
}

/* 우측 패널 (1/3) */
.right-panel {
  width: 33.33%;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-md);
  background: var(--el-bg-color-page);
  min-height: 0; /* flexbox에서 overflow 문제 해결 */
}

.registration-settings {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* flexbox에서 overflow 문제 해결 */
  overflow-y: auto; /* 설정이 많을 경우 스크롤 가능 */
}

.registration-settings h3 {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--el-font-size-medium);
  color: var(--el-text-color-primary);
  font-weight: var(--el-font-weight-semibold);
  flex-shrink: 0;
}

.setting-group {
  margin-bottom: var(--spacing-md);
  flex-shrink: 0;
}

.setting-group label {
  display: block;
  margin-bottom: 6px;
  font-size: var(--el-font-size-base);
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-primary);
}

.setting-group input,
.setting-group select {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-sm);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-small);
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.setting-group input:focus,
.setting-group select:focus {
  outline: none;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(91, 108, 242, 0.25);
}

.action-buttons {
  margin-top: auto;
  display: flex;
  gap: var(--spacing-sm);
  flex-shrink: 0; /* 버튼이 줄어들지 않도록 */
  padding-top: var(--spacing-md);
}

/* 모달 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--el-index-popper);
}

.modal-content {
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  max-width: 80%;
  max-height: 80%;
  overflow: hidden;
  box-shadow: var(--el-box-shadow-light);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--el-border-color-light);
}

.modal-header h3 {
  margin: 0;
  font-size: var(--el-font-size-large);
  color: var(--el-text-color-primary);
}

.modal-body {
  padding: var(--spacing-md);
  text-align: center;
}

.modal-body img {
  max-width: 100%;
  max-height: 500px;
  object-fit: contain;
}

.no-products {
  text-align: center;
  padding: var(--spacing-xxl) var(--spacing-lg);
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-base);
}



</style> 