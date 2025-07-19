<template>
  <div class="ban-words">
    <div class="page-header">
      <h2 class="page-title">경고 키워드 설정</h2>
      <p class="page-description">사용자별로 상품에 포함하면 안되는 경고 키워드를 추가/삭제할 수 있어요. 루프톤은 기본적으로 약 2500개의 글로벌,명품 브랜드, 1700개의 한국 브랜드 300개의 필수금지어, 50개의 위험 카테고리 금지어를 포함하여 약 6000개의 기본적인 금지 키워드를 제공하고 있어요.</p>
    </div>

    <!-- 초기 로딩 상태 -->
    <AppLoading v-if="initialLoading" text="키워드 정보를 불러오고 있습니다..." />

    <!-- 메인 콘텐츠 -->
    <div v-else class="content-container">
      <div class="content-layout">
        <!-- 왼쪽: 입력 폼 -->
        <div class="input-section">
          <div class="content-card">
            <div class="card-header">
              <h3>개인 금지 키워드</h3>
              <p>쉼표로 구분하여 키워드를 입력하세요</p>
            </div>

            <div class="form-section">
              <div class="input-group">
                <label for="banWords">금지 키워드</label>
                <textarea
                  id="banWords"
                  v-model="banWordsInput"
                  placeholder="예: 키워드1, 키워드2, 키워드3"
                  rows="8"
                  :disabled="isLoading"
                ></textarea>
                <div class="input-hint">
                  쉼표(,)로 구분하여 여러 키워드를 입력할 수 있습니다
                </div>
              </div>

              <div class="button-group">
                <el-button 
                  type="primary" 
                  @click="saveBanWords"
                  :disabled="isLoading"
                  :icon="Check"
                  :loading="isLoading"
                >
                  저장
                </el-button>
                <el-button 
                  type="info" 
                  @click="resetBanWords"
                  :disabled="isLoading"
                  :icon="RefreshLeft"
                >
                  초기화
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 오른쪽: 키워드 미리보기 -->
        <div class="preview-section">
          <div class="content-card">
            <div class="card-header">
              <h3>현재 설정된 키워드</h3>
              <p>{{ currentBanWords.length }}개의 키워드가 설정되어 있습니다</p>
            </div>
            
            <div class="keywords-container">
              <div v-if="currentBanWords.length === 0" class="empty-state">
                <el-icon class="empty-icon"><Edit /></el-icon>
                <p>설정된 키워드가 없습니다</p>
                <p class="empty-subtitle">왼쪽 입력창에 키워드를 추가해보세요</p>
              </div>
              
              <div v-else class="keywords-preview">
                <span 
                  v-for="(word, index) in currentBanWords" 
                  :key="index" 
                  class="keyword-tag"
                >
                  {{ word }}
                  <button 
                    type="button" 
                    class="remove-btn" 
                    @click="removeKeyword(index)"
                    :disabled="isLoading"
                    title="키워드 삭제"
                  >
                    ×
                  </button>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { Check, RefreshLeft, Edit } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import AppLoading from '../../components/app/loading.vue';
import { getBanWords, updateBanWords } from '../../services/settings';

export default {
  name: 'BanWordsView',
  components: {
    AppLoading
  },
  setup() {
    const banWordsInput = ref('');
    const isLoading = ref(false);
    const initialLoading = ref(true);
    const currentBanWords = computed(() => {
      if (!banWordsInput.value.trim()) return [];
      return banWordsInput.value
        .split(',')
        .map(word => word.trim())
        .filter(word => word.length > 0);
    });

    const loadBanWords = async () => {
      try {
        isLoading.value = true;
        const response = await getBanWords();
        if (response.success) {
          banWordsInput.value = response.data.bannedWordsString || '';
        }
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '금지 키워드 조회에 실패했습니다.');
        console.error('금지 키워드 조회 실패:', error);
      } finally {
        isLoading.value = false;
        initialLoading.value = false;
      }
    };

    const saveBanWords = async () => {
      try {
        isLoading.value = true;
        const response = await updateBanWords(banWordsInput.value);
        if (response.success) {
          ElMessage.success('금지 키워드가 성공적으로 저장되었습니다.');
        }
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '금지 키워드 저장에 실패했습니다.');
        console.error('금지 키워드 저장 실패:', error);
      } finally {
        isLoading.value = false;
      }
    };

    const resetBanWords = () => {
      banWordsInput.value = '';
      ElMessage.info('금지 키워드가 초기화되었습니다.');
    };

    const removeKeyword = (index) => {
      const words = currentBanWords.value;
      words.splice(index, 1);
      banWordsInput.value = words.join(', ');
    };

    onMounted(() => {
      loadBanWords();
    });

    return {
      banWordsInput,
      isLoading,
      initialLoading,
      currentBanWords,
      saveBanWords,
      resetBanWords,
      removeKeyword,
      Check,
      RefreshLeft,
      Edit
    };
  }
};
</script>

<style scoped>
.ban-words {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color-page);
}

/* 페이지 헤더 */
.page-header {
  padding: var(--spacing-md);
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
  margin-bottom: 0;
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



/* 메인 콘텐츠 */
.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  padding: var(--spacing-sm) var(--spacing-md);
  max-width: 1300px;
  margin: 0 auto;
  width: 100%;
}

.content-layout {
  display: flex;
  gap: var(--spacing-lg);
  height: 100%;
  min-height: 0;
}

.input-section {
  flex: 3;
}

.content-card {
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-lg);
  box-shadow: var(--el-box-shadow-base);
  border: 1px solid var(--el-border-color-lighter);
  margin-bottom: var(--spacing-lg);
  height: fit-content;
}

.card-header {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--el-border-color-light);
}

.card-header h3 {
  color: var(--el-text-color-primary);
  margin-bottom: var(--spacing-xs);
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
}

.card-header p {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
  margin: 0;
}

.form-section {
  margin-bottom: var(--spacing-lg);
}

.input-group {
  margin-bottom: var(--spacing-lg);
}

.input-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  color: var(--el-text-color-primary);
  font-weight: var(--el-font-weight-medium);
  font-size: var(--el-font-size-small);
}

.input-group textarea {
  width: 100%;
  padding: var(--spacing-sm);
  border: 2px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  font-size: var(--el-font-size-small);
  resize: vertical;
  transition: border-color 0.3s ease;
  font-family: inherit;
  box-sizing: border-box;
}

.input-group textarea:focus {
  outline: none;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-9);
}

.input-group textarea:disabled {
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}

.input-hint {
  margin-top: var(--spacing-xs);
  font-size: var(--el-font-size-extra-small);
  color: var(--el-text-color-secondary);
}

.button-group {
  display: flex;
  gap: var(--spacing-sm);
}

.preview-section {
  flex: 2;
}

.keywords-container {
  max-height: 400px;
  overflow-y: auto;
}

.keywords-preview {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xxl);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
  color: var(--el-text-color-secondary);
}

.empty-subtitle {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
}

.keyword-tag {
  display: inline-flex;
  align-items: center;
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--el-border-radius-round);
  font-size: var(--el-font-size-extra-small);
  border: 1px solid var(--el-border-color);
}

.remove-btn {
  background: none;
  border: none;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  margin-left: var(--spacing-xs);
  font-size: var(--el-font-size-medium);
  line-height: 1;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.remove-btn:hover:not(:disabled) {
  background-color: var(--el-color-danger);
  color: white;
}



@media (max-width: 768px) {
  .content-container {
    padding: var(--spacing-sm);
  }
  
  .page-header {
    padding: var(--spacing-sm);
  }
  
  .content-layout {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .content-card {
    padding: var(--spacing-lg);
  }
  
  .empty-state {
    padding: var(--spacing-xl);
  }
}
</style>
