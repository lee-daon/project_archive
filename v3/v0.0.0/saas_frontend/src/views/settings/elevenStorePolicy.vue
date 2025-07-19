<template>
  <div class="eleven-store-policy">
    <div class="page-header">
      <h2 class="page-title">11번가정책</h2>
      <p class="page-description">11번가 판매를 위한 정책 설정을 관리하세요.</p>
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
          <!-- 기본 설정 -->
          <div class="form-section">
            <h3 class="section-title">기본 설정</h3>
            <el-row :gutter="32">
              <el-col :xs="24" :sm="12">
                <el-form-item label="해외사이즈 조견표 노출" prop="overseas_size_chart_display">
                  <el-switch
                    v-model="formData.overseas_size_chart_display"
                    size="large"
                    active-text="노출"
                    inactive-text="미노출"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="관부과세 포함" prop="include_import_duty">
                  <el-switch
                    v-model="formData.include_import_duty"
                    size="large"
                    active-text="포함"
                    inactive-text="미포함"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="32">
              <el-col :xs="24" :sm="12">
                <el-form-item label="배송비 포함" prop="include_delivery_fee">
                  <el-switch
                    v-model="formData.include_delivery_fee"
                    size="large"
                    active-text="포함"
                    inactive-text="미포함"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="11번가 포인트 적립 금액 (원)" prop="elevenstore_point_amount">
                  <el-input
                    v-model.number="formData.elevenstore_point_amount"
                    type="number"
                    :min="0"
                    placeholder="포인트 적립 금액"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="32">
              <el-col :xs="24" :sm="12">
                <el-form-item label="글로벌 셀러여부" prop="overseas_product_indication">
                    <el-switch
                      v-model="formData.overseas_product_indication"
                      size="large"
                      active-text="글로벌셀러"
                      inactive-text="일반셀러"
                    />
                </el-form-item>
                <div class="help-text">
                  <span class="help-warning">
                    ⚠️ 해외 쇼핑 셀러는 해외 쇼핑 카테고리만 등록 가능합니다
                  </span>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="택배회사" prop="delivery_company_code">
                  <el-select
                    v-model="formData.delivery_company_code"
                    placeholder="택배회사를 선택하세요"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="company in deliveryCompanies"
                      :key="company.code"
                      :label="company.name"
                      :value="company.code"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 옵션 설정 -->
          <div class="form-section">
            <h3 class="section-title">옵션 설정</h3>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="옵션 제한선택" prop="option_array_logic">
                  <el-select
                    v-model="formData.option_array_logic"
                    placeholder="옵션 제한 방식 선택"
                    style="width: 100%"
                  >
                    <el-option label="가장 많은 상품" value="most_products" />
                    <el-option label="최저가" value="lowest_price" />
                  </el-select>
                  <div class="help-text">
                    <span class="help-description">
                      옵션 중 어떤 기준으로 우선순위를 정할지 선택하세요
                    </span>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 반품/교환 설정 -->
          <div class="form-section">
            <h3 class="section-title">반품/교환 설정</h3>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="반품 비용 (원)" prop="return_cost">
                  <el-input
                    v-model.number="formData.return_cost"
                    type="number"
                    :min="0"
                    placeholder="반품 비용"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="교환 비용 (원)" prop="exchange_cost">
                  <el-input
                    v-model.number="formData.exchange_cost"
                    type="number"
                    :min="0"
                    placeholder="교환 비용"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 안내 문구 설정 -->
          <div class="form-section">
            <h3 class="section-title">안내 문구</h3>
            <el-row :gutter="16">
              <el-col :span="24">
                <el-form-item label="A/S 안내 내용" prop="as_guide">
                  <el-input
                    v-model="formData.as_guide"
                    type="textarea"
                    :rows="3"
                    placeholder="A/S 관련 안내 내용을 입력하세요"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :span="24">
                <el-form-item label="반품/교환 안내 내용" prop="return_exchange_guide">
                  <el-input
                    v-model="formData.return_exchange_guide"
                    type="textarea"
                    :rows="3"
                    placeholder="반품/교환 관련 안내 내용을 입력하세요"
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
import { Check } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import AppLoading from '../../components/app/loading.vue';
import { getElevenStorePolicy, updateElevenStorePolicy } from '@/services/settings';

export default {
  name: 'ElevenStorePolicy',
  components: {
    AppLoading
  },
  setup() {
    const formRef = ref();
    const loading = ref(false);
    const saving = ref(false);

    
    // 택배회사 목록
    const deliveryCompanies = ref([
      { code: '00034', name: 'CJ대한통운' },
      { code: '00012', name: '롯데택배' },
      { code: '00011', name: '한진택배' },
      { code: '00007', name: '우체국택배/등기' },
      { code: '00002', name: '로젠택배' },
      { code: '00116', name: '(주)팀프레시' },
      { code: '00080', name: 'ACE Express (해외)' },
      { code: '00023', name: 'ACI' },
      { code: '00044', name: 'APEX(ECMS Express) (해외)' },
      { code: '00123', name: 'ARGO' },
      { code: '00045', name: 'CJ대한통운 국제특송 (해외)' },
      { code: '00061', name: 'CU편의점택배' },
      { code: '00060', name: 'CVSnet편의점택배' },
      { code: '00039', name: 'DHL (해외)' },
      { code: '00046', name: 'DHL Global Mail (해외)' },
      { code: '00058', name: 'EMS (해외)' },
      { code: '00098', name: 'Euro Parcel (해외)' },
      { code: '00047', name: 'Fedex (해외)' },
      { code: '00056', name: 'GPS LOGIX (해외)' },
      { code: '00048', name: 'GSI익스프레스 (해외)' },
      { code: '00049', name: 'GSM NtoN (국제특송)' },
      { code: '00114', name: 'GTS로지스' },
      { code: '00068', name: 'HI택배' },
      { code: '00126', name: 'HY(한국야쿠르트)' },
      { code: '00050', name: 'i-Parcel (해외)' },
      { code: '00090', name: 'IK 물류' },
      { code: '00072', name: 'KGL 네트웍스 (국제특송)' },
      { code: '00038', name: 'LG전자 본사설치' },
      { code: '00073', name: 'LineExpress (해외)' },
      { code: '00096', name: 'LOTOS CORPORATION' },
      { code: '00113', name: 'LTL' },
      { code: '00111', name: 'SB GLS' },
      { code: '00063', name: 'SLX택배' },
      { code: '00051', name: 'TNT Express (해외)' },
      { code: '00053', name: 'UPS (해외)' },
      { code: '00054', name: 'USPS (해외)' },
      { code: '00025', name: 'WIZWA' },
      { code: '00092', name: 'YJS글로벌(영국)' },
      { code: '00095', name: 'YJS글로벌(월드)' },
      { code: '00079', name: 'cway express (국제특송)' },
      { code: '00074', name: '2fast익스프레스 (해외)' },
      { code: '00037', name: '건영택배' },
      { code: '00026', name: '경동택배' },
      { code: '00099', name: '기타' },
      { code: '00130', name: '나은물류' },
      { code: '00131', name: '큐브플로우' },
      { code: '00132', name: '(주)국제' },
      { code: '00133', name: '딜리박스' },
      { code: '00134', name: '위니온로지스' },
      { code: '00135', name: '딜리래빗' },
      { code: '00067', name: '농협택배' },
      { code: '00089', name: '대림통운' },
      { code: '00021', name: '대신택배' },
      { code: '00071', name: '대운글로벌 (국제특송)' },
      { code: '00124', name: '더바오' },
      { code: '00119', name: '두발히어로' },
      { code: '00101', name: '로지스밸리택배' },
      { code: '00120', name: '로지스파트너' },
      { code: '00040', name: '롯데글로벌 로지스' },
      { code: '00112', name: '롯데칠성' },
      { code: '00041', name: '범한판토스 (국제특송)' },
      { code: '00117', name: '브릿지 로지스' },
      { code: '00127', name: '삼다수 가정배송' },
      { code: '00036', name: '삼성전자 본사설치' },
      { code: '00057', name: '성원글로벌카고' },
      { code: '00091', name: '성훈 물류' },
      { code: '00066', name: '세방택배' },
      { code: '00105', name: '스마트로지스' },
      { code: '00077', name: '시알로지텍 (국제특송)' },
      { code: '00087', name: '애니트랙' },
      { code: '00042', name: '에어보이익스프레스 (국제특송)' },
      { code: '00100', name: '엘서비스' },
      { code: '00109', name: '카카오T 당일배송' },
      { code: '00128', name: '와이드테크' },
      { code: '00065', name: '용마로지스' },
      { code: '00062', name: '우리택배' },
      { code: '00085', name: '위니아딤채 본사설치' },
      { code: '00094', name: '은하쉬핑' },
      { code: '00129', name: '이스트라' },
      { code: '00106', name: '이투마스(ETOMARS)' },
      { code: '00022', name: '일양로지스' },
      { code: '00083', name: '자이언트' },
      { code: '00097', name: '제니엘시스템' },
      { code: '00104', name: '제이로지스트' },
      { code: '00027', name: '천일택배' },
      { code: '00107', name: '큐런택배' },
      { code: '00108', name: '큐익스프레스' },
      { code: '00121', name: '투데이' },
      { code: '00081', name: '퍼레버택배' },
      { code: '00103', name: '풀앳홈' },
      { code: '00102', name: '프레시솔루션' },
      { code: '00125', name: '핑퐁' },
      { code: '00118', name: '하이브시티' },
      { code: '00064', name: '한의사랑택배' },
      { code: '00035', name: '합동택배' },
      { code: '00122', name: '현대글로비스' },
      { code: '00082', name: '홈이노베이션로지스' },
      { code: '00115', name: '홈픽 오늘도착' },
      { code: '00070', name: '홈픽택배' },
      { code: '00136', name: '풀무원샘물' },
      { code: '00137', name: '티에스지로지스' },
      { code: '00138', name: '든든택배' },
      { code: '00139', name: '모든로지스' },
      { code: '00140', name: '에스더쉬핑' },
      { code: '00141', name: '제이더블유티엔엘' },
      { code: '00142', name: '벤더피아' },
      { code: '00143', name: '한샘' },
      { code: '00144', name: 'JCLS' },
      { code: '00145', name: '지케이글로벌' },
      { code: '00146', name: '서림물류' },
      { code: '00147', name: '비알씨에이치' },
      { code: '00148', name: '신세계까사' },
      { code: '00149', name: '발렉스' }
    ]);
    
    const formData = ref({
      overseas_size_chart_display: false,
      include_import_duty: true,
      include_delivery_fee: true,
      elevenstore_point_amount: 1000,
      option_array_logic: 'most_products',
      return_cost: 5000,
      exchange_cost: 5000,
      as_guide: '문의사항이 있으시면 고객센터로 연락주세요.',
      return_exchange_guide: '상품 수령 후 7일 이내 반품/교환이 가능합니다.',
      delivery_company_code: null,
      overseas_product_indication: true
    });

    const loadPolicy = async () => {
      loading.value = true;
      
      try {
        const response = await getElevenStorePolicy();
        if (response.success && response.data) {
          // 백엔드에서 받아온 숫자 boolean 값들을 실제 boolean으로 변환
          const data = {
            ...response.data,
            overseas_size_chart_display: Boolean(response.data.overseas_size_chart_display),
            include_import_duty: Boolean(response.data.include_import_duty),
            include_delivery_fee: Boolean(response.data.include_delivery_fee),
            overseas_product_indication: Boolean(response.data.overseas_product_indication)
          };
          formData.value = data;
        }
      } catch (err) {
        ElMessage.error(err.response?.data?.message || '설정 정보를 불러오는데 실패했습니다.');
        console.error('11번가 정책 로드 실패:', err);
      } finally {
        loading.value = false;
      }
    };

    const handleSubmit = async () => {
      saving.value = true;

      try {
        // boolean 값들을 명시적으로 변환
        const submitData = {
          ...formData.value,
          overseas_size_chart_display: Boolean(formData.value.overseas_size_chart_display),
          include_import_duty: Boolean(formData.value.include_import_duty),
          include_delivery_fee: Boolean(formData.value.include_delivery_fee),
          overseas_product_indication: Boolean(formData.value.overseas_product_indication)
        };
        
        const response = await updateElevenStorePolicy(submitData);
        if (response.success) {
          ElMessage.success('설정이 성공적으로 저장되었습니다.');
        }
      } catch (err) {
        ElMessage.error(err.response?.data?.message || '설정 저장에 실패했습니다.');
        console.error('11번가 정책 저장 실패:', err);
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
      deliveryCompanies
    };
  }
}
</script>

<style scoped>
.eleven-store-policy {
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

.help-text {
  margin-top: var(--spacing-xs);
  text-align: left;
}

.help-description {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
  line-height: 1.5;
}

.help-warning {
  color: var(--el-color-warning);
  font-size: var(--el-font-size-small);
  line-height: 1.5;
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

:deep(.el-switch__label) {
  font-size: var(--el-font-size-small);
}

:deep(.el-select__wrapper) {
  transition: all 0.2s ease;
}

:deep(.el-select__wrapper:hover) {
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
