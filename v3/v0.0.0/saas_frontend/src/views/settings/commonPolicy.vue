<template>
  <div class="common-policy">
    <div class="page-header">
      <h2 class="page-title">공통정책설정</h2>
      <p class="page-description">상품 등록 시 공통으로 적용될 정책을 설정하세요.</p>
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
          <!-- 마진 설정 -->
          <div class="form-section">
            <h3 class="section-title">마진 설정</h3>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="최소 마진 (원)" prop="minimum_margin">
                  <el-input
                    v-model.number="formData.minimum_margin"
                    type="number"
                    :min="0"
                    placeholder="최소 마진 금액"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="기본 최소 마진 퍼센트 (%)" prop="basic_minimum_margin_percentage">
                  <el-input
                    v-model.number="formData.basic_minimum_margin_percentage"
                    type="number"
                    :min="0"
                    :max="100"
                    placeholder="기본 최소 마진 퍼센트"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="기본 마진 퍼센트 (%)" prop="basic_margin_percentage">
                  <el-input
                    v-model.number="formData.basic_margin_percentage"
                    type="number"
                    :min="0"
                    :max="1000"
                    placeholder="기본 마진 퍼센트"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="기본 배송비 (원)" prop="basic_delivery_fee">
                  <el-input
                    v-model.number="formData.basic_delivery_fee"
                    type="number"
                    :min="0"
                    placeholder="기본 배송비"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 수수료 및 세금 설정 -->
          <div class="form-section">
            <h3 class="section-title">수수료 및 세금 설정</h3>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="구매 수수료 (%)" prop="buying_fee">
                  <el-input
                    v-model.number="formData.buying_fee"
                    type="number"
                    :min="0"
                    :max="100"
                    placeholder="구매 수수료"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="수입 관세 (%)" prop="import_duty">
                  <el-input
                    v-model.number="formData.import_duty"
                    type="number"
                    :min="0"
                    :max="100"
                    placeholder="수입 관세"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="수입 부가세 (%)" prop="import_vat">
                  <el-input
                    v-model.number="formData.import_vat"
                    type="number"
                    :min="0"
                    :max="100"
                    placeholder="수입 부가세"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 환율 설정 -->
          <div class="form-section">
            <h3 class="section-title">환율 설정</h3>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="중국 환율 (원)" prop="china_exchange_rate">
                  <el-input
                    v-model.number="formData.china_exchange_rate"
                    type="number"
                    :min="0"
                    placeholder="중국 환율"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="미국 환율 (원)" prop="usa_exchange_rate">
                  <el-input
                    v-model.number="formData.usa_exchange_rate"
                    type="number"
                    :min="0"
                    placeholder="미국 환율"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 옵션 설정 -->
          <div class="form-section">
            <h3 class="section-title">옵션 설정</h3>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item>
                  <template #label>
                    <span>a-z옵션 매핑(권장)</span>
                    <el-tooltip placement="top">
                      <template #content>
                        <img 
                          src="@/assets/az_option_mapping_tooltip.png" 
                          alt="a-z 옵션 매핑 예시" 
                          style="max-width: 400px;" 
                        />
                        <br/>
                        A-Z 옵션 매핑은 옵션의 순서를 알파벳으로 지정하여<br/>
                        고객이 옵션을 쉽게 선택할 수 있도록 돕습니다. <br/>
                        또한 상품 등록시 오류가 감소합니다.(중복옵션 오류 방지)
                      </template>
                      <el-icon style="margin-left: 4px; vertical-align: middle; cursor: pointer;"><InfoFilled /></el-icon>
                    </el-tooltip>
                  </template>
                  <el-switch v-model="formData.use_az_option" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 할인 설정 -->
          <div class="form-section">
            <h3 class="section-title">할인 설정</h3>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="최소 할인 퍼센트 (%)" prop="min_percentage">
                  <el-input
                    v-model.number="formData.min_percentage"
                    type="number"
                    :min="0"
                    :max="100"
                    placeholder="최소 할인 퍼센트"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="최대 할인 퍼센트 (%)" prop="max_percentage">
                  <el-input
                    v-model.number="formData.max_percentage"
                    type="number"
                    :min="0"
                    :max="100"
                    placeholder="최대 할인 퍼센트"
                  />
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
import { getCommonPolicy, updateCommonPolicy } from '@/services/settings';

export default {
  name: 'CommonPolicy',
  components: {
    AppLoading
  },
  setup() {
    const formRef = ref();
    const loading = ref(false);
    const saving = ref(false);

    
    const formData = ref({
      minimum_margin: 5000,
      basic_minimum_margin_percentage: 10,
      basic_margin_percentage: 20,
      basic_delivery_fee: 3000,
      buying_fee: 2,
      import_duty: 8,
      import_vat: 10,
      china_exchange_rate: 210,
      usa_exchange_rate: 1400,
      min_percentage: 10,
      max_percentage: 30,
      use_az_option: false,
    });

    const loadPolicy = async () => {
      loading.value = true;
      
      try {
        const response = await getCommonPolicy();
        if (response.success && response.data) {
          const policyData = response.data;
          formData.value = { 
            ...policyData,
            use_az_option: !!policyData.use_az_option 
          };
        }
      } catch (err) {
        ElMessage.error(err.response?.data?.message || '설정 정보를 불러오는데 실패했습니다.');
        console.error('공통 정책 로드 실패:', err);
      } finally {
        loading.value = false;
      }
    };

    const handleSubmit = async () => {
      // 유효성 검증
      if (formData.value.min_percentage > formData.value.max_percentage) {
        ElMessage.error('최소 할인율은 최대 할인율보다 작거나 같아야 합니다.');
        return;
      }

      saving.value = true;

      try {
        const payload = {
          ...formData.value,
          use_az_option: formData.value.use_az_option ? 1 : 0,
        };
        const response = await updateCommonPolicy(payload);
        if (response.success) {
          ElMessage.success('설정이 성공적으로 저장되었습니다.');
        }
      } catch (err) {
        ElMessage.error(err.response?.data?.message || '설정 저장에 실패했습니다.');
        console.error('공통 정책 저장 실패:', err);
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
      InfoFilled,
    };
  }
}
</script>

<style scoped>
.common-policy {
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

:deep(.el-input__wrapper) {
  transition: all 0.2s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-color-primary-light-7);
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

