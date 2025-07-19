<template>
  <div class="coopang-policy">
    <div class="page-header">
      <h2 class="page-title">쿠팡정책</h2>
      <p class="page-description">쿠팡 판매를 위한 정책 설정을 관리하세요.</p>
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
          <!-- 배송 설정 -->
          <div class="form-section">
            <h3 class="section-title">배송 설정</h3>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="배송업체 코드" prop="delivery_company_code">
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
              <el-col :xs="24" :sm="12">
                <el-form-item label="A/S 전화번호" prop="after_service_telephone">
                  <el-input
                    v-model="formData.after_service_telephone"
                    placeholder="예: 010-0000-0000"
                    maxlength="20"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :span="24">
                <el-form-item label="A/S 안내 내용" prop="after_service_guide_content">
                  <el-input
                    v-model="formData.after_service_guide_content"
                    type="textarea"
                    :rows="3"
                    placeholder="A/S 관련 안내 내용을 입력하세요"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 추가 설정 -->
          <div class="form-section">
            <h3 class="section-title">추가 설정</h3>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="반품 배송비 (원)" prop="return_delivery_fee">
                  <el-input
                    v-model.number="formData.return_delivery_fee"
                    type="number"
                    :min="0"
                    placeholder="반품 배송비"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="최대 옵션 개수" prop="max_option_count">
                  <el-input
                    v-model.number="formData.max_option_count"
                    type="number"
                    :min="1"
                    placeholder="최대 옵션 개수"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="32">
              <el-col :xs="24" :sm="12">
                <el-form-item label="무료 배송 설정" prop="free_shipping">
                  <el-switch
                    v-model="formData.free_shipping"
                    size="large"
                    active-text="무료"
                    inactive-text="유료"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="관세 설정" prop="include_import_duty">
                  <el-switch
                    v-model="formData.include_import_duty"
                    size="large"
                    active-text="포함"
                    inactive-text="미포함"
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
import { getCoupangPolicy, updateCoupangPolicy } from '@/services/settings';

export default {
  name: 'CoupangPolicy',
  components: {
    AppLoading
  },
  setup() {
    const formRef = ref();
    const loading = ref(false);
    const saving = ref(false);

    
    // 택배회사 목록
    const deliveryCompanies = ref([
      { code: 'HYUNDAI', name: '롯데택배' },
      { code: 'KGB', name: '로젠택배' },
      { code: 'EPOST', name: '우체국' },
      { code: 'HANJIN', name: '한진택배' },
      { code: 'CJGLS', name: 'CJ대한통운' },
      { code: 'KDEXP', name: '경동택배' },
      { code: 'DIRECT', name: '업체직송' },
      { code: 'ILYANG', name: '일양택배' },
      { code: 'CHUNIL', name: '천일특송' },
      { code: 'AJOU', name: '아주택배' },
      { code: 'CSLOGIS', name: 'SC로지스' },
      { code: 'DAESIN', name: '대신택배' },
      { code: 'CVS', name: 'CVS택배' },
      { code: 'HDEXP', name: '합동택배' },
      { code: 'DHL', name: 'DHL' },
      { code: 'UPS', name: 'UPS' },
      { code: 'FEDEX', name: 'FEDEX' },
      { code: 'REGISTPOST', name: '우편등기' },
      { code: 'EMS', name: '우체국 EMS' },
      { code: 'TNT', name: 'TNT' },
      { code: 'USPS', name: 'USPS' },
      { code: 'IPARCEL', name: 'i-parcel' },
      { code: 'GSMNTON', name: 'GSM NtoN' },
      { code: 'SWGEXP', name: '성원글로벌' },
      { code: 'PANTOS', name: '범한판토스' },
      { code: 'ACIEXPRESS', name: 'ACI Express' },
      { code: 'DAEWOON', name: '대운글로벌' },
      { code: 'AIRBOY', name: '에어보이익스프레스' },
      { code: 'KGLNET', name: 'KGL네트웍스' },
      { code: 'KUNYOUNG', name: '건영택배' },
      { code: 'SLX', name: 'SLX택배' },
      { code: 'HONAM', name: '우리택배' },
      { code: 'LINEEXPRESS', name: 'LineExpress' },
      { code: 'TWOFASTEXP', name: '2FastsExpress' },
      { code: 'HPL', name: '한의사랑택배' },
      { code: 'GOODSTOLUCK', name: '굿투럭' },
      { code: 'KOREXG', name: 'CJ대한통운특' },
      { code: 'HANDEX', name: '한덱스' },
      { code: 'BGF', name: 'BGF' },
      { code: 'ECMS', name: 'ECMS익스프레스' },
      { code: 'WONDERS', name: '원더스퀵' },
      { code: 'YONGMA', name: '용마로지스' },
      { code: 'SEBANG', name: '세방택배' },
      { code: 'NHLOGIS', name: '농협택배' },
      { code: 'LOTTEGLOBAL', name: '롯데글로벌' },
      { code: 'GSIEXPRESS', name: 'GSI익스프레스' },
      { code: 'EFS', name: 'EFS' },
      { code: 'DHLGLOBALMAIL', name: 'DHL GlobalMail' },
      { code: 'HILOGIS', name: 'Hi택배' },
      { code: 'GPSLOGIX', name: 'GPS로직' },
      { code: 'CRLX', name: '시알로지텍' },
      { code: 'BRIDGE', name: '브리지로지스' },
      { code: 'HOMEINNOV', name: '홈이노베이션로지스' },
      { code: 'CWAY', name: '씨웨이' },
      { code: 'GNETWORK', name: '자이언트' },
      { code: 'ACEEXP', name: 'ACE Express' },
      { code: 'WEVILL', name: '우리동네택배' },
      { code: 'FOREVERPS', name: '퍼레버택배' },
      { code: 'WARPEX', name: '워펙스' },
      { code: 'QXPRESS', name: '큐익스프레스' },
      { code: 'SMARTLOGIS', name: '스마트로지스' },
      { code: 'HOMEPICK', name: '홈픽택배' },
      { code: 'GTSLOGIS', name: 'GTS로지스' },
      { code: 'ESTHER', name: '에스더쉬핑' },
      { code: 'INTRAS', name: '로토스' },
      { code: 'EUNHA', name: '은하쉬핑' },
      { code: 'UFREIGHT', name: '유프레이트 코리아' },
      { code: 'LSERVICE', name: '엘서비스' },
      { code: 'TPMLOGIS', name: '로지스밸리' },
      { code: 'ZENIELSYSTEM', name: '제니엘시스템' },
      { code: 'ANYTRACK', name: '애니트랙' },
      { code: 'JLOGIST', name: '제이로지스트' },
      { code: 'CHAINLOGIS', name: '두발히어로(4시간당일택배)' },
      { code: 'QRUN', name: '큐런' },
      { code: 'FRESHSOLUTIONS', name: '프레시솔루션' },
      { code: 'HIVECITY', name: '하이브시티' },
      { code: 'HANSSEM', name: '한샘' },
      { code: 'SFC', name: 'SFC(Santai)' },
      { code: 'JNET', name: 'J-NET' },
      { code: 'GENIEGO', name: '지니고' },
      { code: 'PANASIA', name: '판아시아' },
      { code: 'ELIAN', name: 'elianpost' },
      { code: 'LOTTECHILSUNG', name: '롯데칠성' },
      { code: 'SBGLS', name: 'SBGLS' },
      { code: 'ALLTAKOREA', name: '올타코리아' },
      { code: 'YUNDA', name: 'yunda express' },
      { code: 'VALEX', name: '발렉스' },
      { code: 'KOKUSAI', name: '국제익스프레스' },
      { code: 'XINPATEK', name: '윈핸드해운항공' },
      { code: 'HEREWEGO', name: '탱고앤고' },
      { code: 'WOONGJI', name: '웅지익스프레스' },
      { code: 'PINGPONG', name: '핑퐁' },
      { code: 'YDH', name: 'YDH' },
      { code: 'CARGOPLEASE', name: '화물부탁해' },
      { code: 'LOGISPOT', name: '로지스팟' },
      { code: 'FRESHMATES', name: '프레시메이트' },
      { code: 'VROONG', name: '부릉' },
      { code: 'NKLS', name: 'NK로지솔루션' },
      { code: 'DODOFLEX', name: '도도플렉스' },
      { code: 'ETOMARS', name: '이투마스' },
      { code: 'SHIPNERGY', name: '배송하기좋은날' },
      { code: 'VENDORPIA', name: '벤더피아' },
      { code: 'COSHIP', name: '캐나다쉬핑' },
      { code: 'GDAKOREA', name: '지디에이코리아' },
      { code: 'BABABA', name: '바바바로지스' },
      { code: 'TEAMFRESH', name: '팀프레시' },
      { code: 'HOME1004', name: '1004홈' },
      { code: 'NAEUN', name: '나은물류' },
      { code: 'ACCCARGO', name: 'acccargo' },
      { code: 'NTLPS', name: '엔티엘피스' },
      { code: 'EKDP', name: '삼다수가정배송' },
      { code: 'HOTSINGCARGO', name: '허싱카고코리아' },
      { code: 'SINOEX', name: 'SINOTRANS EXPRESS' },
      { code: 'DRABBIT', name: '딜리래빗' },
      { code: 'HOMEPICKTODAY', name: '홈픽오늘도착' },
      { code: 'DAERIM', name: '대림통운' },
      { code: 'LOGISPARTNER', name: '로지스파트너' },
      { code: 'GOBOX', name: '고박스' },
      { code: 'FASTBOX', name: '패스트박스' },
      { code: 'PANSTAR', name: '팬스타국제특송' },
      { code: 'ACTCORE', name: '에이씨티앤코아물류' },
      { code: 'KJT', name: '케이제이티' },
      { code: 'THEBAO', name: '더바오' },
      { code: 'RUSH', name: '오늘회러쉬' },
      { code: 'KT', name: 'kt express' },
      { code: 'IBP', name: 'ibpcorp' },
      { code: 'HY', name: 'HY' },
      { code: 'LOGISVALLEY', name: '로지스밸리' },
      { code: 'TODAY', name: '투데이' },
      { code: 'ONEDAYLOGIS', name: '라스트마일시스템즈' },
      { code: 'HKHOLDINGS', name: '에이치케이홀딩스' },
      { code: 'JIKGUMOON', name: '직구문' },
      { code: 'CUBEFLOW', name: '큐브플로우' },
      { code: 'SHFLY', name: '성훈물류' },
      { code: 'GBS', name: '지비에스' },
      { code: 'BANPOOM', name: '반품구조대' },
      { code: 'GLOVIS', name: '현대글로비스' },
      { code: 'ARGO', name: '아르고' },
      { code: 'JMNP', name: '딜리박스' },
      { code: 'SELC', name: '삼성로지텍' },
      { code: 'MTINTER', name: '엠티인터네셔널' },
      { code: 'GDSP', name: '골드스넵스' },
      { code: 'TODAYPICKUP', name: '오늘의픽업' },
      { code: 'YJSGLOBAL', name: 'yjs글로벌' },
      { code: 'DUXGLOBAL', name: '유로택배' },
      { code: 'INTERLOGIS', name: '인터로지스' },
      { code: 'WOOJIN', name: '우진인터로지스' },
      { code: 'GHSPEED', name: '지에이치스피드' },
      { code: 'WIDETECH', name: '와이드테크' },
      { code: 'ECOHAI', name: '에코하이' },
      { code: 'TONAMI', name: '토나미' },
      { code: 'DAIICHI', name: '제1화물' },
      { code: 'FUKUYAMA', name: '후쿠야마통운' },
      { code: 'KURLYNEXTMILE', name: '컬리넥스트마일' },
      { code: 'ARAMEX', name: 'ARAMEX' },
      { code: 'BISNZ', name: 'BISNZ' },
      { code: 'INNOS', name: '이노스' },
      { code: 'SEORIM', name: '서림물류' },
      { code: 'WEMOVE', name: '위무브' },
      { code: 'POOLATHOME', name: '풀앳홈' },
      { code: 'SPARKLE', name: '스파클직배송' },
      { code: 'ICS', name: 'ICS' },
      { code: 'HANMI', name: '한미포스트' },
      { code: 'CAINIAO', name: 'CAINIAO' },
      { code: 'HWATONG', name: '화통' },
      { code: 'ESTLA', name: '이스트라' },
      { code: 'IK', name: 'IK물류' },
      { code: 'PULMUONEWATER', name: '풀무원샘물' },
      { code: 'TSG', name: '티에스지로지스' },
      { code: 'OCS', name: 'ocs코리아' },
      { code: 'MDLOGIS', name: '모든로지스' },
      { code: 'GCS', name: '지씨에스' },
      { code: 'FTF', name: '물류대장LCS' },
      { code: 'HUBNET', name: 'Hubnet Logistics' },
      { code: 'WINION_3P', name: '위니온로지스' },
      { code: 'WOORIHB', name: '우리한방택배' },
      { code: 'LETUS', name: '레터스' },
      { code: 'JWTNL', name: 'JWTNL' },
      { code: 'JCLS', name: 'JCLS' },
      { code: 'GKGLOBAL', name: '지케이글로벌' },
      { code: 'GONELO', name: '고넬로' }
    ]);
    
    const formData = ref({
      delivery_company_code: 'KGB',
      after_service_telephone: '010-0000-0000',
      after_service_guide_content: 'A/S 관련 안내 내용입니다.',
      free_shipping: true,
      max_option_count: 10,
      return_delivery_fee: 5000,
      include_import_duty: true,
    });

    const loadPolicy = async () => {
      loading.value = true;
      
      try {
        const response = await getCoupangPolicy();
        if (response.success && response.data) {
          // 백엔드에서 받아온 숫자 boolean 값들을 실제 boolean으로 변환
          const data = {
            ...response.data,
            free_shipping: Boolean(response.data.free_shipping),
            include_import_duty: Boolean(response.data.include_import_duty)
          };
          formData.value = data;
        }
      } catch (err) {
        ElMessage.error(err.response?.data?.message || '설정 정보를 불러오는데 실패했습니다.');
        console.error('쿠팡 정책 로드 실패:', err);
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
          free_shipping: Boolean(formData.value.free_shipping),
          include_import_duty: Boolean(formData.value.include_import_duty)
        };
        
        const response = await updateCoupangPolicy(submitData);
        if (response.success) {
          ElMessage.success('설정이 성공적으로 저장되었습니다.');
        }
      } catch (err) {
        ElMessage.error(err.response?.data?.message || '설정 저장에 실패했습니다.');
        console.error('쿠팡 정책 저장 실패:', err);
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
.coopang-policy {
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
