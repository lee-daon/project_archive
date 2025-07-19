<template>
  <div class="modal-overlay" v-if="isVisible" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>쿠팡 카테고리 매핑</h3>
        <button class="close-button" @click="closeModal">×</button>
      </div>
      
      <div class="modal-body">
        <!-- 상품 정보 표시 -->
        <div class="product-info" v-if="productName">
          <div class="product-name-section">
            <h4>상품명: {{ productName }}</h4>
            <button 
              class="suggestion-button"
              @click="getSuggestion"
              :disabled="suggestionsLoading"
            >
              <span v-if="suggestionsLoading">추천 중...</span>
              <span v-else>🤖 AI 추천</span>
            </button>
          </div>
          
          <!-- 추천 결과 -->
          <div v-if="suggestedCategory" class="suggestion-result">
            <h5>💡 추천 카테고리</h5>
            <div class="suggested-category" @click="applySuggestion">
              <span class="suggested-name">{{ suggestedCategory.predictedCategoryName }}</span>
              <span class="suggested-id">(ID: {{ suggestedCategory.predictedCategoryId }})</span>
              <button class="apply-suggestion-btn">적용하기</button>
            </div>
          </div>
          

        </div>
        
        <!-- 검색 입력 -->
        <div class="search-section">
          <input 
            type="text" 
            v-model="searchTerm" 
            @input="onSearchInput"
            placeholder="카테고리를 검색하세요..."
            class="search-input"
          />
        </div>
        
        <!-- 검색 결과 또는 카테고리 트리 -->
        <div class="categories-section">
          <h4>{{ searchTerm ? '검색 결과' : '카테고리 목록' }}</h4>
          
          <!-- 로딩 표시 -->
          <div v-if="categoriesLoading || searchLoading" class="loading-section">
            <div class="loading-spinner">
              <div class="spinner"></div>
              <p>{{ categoriesLoading ? '카테고리를 불러오고 있습니다...' : '검색 결과를 계산하고 있습니다...' }}</p>
            </div>
          </div>
          
          <!-- 경로 탐색 -->
          <div v-else-if="currentPath.length > 0 && !searchTerm" class="breadcrumb">
            <span class="breadcrumb-item" @click="navigateToRoot">전체</span>
            <span 
              v-for="(path, index) in currentPath" 
              :key="index"
              class="breadcrumb-item"
              @click="navigateToPath(index)"
            >
              > {{ path }}
            </span>
          </div>
          
          <div v-if="displayCategories.length > 0" class="category-list">
            <div 
              v-for="category in displayCategories" 
              :key="category.id"
              class="category-item"
              :class="{ 
                'has-children': !category.last,
                'selected': selectedCategory && selectedCategory.id === category.id 
              }"
              @click="handleCategoryClick(category)"
            >
              <span class="category-name">{{ category.wholeCategoryName }}</span>
              <span class="category-score" v-if="searchTerm && category.score">
                ({{ category.score }}점)
              </span>
              <span class="category-arrow" v-if="!category.last">→</span>
              <span class="category-final" v-if="category.last">선택 가능</span>
            </div>
          </div>
          
          <!-- 검색 결과 없음 -->
          <div v-if="searchTerm && displayCategories.length === 0" class="no-results">
            <p>검색 결과가 없습니다.</p>
          </div>
        </div>
        
        <!-- 선택된 카테고리 -->
        <div class="selected-section" v-if="selectedCategory">
          <h4>선택된 카테고리</h4>
          <div class="selected-category">
            <span>{{ selectedCategory.wholeCategoryName }}</span>
            <span class="selected-id">(ID: {{ selectedCategory.id }})</span>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="cancel-button" @click="closeModal">취소</button>
        <button 
          class="confirm-button" 
          @click="confirmSelection"
          :disabled="!selectedCategory"
        >
          확인
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import coopangCategories from '@/assets/coupang-categories.json'
import { ElMessage } from 'element-plus'
import { getCoopangCategorySuggestion } from '@/services/postprocessing'

// 카테고리 평면화 캐시 (첫 로드 이후 재사용)
let coopangFlatCache = null

export default {
  name: 'CoopangCategoryMappingModal',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    platform: {
      type: String,
      default: 'coopang',
      validator: value => ['naver', 'coopang'].includes(value)
    },
    productName: {
      type: String,
      default: ''
    },
    currentMappingId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      searchTerm: '',
      selectedCategory: null,
      displayCategories: [],
      currentPath: [],
      searchTimeout: null,
      allCategories: [],
      categoriesLoading: false,
      searchLoading: false,
      suggestionsLoading: false,
      suggestedCategory: null
    }
  },
  mounted() {
    // 컴포넌트가 처음 렌더링될 때 모달이 이미 표시 중이면 초기화 실행
    if (this.isVisible) {
      this.initializeModal()
      // 배경 스크롤 방지
      document.body.style.overflow = 'hidden'
    }
  },
  watch: {
    isVisible(newVal) {
      if (newVal) {
        this.initializeModal()
        // 배경 스크롤 방지
        document.body.style.overflow = 'hidden'
      } else {
        this.resetModal()
        // 배경 스크롤 복원
        document.body.style.overflow = ''
      }
    },
    productName(newVal) {
      if (newVal && this.isVisible) {
        // 상품명이 변경되고 모달이 열려있을 때 자동 검색
        this.searchTerm = newVal
        this.performSearch()
      }
    }
  },
  methods: {
    initializeModal() {
      // 카테고리 로딩 후 처리하도록 콜백 이용
      this.loadCategories(() => {
        if (this.productName) {
          this.searchTerm = this.productName
          this.performSearch()
        } else {
          this.loadInitialCategories()
        }
      })
    },
    
    resetModal() {
      this.searchTerm = ''
      this.selectedCategory = null
      this.displayCategories = []
      this.currentPath = []
      this.suggestedCategory = null
      this.suggestionsLoading = false
    },
    
    loadCategories(callback) {
      // 이미 캐시에 있으면 바로 사용
      if (coopangFlatCache) {
        this.allCategories = coopangFlatCache
        if (callback) callback()
        return
      }
      // 쿠팡 카테고리 JSON을 평면화하여 네이버와 같은 구조로 변환
      this.categoriesLoading = true
      // setTimeout으로 UI 렌더링 후 무거운 작업 실행
      setTimeout(() => {
        this.allCategories = this.flattenCoopangCategories(coopangCategories)
        coopangFlatCache = this.allCategories // 캐시에 저장
        this.categoriesLoading = false
        if (callback) callback()
      }, 0)
    },
    
    flattenCoopangCategories(categoryNode, parentPath = '') {
      const result = []
      
      // ROOT 노드는 건너뛰기
      if (categoryNode.name === 'ROOT') {
        categoryNode.child.forEach(child => {
          result.push(...this.flattenCoopangCategories(child, ''))
        })
        return result
      }
      
      // 현재 카테고리의 전체 경로 계산
      const currentPath = parentPath ? `${parentPath}>${categoryNode.name}` : categoryNode.name
      
      // 현재 카테고리 추가 (ACTIVE 상태인 것만)
      if (categoryNode.status === 'ACTIVE') {
        result.push({
          id: categoryNode.displayItemCategoryCode.toString(),
          name: categoryNode.name,
          wholeCategoryName: currentPath,
          last: categoryNode.child.length === 0
        })
      }
      
      // 하위 카테고리 재귀적으로 처리
      if (categoryNode.child && categoryNode.child.length > 0) {
        categoryNode.child.forEach(child => {
          result.push(...this.flattenCoopangCategories(child, currentPath))
        })
      }
      
      return result
    },
    
    loadInitialCategories() {
      // 최상위 카테고리만 표시 (wholeCategoryName에 '>'가 없는 것들)
      this.displayCategories = this.allCategories.filter(cat => 
        !cat.wholeCategoryName.includes('>')
      )
    },
    
    onSearchInput() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }
      
      this.searchTimeout = setTimeout(() => {
        if (this.searchTerm.trim()) {
          this.performSearch()
        } else {
          this.loadInitialCategories()
          this.currentPath = []
        }
      }, 300)
    },
    
    performSearch() {
      this.searchLoading = true
      const searchTerm = this.searchTerm.toLowerCase().trim()
      if (!searchTerm) {
        this.displayCategories = []
        this.searchLoading = false
        return
      }
      
      // 검색어를 공백으로 분리
      const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0)
      
      // 각 카테고리에 대해 매칭 점수 계산
      const categoriesWithScore = this.allCategories.map(category => {
        const categoryName = category.name.toLowerCase()
        const wholeCategoryName = category.wholeCategoryName.toLowerCase()
        
        let score = 0
        
        // 각 검색어에 대해 점수 계산
        searchWords.forEach(word => {
          // 카테고리명에 단어가 포함된 경우 높은 점수
          if (categoryName.includes(word)) {
            score += 3
          }
          // 전체 경로에 단어가 포함된 경우 낮은 점수
          else if (wholeCategoryName.includes(word)) {
            score += 1
          }
        })
        
        return { ...category, score }
      })
      
      // 점수가 1 이상인 카테고리만 필터링하고 점수순으로 정렬
      this.displayCategories = categoriesWithScore
        .filter(category => category.score > 0)
        .sort((a, b) => b.score - a.score)
      
      this.searchLoading = false
    },
    
    handleCategoryClick(category) {
      if (category.last) {
        // 최종 카테고리인 경우 선택
        this.selectCategory(category)
      } else {
        // 하위 카테고리가 있는 경우 탐색
        this.navigateToSubCategories(category)
      }
    },
    
    navigateToSubCategories(category) {
      if (this.searchTerm) {
        // 검색 중인 경우 검색 초기화
        this.searchTerm = ''
      }
      
      // 경로 추가
      this.currentPath.push(category.name)
      
      // 현재 선택된 카테고리의 하위 카테고리 찾기
      const currentCategoryPath = category.wholeCategoryName
      this.displayCategories = this.allCategories.filter(cat => {
        // 현재 카테고리의 직접적인 하위 카테고리만 표시
        return cat.wholeCategoryName.startsWith(currentCategoryPath + '>') &&
               cat.wholeCategoryName.split('>').length === currentCategoryPath.split('>').length + 1
      })
    },
    
    navigateToPath(index) {
      // 특정 경로로 이동
      this.currentPath = this.currentPath.slice(0, index + 1)
      const pathString = this.currentPath.join('>')
      
      this.displayCategories = this.allCategories.filter(cat => {
        return cat.wholeCategoryName.startsWith(pathString + '>') &&
               cat.wholeCategoryName.split('>').length === pathString.split('>').length + 1
      })
    },
    
    navigateToRoot() {
      // 최상위로 이동
      this.currentPath = []
      this.loadInitialCategories()
    },
    
    selectCategory(category) {
      this.selectedCategory = category
    },
    
    confirmSelection() {
      if (this.selectedCategory) {
        this.$emit('category-selected', {
          id: this.selectedCategory.id,
          name: this.selectedCategory.name,
          wholeCategoryName: this.selectedCategory.wholeCategoryName,
          platform: this.platform
        })
        this.closeModal()
      }
    },
    
    closeModal() {
      this.$emit('close')
    },
    
    async getSuggestion() {
      if (!this.productName) {
        ElMessage.warning('상품명이 없습니다.')
        return
      }
      
      this.suggestionsLoading = true
      this.suggestedCategory = null
      
      try {
        const response = await getCoopangCategorySuggestion(this.productName)
        
        if (response.success && response.data) {
          const { predictedCategoryId, predictedCategoryName } = response.data
          
          // 추천된 카테고리 ID로 실제 카테고리 정보 찾기
          const foundCategory = this.allCategories.find(cat => 
            cat.id === predictedCategoryId.toString()
          )
          
          if (foundCategory) {
            this.suggestedCategory = {
              ...foundCategory,
              predictedCategoryId,
              predictedCategoryName
            }
          } else {
            // 카테고리를 찾지 못한 경우 기본 정보로 생성
            this.suggestedCategory = {
              id: predictedCategoryId.toString(),
              name: predictedCategoryName,
              wholeCategoryName: predictedCategoryName,
              last: true,
              predictedCategoryId,
              predictedCategoryName
            }
          }
        } else {
          ElMessage.error(response.message || '카테고리 추천에 실패했습니다.')
        }
      } catch (error) {
        console.error('카테고리 추천 오류:', error)
        // 서버로부터 받은 에러 메시지 사용
        const errorMessage = error.response?.data?.message || '카테고리 추천 중 오류가 발생했습니다.'
        ElMessage.error(errorMessage)
      } finally {
        this.suggestionsLoading = false
      }
    },
    
    applySuggestion() {
      if (this.suggestedCategory) {
        // 추천된 카테고리를 선택된 카테고리로 설정
        this.selectedCategory = {
          id: this.suggestedCategory.id,
          name: this.suggestedCategory.predictedCategoryName || this.suggestedCategory.name,
          wholeCategoryName: this.suggestedCategory.wholeCategoryName,
          last: true
        }
        
        // 검색어 초기화 (추천 결과가 선택되었으므로)
        this.searchTerm = ''
        this.displayCategories = []
        this.currentPath = []
      }
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  padding: 0;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--el-box-shadow-dark);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color-page);
}

.modal-header h3 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.close-button:hover {
  color: var(--el-text-color-primary);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm);
}

.product-info {
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--el-bg-color-page);
  border-radius: var(--el-border-radius-base);
}

.product-info h4 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-semibold);
}

.search-section {
  margin-bottom: var(--spacing-md);
}

.search-input {
  width: 100%;
  padding: var(--spacing-sm);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  font-size: var(--el-font-size-base);
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
}

.categories-section,
.selected-section {
  margin-bottom: var(--spacing-md);
}

.categories-section h4,
.selected-section h4 {
  margin-bottom: var(--spacing-sm);
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-semibold);
}

.breadcrumb {
  margin-bottom: var(--spacing-sm);
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
}

.breadcrumb-item {
  cursor: pointer;
  color: var(--el-color-primary);
  margin-right: var(--spacing-xs);
  transition: color 0.2s ease;
}

.breadcrumb-item:hover {
  text-decoration: underline;
  color: var(--el-color-primary-light-3);
}

.category-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
}

.category-item {
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
}

.category-item:last-child {
  border-bottom: none;
}

.category-item:hover {
  background-color: var(--el-bg-color-page);
  transform: translateY(-1px);
}

.category-item.has-children {
  font-weight: var(--el-font-weight-medium);
}

.category-item.selected {
  background-color: var(--el-color-primary-light-9);
  border-left: 3px solid var(--el-color-primary);
}

.category-name {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
}

.category-score {
  font-size: var(--el-font-size-extra-small);
  color: var(--el-color-white);
  background-color: var(--el-color-primary);
  padding: 2px var(--spacing-xs);
  border-radius: var(--el-border-radius-round);
  margin-left: var(--spacing-sm);
}

.category-arrow {
  color: var(--el-color-primary);
  font-weight: var(--el-font-weight-bold);
  margin-left: var(--spacing-sm);
}

.category-final {
  color: var(--el-color-success);
  font-weight: var(--el-font-weight-bold);
  font-size: var(--el-font-size-extra-small);
  margin-left: var(--spacing-sm);
}

.selected-category {
  padding: var(--spacing-md);
  background-color: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: var(--el-border-radius-base);
  color: var(--el-color-primary-dark-2);
}

.selected-id {
  font-size: var(--el-font-size-extra-small);
  color: var(--el-text-color-secondary);
  margin-left: var(--spacing-sm);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border-top: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color-page);
}

.cancel-button,
.confirm-button {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--el-border-radius-base);
  cursor: pointer;
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-medium);
  transition: all 0.2s ease;
}

.cancel-button {
  background-color: var(--el-color-info);
  color: var(--el-color-white);
}

.cancel-button:hover {
  background-color: var(--el-color-info);
  opacity: 0.9;
  transform: translateY(-1px);
}

.confirm-button {
  background-color: var(--el-color-primary);
  color: var(--el-color-white);
}

.confirm-button:hover:not(:disabled) {
  background-color: var(--el-color-primary-dark-2);
  transform: translateY(-1px);
}

.confirm-button:disabled {
  background-color: var(--el-border-color);
  cursor: not-allowed;
  color: var(--el-text-color-disabled);
}

.no-results {
  text-align: center;
  padding: var(--spacing-xxl) var(--spacing-lg);
  color: var(--el-text-color-secondary);
}

.no-results p {
  margin: 0;
  font-size: var(--el-font-size-medium);
}

/* 로딩 섹션 스타일 추가 */
.loading-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.loading-spinner {
  text-align: center;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid var(--el-border-color-lighter);
  border-top: 3px solid var(--el-color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--spacing-md);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-spinner p {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
  margin: 0;
}

.product-name-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.suggestion-button {
  background-color: var(--el-color-primary);
  color: var(--el-color-white);
  border: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--el-border-radius-round);
  font-size: var(--el-font-size-extra-small);
  font-weight: var(--el-font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.suggestion-button:hover:not(:disabled) {
  background-color: var(--el-color-primary-dark-2);
  transform: translateY(-1px);
}

.suggestion-button:disabled {
  background-color: var(--el-color-info);
  cursor: not-allowed;
  opacity: 0.7;
}

.suggestion-result {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-bg-color-page));
  border-left: 4px solid var(--el-color-primary);
  border-radius: var(--el-border-radius-base);
}

.suggestion-result h5 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--el-color-primary-dark-2);
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-semibold);
}

.suggested-category {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--el-bg-color);
  border: 2px solid var(--el-color-primary);
  border-radius: var(--el-border-radius-base);
  transition: all 0.2s ease;
  gap: var(--spacing-sm);
}

.suggested-category:hover {
  background-color: var(--el-bg-color-page);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(91, 108, 242, 0.15);
}

.suggested-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  flex: 1;
}

.suggested-id {
  font-size: 12px;
  color: #666;
  background-color: #f8f9fa;
  padding: 2px 8px;
  border-radius: 12px;
}

.apply-suggestion-btn {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.apply-suggestion-btn:hover {
  background-color: #218838;
}
</style>
