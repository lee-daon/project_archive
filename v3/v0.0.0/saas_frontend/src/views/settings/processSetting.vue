<template>
  <div class="process-setting">
    <div class="page-header">
      <h2 class="page-title">기타 세팅</h2>
      <p class="page-description">프로세스 관련 기타 설정을 관리하세요.</p>
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
          class="setting-form"
          @submit.prevent="handleSubmit"
        >
          <!-- 기본 설정 -->
          <div class="form-section">
            <h3 class="section-title">기본 설정</h3>
            <el-row :gutter="32">
              <el-col :xs="24" :sm="12">
                <el-form-item prop="use_deep_ban">
                  <template #label>
                    <div class="label-with-tooltip">
                      딥 필터링 사용여부
                      <el-tooltip
                        placement="top"
                        :show-after="500"
                      >
                        <template #content>
                          <div v-if="isEnterprisePlan">
                            AI웹검색, OCR브랜드 추출, 상표권 db 기반 심층적인 필터링을 사용합니다.
                          </div>
                          <div v-else>
                            Enterprise 플랜에서만 사용 가능한 기능입니다.<br/>
                            AI웹검색, OCR브랜드 추출, 상표권검수 기반 심층적인 필터링을 제공합니다.
                          </div>
                        </template>
                        <el-icon class="tooltip-icon">
                          <QuestionFilled />
                        </el-icon>
                      </el-tooltip>
                      <el-tag v-if="!isEnterprisePlan" type="warning" size="small" class="plan-badge">
                        Enterprise 전용
                      </el-tag>
                    </div>
                  </template>
                  <el-switch
                    v-model="formData.use_deep_ban"
                    size="large"
                    active-text="사용"
                    inactive-text="미사용"
                    :disabled="!isEnterprisePlan"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item prop="allow_keyword_spacing">
                  <template #label>
                    <div class="label-with-tooltip">
                      키워드 뛰어쓰기 허용여부
                      <el-tooltip
                        placement="top"
                        :show-after="500"
                      >
                        <template #content>
                          키워드 생성시 뛰어쓰기 허용여부를 결정합니다.
                        </template>
                        <el-icon class="tooltip-icon">
                          <QuestionFilled />
                        </el-icon>
                      </el-tooltip>
                    </div>
                  </template>
                  <el-switch
                    v-model="formData.allow_keyword_spacing"
                    size="large"
                    active-text="허용"
                    inactive-text="비허용"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 상품개수 정정 -->
          <div class="form-section">
            <h3 class="section-title">상품개수 정정</h3>
            <p class="section-description">마켓별 상품 개수를 조회하고 수정할 수 있습니다.</p>
            
            <el-row :gutter="16" align="bottom">
              <el-col :xs="24" :sm="6">
                <el-form-item label="마켓 선택" prop="selected_market">
                  <el-select
                    v-model="formData.selected_market"
                    placeholder="마켓을 선택하세요"
                    size="large"
                    class="full-width"
                    @change="handleMarketChange"
                  >
                    <el-option
                      v-for="market in markets"
                      :key="market.value"
                      :label="market.label"
                      :value="market.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="6">
                <el-form-item label="마켓번호 선택" prop="selected_market_number">
                  <el-select
                    v-model="formData.selected_market_number"
                    placeholder="마켓번호를 선택하세요"
                    size="large"
                    class="full-width"
                    :disabled="!formData.selected_market || loadingMarketNumbers"
                    @change="handleMarketNumberChange"
                  >
                    <el-option
                      v-for="number in marketNumbers"
                      :key="number.value"
                      :label="number.label"
                      :value="number.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" class="button-col">
                <el-form-item label="조회">
                  <div class="button-wrapper">
                    <el-button
                      type="primary"
                      size="large"
                      :loading="loadingProductCount"
                      :disabled="!formData.selected_market || !formData.selected_market_number"
                      @click="fetchProductCount"
                      class="action-button"
                    >
                      상품개수 조회
                    </el-button>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 상품개수 수정 -->
            <div v-if="productCountData.count !== null" class="product-count-section">
              <el-alert
                :title="`현재 ${formData.selected_market} 마켓 ${formData.selected_market_number}번의 상품개수: ${productCountData.count}개`"
                type="info"
                :closable="false"
                show-icon
                class="count-info"
              />
              
              <el-row :gutter="16" class="count-edit-row" align="bottom">
                <el-col :xs="24" :sm="12">
                  <el-form-item label="수정할 상품개수" prop="new_product_count">
                    <el-input
                      v-model.number="formData.new_product_count"
                      type="number"
                      :min="0"
                      size="large"
                      placeholder="새로운 상품개수를 입력하세요"
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" class="button-col">
                  <el-form-item label="적용">
                    <div class="button-wrapper">
                      <el-button
                        type="success"
                        size="large"
                        :loading="savingProductCount"
                        :disabled="!formData.new_product_count"
                        @click="updateProductCount"
                        class="action-button"
                      >
                        상품개수 수정
                      </el-button>
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </div>

          <!-- 판매자 차단 -->
          <div class="form-section">
            <h3 class="section-title">판매자 차단</h3>
            <p class="section-description">상품 ID를 입력하여 해당 판매자를 영구 차단할 수 있습니다.</p>
            
            <el-row :gutter="16" align="bottom">
              <el-col :xs="24" :sm="12">
                <el-form-item label="상품 ID" prop="product_id_to_ban">
                  <el-input
                    v-model="formData.product_id_to_ban"
                    size="large"
                    placeholder="차단할 상품의 ID를 입력하세요"
                    clearable
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" class="button-col">
                <el-form-item label="실행">
                  <div class="button-wrapper">
                    <el-button
                      type="danger"
                      size="large"
                      :loading="banningSeller"
                      :disabled="!formData.product_id_to_ban || !formData.product_id_to_ban.trim()"
                      @click="handleBanSeller"
                      class="action-button"
                    >
                      판매자 벤
                    </el-button>
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
import { Check, QuestionFilled } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import AppLoading from '../../components/app/loading.vue';
import { getProcessSetting, updateProcessSetting, getMarketNumbers, getProductCount, updateProductCount as updateProductCountAPI, banSellerByProductId } from '@/services/settings';
import { getUser } from '@/services/auth';

export default {
  name: 'ProcessSetting',
  components: {
    AppLoading
  },
  setup() {
    const formRef = ref();
    const loading = ref(false);
    const saving = ref(false);
    const loadingMarketNumbers = ref(false);
    const loadingProductCount = ref(false);
    const savingProductCount = ref(false);
    const banningSeller = ref(false);

    
    const user = ref(null);
    const isEnterprisePlan = ref(false);
    
    const formData = ref({
      use_deep_ban: false,
      allow_keyword_spacing: true,
      selected_market: '',
      selected_market_number: '',
      new_product_count: null,
      product_id_to_ban: ''
    });

    const markets = ref([
      { label: '네이버', value: 'naver' },
      { label: '쿠팡', value: 'coupang' },
      { label: '11번가', value: '11st' },
      { label: 'ESM (옥션+G마켓)', value: 'esm' }
    ]);

    const marketNumbers = ref([]);
    
    const productCountData = ref({
      count: null
    });

    const loadSettings = async () => {
      loading.value = true;
      
      try {
        user.value = getUser();
        isEnterprisePlan.value = user.value?.plan === 'enterprise';
        
        const response = await getProcessSetting();
        if (response.success && response.data) {
          formData.value = {
            ...formData.value,
            use_deep_ban: Boolean(response.data.use_deep_ban),
            allow_keyword_spacing: Boolean(response.data.allow_keyword_spacing)
          };
          
          if (!isEnterprisePlan.value) {
            formData.value.use_deep_ban = false;
          }
        }
      } catch (err) {
        ElMessage.error(err.response?.data?.message || '설정 정보를 불러오는데 실패했습니다.');
        console.error('기타 설정 로드 실패:', err);
      } finally {
        loading.value = false;
      }
    };

    const handleMarketChange = async () => {
      formData.value.selected_market_number = '';
      marketNumbers.value = [];
      productCountData.value.count = null;
      formData.value.new_product_count = null;

      if (!formData.value.selected_market) return;

      loadingMarketNumbers.value = true;
      try {
        const response = await getMarketNumbers(formData.value.selected_market);
        if (response.success && response.data) {
          marketNumbers.value = response.data.map(item => ({
            label: `${item.number}번 - ${item.name || ''}`,
            value: item.number
          }));
        }
      } catch (err) {
        ElMessage.error(err.response?.data?.message || '마켓번호 목록을 불러오는데 실패했습니다.');
        console.error('마켓번호 로드 실패:', err);
      } finally {
        loadingMarketNumbers.value = false;
      }
    };

    const handleMarketNumberChange = () => {
      productCountData.value.count = null;
      formData.value.new_product_count = null;
    };

    const fetchProductCount = async () => {
      loadingProductCount.value = true;
      try {
        const response = await getProductCount({
          market: formData.value.selected_market,
          market_number: formData.value.selected_market_number
        });
        if (response.success && response.data) {
          productCountData.value.count = response.data.count;
          formData.value.new_product_count = response.data.count;
        }
      } catch (err) {
        ElMessage.error(err.response?.data?.message || '상품개수 조회에 실패했습니다.');
        console.error('상품개수 조회 실패:', err);
      } finally {
        loadingProductCount.value = false;
      }
    };

    const updateProductCount = async () => {
      savingProductCount.value = true;
      try {
        const response = await updateProductCountAPI({
          market: formData.value.selected_market,
          market_number: formData.value.selected_market_number,
          count: formData.value.new_product_count
        });
        if (response.success) {
          ElMessage.success('상품개수가 성공적으로 수정되었습니다.');
          productCountData.value.count = formData.value.new_product_count;
        }
      } catch (err) {
        ElMessage.error(err.response?.data?.message || '상품개수 수정에 실패했습니다.');
        console.error('상품개수 수정 실패:', err);
      } finally {
        savingProductCount.value = false;
      }
    };

    const handleSubmit = async () => {
      saving.value = true;

      try {
        const submitData = {
          use_deep_ban: isEnterprisePlan.value ? formData.value.use_deep_ban : false,
          allow_keyword_spacing: formData.value.allow_keyword_spacing
        };
        
        const response = await updateProcessSetting(submitData);
        if (response.success) {
          ElMessage.success('기본 설정이 성공적으로 저장되었습니다.');
          
          // enterprise가 아닌 사용자는 딥 필터링이 자동으로 비활성화됨을 알림
          if (!isEnterprisePlan.value && formData.value.use_deep_ban) {
            ElMessage.info('딥 필터링은 Enterprise 플랜에서만 사용 가능하여 비활성화되었습니다.');
            formData.value.use_deep_ban = false;
          }
        }
      } catch (err) {
        ElMessage.error(err.response?.data?.message || '설정 저장에 실패했습니다.');
        console.error('기타 설정 저장 실패:', err);
      } finally {
        saving.value = false;
      }
    };

    const handleBanSeller = async () => {
      try {
        await ElMessageBox.confirm(
          '이 판매자의 상품은 앞으로 영원히 만나볼 수 없어요. 정말로 차단하시겠습니까?',
          '판매자 차단 확인',
          {
            confirmButtonText: '차단',
            cancelButtonText: '취소',
            type: 'warning',
            confirmButtonClass: 'el-button--danger'
          }
        );

        banningSeller.value = true;
        
        const response = await banSellerByProductId(formData.value.product_id_to_ban.trim());
        
        if (response.success) {
          ElMessage.success('판매자가 성공적으로 차단되었습니다.');
          formData.value.product_id_to_ban = '';
        }
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error(error.response?.data?.message || '판매자 차단에 실패했습니다.');
          console.error('판매자 차단 실패:', error);
        }
      } finally {
        banningSeller.value = false;
      }
    };

    onMounted(() => {
      loadSettings();
    });

    return {
      formRef,
      loading,
      saving,
      loadingMarketNumbers,
      loadingProductCount,
      savingProductCount,
      banningSeller,
      formData,
      markets,
      marketNumbers,
      productCountData,
      user,
      isEnterprisePlan,
      handleMarketChange,
      handleMarketNumberChange,
      fetchProductCount,
      updateProductCount,
      handleSubmit,
      handleBanSeller,
      Check,
      QuestionFilled
    };
  }
}
</script>

<style scoped>
.process-setting {
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
  max-width: 1400px;
  margin: 0 auto;
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-xl);
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-lighter);
}

.setting-form {
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

.section-description {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
  margin: 0 0 var(--spacing-lg) 0;
}

.label-with-tooltip {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.tooltip-icon {
  color: var(--el-text-color-placeholder);
  cursor: help;
  transition: color 0.2s ease;
  font-size: var(--el-font-size-small);
}

.tooltip-icon:hover {
  color: var(--el-color-primary);
}

.plan-badge {
  margin-left: var(--spacing-xs);
}

/* 상품개수 정정 섹션 */
.product-count-section {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-lg);
  background-color: var(--el-bg-color-page);
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color-light);
}

.count-info {
  margin-bottom: var(--spacing-lg);
}

.count-edit-row {
  margin-top: var(--spacing-md);
}

.full-width {
  width: 100%;
}

.button-col {
  display: flex;
  align-items: flex-end;
}

.button-wrapper {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.action-button {
  min-width: 140px;
  max-width: 140px;
}

.form-actions {
  text-align: center;
  padding-top: var(--spacing-lg);
}

/* Element Plus 커스터마이징 */
:deep(.el-form-item__label) {
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-small);
}

:deep(.el-switch__label) {
  font-size: var(--el-font-size-small);
}

:deep(.el-input__wrapper) {
  transition: all 0.2s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-color-primary-light-7);
}

:deep(.el-select .el-input__wrapper) {
  transition: all 0.2s ease;
}

:deep(.el-select .el-input__wrapper:hover) {
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

  .product-count-section {
    padding: var(--spacing-md);
  }

  .button-wrapper {
    justify-content: center;
  }

  .action-button {
    width: 100%;
    max-width: none;
  }
}
</style>
