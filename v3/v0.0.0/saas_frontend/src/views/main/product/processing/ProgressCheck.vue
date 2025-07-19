<template>
  <div class="progress-check">
    <AppLoading v-if="loading && products.length === 0" text="데이터를 불러오는 중..." />
    <div v-else class="main-container">
      <div class="left-container">
        <div class="search-section">
          <div class="search-container">
            <div class="search-options">
              <div class="form-group">
                <label>정렬 순서</label>
                <select v-model="searchParams.order">
                  <option value="asc">과거순</option>
                  <option value="desc">최신순</option>
                </select>
              </div>
              <div class="form-group">
                <label>조회 개수</label>
                <select v-model="searchParams.limit">
                  <option v-for="num in [5, 10, 20, 50, 100, 500, 1000]" :key="num" :value="num">{{ num }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>조회 상태</label>
                <select v-model="searchParams.status">
                  <option value="all">전체 상품</option>
                  <option value="pending">요청 상태</option>
                  <option value="brandbanCheck">브랜드 필터링 승인 대기</option>
                  <option value="processing">가공 중</option>
                  <option value="success">가공 완료</option>
                  <option value="fail">가공 실패</option>
                </select>
              </div>
              <div class="form-group-with-button">
                <div class="form-group">
                  <label>그룹 코드</label>
                  <input type="text" v-model="searchParams.groupCode" placeholder="그룹 코드" />
                </div>
                <el-button 
                  type="primary"
                  @click="fetchProducts" 
                  :loading="isSearching"
                  :disabled="loading"
                  class="search-button"
                >
                  {{ isSearching ? '조회 중...' : '상품 조회' }}
                </el-button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="products-section">
          <div class="select-all">
            <input 
              type="checkbox" 
              :checked="allSelected" 
              @change="toggleSelectAll" 
              :disabled="!hasSelectableProducts"
            />
            <label>전체 선택</label>
          </div>
          
          <div class="products-scrollable">
            <div 
              v-for="product in products" 
              :key="product.productid" 
              class="product-item"
              :class="{
                'product-success': product.status === 'success'
              }"
              :data-status="product.status"
              @click="toggleProductSelection(product.productid)"
            >
              <div class="product-header">
                <input 
                  type="checkbox" 
                  v-model="selectedProducts" 
                  :value="product.productid"
                  @click.stop
                />
                <span class="product-id">상품 ID: {{ product.productid }}</span>
                <span class="created-time">{{ formatTime(product.created_at) }}</span>
              </div>
              <div class="product-details">
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="label">브랜드 필터링:</span>
                    <span class="value" :class="{ 'completed': product.brandfilter }">
                      {{ product.brandfilter ? '완료' : '미완료' }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">이름 최적화:</span>
                    <span class="value" :class="{ 'completed': product.name_optimized }">
                      {{ product.name_optimized ? '완료' : '미완료' }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">메인 이미지 번역:</span>
                    <span class="value" :class="{ 'completed': product.main_image_translated }">
                      {{ product.main_image_translated ? '완료' : '미완료' }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">설명 이미지 번역:</span>
                    <span class="value" :class="{ 'completed': product.description_image_translated }">
                      {{ product.description_image_translated ? '완료' : '미완료' }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">옵션 이미지 번역:</span>
                    <span class="value" :class="{ 'completed': product.option_image_translated }">
                      {{ product.option_image_translated ? '완료' : '미완료' }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">속성 번역:</span>
                    <span class="value" :class="{ 'completed': product.attribute_translated }">
                      {{ product.attribute_translated ? '완료' : '미완료' }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">키워드 생성:</span>
                    <span class="value" :class="{ 'completed': product.keyword_generated }">
                      {{ product.keyword_generated ? '완료' : '미완료' }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">누끼 이미지 생성:</span>
                    <span class="value" :class="{ 'completed': product.nukki_created }">
                      {{ product.nukki_created ? '완료' : '미완료' }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">옵션 최적화:</span>
                    <span class="value" :class="{ 'completed': product.option_optimized }">
                      {{ product.option_optimized ? '완료' : '미완료' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="right-container">
        <div class="counts-container">
          <div class="container-header">
            <h3>처리 현황</h3>
          </div>
          <div class="counts">
            <div class="count-item">
              <span class="count-label">요청 상태</span>
              <span class="count-value">{{ counts.pending || 0 }}</span>
            </div>
            <div class="count-item">
              <span class="count-label">브랜드 필터링 대기</span>
              <span class="count-value">{{ counts.brandbanCheck || 0 }}</span>
            </div>
            <div class="count-item">
              <span class="count-label">가공 중</span>
              <span class="count-value">{{ counts.processing || 0 }}</span>
            </div>
            <div class="count-item">
              <span class="count-label">가공 완료</span>
              <span class="count-value success">{{ counts.success || 0 }}</span>
            </div>
            <div class="count-item">
              <span class="count-label">가공 실패</span>
              <span class="count-value danger">{{ counts.fail || 0 }}</span>
            </div>
            <div class="count-item total">
              <span class="count-label">전체</span>
              <span class="count-value">{{ counts.total || 0 }}</span>
            </div>
          </div>
        </div>
        
        <div class="request-container">
          <div class="container-header">
            <h3>승인 관리</h3>
          </div>
          <div class="product-input">
            <div class="form-group">
              <label>상품군 관리 코드</label>
              <input 
                type="text" 
                v-model="requestData.commitcode" 
                placeholder="상품군 관리 번호" 
                @input="validatePositiveNumber"
                pattern="[0-9]*"
                inputmode="numeric"
              />
            </div>
            <div class="form-group" ref="memoFormGroup">
              <label ref="memoLabel">메모</label>
              <textarea 
                v-model="requestData.memo" 
                placeholder="메모"
                ref="memoTextarea"
              ></textarea>
            </div>
          </div>
          <div class="action-buttons">
            <el-button 
              type="primary"
              @click="approveSelected" 
              :loading="loading"
              :disabled="selectedProducts.length === 0"
              class="approve-button"
            >
              {{ loading ? '처리 중...' : '승인하기' }}
            </el-button>
            <el-button 
              @click="discardSelected" 
              :loading="loading"
              :disabled="selectedProducts.length === 0"
              class="discard-button"
            >
              {{ loading ? '처리 중...' : '폐기하기' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus';
import { getProcessingInfo, approveProducts, discardProducts } from '@/services/postprocessing';
import AppLoading from '@/components/app/loading.vue';

export default {
  name: 'ProgressCheck',
  components: {
    AppLoading
  },
  data() {
    return {
      searchParams: {
        order: 'asc',
        limit: 10,
        status: 'all',
        groupCode: ''
      },
      products: [],
      counts: {},
      selectedProducts: [],
      requestData: {
        commitcode: '',
        memo: ''
      },
      loading: false,
      error: null,
      isSearching: false
    };
  },
  computed: {
    allSelected() {
      return this.products.length > 0 && 
             this.selectedProducts.length === this.products.length;
    },
    selectableProducts() {
      return this.products.map(product => product.productid);
    },
    hasSelectableProducts() {
      return this.products.length > 0;
    }
  },
  methods: {
    validatePositiveNumber(event) {
      const value = event.target.value;
      // 숫자가 아니거나 음수인 경우 제거
      const filteredValue = value.replace(/[^0-9]/g, '');
      // 맨 앞이 0인 경우 제거 (단, 빈 문자열이 아닌 경우)
      const finalValue = filteredValue.replace(/^0+/, '') || (filteredValue === '0' ? '' : filteredValue);
      
      if (finalValue !== value) {
        this.requestData.commitcode = finalValue;
        event.target.value = finalValue;
      }
    },
    
    async fetchProducts() {
      this.isSearching = true;
      const startTime = Date.now();
      
      try {
        this.loading = true;
        this.error = null;
        
        const params = {
          order: this.searchParams.order,
          limit: this.searchParams.limit,
          status: this.searchParams.status,
          group_code: this.searchParams.groupCode || undefined
        };
        
        const response = await getProcessingInfo(params);
        
        if (response.success) {
          this.products = response.data.products;
          this.counts = response.data.counts;
          this.selectedProducts = [];
        } else {
          this.error = response.message || '상품 정보를 불러오는데 실패했습니다.';
          ElMessage.error(this.error);
        }
        
        // 최소 0.3초 로딩 보장
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < 300) {
          await new Promise(resolve => setTimeout(resolve, 300 - elapsedTime));
        }
      } catch (error) {
        console.error('API 오류:', error);
        // 서버로부터 받은 에러 메시지 사용
        const errorMessage = error.response?.data?.message || '서버 요청 중 오류가 발생했습니다.';
        this.error = errorMessage;
        ElMessage.error(this.error);
      } finally {
        this.loading = false;
        this.isSearching = false;
      }
    },
    toggleSelectAll(event) {
      if (event.target.checked) {
        this.selectedProducts = [...this.selectableProducts];
      } else {
        this.selectedProducts = [];
      }
    },
    toggleProductSelection(productId) {
      const index = this.selectedProducts.indexOf(productId);
      if (index === -1) {
        this.selectedProducts.push(productId);
      } else {
        this.selectedProducts.splice(index, 1);
      }
    },
    async approveSelected() {
      if (this.loading) return;
      
      const startTime = Date.now();
      try {
        // 요구사항 체크 먼저 수행
        
        // 선택된 상품이 없으면 오류
        if (this.selectedProducts.length === 0) {
          ElMessage.warning('승인할 상품을 선택해야 합니다.');
          return;
        }
        
        // 선택된 모든 상품이 성공/실패 상태인지 확인
        const selectedProducts = this.products.filter(product => 
          this.selectedProducts.includes(product.productid)
        );
        
        const nonApprovableProducts = selectedProducts.filter(product => 
          !['success', 'fail'].includes(product.status)
        );
        
        if (nonApprovableProducts.length > 0) {
          ElMessage.warning('선택된 모든 상품이 성공/실패 상태여야 합니다.');
          return;
        }
        
        // 상품군 관리 코드 체크
        if (!this.requestData.commitcode) {
          ElMessage.warning('상품군 관리 코드를 입력해야 합니다.');
          return;
        }
        
        // 메모 체크
        if (!this.requestData.memo) {
          ElMessage.warning('메모 내용을 입력해야 합니다.');
          return;
        }
        
        this.loading = true;
        this.error = null;
        
        let productsToApprove = [...this.selectedProducts];
        let commitcode = this.requestData.commitcode;
        
        const response = await approveProducts(productsToApprove, this.requestData.memo, commitcode);
        
        if (response.success) {
          this.requestData.commitcode = '';
          this.requestData.memo = '';
          this.selectedProducts = [];
          ElMessage.success(response.message || '상품 승인이 성공적으로 완료되었습니다.');
          await this.fetchProducts();
        } else {
          this.error = response.message || '승인 처리 중 오류가 발생했습니다.';
          ElMessage.error(this.error);
        }
        
        // 최소 0.3초 로딩 보장
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < 300) {
          await new Promise(resolve => setTimeout(resolve, 300 - elapsedTime));
        }
      } catch (error) {
        // 서버로부터 받은 에러 메시지 사용
        const errorMessage = error.response?.data?.message || '서버 요청 중 오류가 발생했습니다.';
        this.error = errorMessage;
        ElMessage.error(this.error);
      } finally {
        this.loading = false;
      }
    },
    
    async discardSelected() {
      if (this.loading) return;
      
      const startTime = Date.now();
      try {
        // 상품이 선택되었는지 확인
        if (this.selectedProducts.length === 0) {
          ElMessage.warning('폐기할 상품을 선택해야 합니다.');
          return;
        }
        
        this.loading = true;
        this.error = null;
        
        let productsToDiscard = [...this.selectedProducts];
        
        const response = await discardProducts(productsToDiscard);
        
        if (response.success) {
          this.selectedProducts = [];
          ElMessage.success(response.message || '상품 폐기가 성공적으로 완료되었습니다.');
          await this.fetchProducts();
        } else {
          this.error = response.message || '폐기 처리 중 오류가 발생했습니다.';
          ElMessage.error(this.error);
        }
        
        // 최소 0.3초 로딩 보장
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < 300) {
          await new Promise(resolve => setTimeout(resolve, 300 - elapsedTime));
        }
      } catch (error) {
        // 서버로부터 받은 에러 메시지 사용
        const errorMessage = error.response?.data?.message || '서버 요청 중 오류가 발생했습니다.';
        this.error = errorMessage;
        ElMessage.error(this.error);
      } finally {
        this.loading = false;
      }
    },
    formatTime(timestamp) {
      if (!timestamp) return '';
      
      const now = new Date();
      const createdDate = new Date(timestamp);
      const diffMs = now - createdDate;
      
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      if (diffDay > 0) {
        return `${diffDay}일 전`;
      } else if (diffHour > 0) {
        return `${diffHour}시간 전`;
      } else if (diffMin > 0) {
        return `${diffMin}분 전`;
      } else {
        return '방금 전';
      }
    },
    
    calculateTextareaHeight() {
      this.$nextTick(() => {
        if (this.$refs.memoFormGroup && this.$refs.memoLabel && this.$refs.memoTextarea) {
          const formGroupHeight = this.$refs.memoFormGroup.clientHeight;
          const labelHeight = this.$refs.memoLabel.offsetHeight;
          const spacing = 8; // 라벨과 textarea 사이 간격
          const calculatedHeight = formGroupHeight - labelHeight - spacing;
          
          if (calculatedHeight > 60) {
            this.$refs.memoTextarea.style.height = calculatedHeight + 'px';
          }
        }
      });
    }
  },
  mounted() {
    this.fetchProducts();
    this.calculateTextareaHeight();
  }
}
</script>

<style scoped>
.progress-check {
  padding: var(--spacing-xs) var(--spacing-md) var(--spacing-xs) var(--spacing-md);
  font-family: 'Noto Sans KR', sans-serif;
  height: 100%;
  box-sizing: border-box;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.main-container {
  display: flex;
  gap: 2%;
  flex: 1;
  min-height: 0;
}

.left-container {
  width: 68%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.right-container {
  width: 30%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.search-section {
  margin-bottom: var(--spacing-md);
}

.search-container {
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  padding: 1.5%;
  box-shadow: var(--el-box-shadow-light);
  transition: all 0.2s ease;
}

.search-container:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.search-options {
  display: flex;
  gap: 2%;
  align-items: end;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  min-width: 15%;
  flex: 1;
}

.form-group label {
  font-size: var(--el-font-size-extra-small);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
}

.form-group select, .form-group input, .form-group textarea {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-small);
  transition: all 0.2s ease;
  height: 38px;
}

.form-group select:focus, .form-group input:focus, .form-group textarea:focus {
  outline: none;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-9);
}

.form-group select:hover, .form-group input:hover, .form-group textarea:hover {
  border-color: var(--el-color-primary-light-7);
}

.form-group-with-button {
  display: flex;
  gap: 2%;
  align-items: end;
}

.form-group-with-button .form-group {
  flex: 1;
  min-width: 20%;
}

.search-button {
  font-weight: var(--el-font-weight-bold);
  height: 38px;
  padding: 0 3%;
  border-radius: var(--el-border-radius-base);
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
  white-space: nowrap;
  min-width: 15%;
}

.approve-button,
.discard-button {
  flex: 1;
  font-weight: var(--el-font-weight-bold);
}

.products-section {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
  transition: all 0.2s ease;
}

.products-section:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.select-all {
  display: flex;
  align-items: center;
  gap: 1%;
  padding: 1.5% 2%;
  background-color: var(--el-bg-color-page);
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  border-radius: var(--el-border-radius-base) var(--el-border-radius-base) 0 0;
}

.select-all input[type="checkbox"] {
  width: 16px;
  height: 16px;
  border: 2px solid var(--el-border-color);
  border-radius: 3px;
  cursor: pointer;
  accent-color: var(--el-color-primary);
}

.products-scrollable {
  flex: 1;
  overflow-y: auto;
  padding: 2%;
  background-color: var(--el-bg-color);
}

.product-item {
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  padding: 1.5%;
  margin-bottom: 1.5%;
  background-color: var(--el-bg-color);
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--el-box-shadow-light);
}

.product-item:hover {
  border-color: rgba(64, 158, 255, 0.5);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
  transform: translateY(-1px);
  background-color: rgba(64, 158, 255, 0.03);
}

.product-success {
  border-left: 4px solid #409eff;
  background-color: rgba(64, 158, 255, 0.02);
}

.product-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
  padding: var(--spacing-xs);
  border-radius: var(--el-border-radius-small);
  transition: background-color 0.2s ease;
}

.product-header:hover {
  background-color: var(--el-fill-color-light);
}

.product-id {
  font-weight: var(--el-font-weight-bold);
  flex-grow: 1;
}

.created-time {
  font-size: var(--el-font-size-extra-small);
  color: var(--el-text-color-secondary);
}

.product-item[data-status="processing"],
.product-item[data-status="pending"],
.product-item[data-status="brandbanCheck"],
.product-item[data-status="fail"] {
  position: relative;
}

.product-item[data-status="processing"]::after {
  content: "가공중";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(90, 130, 180, 0.7); /* 블루-그레이 (중성적) */
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  font-weight: 900;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  z-index: 10;
}

.product-item[data-status="pending"]::after {
  content: "요청 대기중";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(64, 158, 255, 0.7); /* 라이트 블루 (대기 상태) */
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  font-weight: 900;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  z-index: 10;
}

.product-item[data-status="brandbanCheck"]::after {
  content: "브랜드 필터링 승인 대기";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(32, 146, 202, 0.7); /* 블루-틸 (승인 대기) */
  color: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  font-weight: 900;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  z-index: 10;
}

.product-item[data-status="fail"]::after {
  content: "가공 실패";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(89, 74, 176, 0.7); /* 블루-퍼플 (실패 상태) */
  color: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  font-weight: 900;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  z-index: 10;
}

.product-item[data-status="processing"]::before,
.product-item[data-status="pending"]::before,
.product-item[data-status="brandbanCheck"]::before {
  content: "";
  position: absolute;
  top: calc(50% - 15px);
  left: calc(50% - 15px);
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  z-index: 11;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.product-details {
  padding-top: var(--spacing-xs);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-xs);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs);
  border-radius: var(--el-border-radius-small);
  transition: all 0.2s ease;
}

.detail-item:hover {
  background-color: rgba(64, 158, 255, 0.03);
  transform: translateX(2px);
}

.label {
  font-size: var(--el-font-size-extra-small);
  color: var(--el-text-color-secondary);
}

.value {
  font-size: var(--el-font-size-extra-small);
  font-weight: var(--el-font-weight-medium);
  color: var(--el-color-danger);
}

.value.completed {
  color: var(--el-color-success);
}

.counts-container, .request-container {
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.counts-container:hover, .request-container:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.counts-container {
  flex: 0 0 auto;
  overflow: hidden;
  margin-bottom: var(--spacing-md);
}

.request-container {
  flex: 1;
  overflow: hidden;
  margin-bottom: 0;
}

.container-header {
  padding: 2% 2% 0 2%;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 2%;
  flex-shrink: 0;
}

.container-header h3 {
  margin: 0 0 2% 0;
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
}

.counts {
  padding: 0 2% 2% 2%;
  display: flex;
  flex-direction: column;
  gap: 1%;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.count-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--el-bg-color-page);
  border-radius: var(--el-border-radius-base);
  border: 1px solid transparent;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-bottom: var(--spacing-xs);
  cursor: pointer;
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-primary);
}

.count-item:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
  transform: translateY(-1px);
  background-color: var(--el-color-primary-light-9);
}

.count-item:last-child {
  margin-bottom: 0;
}

.count-item.total {
  font-weight: var(--el-font-weight-bold);
  background-color: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  margin-top: var(--spacing-xs);
}

.count-item.total:hover {
  background-color: var(--el-color-primary-light-7);
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
  transform: translateY(-1px);
}

.count-label {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-regular);
  font-weight: var(--el-font-weight-medium);
}

.count-value {
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  min-width: 40px;
  text-align: right;
}

.count-value.success {
  color: var(--el-color-success);
}

.count-value.danger {
  color: var(--el-color-danger);
}

.product-input {
  padding: 0 2%;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-height: 0;
}

.product-input .form-group:first-child {
  margin-bottom: var(--spacing-md);
  flex: none;
}

.product-input .form-group:last-child {
  margin-bottom: var(--spacing-md);
  margin-top: 0;
}

.product-input .form-group:last-child textarea {
  min-height: 60px;
  height: auto;
  resize: vertical;
}

textarea {
  min-height: 60px;
  resize: vertical;
}

.action-buttons {
  padding: var(--spacing-sm) 2% 2% 2%;
  margin-top: 0;
  display: flex;
  flex-direction: row;
  gap: 2%;
  flex-shrink: 0;
  border-top: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color);
}

.approve-button:disabled, .discard-button:disabled, .search-button:disabled {
  background-color: var(--el-border-color);
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  margin-right: var(--spacing-xs);
}

button:disabled .loading-spinner {
  border: 2px solid rgba(150, 150, 150, 0.3);
  border-top-color: var(--el-text-color-secondary);
}

/* 반응형 디자인 */
@media (max-width: 1200px) {
  .right-container {
    flex: 0 0 280px;
  }
}

@media (max-width: 992px) {
  .main-container {
    flex-direction: column;
    height: auto;
    min-height: calc(100vh - 40px);
  }
  
  .left-container {
    flex: none;
    height: auto;
    min-height: 60vh;
  }
  
  .right-container {
    flex: none;
    width: 100%;
    height: auto;
    min-height: 400px;
  }
  
  .counts-container {
    flex: none;
    height: auto;
  }
  
  .counts {
    overflow-y: visible;
    max-height: none;
  }
  
  .request-container {
    min-height: 250px;
  }
  
  .product-input {
    max-height: 200px;
  }
}

@media (max-width: 768px) {
  .progress-check {
    padding: var(--spacing-sm);
  }
  
  .main-container {
    gap: var(--spacing-sm);
  }
  
  .search-options {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .form-group-with-button {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-button {
    width: 100%;
    margin-top: var(--spacing-xs);
  }
}
</style> 