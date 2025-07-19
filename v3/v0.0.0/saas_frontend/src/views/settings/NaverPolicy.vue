<template>
  <div class="naver-policy">
    <div class="page-header">
      <h2 class="page-title">네이버정책</h2>
      <p class="page-description">네이버 스마트스토어 등록을 위한 정책 설정을 관리하세요.</p>
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
                <el-form-item label="배송업체" prop="delivery_company">
                  <el-select
                    v-model="formData.delivery_company"
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

          <!-- 배송비 설정 -->
          <div class="form-section">
            <h3 class="section-title">배송비 설정</h3>
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
                <el-form-item label="교환 배송비 (원)" prop="exchange_delivery_fee">
                  <el-input
                    v-model.number="formData.exchange_delivery_fee"
                    type="number"
                    :min="0"
                    placeholder="교환 배송비"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 포인트 및 혜택 설정 -->
          <div class="form-section">
            <h3 class="section-title">포인트 및 혜택 설정</h3>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="네이버포인트 할인 적용 금액 (원)" prop="naver_point">
                  <el-input
                    v-model.number="formData.naver_point"
                    type="number"
                    :min="0"
                    placeholder="네이버포인트 할인 금액"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="구매 포인트 (원)" prop="purchase_point">
                  <el-input
                    v-model.number="formData.purchase_point"
                    type="number"
                    :min="0"
                    placeholder="구매 포인트"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="네이버 캐시백 가격 (원)" prop="naver_cashback_price">
                  <el-input
                    v-model.number="formData.naver_cashback_price"
                    type="number"
                    :min="0"
                    placeholder="네이버 캐시백 가격"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 리뷰 포인트 설정 -->
          <div class="form-section">
            <h3 class="section-title">리뷰 포인트 설정</h3>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="텍스트 리뷰 포인트 (원)" prop="text_review_point">
                  <el-input
                    v-model.number="formData.text_review_point"
                    type="number"
                    :min="0"
                    placeholder="텍스트 리뷰 포인트"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="포토/비디오 리뷰 포인트 (원)" prop="photo_video_review_point">
                  <el-input
                    v-model.number="formData.photo_video_review_point"
                    type="number"
                    :min="0"
                    placeholder="포토/비디오 리뷰 포인트"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="사용 후 텍스트 리뷰 포인트 (원)" prop="after_use_text_review_point">
                  <el-input
                    v-model.number="formData.after_use_text_review_point"
                    type="number"
                    :min="0"
                    placeholder="사용 후 텍스트 리뷰 포인트"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="사용 후 포토/비디오 리뷰 포인트 (원)" prop="after_use_photo_video_review_point">
                  <el-input
                    v-model.number="formData.after_use_photo_video_review_point"
                    type="number"
                    :min="0"
                    placeholder="사용 후 포토/비디오 리뷰 포인트"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="스토어 멤버 리뷰 포인트 (원)" prop="store_member_review_point">
                  <el-input
                    v-model.number="formData.store_member_review_point"
                    type="number"
                    :min="0"
                    placeholder="스토어 멤버 리뷰 포인트"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

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
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="옵션 제한 선택" prop="price_setting_logic">
                  <el-select
                    v-model="formData.price_setting_logic"
                    placeholder="옵션 제한 방식 선택"
                    style="width: 100%"
                  >
                    <el-option label="최저가" value="low_price" />
                    <el-option label="AI 추천" value="ai" />
                    <el-option label="가장 많은 상품" value="many" />
                  </el-select>
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
import { getNaverPolicy, updateNaverPolicy } from '@/services/settings';

export default {
  name: 'NaverPolicy',
  components: {
    AppLoading
  },
  setup() {
    const formRef = ref();
    const loading = ref(false);
    const saving = ref(false);

    
    // 택배회사 목록
    const deliveryCompanies = ref([
      { code: 'CJGLS', name: 'CJ대한통운' },
      { code: 'HYUNDAI', name: '롯데택배' },
      { code: 'HANJIN', name: '한진택배' },
      { code: 'KGB', name: '로젠택배' },
      { code: 'EPOST', name: '우체국택배' },
      { code: 'MTINTER', name: '엠티인터내셔널' },
      { code: '1004HOME', name: '1004HOME' },
      { code: 'TWOFASTEXPRESS', name: '2FAST익스프레스' },
      { code: 'ACE', name: 'ACEexpress' },
      { code: 'ACIEXPRESS', name: 'ACI' },
      { code: 'ADCAIR', name: 'ADC항운택배' },
      { code: 'AIRWAY', name: 'AIRWAY익스프레스' },
      { code: 'APEX', name: 'APEX' },
      { code: 'ARAMEX', name: 'ARAMEX' },
      { code: 'ARGO', name: 'ARGO' },
      { code: 'AIRBOY', name: 'AirboyExpress' },
      { code: 'KOREXG', name: 'CJ대한통운(국제택배)' },
      { code: 'CUPARCEL', name: 'CU편의점택배' },
      { code: 'CWAYEXPRESS', name: 'CwayExpress' },
      { code: 'DHL', name: 'DHL' },
      { code: 'DHLDE', name: 'DHL(독일)' },
      { code: 'DHLGLOBALMAIL', name: 'DHLGlobalMail' },
      { code: 'DPD', name: 'DPD' },
      { code: 'ECMSEXPRESS', name: 'ECMSExpress' },
      { code: 'EFS', name: 'EFS' },
      { code: 'EMS', name: 'EMS' },
      { code: 'EZUSA', name: 'EZUSA' },
      { code: 'EUROPARCEL', name: 'EuroParcel' },
      { code: 'FEDEX', name: 'FEDEX' },
      { code: 'GOP', name: 'GOP당일택배' },
      { code: 'GOS', name: 'GOS당일택배' },
      { code: 'GPSLOGIX', name: 'GPSLOGIX' },
      { code: 'GSFRESH', name: 'GSFresh' },
      { code: 'GSIEXPRESS', name: 'GSI익스프레스' },
      { code: 'GSMNTON', name: 'GSMNTON' },
      { code: 'GSPOSTBOX', name: 'GSPostbox퀵' },
      { code: 'CVSNET', name: 'GSPostbox택배' },
      { code: 'GS더프레시', name: 'GSTHEFRESH' },
      { code: 'GTSLOGIS', name: 'GTS로지스' },
      { code: 'HYBRID', name: 'HI택배' },
      { code: 'HY', name: 'HY' },
      { code: 'IK', name: 'IK물류' },
      { code: 'KGLNET', name: 'KGL네트웍스' },
      { code: 'KT', name: 'KT EXPRESS' },
      { code: 'LGE', name: 'LG전자배송센터' },
      { code: 'LTL', name: 'LTL' },
      { code: 'NDEXKOREA', name: 'NDEX KOREA' },
      { code: 'SBGLS', name: 'SBGLS' },
      { code: 'SFEX', name: 'SFexpress' },
      { code: 'SLX', name: 'SLX택배' },
      { code: 'SSG', name: 'SSG' },
      { code: 'TNT', name: 'TNT' },
      { code: 'LOGISPARTNER', name: 'UFO로지스' },
      { code: 'UPS', name: 'UPS' },
      { code: 'USPS', name: 'USPS' },
      { code: 'WIZWA', name: 'WIZWA' },
      { code: 'YJSWORLD', name: 'YJS글로벌' },
      { code: 'YJS', name: 'YJS글로벌(영국)' },
      { code: 'YUNDA', name: 'YUNDAEXPRESS' },
      { code: 'IPARCEL', name: 'i-parcel' },
      { code: 'KY', name: '건영복합물류' },
      { code: 'KUNYOUNG', name: '건영택배' },
      { code: 'KDEXP', name: '경동택배' },
      { code: 'KIN', name: '경인택배' },
      { code: 'KORYO', name: '고려택배' },
      { code: 'GDSP', name: '골드스넵스' },
      { code: 'KOKUSAI', name: '국제익스프레스' },
      { code: 'GOODTOLUCK', name: '굿투럭' },
      { code: 'NAEUN', name: '나은물류' },
      { code: 'NOGOK', name: '노곡물류' },
      { code: 'NONGHYUP', name: '농협택배' },
      { code: 'HANAROMART', name: '농협하나로마트' },
      { code: 'DAELIM', name: '대림통운' },
      { code: 'DAESIN', name: '대신택배' },
      { code: 'DAEWOON', name: '대운글로벌' },
      { code: 'THEBAO', name: '더바오' },
      { code: 'DODOFLEX', name: '도도플렉스' },
      { code: 'DONGGANG', name: '동강물류' },
      { code: 'DONGJIN', name: '동진특송' },
      { code: 'CHAINLOGIS', name: '두발히어로당일택배' },
      { code: 'DRABBIT', name: '딜리래빗' },
      { code: 'JMNP', name: '딜리박스' },
      { code: 'ONEDAYLOGIS', name: '라스트마일' },
      { code: 'LINEEXP', name: '라인익스프레스' },
      { code: 'ROADSUNEXPRESS', name: '로드썬익스프레스' },
      { code: 'LOGISVALLEY', name: '로지스밸리' },
      { code: 'POOLATHOME', name: '로지스올홈케어(풀앳홈)' },
      { code: 'LOTOS', name: '로토스' },
      { code: 'HLCGLOBAL', name: '롯데글로벌로지스(국제택배)' },
      { code: 'LOTTECHILSUNG', name: '롯데칠성' },
      { code: 'MDLOGIS', name: '모든로지스(SLO)' },
      { code: 'DASONG', name: '물류대장' },
      { code: 'BABABA', name: '바바바로지스' },
      { code: 'BANPOOM', name: '반품구조대' },
      { code: 'VALEX', name: '발렉스' },
      { code: 'SHIPNERGY', name: '배송하기좋은날' },
      { code: 'PANTOS', name: 'LX판토스' },
      { code: 'VROONG', name: '부릉' },
      { code: 'BRIDGE', name: '브릿지로지스' },
      { code: 'EKDP', name: '삼다수가정배송' },
      { code: 'SELC', name: '삼성전자물류' },
      { code: 'SEORIM', name: '서림물류' },
      { code: 'SWGEXP', name: '성원글로벌' },
      { code: 'SUNGHUN', name: '성훈물류' },
      { code: 'SEBANG', name: '세방택배' },
      { code: 'SMARTLOGIS', name: '스마트로지스' },
      { code: 'SPARKLE', name: '스파클직배송' },
      { code: 'SPASYS1', name: '스페이시스원' },
      { code: 'CRLX', name: '시알로지텍' },
      { code: 'ANYTRACK', name: '애니트랙' },
      { code: 'ABOUTPET', name: '어바웃펫' },
      { code: 'ESTHER', name: '에스더쉬핑' },
      { code: 'VENDORPIA', name: '벤더피아' },
      { code: 'ACTCORE', name: '에이씨티앤코아' },
      { code: 'HKHOLDINGS', name: '에이치케이홀딩스' },
      { code: 'NTLPS', name: '엔티엘피스' },
      { code: 'TODAYPICKUP', name: '카카오T당일배송' },
      { code: 'RUSH', name: '오늘회러쉬' },
      { code: 'ALLIN', name: '올인닷컴' },
      { code: 'ALLTAKOREA', name: '올타코리아' },
      { code: 'WIDETECH', name: '와이드테크' },
      { code: 'YONGMA', name: '용마로지스' },
      { code: 'DCOMMERCE', name: '우리동네커머스' },
      { code: 'WEVILL', name: '우리동네택배' },
      { code: 'HONAM', name: '우리택배' },
      { code: 'WOORIHB', name: '우리한방택배' },
      { code: 'WOOJIN', name: '우진인터로지스' },
      { code: 'REGISTPOST', name: '우편등기' },
      { code: 'WOONGJI', name: '웅지익스프레스' },
      { code: 'WARPEX', name: '워펙스' },
      { code: 'WINION', name: '위니온로지스' },
      { code: 'WIHTYOU', name: '위드유당일택배' },
      { code: 'WEMOVE', name: '위무브' },
      { code: 'UFREIGHT', name: '유프레이트코리아' },
      { code: 'EUNHA', name: '은하쉬핑' },
      { code: 'INNOS', name: '이노스(올인닷컴)' },
      { code: 'EMARTEVERYDAY', name: '이마트에브리데이' },
      { code: 'ESTLA', name: '이스트라' },
      { code: 'ETOMARS', name: '이투마스' },
      { code: 'GENERALPOST', name: '일반우편' },
      { code: 'ILSHIN', name: '일신모닝택배' },
      { code: 'ILYANG', name: '일양로지스' },
      { code: 'GNETWORK', name: '자이언트' },
      { code: 'ZENIEL', name: '제니엘시스템' },
      { code: 'JLOGIST', name: '제이로지스트' },
      { code: 'GENIEGO', name: '지니고당일특급' },
      { code: 'GDAKOREA', name: '지디에이코리아' },
      { code: 'GHSPEED', name: '지에이치스피드' },
      { code: 'JIKGUMOON', name: '직구문' },
      { code: 'CHUNIL', name: '천일택배' },
      { code: 'CHOROC', name: '초록마을(외부 연동)' },
      { code: 'CHOROCMAEUL', name: '초록마을(네이버직연동)' },
      { code: 'COSHIP', name: '캐나다쉬핑' },
      { code: 'KJT', name: '케이제이티' },
      { code: 'QRUN', name: '큐런' },
      { code: 'CUBEFLOW', name: '큐브플로우' },
      { code: 'QXPRESS', name: '트랙스로지스' },
      { code: 'HEREWEGO', name: '탱고앤고' },
      { code: 'TOMATO', name: '토마토앱' },
      { code: 'TODAY', name: '투데이' },
      { code: 'TSG', name: '티에스지로지스' },
      { code: 'TEAMFRESH', name: '팀프레시' },
      { code: 'PATEK', name: '파테크해운상공' },
      { code: 'XINPATEK', name: '파테크해운항공' },
      { code: 'PANASIA', name: '판월드로지스틱' },
      { code: 'PANSTAR', name: '팬스타국제특송(PIEX)' },
      { code: 'FOREVER', name: '퍼레버택배' },
      { code: 'PULMUONE', name: '풀무원(로지스밸리)' },
      { code: 'FREDIT', name: '프레딧' },
      { code: 'FRESHMATES', name: '프레시메이트' },
      { code: 'FRESH', name: '컬리넥스트마일' },
      { code: 'PINGPONG', name: '핑퐁' },
      { code: 'HOWSER', name: '하우저' },
      { code: 'HIVECITY', name: '하이브시티' },
      { code: 'HANDALUM', name: '한달음택배' },
      { code: 'HANDEX', name: '한덱스' },
      { code: 'HANMI', name: '한미포스트' },
      { code: 'HANSSEM', name: '한샘' },
      { code: 'HANWOORI', name: '한우리물류' },
      { code: 'HPL', name: '한의사랑택배' },
      { code: 'HDEXP', name: '합동택배' },
      { code: 'HERWUZUG', name: '허우적' },
      { code: 'GLOVIS', name: '현대글로비스' },
      { code: 'HOMEINNO', name: '홈이노베이션로지스' },
      { code: 'HOMEPICKTODAY', name: '홈픽오늘도착' },
      { code: 'HOMEPICK', name: '홈픽택배' },
      { code: 'HOMEPLUSDELIVERY', name: '홈플러스' },
      { code: 'HOMEPLUSEXPRESS', name: '홈플러스익스프레스' },
      { code: 'CARGOPLEASE', name: '화물을부탁해' },
      { code: 'HWATONG', name: '화통' },
      { code: 'CH1', name: '기타 택배' },
      { code: 'LETUS', name: '바로스' },
      { code: 'LETUS3PL', name: '레터스' },
      { code: 'CASA', name: '신세계까사' },
      { code: 'GCS', name: '지씨에스' },
      { code: 'GKGLOBAL', name: '지케이글로벌' },
      { code: 'BRCH', name: '비알씨에이치' },
      { code: 'DNDN', name: '든든택배' },
      { code: 'GONELO', name: '고넬로' },
      { code: 'JCLS', name: 'JCLS' },
      { code: 'JWTNL', name: 'JWTNL' },
      { code: 'GS25', name: 'GS편의점(퀵배달용)' },
      { code: 'CU', name: 'CU편의점(퀵배달용)' }
    ]);
    
    const formData = ref({
      delivery_company: 'CJGLS',
      after_service_telephone: '010-0000-0000',
      after_service_guide_content: 'A/S (개봉 및 택 제거 후 반품 교환 환불 불가)',
      naver_point: 1000,
      return_delivery_fee: 5000,
      exchange_delivery_fee: 5000,
      purchase_point: 1000,
      naver_cashback_price: 1000,
      text_review_point: 1000,
      photo_video_review_point: 1000,
      after_use_text_review_point: 1000,
      after_use_photo_video_review_point: 1000,
      store_member_review_point: 2000,
      include_delivery_fee: true,
      include_import_duty: true,
      price_setting_logic: 'many'
    });

    const loadPolicy = async () => {
      loading.value = true;
      
      try {
        const response = await getNaverPolicy();
        if (response.success && response.data) {
          // 0/1을 true/false로 변환
          const data = { ...response.data };
          data.include_delivery_fee = Boolean(data.include_delivery_fee);
          data.include_import_duty = Boolean(data.include_import_duty);
          formData.value = data;
        }
      } catch (err) {
        ElMessage.error(err.response?.data?.message || '설정 정보를 불러오는데 실패했습니다.');
        console.error('네이버 정책 로드 실패:', err);
      } finally {
        loading.value = false;
      }
    };

    const handleSubmit = async () => {
      saving.value = true;

      try {
        const response = await updateNaverPolicy(formData.value);
        if (response.success) {
          ElMessage.success('설정이 성공적으로 저장되었습니다.');
        }
      } catch (err) {
        ElMessage.error(err.response?.data?.message || '설정 저장에 실패했습니다.');
        console.error('네이버 정책 저장 실패:', err);
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
.naver-policy {
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

:deep(.el-select__wrapper) {
  transition: all 0.2s ease;
}

:deep(.el-select__wrapper:hover) {
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
