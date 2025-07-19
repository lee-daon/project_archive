<template>
    <div class="category-mapping">
    <div class="page-header">
      <h2 class="page-title">카테고리 매핑</h2>
      <p class="page-description">
        {{ isPendingMode ? '카테고리 매핑이 필요한 상품들의 카테고리를 설정해주세요.' : '매핑이 완료된 카테고리들을 확인하고 수정할 수 있습니다.' }}
      </p>
    </div>

    <!-- 로딩 상태 -->
    <AppLoading v-if="loading" text="카테고리 정보를 불러오고 있습니다..." />

    <!-- 메인 콘텐츠 -->
    <div v-else class="content-container">
      <!-- 카테고리 목록 헤더 -->
      <div class="categories-header">
        <div class="header-info">
          <h3 class="categories-count">
            {{ isPendingMode ? '매핑 대상 카테고리' : '매핑 완료된 카테고리' }} 
            <span v-if="hasPagination">({{ total }}개 중 {{ categories.length }}개)</span>
            <span v-else>({{ categories.length }}개)</span>
          </h3>
          <span v-if="hasChanges" class="changes-indicator">
            {{ Object.keys(pendingChanges).length }}개 변경사항
          </span>
        </div>
        <div class="header-actions">
          <el-button 
            @click="toggleViewMode"
            :disabled="saving"
          >
            {{ modeButtonText }}
          </el-button>
          <el-button 
            type="primary"
            @click="saveAllMappings"
            :disabled="!hasChanges || saving"
          >
            {{ saving ? '저장 중...' : '전체 저장' }}
          </el-button>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-if="categories.length === 0" class="empty-container">
        <el-icon class="empty-icon"><Document /></el-icon>
        <h3 class="empty-title">
          {{ isPendingMode ? '카테고리 매핑이 필요한 상품이 없습니다' : '매핑이 완료된 카테고리가 없습니다' }}
        </h3>
        <p class="empty-message">
          {{ isPendingMode ? '모든 상품이 적절한 카테고리에 매핑되어 있습니다.' : '아직 매핑이 완료된 카테고리가 없습니다.' }}
        </p>
      </div>

      <!-- 카테고리 목록 (스크롤 영역) -->
      <div v-else class="categories-list-container">
      <div class="category-list">
        <div 
          v-for="category in categories" 
          :key="category.catid"
          class="category-card"
            :class="{ 
              'has-changes': hasChangesForCategory(category.catid),
              'completed-mode': isCompletedMode 
            }"
        >
          <!-- 상품 샘플들 -->
          <div class="product-samples">
              <h4 class="samples-title">{{ category.catname }} - 상품 예시</h4>
            <div class="samples-container">
              <div class="images-row">
                <img 
                  v-for="product in category.products.slice(0, 3)" 
                  :key="product.id"
                  :src="product.imageurl || '/placeholder-image.jpg'" 
                  :alt="product.name"
                  class="product-image"
                />
              </div>
              <div class="product-names">
                <div 
                  v-for="product in category.products.slice(0, 3)" 
                  :key="product.id"
                  class="product-name"
                >
                  {{ product.name }}
                </div>
              </div>
            </div>
          </div>

          <!-- 매핑 정보 -->
          <div class="mapping-section">
            <div class="mapping-row">
              <div class="mapping-item">
                  <label class="mapping-label">네이버 카테고리</label>
                <div class="mapping-controls">
                  <div class="current-mapping">
                      <span v-if="category.naver_cat_name" class="mapping-value">
                      {{ category.naver_cat_name }}
                        <small class="mapping-id">({{ category.naver_cat_id }})</small>
                    </span>
                    <span v-else class="no-mapping">매핑되지 않음</span>
                  </div>
                  <el-button 
                    @click="openCategoryModal('naver', category)"
                  >
                    {{ category.naver_cat_name ? '변경' : '매핑' }}
                  </el-button>
                </div>
              </div>

              <div class="mapping-item">
                  <label class="mapping-label">쿠팡 카테고리</label>
                <div class="mapping-controls">
                  <div class="current-mapping">
                      <span v-if="category.coopang_cat_name" class="mapping-value">
                      {{ category.coopang_cat_name }}
                        <small class="mapping-id">({{ category.coopang_cat_id }})</small>
                    </span>
                    <span v-else class="no-mapping">매핑되지 않음</span>
                  </div>
                  <el-button 
                    @click="openCategoryModal('coopang', category)"
                  >
                    {{ category.coopang_cat_name ? '변경' : '매핑' }}
                  </el-button>
                </div>
              </div>

              <div class="mapping-item">
                  <label class="mapping-label">11번가 카테고리</label>
                <div class="mapping-controls">
                  <div class="current-mapping">
                      <span v-if="category.elevenstore_cat_name" class="mapping-value">
                      {{ category.elevenstore_cat_name }}
                        <small class="mapping-id">({{ category.elevenstore_cat_id }})</small>
                    </span>
                    <span v-else class="no-mapping">매핑되지 않음</span>
                  </div>
                  <el-button 
                    @click="openCategoryModal('11st', category)"
                  >
                    {{ category.elevenstore_cat_name ? '변경' : '매핑' }}
                  </el-button>
                </div>
              </div>

              <div class="mapping-item">
                  <label class="mapping-label">ESM 카테고리 (옥션+G마켓)</label>
                <div class="mapping-controls">
                  <div class="current-mapping">
                      <span v-if="category.esm_cat_name" class="mapping-value">
                      {{ category.esm_cat_name }}
                        <small class="mapping-id">({{ category.esm_cat_id }})</small>
                    </span>
                    <span v-else class="no-mapping">매핑되지 않음</span>
                  </div>
                  <el-button 
                    @click="openCategoryModal('esm', category)"
                  >
                    {{ category.esm_cat_name ? '변경' : '매핑' }}
                  </el-button>
                </div>
              </div>
            </div>

            <!-- 변경사항 표시 -->
              <div v-if="hasChangesForCategory(category.catid)" class="category-changes">
              <span class="changes-text">변경사항이 있습니다</span>
              <el-button 
                  type="primary"
                  size="small"
                @click="saveCategoryMapping(category.catid)"
                :disabled="saving"
              >
                저장
              </el-button>
            </div>
          </div>
        </div>
      </div>
      </div>
      
      <!-- 페이지네이션 -->
      <div v-if="hasPagination && total > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          :small="false"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="onPageSizeChange"
          @current-change="onPageChange"
        />
      </div>
    </div>

    <!-- 플로팅 저장 버튼 -->
    <div 
      v-if="hasChanges && !loading" 
      class="floating-save-button"
      @click="saveAllMappings"
      :class="{ 'saving': saving }"
    >
      <el-icon class="save-icon">
        <Loading v-if="saving" />
        <Download v-else />
      </el-icon>
      <span class="save-text">{{ saving ? '저장 중...' : '전체 저장' }}</span>
      <div v-if="Object.keys(pendingChanges).length > 0" class="changes-count">
        {{ Object.keys(pendingChanges).length }}
      </div>
    </div>

    <!-- 카테고리 매핑 모달 -->
    <CategoryMappingModal
      v-if="modalPlatform === 'naver'"
      :is-visible="modalVisible"
      :platform="modalPlatform"
      :product-name="selectedCategoryProductName"
      :current-mapping-id="currentMappingId"
      @category-selected="onCategorySelected"
      @close="closeModal"
    />
    
    <!-- 쿠팡 카테고리 매핑 모달 -->
    <CoopangCategoryMappingModal
      v-if="modalPlatform === 'coopang'"
      :is-visible="modalVisible"
      :platform="modalPlatform"
      :product-name="selectedCategoryProductName"
      :current-mapping-id="currentMappingId"
      @category-selected="onCategorySelected"
      @close="closeModal"
    />
    
    <!-- 11번가 카테고리 매핑 모달 -->
    <ElevenStoreCategoryMappingModal
      v-if="modalPlatform === '11st'"
      :is-visible="modalVisible"
      :platform="modalPlatform"
      :product-name="selectedCategoryProductName"
      :current-mapping-id="currentMappingId"
      @category-selected="onCategorySelected"
      @close="closeModal"
    />
    
    <!-- ESM 카테고리 매핑 모달 -->
    <EsmCategoryMappingModal
      v-if="modalPlatform === 'esm'"
      :is-visible="modalVisible"
      :platform="modalPlatform"
      :product-name="selectedCategoryProductName"
      :current-mapping-id="currentMappingId"
      @category-selected="onCategorySelected"
      @close="closeModal"
    />
  </div>
</template>

<script>
import CategoryMappingModal from '@/components/product/naverCategoryMapping.vue'
import CoopangCategoryMappingModal from '@/components/product/coopangCategoryMapping.vue'
import ElevenStoreCategoryMappingModal from '@/components/product/11storeCategoryMapping.vue'
import EsmCategoryMappingModal from '@/components/product/esmCategoryMapping.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Loading, Download } from '@element-plus/icons-vue'
import AppLoading from '@/components/app/loading.vue'
import { 
  getCategoryMappingInfo, 
  updateCategoryMapping, 
  getCategoryProductSamples,
  getCompletedCategoryMappingInfo
} from '@/services/postprocessing'

export default {
  name: 'CategoryMapping',
  components: {
    CategoryMappingModal,
    CoopangCategoryMappingModal,
    ElevenStoreCategoryMappingModal,
    EsmCategoryMappingModal,
    Document,
    Loading,
    Download,
    AppLoading
  },
  data() {
    return {
      loading: false,
      saving: false,
      viewMode: 'pending', // 'pending' | 'completed'
      categories: [],
      originalMappings: {},
      pendingChanges: {},
      modalVisible: false,
      modalPlatform: 'naver',
      selectedCategory: null,
      selectedCategoryProductName: '',
      currentMappingId: '',
      // 페이지네이션 관련
      currentPage: 1,
      pageSize: 20,
      total: 0,
      hasPagination: false
    }
  },
  computed: {
    hasChanges() {
      return Object.keys(this.pendingChanges).length > 0
    },
    isPendingMode() {
      return this.viewMode === 'pending'
    },
    isCompletedMode() {
      return this.viewMode === 'completed'
    },
    modeButtonText() {
      return this.isPendingMode ? '매핑 완료된 카테고리 보기' : '매핑 대기중인 카테고리 보기'
    },
    totalPages() {
      return Math.ceil(this.total / this.pageSize)
    }
  },
  async mounted() {
    await this.loadCategoryMappingInfo()
  },
  methods: {
    async loadCategoryMappingInfo() {
      this.loading = true
      
      try {
        const params = {
          page: this.currentPage,
          limit: this.pageSize
        }
        
        let response
        if (this.isPendingMode) {
          response = await getCategoryMappingInfo(params)
        } else {
          response = await getCompletedCategoryMappingInfo(params)
        }
        
        this.categories = response.categories || []
        
        // 페이지네이션 정보 업데이트
        this.hasPagination = Object.prototype.hasOwnProperty.call(response, 'total')
        if (this.hasPagination) {
          this.total = response.total || 0
          this.currentPage = response.page || 1
          this.pageSize = response.limit || 20
        }
        
        // 원본 매핑 정보 저장
        this.originalMappings = {}
        this.categories.forEach(category => {
          this.originalMappings[category.catid] = {
            naver_cat_id: category.naver_cat_id,
            naver_cat_name: category.naver_cat_name,
            coopang_cat_id: category.coopang_cat_id,
            coopang_cat_name: category.coopang_cat_name,
            elevenstore_cat_id: category.elevenstore_cat_id,
            elevenstore_cat_name: category.elevenstore_cat_name,
            esm_cat_id: category.esm_cat_id,
            esm_cat_name: category.esm_cat_name
          }
        })
        
        // 각 카테고리의 상품 샘플 로드
        await this.loadProductSamples()
        
      } catch (error) {
        console.error('카테고리 매핑 정보 로드 실패:', error)
        // 서버로부터 받은 에러 메시지 사용
        const errorMessage = error.response?.data?.message || '카테고리 매핑 정보를 불러오는데 실패했습니다.'
        ElMessage.error(errorMessage)
      } finally {
        this.loading = false
      }
    },
    
    async loadProductSamples() {
      for (const category of this.categories) {
        try {
          const samples = await getCategoryProductSamples(category.catid, 3)
          category.products = samples.products || []
        } catch (error) {
          console.error(`카테고리 ${category.catid} 상품 샘플 로드 실패:`, error)
          category.products = []
        }
      }
    },
    
    openCategoryModal(platform, category) {
      this.modalPlatform = platform
      this.selectedCategory = category
      
      if (platform === 'naver') {
        this.currentMappingId = category.naver_cat_id
      } else if (platform === 'coopang') {
        this.currentMappingId = category.coopang_cat_id
      } else if (platform === '11st') {
        this.currentMappingId = category.elevenstore_cat_id
      } else if (platform === 'esm') {
        this.currentMappingId = category.esm_cat_id
      }
      
      // 상품명으로 추천을 위해 첫 번째 상품명 사용
      this.selectedCategoryProductName = category.products?.[0]?.name || ''
      
      this.modalVisible = true
    },
    
    closeModal() {
      this.modalVisible = false
      this.selectedCategory = null
      this.selectedCategoryProductName = ''
      this.currentMappingId = ''
    },
    
    onCategorySelected(selectedCategoryData) {
      if (!this.selectedCategory) return
      
      const { id, name, platform } = selectedCategoryData
      const catid = this.selectedCategory.catid
      
      // 변경사항 추적
      if (!this.pendingChanges[catid]) {
        this.pendingChanges[catid] = {}
      }
      
      if (platform === 'naver') {
        this.selectedCategory.naver_cat_id = id
        this.selectedCategory.naver_cat_name = name
        this.pendingChanges[catid].naver_cat_id = id
        this.pendingChanges[catid].naver_cat_name = name
      } else if (platform === 'coopang') {
        this.selectedCategory.coopang_cat_id = id
        this.selectedCategory.coopang_cat_name = name
        this.pendingChanges[catid].coopang_cat_id = id
        this.pendingChanges[catid].coopang_cat_name = name
      } else if (platform === '11st') {
        this.selectedCategory.elevenstore_cat_id = id
        this.selectedCategory.elevenstore_cat_name = name
        this.pendingChanges[catid].elevenstore_cat_id = id
        this.pendingChanges[catid].elevenstore_cat_name = name
      } else if (platform === 'esm') {
        this.selectedCategory.esm_cat_id = id
        this.selectedCategory.esm_cat_name = name
        this.pendingChanges[catid].esm_cat_id = id
        this.pendingChanges[catid].esm_cat_name = name
        // ESM 추가 정보 저장
        if (selectedCategoryData.auctionCategorycode) {
          this.pendingChanges[catid].auction_cat_id = selectedCategoryData.auctionCategorycode
        }
        if (selectedCategoryData.gmarketCategorycode) {
          this.pendingChanges[catid].gmarket_cat_id = selectedCategoryData.gmarketCategorycode
        }
      }
      
      this.closeModal()
    },
    
    reapplyPendingChanges() {
      if (!this.hasChanges) return

      this.categories.forEach(category => {
        if (this.pendingChanges[category.catid]) {
          Object.assign(category, this.pendingChanges[category.catid])
        }
      })
    },

    hasChangesForCategory(catid) {
      return this.pendingChanges[catid] && Object.keys(this.pendingChanges[catid]).length > 0
    },
    
    async saveCategoryMapping(catid) {
      if (!this.pendingChanges[catid]) return
      
      this.saving = true
      try {
        const mappings = [{
          catid,
          ...this.pendingChanges[catid]
        }]
        
        await updateCategoryMapping(mappings)
        
        delete this.pendingChanges[catid]
        
        ElMessage.success('카테고리 매핑이 저장되었습니다.')

        await this.loadCategoryMappingInfo()
        
        this.reapplyPendingChanges()
        
      } catch (error) {
        console.error('카테고리 매핑 저장 실패:', error)
        // 서버로부터 받은 에러 메시지 사용
        const errorMessage = error.response?.data?.message || '카테고리 매핑 저장에 실패했습니다.'
        ElMessage.error(errorMessage)
      } finally {
        this.saving = false
      }
    },
    
    async saveAllMappings() {
      if (!this.hasChanges) return
      
      this.saving = true
      try {
        const mappings = Object.keys(this.pendingChanges).map(catid => ({
          catid,
          ...this.pendingChanges[catid]
        }))
        
        await updateCategoryMapping(mappings)
        
        this.pendingChanges = {}
        
        ElMessage.success('모든 카테고리 매핑이 저장되었습니다.')

        await this.loadCategoryMappingInfo()
        
      } catch (error) {
        console.error('카테고리 매핑 일괄 저장 실패:', error)
        // 서버로부터 받은 에러 메시지 사용
        const errorMessage = error.response?.data?.message || '카테고리 매핑 저장에 실패했습니다.'
        ElMessage.error(errorMessage)
      } finally {
        this.saving = false
      }
    },
    
    async toggleViewMode() {
      // 변경사항이 있으면 확인
      if (this.hasChanges) {
        const result = await ElMessageBox.confirm(
          '저장하지 않은 변경사항이 있습니다. 계속하시겠습니까?',
          '확인',
          {
            confirmButtonText: '계속',
            cancelButtonText: '취소',
            type: 'warning'
          }
        ).catch(() => false)
        
        if (!result) return
      }
      
      // 모드 전환
      this.viewMode = this.viewMode === 'pending' ? 'completed' : 'pending'
      
      // 변경사항 초기화
      this.pendingChanges = {}
      
      // 페이지 리셋
      this.currentPage = 1
      
      // 데이터 다시 로드
      await this.loadCategoryMappingInfo()
    },
    
    async onPageChange(page) {
      this.currentPage = page
      await this.loadCategoryMappingInfo()
    },
    
    async onPageSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1 // 페이지 사이즈 변경 시 첫 페이지로 이동
      await this.loadCategoryMappingInfo()
    }
  }
}
</script>

<style scoped>
.category-mapping {
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
  margin-bottom: 0;
}

.page-description {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-base);
  margin: 0;
}

/* 상태 컨테이너들 */
.empty-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
  padding: var(--spacing-xxl);
}

.empty-container {
  color: var(--el-text-color-secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
}

.empty-title {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-semibold);
  margin-bottom: var(--spacing-sm);
}

.empty-message {
  font-size: var(--el-font-size-base);
  text-align: center;
  margin-bottom: var(--spacing-md);
}

/* 메인 콘텐츠 */
.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: var(--spacing-sm) var(--spacing-md) 0;
  max-width: 1800px;
  margin: 0 auto;
  width: 100%;
}

/* 카테고리 헤더 */
.categories-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--el-bg-color);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--el-box-shadow-base);
  margin-bottom: var(--spacing-sm);
  flex-shrink: 0;
}

.header-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.categories-count {
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-primary);
  margin: 0;
}

.changes-indicator {
  font-size: var(--el-font-size-small);
  color: var(--el-color-warning);
  font-weight: var(--el-font-weight-medium);
  background-color: rgba(255, 193, 7, 0.1);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--el-border-radius-base);
}

/* 카테고리 목록 컨테이너 (스크롤 영역) */
.categories-list-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: var(--spacing-xs);
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* 페이지네이션 */
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  border-top: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
}

.category-card {
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-md);
  box-shadow: var(--el-box-shadow-base);
  transition: all 0.2s ease;
}

.category-card:hover {
  box-shadow: var(--el-box-shadow-dark);
}

.category-card.has-changes {
  border-color: var(--el-color-warning);
  background-color: rgba(255, 193, 7, 0.02);
}

/* 상품 샘플 */
.product-samples {
  margin-bottom: var(--spacing-md);
}

.samples-title {
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-primary);
  margin-bottom: var(--spacing-sm);
}

.samples-container {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
}

.images-row {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-start;
}

.product-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  flex-shrink: 0;
}

.product-names {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex: 1;
}

.product-name {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

/* 매핑 섹션 */
.mapping-section {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: var(--spacing-md);
}

.mapping-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
}

.mapping-item {
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-md);
  background-color: var(--el-bg-color-page);
}

.mapping-label {
  display: block;
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-primary);
  margin-bottom: var(--spacing-sm);
}

.mapping-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
}

.current-mapping {
  flex: 1;
  min-height: 20px;
}

.mapping-value {
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-small);
}

.mapping-id {
  color: var(--el-text-color-secondary);
  margin-left: var(--spacing-xs);
}

.no-mapping {
  color: var(--el-text-color-placeholder);
  font-style: italic;
  font-size: var(--el-font-size-small);
}

/* 변경사항 표시 */
.category-changes {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm);
  background-color: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: var(--el-border-radius-base);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.changes-text {
  color: var(--el-color-warning);
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-medium);
}

/* 플로팅 저장 버튼 */
.floating-save-button {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background-color: var(--el-color-primary);
  color: white;
  border: none;
  border-radius: var(--el-border-radius-round);
  padding: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  box-shadow: var(--el-box-shadow-dark);
  transition: all 0.3s ease;
  z-index: 1000;
  font-weight: var(--el-font-weight-semibold);
  font-size: var(--el-font-size-small);
  min-width: 140px;
}

.floating-save-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow-light);
  background-color: var(--el-color-primary-light-3);
}

.floating-save-button.saving {
  background-color: var(--el-color-info);
  cursor: not-allowed;
}

.floating-save-button.saving:hover {
  transform: none;
  background-color: var(--el-color-info);
}

.save-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.save-text {
  white-space: nowrap;
}

.changes-count {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--el-font-size-extra-small);
  font-weight: var(--el-font-weight-bold);
  margin-left: var(--spacing-xs);
  flex-shrink: 0;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .content-container {
    padding: var(--spacing-sm);
  }
  
  .page-header {
    padding: var(--spacing-sm);
  }
  
  .mapping-row {
    grid-template-columns: 1fr;
  }
  
  .samples-container {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .images-row {
    gap: var(--spacing-xs);
  }
  
  .product-image {
    width: 80px;
    height: 80px;
  }
  
  .categories-header {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: stretch;
  }
  
  .header-info {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
  
  .header-actions {
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  
  .floating-save-button {
    bottom: 20px;
    right: 20px;
    padding: var(--spacing-sm);
    min-width: 60px;
  }
  
  .save-text {
    display: none;
  }
  
  .changes-count {
    margin-left: 0;
  }
  
  .pagination-container {
    padding: var(--spacing-sm) 0;
  }
  
  .pagination-container :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .pagination-container :deep(.el-pagination__sizes) {
    margin: var(--spacing-xs) 0;
  }
}

@media (max-width: 992px) {
  .samples-container {
    flex-direction: column;
  }
}
</style> 