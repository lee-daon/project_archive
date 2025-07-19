<template>
  <div class="esm-policy">
    <div class="page-header">
      <h2 class="page-title">ESM정책</h2>
      <p class="page-description">G마켓/옥션 등록을 위한 정책 설정을 관리하세요.</p>
    </div>

    <!-- 로딩 상태 -->
    <AppLoading v-if="loading" text="설정 정보를 불러오고 있습니다..." />

    <!-- 설정 폼 -->
    <div v-else class="content-container">
      <div class="content-area">
        <el-form
          ref="formRef"
          :model="formData"
          label-position="top"
          class="policy-form"
          @submit.prevent="handleSubmit"
        >
          <!-- 가격 설정 -->
          <div class="form-section">
            <h3 class="section-title">가격 설정</h3>
            <el-row :gutter="32">
              <el-col :xs="24" :sm="12">
                <el-form-item label="배송비 설정" prop="include_delivery_fee">
                  <el-switch
                    v-model="formData.include_delivery_fee"
                    size="large"
                    active-text="포함"
                    inactive-text="미포함"
                  />
                  <div class="field-description">
                    상품 가격에 배송비를 포함하여 계산합니다.<br/>배송비를 별도부과하지 않습니다.
                  </div>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="관부과세 설정" prop="include_import_duty">
                  <el-switch
                    v-model="formData.include_import_duty"
                    size="large"
                    active-text="포함"
                    inactive-text="미포함"
                  />
                  <div class="field-description">
                    150$ 초과시 상품 가격에 관부과세를 포함하여 계산합니다.
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 상품 설정 -->
          <div class="form-section">
            <h3 class="section-title">상품 설정</h3>
            <el-row :gutter="32">
              <el-col :xs="24" :sm="12">
                <el-form-item prop="max_option_count">
                  <template #label>
                    <div class="label-with-tooltip">
                      최대 옵션 개수
                      <el-tooltip
                        content="상품당 최대 등록할 옵션수입니다. 1개를 권장합니다."
                        placement="top"
                      >
                        <el-icon class="info-icon"><InfoFilled /></el-icon>
                      </el-tooltip>
                    </div>
                  </template>
                  <el-input-number
                    v-model="formData.max_option_count"
                    :min="1"
                    :max="100"
                    size="large"
                    :controls="true"
                    placeholder="최대 옵션 개수"
                  />
                  <div class="field-description">
                    상품당 최대 등록할 수 있는 옵션의 개수입니다. (범위: 1~100)
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 저장 버튼 -->
          <div class="form-actions">
            <el-button 
              type="primary" 
              size="large"
              :disabled="saving"
              :loading="saving"
              :icon="Check"
              @click="handleSubmit"
            >
              설정 저장
            </el-button>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { Check, InfoFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import AppLoading from '../../components/app/loading.vue';
import { getEsmPolicy, updateEsmPolicy } from '@/services/settings';

export default {
  name: 'EsmPolicy',
  components: {
    AppLoading
  },
  setup() {
    const formRef = ref();
    const loading = ref(false);
    const saving = ref(false);
    
    const formData = ref({
      include_delivery_fee: true,
      include_import_duty: true,
      max_option_count: 1
    });

    const loadPolicy = async () => {
      loading.value = true;
      
      try {
        const response = await getEsmPolicy();
        if (response.success && response.data) {
          // 0/1을 true/false로 변환
          const data = { ...response.data };
          data.include_delivery_fee = Boolean(data.include_delivery_fee);
          data.include_import_duty = Boolean(data.include_import_duty);
          data.max_option_count = data.max_option_count || 1;
          formData.value = data;
        }
      } catch (err) {
        ElMessage.error(err.response?.data?.message || '설정 정보를 불러오는데 실패했습니다.');
        console.error('ESM 정책 로드 실패:', err);
      } finally {
        loading.value = false;
      }
    };

    const handleSubmit = async () => {
      saving.value = true;

      try {
        const response = await updateEsmPolicy(formData.value);
        if (response.success) {
          ElMessage.success('설정이 성공적으로 저장되었습니다.');
        }
      } catch (err) {
        ElMessage.error(err.response?.data?.message || '설정 저장에 실패했습니다.');
        console.error('ESM 정책 저장 실패:', err);
      } finally {
        saving.value = false;
      }
    };

    onMounted(() => {
      loadPolicy();
    });

    return {
      formRef,
      loading,
      saving,
      formData,
      handleSubmit,
      Check,
      InfoFilled
    };
  }
}
</script>

<style scoped>
.esm-policy {
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
  overflow-y: auto;
  padding: var(--spacing-md);
}

.content-area {
  max-width: 1200px;
  margin: 0 auto;
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-xl);
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-lighter);
}

.policy-form {
  width: 100%;
}

.form-section {
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--el-border-color-light);
}

.form-section:last-of-type {
  border-bottom: none;
  margin-bottom: var(--spacing-lg);
}

.section-title {
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
  margin: 0 0 var(--spacing-lg) 0;
  display: flex;
  align-items: center;
}

.section-title:before {
  content: '';
  width: 4px;
  height: 20px;
  background-color: var(--el-color-primary);
  margin-right: var(--spacing-sm);
  border-radius: 2px;
}

.field-description {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
  margin-top: var(--spacing-sm);
  line-height: 1.4;
  display: block;
  width: 100%;
}

.label-with-tooltip {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.info-icon {
  color: var(--el-color-info);
  cursor: help;
  font-size: var(--el-font-size-small);
}

.form-actions {
  text-align: center;
  padding-top: var(--spacing-lg);
}

/* Element Plus 컴포넌트 커스터마이징 */
:deep(.el-form-item__label) {
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-small);
}

:deep(.el-switch__label) {
  font-size: var(--el-font-size-small);
}

:deep(.el-button--large) {
  padding: var(--spacing-sm) var(--spacing-xl);
  font-size: var(--el-font-size-base);
  font-weight: var(--el-font-weight-medium);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .content-container {
    padding: var(--spacing-sm);
  }
  
  .page-header {
    padding: var(--spacing-sm);
  }
  
  .content-area {
    padding: var(--spacing-lg);
  }
  
  .page-title {
    font-size: var(--el-font-size-large);
  }
}
</style>
