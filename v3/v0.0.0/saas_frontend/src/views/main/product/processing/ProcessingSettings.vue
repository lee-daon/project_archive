<template>
  <div class="processing-settings">
    <div class="page-header">
      <h2 class="page-title">가공설정 및 진행</h2>
      <p class="page-description">승인된 상품을 선택하여 다양한 가공 옵션을 적용할 수 있습니다.</p>
    </div>
    
    <AppLoading 
      v-if="isLoading" 
      text="처리 중입니다. 잠시만 기다려주세요..."
      overlay
    />
    
    <div class="layout-container">
      <div class="left-column">
        <div class="card">
          <h2>가공할 상품 선택</h2>
          <div class="selection-options">
            <div class="option-item">
              <label class="radio-label">
                <input 
                  type="radio" 
                  id="select-all" 
                  v-model="productSelectionType" 
                  value="all" 
                  @change="resetProductSelection"
                  :disabled="isLoading">
                <span>전체 상품</span>
              </label>
              <div v-if="productSelectionType === 'all'" class="total-info">
                총 {{ totalCommitCount }}개의 상품
              </div>
            </div>

            <div class="option-item">
              <label class="radio-label">
                <input 
                  type="radio" 
                  id="select-recent" 
                  v-model="productSelectionType" 
                  value="recent" 
                  @change="resetProductSelection"
                  :disabled="isLoading">
                <span>최신/과거 N개</span>
              </label>
                             <div v-if="productSelectionType === 'recent'" class="sub-option-styled">
                 <div class="recent-option">
                   <label for="recent-count">개수</label>
                   <input 
                     type="number" 
                     id="recent-count"
                     v-model.number="recentCount" 
                     min="1" 
                     :max="totalCommitCount"
                     :disabled="isLoading">
                   <div class="radio-group">
                     <label class="radio-label">
                       <input 
                         type="radio" 
                         id="recent-type-recent" 
                         v-model="recentType" 
                         value="recent"
                         :disabled="isLoading">
                       <span>최신</span>
                     </label>
                     <label class="radio-label">
                       <input 
                         type="radio" 
                         id="recent-type-past" 
                         v-model="recentType" 
                         value="past"
                         :disabled="isLoading">
                       <span>과거</span>
                     </label>
                   </div>
                 </div>
               </div>
            </div>

            <div class="option-item">
              <label class="radio-label">
                <input 
                  type="radio" 
                  id="select-commitcode" 
                  v-model="productSelectionType" 
                  value="commitcode" 
                  @change="resetProductSelection"
                  :disabled="isLoading">
                <span>그룹 코드별</span>
              </label>
                             <div v-if="productSelectionType === 'commitcode'" class="sub-option">
                 <select 
                   id="commit-code-select"
                   v-model="selectedCommitCode"
                   @change="handleCommitCodeChange"
                   :disabled="isLoading">
                   <option value="">코드를 선택하세요</option>
                   <option v-for="group in commitGroups" :key="group.commitcode" :value="group.commitcode">
                     코드 {{ group.commitcode }} ({{ group.count }}개)
                   </option>
                 </select>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div class="right-column">
        <div class="card options-card">
          <h2>가공 옵션 선택</h2>
          
          <div class="processing-options">
            <div class="option-buttons option-section">
              <button 
                type="button"
                class="option-btn modal-btn" 
                :class="{ active: showSeoOptions }"
                @click="toggleSeoModal"
                :disabled="isLoading">
                <el-icon><Setting /></el-icon>
                상품명 SEO 최적화
              </button>
              <button 
                type="button"
                class="option-btn modal-btn" 
                :class="{ active: showKeywordOptions }"
                @click="toggleKeywordModal"
                :disabled="isLoading">
                <el-icon><Setting /></el-icon>
                키워드 생성
              </button>
            </div>
            
            <div class="option-buttons option-section">
              <button 
                type="button"
                class="option-btn" 
                :class="{ active: processingOptions.brandFiltering }"
                @click="processingOptions.brandFiltering = !processingOptions.brandFiltering"
                :disabled="isLoading">
                <el-icon><Filter /></el-icon>
                브랜드 필터링
              </button>
              <button 
                type="button"
                class="option-btn" 
                :class="{ active: processingOptions.optionTranslation }"
                @click="processingOptions.optionTranslation = !processingOptions.optionTranslation"
                :disabled="isLoading">
                <el-icon><Switch /></el-icon>
                옵션명 SEO 최적화
              </button>
              <button 
                type="button"
                class="option-btn" 
                :class="{ active: processingOptions.attributeTranslation }"
                @click="processingOptions.attributeTranslation = !processingOptions.attributeTranslation"
                :disabled="isLoading">
                <el-icon><Edit /></el-icon>
                속성명 번역
              </button>
            </div>
            
            <div class="option-buttons option-section">
              <button 
                type="button"
                class="option-btn" 
                :class="{ active: processingOptions.imageTranslation.main }"
                @click="processingOptions.imageTranslation.main = !processingOptions.imageTranslation.main"
                :disabled="isLoading">
                <el-icon><Picture /></el-icon>
                메인 이미지 번역
              </button>
              <button 
                type="button"
                class="option-btn" 
                :class="{ active: processingOptions.imageTranslation.detail }"
                @click="processingOptions.imageTranslation.detail = !processingOptions.imageTranslation.detail"
                :disabled="isLoading">
                <el-icon><PictureFilled /></el-icon>
                상세 이미지 번역
              </button>
              <button 
                type="button"
                class="option-btn" 
                :class="{ active: processingOptions.imageTranslation.option }"
                @click="processingOptions.imageTranslation.option = !processingOptions.imageTranslation.option"
                :disabled="isLoading">
                <el-icon><Files /></el-icon>
                옵션 이미지 번역
              </button>
            </div>
            
            <div class="option-buttons">
              <div class="image-option-container">
                <button 
                  type="button"
                  class="option-btn" 
                  :class="{ active: processingOptions.alphaImages }"
                  @click="processingOptions.alphaImages = !processingOptions.alphaImages"
                  :disabled="isLoading || !isEnterprisePlan">
                  <el-icon><Crop /></el-icon>
                  누끼 이미지 생성
                </button>
                <el-tag v-if="!isEnterprisePlan" type="warning" size="small">Enterprise 전용</el-tag>
                <div class="number-input">
                  <label for="alpha-image-number">이미지 번호:</label>
                  <input 
                    type="number" 
                    id="alpha-image-number"
                    v-model.number="processingOptions.alphaImageNumber" 
                    min="1"
                    :disabled="isLoading || !isEnterprisePlan">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="bottom-bar">
      <div class="stats-counter">
        <div class="stat">
          선택 상품: <span class="stat-value">{{ selectedProductCount }}</span>
        </div>
        <div class="stat">
          전체 상품: <span class="stat-value">{{ totalCommitCount }}</span>
        </div>
      </div>
      <div class="action-buttons">
        <el-button 
          @click="resetOptions" 
          :disabled="isLoading"
          size="default"
        >
          <el-icon><RefreshLeft /></el-icon>
          초기화
        </el-button>
        <el-button 
          type="primary" 
          @click="startProcessingHandler" 
          :disabled="isLoading"
          :loading="isLoading"
          size="default"
        >
          <el-icon><VideoPlay /></el-icon>
          가공 시작
        </el-button>
      </div>
    </div>
    
    <!-- 키워드 생성 모달 -->
    <div class="modal" v-if="keywordModalVisible" @click.self="closeKeywordModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>키워드 생성 설정</h3>
          <button type="button" class="close-btn" @click="closeKeywordModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="modal-option">
            <div class="toggle-group">
              <el-switch 
                v-model="keywordToggleValue"
                :disabled="!isEnterprisePlan"
                active-text="고급"
                inactive-text="기본"
                size="large"
                @change="handleKeywordToggle"
              />
              <el-tag v-if="!isEnterprisePlan" type="warning" size="small">Enterprise 전용</el-tag>
            </div>
            <div class="input-group">
              <label for="keyword-include">포함할 키워드</label>
              <input 
                type="text" 
                id="keyword-include"
                v-model="keywordOptionsTemp.include"
                placeholder="필요시 작성(쉼표로 구분)"
                class="modal-input">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <el-button @click="closeKeywordModal">취소</el-button>
          <el-button type="primary" @click="applyKeywordOptions">적용</el-button>
        </div>
      </div>
    </div>
    
    <!-- SEO 최적화 모달 -->
    <div class="modal" v-if="seoModalVisible" @click.self="closeSeoModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>상품명 SEO 최적화 설정</h3>
          <button type="button" class="close-btn" @click="closeSeoModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="modal-option">
            <div class="input-group">
              <label for="seo-include">포함할 키워드</label>
              <input 
                type="text" 
                id="seo-include"
                v-model="seoOptionsTemp.include"
                placeholder="필요시 작성(쉼표로 구분)"
                class="modal-input">
            </div>
            <div class="input-group">
              <label for="seo-category">참고할 카테고리</label>
              <input 
                type="text" 
                id="seo-category"
                v-model="seoOptionsTemp.category"
                placeholder="공통 카테고리 존재시 작성"
                class="modal-input">
            </div>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  id="seo-include-brand"
                  v-model="seoOptionsTemp.includeBrand">
                <span>브랜드명 포함</span>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <el-button @click="closeSeoModal">취소</el-button>
          <el-button type="primary" @click="applySeoOptions">적용</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getCommitStatusProducts, startProcessing } from '../../../../services/processing';
import { stringToArray } from '../../../../services/processing_service/utils';
import { getUser } from '@/services/auth';
import AppLoading from '@/components/app/loading.vue';
import { 
  Setting, 
  Filter, 
  Switch, 
  Edit, 
  Picture, 
  PictureFilled, 
  Files, 
  Crop, 
  RefreshLeft, 
  VideoPlay 
} from '@element-plus/icons-vue';

export default {
  name: 'ProcessingSettings',
  components: {
    AppLoading,
    Setting,
    Filter,
    Switch,
    Edit,
    Picture,
    PictureFilled,
    Files,
    Crop,
    RefreshLeft,
    VideoPlay
  },
  setup() {
    // 라우터 추가
    const router = useRouter();
    // 권한/로딩
    const isLoading = ref(false);
    const user = ref(null);
    const isEnterprisePlan = ref(false);
    const totalCommitCount = ref(0);
    const commitGroups = ref([]);
    
    // 상품 선택 옵션
    const productSelectionType = ref('all');
    const recentCount = ref(10);
    const recentType = ref('recent');
    const selectedCommitCode = ref('');
    
    // 가공 옵션
    const processingOptions = reactive({
      brandFiltering: false,
      optionTranslation: false,
      attributeTranslation: false,
      imageTranslation: {
        main: false,
        detail: false,
        option: false
      },
      keyword: {
        type: 'basic',
        include: ''
      },
      seo: {
        include: '',
        category: '',
        includeBrand: false
      },
      alphaImages: false,
      alphaImageNumber: 1
    });
    
    // UI 상태
    const showKeywordOptions = ref(false);
    const showSeoOptions = ref(false);
    
    // 모달 상태
    const keywordModalVisible = ref(false);
    const seoModalVisible = ref(false);
    const keywordOptionsTemp = ref({...processingOptions.keyword});
    const seoOptionsTemp = ref({...processingOptions.seo});
    
    // 토글 상태
    const keywordToggleValue = ref(false);
    
    // 초기 데이터 로드 및 권한 체크
    onMounted(async () => {
      try {
        // 사용자 정보 확인
        user.value = getUser();
        isEnterprisePlan.value = user.value?.plan === 'enterprise';

        isLoading.value = true;
        const response = await getCommitStatusProducts();
        if (response.success) {
          totalCommitCount.value = response.data.total_commit_count;
          commitGroups.value = response.data.commit_groups;
        }
      } catch (error) {
        console.error('데이터 로드 중 오류 발생:', error);
        ElMessage.error(error.response?.data?.message || '데이터 로드 중 오류가 발생했습니다.');
      } finally {
        isLoading.value = false;
      }
    });
    
    // 선택된 상품 ID 계산
    const selectedProductIds = computed(() => {
      if (productSelectionType.value === 'all') {
        // 전체 상품: 모든 그룹의 모든 상품 ID
        const allIds = [];
        commitGroups.value.forEach(group => {
          allIds.push(...group.productids);
        });
        return allIds;
      } else if (productSelectionType.value === 'recent') {
        // 최신/과거 N개 상품
        let allProductIds = [];
        commitGroups.value.forEach(group => {
          allProductIds = [...allProductIds, ...group.productids];
        });
        
        // 최신 또는 과거 상품 선택
        if (recentType.value === 'recent') {
          return allProductIds.slice(-recentCount.value);
        } else {
          return allProductIds.slice(0, recentCount.value);
        }
      } else if (productSelectionType.value === 'commitcode') {
        // 특정 커밋 코드 상품
        if (selectedCommitCode.value !== '' && selectedCommitCode.value !== undefined) {
          const commitCodeValue = parseInt(selectedCommitCode.value);
          const group = commitGroups.value.find(g => g.commitcode === commitCodeValue);
          console.log('Found group:', group);
          return group ? [...group.productids] : [];
        }
        return [];
      }
      
      return [];
    });
    
    // 선택된 상품 개수 계산
    const selectedProductCount = computed(() => {
      const ids = selectedProductIds.value;
      return ids ? ids.length : 0;
    });
    
    // 커밋 코드 변경 처리
    const handleCommitCodeChange = () => {
      // 컴포넌트 업데이트를 위해 nextTick 사용
      nextTick(() => {
        console.log(`커밋 코드 선택: ${selectedCommitCode.value} (타입: ${typeof selectedCommitCode.value})`);
        console.log(`선택된 상품 ID 목록:`, selectedProductIds.value);
        console.log(`상품 개수: ${selectedProductCount.value}`);
      });
    };
    
    // 커밋 코드 변경 감시
    watch([selectedCommitCode, productSelectionType], () => {
      // 값 변경 시 DOM이 업데이트되도록 보장
      nextTick(() => {
        console.log(`선택 타입: ${productSelectionType.value}, 커밋 코드: ${selectedCommitCode.value}, 타입: ${typeof selectedCommitCode.value}`);
        console.log(`상품 개수: ${selectedProductCount.value}`);
        
        // commitGroups 상태 확인
        if (commitGroups.value.length > 0) {
          console.log('사용 가능한 커밋 그룹:', commitGroups.value);
        }
      });
    });
    
    // 선택 초기화
    const resetProductSelection = () => {
      if (productSelectionType.value === 'recent') {
        recentCount.value = 10;
        recentType.value = 'recent';
      } else if (productSelectionType.value === 'commitcode') {
        selectedCommitCode.value = '';
      }
    };
    
    // 옵션 초기화
    const resetOptions = () => {
      productSelectionType.value = 'all';
      recentCount.value = 10;
      recentType.value = 'recent';
      selectedCommitCode.value = '';
      
      // 모든 가공 옵션 초기화
      Object.keys(processingOptions).forEach(key => {
        if (typeof processingOptions[key] === 'object') {
          if (key === 'imageTranslation') {
            processingOptions[key].main = false;
            processingOptions[key].detail = false;
            processingOptions[key].option = false;
          } else if (key === 'keyword') {
            processingOptions[key].type = 'basic';
            processingOptions[key].include = '';
          } else if (key === 'seo') {
            processingOptions[key].include = '';
            processingOptions[key].category = '';
            processingOptions[key].includeBrand = false;
          }
        } else {
          processingOptions[key] = false;
        }
      });
      
      processingOptions.alphaImageNumber = 1;
      showKeywordOptions.value = false;
      showSeoOptions.value = false;
    };
    
    // 토글 핸들러 함수
    const handleKeywordToggle = (value) => {
      keywordOptionsTemp.value.type = value ? 'advanced' : 'basic';
    };
    
    // 모달 관리 함수
    const toggleKeywordModal = () => {
      if (!isEnterprisePlan.value && processingOptions.keyword.type === 'advanced') {
        // 비 Enterprise에서 이미 고급 선택된 경우 기본으로 리셋
        processingOptions.keyword.type = 'basic';
      }
      keywordOptionsTemp.value = {...processingOptions.keyword};
      keywordToggleValue.value = keywordOptionsTemp.value.type === 'advanced';
      keywordModalVisible.value = !keywordModalVisible.value;
    };
    
    const closeKeywordModal = () => {
      keywordModalVisible.value = false;
    };
    
    const applyKeywordOptions = () => {
      processingOptions.keyword = {...keywordOptionsTemp.value};
      showKeywordOptions.value = true;
      keywordModalVisible.value = false;
    };
    
    const toggleSeoModal = () => {
      seoOptionsTemp.value = {...processingOptions.seo};
      seoModalVisible.value = !seoModalVisible.value;
    };
    
    const closeSeoModal = () => {
      seoModalVisible.value = false;
    };
    
    const applySeoOptions = () => {
      processingOptions.seo = {...seoOptionsTemp.value};
      showSeoOptions.value = true;
      seoModalVisible.value = false;
    };
    
    // 가공 시작
    const startProcessingHandler = async () => {
      try {
        isLoading.value = true;
        
        // 가공 옵션 구성
        const options = {
          brandFiltering: processingOptions.brandFiltering,
          optionTranslation: processingOptions.optionTranslation,
          attributeTranslation: processingOptions.attributeTranslation,
          imageTranslation: {
            main: processingOptions.imageTranslation.main,
            detail: processingOptions.imageTranslation.detail,
            option: processingOptions.imageTranslation.option
          }
        };
        
        // 키워드 옵션
        if (showKeywordOptions.value) {
          options.keyword = {
            type: processingOptions.keyword.type,
            include: stringToArray(processingOptions.keyword.include)
          };
        }
        
        // SEO 옵션
        if (showSeoOptions.value) {
          options.seo = {
            include: stringToArray(processingOptions.seo.include),
            category: processingOptions.seo.category,
            includeBrand: processingOptions.seo.includeBrand
          };
        }
        
        // 누끼 이미지 옵션
        if (processingOptions.alphaImages) {
          const order = processingOptions.alphaImageNumber;
          options.nukkiImages = {
            enabled: true,
            order: order < 5 ? order : 1 // 5보다 작아야 함
          };
        }
        
        // 타겟 구성
        let targets;
        
        if (productSelectionType.value === 'all') {
          // 전체 상품
          targets = { type: 'all' };
        } else if (productSelectionType.value === 'recent') {
          // 최신/과거 N개 상품
          targets = {
            type: recentType.value === 'recent' ? 'recent' : 'past',
            count: recentCount.value
          };
        } else if (productSelectionType.value === 'commitcode') {
          // 테스트 코드별 상품
          if (selectedCommitCode.value !== '' && selectedCommitCode.value !== undefined) {
            const commitCodeValue = parseInt(selectedCommitCode.value);
            targets = {
              type: 'commit',
              commitCode: commitCodeValue,
              productIds: selectedProductIds.value
            };
          } else {
            ElMessage.warning('테스트 코드를 선택해주세요.');
            isLoading.value = false;
            return;
          }
        }
        
        // 선택된 상품이 없는 경우 체크
        if ((targets.type === 'ids' || targets.type === 'commit') && 
            (!selectedProductIds.value || selectedProductIds.value.length === 0)) {
          ElMessage.warning('선택된 상품이 없습니다.');
          isLoading.value = false;
          return;
        }
        
        console.log('가공 요청 데이터:', { options, targets });
        
        // 가공 요청 전송
        const response = await startProcessing(options, targets);
        
        if (response.success) {
          ElMessage.success(response.message);
          // brandFiltering이 true일 때만 ForbiddenBrand 페이지로 이동
          if (processingOptions.brandFiltering) {
            setTimeout(() => {
              router.push('/product/processing/brand');
            }, 200);
          }
        } else {
          ElMessage.error(`가공 작업 시작 실패: ${response.message}`);
        }
      } catch (error) {
        console.error('가공 작업 시작 중 오류 발생:', error);
        // 서버로부터 받은 에러 메시지 사용
        ElMessage.error(error.response?.data?.message || '가공 작업 시작 중 오류가 발생했습니다.');
      } finally {
        isLoading.value = false;
      }
    };
    
    return {
      isLoading,
      isEnterprisePlan,
      totalCommitCount,
      commitGroups,
      productSelectionType,
      recentCount,
      recentType,
      selectedCommitCode,
      processingOptions,
      showKeywordOptions,
      showSeoOptions,
      keywordModalVisible,
      seoModalVisible,
      keywordOptionsTemp,
      seoOptionsTemp,
      keywordToggleValue,
      handleKeywordToggle,
      toggleKeywordModal,
      closeKeywordModal,
      applyKeywordOptions,
      toggleSeoModal,
      closeSeoModal,
      applySeoOptions,
      resetProductSelection,
      resetOptions,
      startProcessingHandler,
      selectedProductIds,
      selectedProductCount,
      handleCommitCodeChange,
      user
    };
  }
}
</script>

<style scoped>
.processing-settings {
  height: 100%;
  overflow-y: auto;
  background-color: var(--el-bg-color-page);
  display: flex;
  flex-direction: column;
  position: relative;
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



/* 비활성화된 버튼 스타일 */
.option-btn:disabled,
.reset-btn:disabled,
.start-btn:disabled,
.apply-btn:disabled,
.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

h2 {
  font-size: var(--el-font-size-large);
  margin-bottom: var(--spacing-sm);
  color: var(--el-text-color-primary);
  font-weight: var(--el-font-weight-semibold);
}

h3 {
  font-size: var(--el-font-size-medium);
  margin: 0;
  color: var(--el-text-color-primary);
  font-weight: var(--el-font-weight-medium);
}

.layout-container {
  display: flex;
  flex: 1;
  gap: var(--spacing-md);
  overflow: hidden;
  padding: var(--spacing-xs) var(--spacing-md) var(--spacing-sm);
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.left-column {
  width: 35%;
  display: flex;
  flex-direction: column;
}

.right-column {
  width: 65%;
  display: flex;
  flex-direction: column;
}

.card {
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
}

.options-card {
  height: 100%;
  max-height: 600px;
}

.selection-options {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.option-item {
  padding: var(--spacing-md);
  border-radius: var(--el-border-radius-base);
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.2s ease;
  margin-bottom: var(--spacing-sm);
}

.option-item:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: var(--el-box-shadow-light);
}

.option-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.option-section {
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.image-option-container {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.number-input {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: 10px;
}

.number-input label {
  font-size: 14px;
  white-space: nowrap;
}

.number-input input {
  width: 80px;
  padding: 6px;
  border-radius: 4px;
  border: 1px solid #ced4da;
}

.option-btn {
  padding: 12px 16px;
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  outline: none;
  text-align: center;
  color: var(--el-text-color-regular);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.option-btn:hover {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
  box-shadow: var(--el-box-shadow-light);
}

.option-btn.active {
  background-color: var(--el-color-primary);
  color: var(--el-color-white);
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 6px rgba(91, 108, 242, 0.3);
}

.option-btn.modal-btn {
  display: flex;
  align-items: center;
  justify-content: center;
}

.sub-option {
  margin-top: var(--spacing-sm);
}

.sub-option-styled {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm);
  background-color: var(--el-color-primary-light-9);
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-color-primary-light-7);
}

.recent-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.radio-group, .checkbox-group {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  align-items: center;
  margin-top: var(--spacing-xs);
}

.input-group {
  margin-top: var(--spacing-xs);
}

.input-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-size: var(--el-font-size-base);
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-regular);
}

input[type="text"], 
input[type="number"],
select {
  width: 100%;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  font-size: var(--el-font-size-base);
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
  transition: border-color 0.2s ease;
}

.modal-input {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--el-font-size-medium);
  height: 42px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
  transition: border-color 0.2s ease;
}

.modal-input:focus {
  outline: none;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
}

input[type="text"]:focus,
input[type="number"]:focus,
select:focus {
  outline: none;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
}

select {
  height: 36px;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%235B6CF2' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 16px 12px;
  appearance: none;
}

.radio-label, .checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: var(--el-font-size-base);
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-primary);
  transition: color 0.2s ease;
}

.radio-label:hover, .checkbox-label:hover {
  color: var(--el-color-primary);
}

.checkbox-label.small {
  font-size: var(--el-font-size-small);
}

.radio-label span, .checkbox-label span {
  margin-left: var(--spacing-xs);
}

input[type="checkbox"],
input[type="radio"] {
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
  accent-color: var(--el-color-primary);
}

.bottom-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  margin-top: 10px;
  border-top: 1px solid #eee;
}

.stats-counter {
  display: flex;
  gap: 20px;
}

.stat {
  font-size: 14px;
  color: #666;
}

.stat-value {
  font-weight: 600;
  color: #333;
}

.action-buttons {
  display: flex;
  gap: var(--spacing-xs);
}

.action-buttons .el-button {
  min-width: 120px;
}

.total-info {
  margin-top: var(--spacing-xs);
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
  padding: var(--spacing-xs);
  background-color: var(--el-color-primary-light-9);
  border-radius: var(--el-border-radius-base);
}

/* 모달 스타일 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: var(--spacing-sm) var(--spacing-md);
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-xs);
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
}

.close-btn:hover {
  color: #333;
}

.modal-option {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.toggle-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}
</style> 