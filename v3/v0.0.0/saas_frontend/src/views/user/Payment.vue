<template>
  <div class="payment-page">
    <div class="container">
      <!-- 전체 콘텐츠 레이아웃 -->
      <div class="content-layout">
        <!-- 왼쪽: 요금제 선택 영역 -->
        <div class="pricing-section">
          <!-- 페이지 헤더 -->
          <div class="page-header">
            <h1 class="page-title">결제 옵션 선택</h1>
            <p class="page-subtitle">필요한 구독·부가 서비스를 선택하세요</p>
          </div>

          <!-- 메인 콘텐츠 3열 레이아웃 -->
          <div class="main-grid">
            <!-- 1열: 베이직 요금제 -->
            <div class="pricing-column">
              <div 
                class="pricing-card vertical" 
                :class="{ 'selected': selectedPlan === 'basic' }"
                @click="selectPlan('basic')"
              >
                <div class="plan-header">
                  <h3 class="plan-name">베이직</h3>
                  <div class="plan-price">
                    <span class="price-amount">85,000</span>
                    <span class="price-currency">원</span>
                    <span class="price-period">/월</span>
                  </div>
                </div>
                <div class="plan-features">
                  <div class="feature-item">
                    <span>• 소싱 100개/일</span>
                  </div>
                  <div class="feature-item">
                    <span>• 관리 상품수 무제한</span>
                  </div>
                  <div class="feature-item">
                    <span>• 올인원 이미지 가공 50개/일</span>
                  </div>
                  <div class="feature-item">
                    <span>• SEO 최적화</span>
                  </div>
                  <div class="feature-item">
                    <span>• 키워드 생성</span>
                  </div>
                  <div class="feature-item">
                    <span>• 브랜드 필터링</span>
                  </div>
                  <div class="feature-item">
                    <span>• 옵션 SEO 최적화</span>
                  </div>
                  <div class="feature-item">
                    <span>• 속성명 번역</span>
                  </div>
                  <div class="feature-item">
                    <span>• 기본 사업자 1개</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2열: 엔터프라이즈 요금제 -->
            <div class="pricing-column">
              <div 
                class="pricing-card vertical enterprise" 
                :class="{ 'selected': selectedPlan === 'enterprise' }"
                @click="selectPlan('enterprise')"
              >
                <div class="plan-badge">인기</div>
                <div class="plan-header">
                  <h3 class="plan-name">엔터프라이즈</h3>
                  <div class="plan-price">
                    <span class="price-amount">180,000</span>
                    <span class="price-currency">원</span>
                    <span class="price-period">/월</span>
                  </div>
                </div>
                <div class="plan-features">
                  <div class="feature-item">
                    <span>• 베이직 플랜 모든 기능+</span>
                  </div>
                  <div class="feature-item">
                    <span>• 올인원 이미지 가공 200개/일</span>
                  </div>
                  <div class="feature-item">
                    <span>• 무제한 소싱</span>
                  </div>
                  <div class="feature-item">
                    <span>• 무제한 텍스트 번역, SEO 최적화</span>
                  </div>
                  <div class="feature-item">
                    <span>• 무제한 이미지 호스팅 및 트레픽 지원</span>
                  </div>
                  <div class="feature-item">
                    <span>• 이미지 누끼</span>
                  </div>
                  <div class="feature-item">
                    <span>• 고급 키워드 생성</span>
                  </div>
                  <div class="feature-item">
                    <span>• 애넬리틱스 데이터 분석</span>
                  </div>
                  <div class="feature-item">
                    <span>• 브랜드 딥 필터링</span>
                  </div>
                  <div class="feature-item">
                    <span>• API 연동</span>
                  </div>
                  <div class="feature-item">
                    <span>• 쿠팡 자동 매핑</span>
                  </div>
                  <div class="feature-item">
                    <span>• 필요기능 맞춤 개발</span>
                  </div>
                  <div class="feature-item">
                    <span>• 기본 사업자 3개</span>
                  </div>
                  <div class="feature-item">
                    <span>• 필요시 사업자 추가 가능</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3열: 추가 옵션 -->
            <div class="options-column">
              <!-- 올인원 이미지 번역 패키지 -->
              <div class="addon-card premium" :class="{ 'selected': allInOnePackageInput > 0 }">
                <div class="addon-header">
                  <div class="addon-info">
                    <h4 class="addon-name">올인원 이미지 번역 패키지</h4>
                    <p class="addon-description">모든 이미지 번역 + AI 누끼 포함. 고민 없이 가장 확실한 성공률을 보장합니다</p>
                    <p class="addon-price">상품1개당 12원</p>
                  </div>
                  <div class="addon-control">
                    <el-input 
                      v-model="allInOnePackageInput" 
                      type="number"
                      size="small"
                      style="width: 80px;"
                    />
                    <span class="unit">개</span>
                    <span class="price-display" v-if="allInOnePackageInput > 0">
                      {{ formatPrice(allInOnePackageInput) }}개 / {{ formatPrice(allInOnePackageInput * 12) }}원
                    </span>
                  </div>
                </div>
              </div>

              <!-- 이미지 번역 (커스터마이징) -->
              <div class="addon-card" :class="{ 'selected': imageTranslationInput > 0 }">
                <div class="addon-header">
                  <div class="addon-info">
                    <h4 class="addon-name">이미지 번역 (커스터마이징)</h4>
                    <p class="addon-description">1만장당 5,000원</p>
                  </div>
                  <div class="addon-control">
                    <el-input 
                      v-model="imageTranslationInput" 
                      type="number"
                      size="small"
                      style="width: 80px;"
                    />
                    <span class="unit">만장</span>
                    <span class="price-display" v-if="imageTranslationInput > 0">
                      {{ formatPrice(imageTranslationInput * 10000) }}장 / {{ formatPrice(imageTranslationInput * 5000) }}원
                    </span>
                  </div>
                </div>
                
                <!-- 이미지 계산기 -->
                <div class="image-calculator">
                  <h5 class="calculator-title">
                    필요 이미지수 계산
                    <span class="product-count" v-if="productCountInput > 0">(상품수: {{ formatPrice(productCountInput) }}개)</span>
                  </h5>
                  <div class="calculator-input">
                    <label>상품 수:</label>
                    <el-input 
                      v-model="productCountInput" 
                      type="number"
                      size="small"
                      style="width: 80px;"
                      @input="calculateImages"
                    />
                    <span class="unit">개</span>
                  </div>
                  
                  <div class="image-options">
                    <div class="image-type-buttons">
                      <el-button 
                        :type="imageTypes.main ? 'primary' : ''"
                        size="small"
                        @click="toggleImageType('main')"
                      >
                        메인(5장)
                      </el-button>
                      <el-button 
                        :type="imageTypes.option ? 'primary' : ''"
                        size="small"
                        @click="toggleImageType('option')"
                      >
                        옵션(5장)
                      </el-button>
                      <el-button 
                        :type="imageTypes.detail ? 'primary' : ''"
                        size="small"
                        @click="toggleImageType('detail')"
                      >
                        상세(17장)
                      </el-button>
                      <el-button 
                        :type="imageTypes.cutout ? 'primary' : ''"
                        size="small"
                        @click="toggleImageType('cutout')"
                      >
                        누끼(1장)
                      </el-button>
                    </div>
                  </div>
                  
                  <div class="calculator-result" v-if="productCountInput > 0 && hasSelectedImageTypes">
                    <div class="image-breakdown">
                      <div class="breakdown-item" v-if="imageTypes.main">
                        <span>메인 이미지:</span>
                        <span>{{ productCountInput * 5 }}장</span>
                      </div>
                      <div class="breakdown-item" v-if="imageTypes.option">
                        <span>옵션 이미지:</span>
                        <span>{{ productCountInput * 5 }}장</span>
                      </div>
                      <div class="breakdown-item" v-if="imageTypes.detail">
                        <span>상세 이미지:</span>
                        <span>{{ productCountInput * 17 }}장</span>
                      </div>
                      <div class="breakdown-item" v-if="imageTypes.cutout">
                        <span>이미지 누끼:</span>
                        <span>{{ productCountInput * 1 }}장</span>
                      </div>
                      <div class="breakdown-total">
                        <span>총 필요 이미지:</span>
                        <span class="total-count">{{ totalImages }}장 ({{ suggestedImageTranslation }}만장)</span>
                      </div>
                      <div class="auto-fill-suggestion">
                        <el-button 
                          type="success" 
                          size="small" 
                          @click="applySuggestedAmount"
                          :disabled="suggestedImageTranslation === 0"
                        >
                          위 수량 적용
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 딥 필터링 이용권 (엔터프라이즈만) -->
              <div class="addon-card" :class="{ 'selected': deepFilteringInput > 0 }">
                <div class="addon-header">
                  <div class="addon-info">
                    <h4 class="addon-name">딥 필터링 이용권</h4>
                    <p class="addon-description">1회당 1원</p>
                  </div>
                  <div class="addon-control">
                    <el-input 
                      v-model="deepFilteringInput" 
                      type="number"
                      size="small"
                      style="width: 80px;"
                    />
                    <span class="unit">만회</span>
                    <span class="price-display" v-if="deepFilteringInput > 0">
                      {{ formatPrice(deepFilteringInput*10000) }}회 / {{ formatPrice(deepFilteringInput * 10000) }}원
                    </span>
                  </div>
                </div>
              </div>

              <!-- 사업자 수 추가 (엔터프라이즈만) -->
              <div class="addon-card" :class="{ 'selected': additionalMarketsInput > 0 }">
                <div class="addon-header">
                  <div class="addon-info">
                    <h4 class="addon-name">추가 사업자</h4>
                    <p class="addon-description">사업자 1개당 45,000원</p>
                  </div>
                  <div class="addon-control">
                    <el-input 
                      v-model="additionalMarketsInput" 
                      type="number"
                      size="small"
                      style="width: 80px;"
                    />
                    <span class="unit">개</span>
                    <span class="price-display" v-if="additionalMarketsInput > 0">
                      {{ formatPrice(additionalMarketsInput) }}개 / {{ formatPrice(additionalMarketsInput * 45000) }}원
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 오른쪽: 결제 요약 -->
        <div class="summary-sidebar">
          <div class="payment-summary">
            <h4 class="summary-title">결제 요약</h4>
            <div class="summary-card" v-if="hasPurchase">
              <!-- 결제 기간 선택 -->
              <div class="billing-period" v-if="monthlyTotal > 0">
                <h5 class="billing-title">결제 기간</h5>
                <el-select v-model="billingMonths" placeholder="결제 기간 선택" size="small">
                  <el-option label="1개월" :value="1" />
                  <el-option label="3개월" :value="3" />
                  <el-option label="6개월 (5% 할인)" :value="6" />
                  <el-option label="12개월 (10% 할인)" :value="12" />
                </el-select>
                <div class="discount-info" v-if="discountRate > 0">
                  <el-tag type="success" size="small">
                    {{ discountRate }}% 할인 적용
                  </el-tag>
                </div>
              </div>

              <div class="summary-section" v-if="monthlyTotal > 0">
                <h5 class="summary-subtitle">월 구독료</h5>
                <div class="summary-item" v-if="selectedPlan">
                  <span>{{ selectedPlan === 'basic' ? '베이직' : '엔터프라이즈' }} 플랜</span>
                  <span class="amount">{{ formatPrice(planPrice) }}원</span>
                </div>
                <div class="summary-item" v-if="additionalMarkets > 0">
                  <span>추가 사업자 ({{ additionalMarkets }}개)</span>
                  <span class="amount">{{ formatPrice(additionalMarketsCost) }}원</span>
                </div>
                <div class="summary-subtotal" v-if="false">
                  <span>월 구독료 합계</span>
                  <span class="amount">{{ formatPrice(monthlyTotal) }}원</span>
                </div>
              </div>

              <div class="summary-section" v-if="oneTimeTotal > 0">
                <h5 class="summary-subtitle">일회성 비용</h5>
                <div class="summary-item" v-if="allInOnePackageInput > 0">
                  <span>올인원 이미지 번역 패키지 ({{ allInOnePackageInput }}개)</span>
                  <span class="amount">{{ formatPrice(allInOnePackageInput * 12) }}원</span>
                </div>
                <div class="summary-item" v-if="imageTranslationInput > 0">
                  <span>이미지 번역 ({{ imageTranslationInput }}만장)</span>
                  <span class="amount">{{ formatPrice(imageTranslationInput * 5000) }}원</span>
                </div>
                <div class="summary-item" v-if="deepFilteringInput > 0">
                  <span>딥 필터링 이용권 ({{ deepFilteringInput }}만회)</span>
                  <span class="amount">{{ formatPrice(deepFilteringInput * 10000) }}원</span>
                </div>
                <div class="summary-subtotal" v-if="false">
                  <span>일회성 비용 합계</span>
                  <span class="amount">{{ formatPrice(oneTimeTotal) }}원</span>
                </div>
              </div>

              <div class="summary-section" v-if="monthlyTotal > 0">
                <h5 class="summary-subtitle">구독료 총계 ({{ billingMonths }}개월)</h5>
                <div class="summary-item" v-if="discountRate > 0">
                  <span>할인 전 금액</span>
                  <span class="original-amount">{{ formatPrice(monthlyTotal * billingMonths) }}원</span>
                </div>
                <div class="summary-item" v-if="discountRate > 0">
                  <span>할인 금액 ({{ discountRate }}%)</span>
                  <span class="discount-amount">-{{ formatPrice(discountAmount) }}원</span>
                </div>
                <div class="summary-subtotal" v-if="false">
                  <span>구독료 총계</span>
                  <span class="amount">{{ formatPrice(subscriptionTotal) }}원</span>
                </div>
              </div>

              <div class="summary-total">
                <div class="total-item">
                  <span>최종 결제 금액</span>
                  <span class="total-amount">{{ formatPrice(finalTotal) }}원</span>
                </div>
              </div>

              <div class="payment-actions">
                <el-button type="primary" size="large" class="payment-button">
                  결제하기
                </el-button>
              </div>
            </div>
            <div class="no-plan-selected" v-else>
              <p>결제 옵션을 선택하면 결제 요약이 표시됩니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  name: 'PaymentPage',
  setup() {
    const selectedPlan = ref('');
    const additionalMarkets = ref(0);
    const allInOnePackage = ref(0);
    const imageTranslation = ref(0);
    const deepFiltering = ref(0);
    const productCount = ref(0);
    const billingMonths = ref(1);
    const imageTypes = ref({
      main: false,
      option: false,
      detail: false,
      cutout: false
    });

    /* ------------------------------------------------------------------
     *  입력창 UX 개선용 computed 래퍼 (0 ➔ '' 표시, 입력 ➔ 숫자 변환)
     * ------------------------------------------------------------------ */
    const allInOnePackageInput = computed({
      get: () => (allInOnePackage.value === 0 ? '' : allInOnePackage.value),
      set: (v) => {
        const n = Number(v);
        allInOnePackage.value = isNaN(n) || v === '' ? 0 : n;
      }
    });

    const imageTranslationInput = computed({
      get: () => (imageTranslation.value === 0 ? '' : imageTranslation.value),
      set: (v) => {
        const n = Number(v);
        imageTranslation.value = isNaN(n) || v === '' ? 0 : n;
      }
    });

    const deepFilteringInput = computed({
      get: () => (deepFiltering.value === 0 ? '' : deepFiltering.value),
      set: (v) => {
        const n = Number(v);
        deepFiltering.value = isNaN(n) || v === '' ? 0 : n;
      }
    });

    const productCountInput = computed({
      get: () => (productCount.value === 0 ? '' : productCount.value),
      set: (v) => {
        const n = Number(v);
        productCount.value = isNaN(n) || v === '' ? 0 : n;
      }
    });

    const additionalMarketsInput = computed({
      get: () => (additionalMarkets.value === 0 ? '' : additionalMarkets.value),
      set: (v) => {
        const n = Number(v);
        additionalMarkets.value = isNaN(n) || v === '' ? 0 : n;
      }
    });

    const selectPlan = (plan) => {
      selectedPlan.value = selectedPlan.value === plan ? '' : plan;
    };

    const toggleImageType = (type) => {
      imageTypes.value[type] = !imageTypes.value[type];
      calculateImages();
    };

    const planPrice = computed(() => {
      if (selectedPlan.value === 'basic') return 85000;
      if (selectedPlan.value === 'enterprise') return 180000;
      return 0; // 플랜 선택 안 됨
    });

    const additionalMarketsCost = computed(() => {
      return additionalMarkets.value > 0 ? additionalMarkets.value * 45000 : 0;
    });

    const monthlyTotal = computed(() => {
      return planPrice.value + additionalMarketsCost.value;
    });

    const oneTimeTotal = computed(() => {
      let total = 0;
      total += allInOnePackage.value * 12;
      total += imageTranslation.value * 5000;
      total += deepFiltering.value * 10000;
      return total;
    });

    const discountRate = computed(() => {
      if (billingMonths.value >= 12) return 10;
      if (billingMonths.value >= 6) return 5;
      return 0;
    });

    const discountAmount = computed(() => {
      const totalBeforeDiscount = monthlyTotal.value * billingMonths.value;
      return Math.floor(totalBeforeDiscount * (discountRate.value / 100));
    });

    const subscriptionTotal = computed(() => {
      const totalBeforeDiscount = monthlyTotal.value * billingMonths.value;
      return totalBeforeDiscount - discountAmount.value;
    });

    const finalTotal = computed(() => {
      return subscriptionTotal.value + oneTimeTotal.value;
    });

    const hasPurchase = computed(() => {
      return (
        selectedPlan.value !== '' ||
        additionalMarkets.value > 0 ||
        allInOnePackage.value > 0 ||
        imageTranslation.value > 0 ||
        deepFiltering.value > 0
      );
    });

    const hasSelectedImageTypes = computed(() => {
      return Object.values(imageTypes.value).some(type => type);
    });

    const totalImages = computed(() => {
      if (productCount.value === 0 || !hasSelectedImageTypes.value) return 0;
      let total = 0;
      if (imageTypes.value.main) total += productCount.value * 5;
      if (imageTypes.value.option) total += productCount.value * 5;
      if (imageTypes.value.detail) total += productCount.value * 17;
      if (imageTypes.value.cutout) total += productCount.value * 1;
      return total;
    });

    const suggestedImageTranslation = computed(() => {
      if (totalImages.value === 0) return 0;
      return Math.ceil(totalImages.value / 10000);
    });

    const applySuggestedAmount = () => {
      if (suggestedImageTranslation.value > 0) {
        imageTranslation.value = suggestedImageTranslation.value;
      }
    };

    const calculateImages = () => {
      // 이미지 계산은 computed에서 자동으로 처리됨
    };

    const formatPrice = (price) => {
      return price.toLocaleString('ko-KR');
    };

    return {
      selectedPlan,
      additionalMarkets,
      additionalMarketsInput,
      allInOnePackageInput,
      allInOnePackage,
      imageTranslationInput,
      deepFilteringInput,
      productCountInput,
      imageTranslation,
      deepFiltering,
      productCount,
      billingMonths,
      imageTypes,
      selectPlan,
      toggleImageType,
      planPrice,
      additionalMarketsCost,
      monthlyTotal,
      oneTimeTotal,
      discountRate,
      discountAmount,
      subscriptionTotal,
      finalTotal,
      hasPurchase,
      hasSelectedImageTypes,
      totalImages,
      suggestedImageTranslation,
      applySuggestedAmount,
      calculateImages,
      formatPrice
    };
  }
};
</script>

<style scoped>
.el-button+.el-button {
    margin-left: 4px;
}
.payment-page {
  padding: var(--spacing-md);
}

.container {
  max-width: 1600px;
  margin: 0 auto;
}

.content-layout {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.pricing-section {
  flex: 1;
}

.summary-sidebar {
  width: 350px;
  position: sticky;
  top: 10px;
  height: fit-content;
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.page-title {
  font-size: var(--el-font-size-extra-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  margin-bottom: var(--spacing-sm);
}

.page-subtitle {
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-secondary);
}

/* 3열 그리드 레이아웃 */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--spacing-md);
  align-items: start;
}

.pricing-column {
  display: flex;
  flex-direction: column;
}

.options-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.pricing-card.vertical {
  background: var(--el-bg-color);
  border: 2px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-lg);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  min-height: 650px;
  display: flex;
  flex-direction: column;
}

.pricing-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow-base);
}

.pricing-card.selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary);
}

.addon-card.selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary);
}

.plan-badge {
  position: absolute;
  top: -10px;
  right: var(--spacing-lg);
  background: var(--el-color-warning);
  color: white;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--el-border-radius-base);
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-medium);
}

.plan-header {
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.plan-name {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  margin-bottom: var(--spacing-md);
}

.plan-price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--spacing-sm);
}

.price-amount {
  font-size: 2rem;
  font-weight: var(--el-font-weight-bold);
  color: var(--el-color-primary);
}

.price-currency,
.price-period {
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-secondary);
}

.plan-features {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  flex: 1;
}

.feature-item {
  display: flex;
  align-items: center;
  padding: 2px 0;
}

.addon-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-sm) var(--spacing-md);
}

.addon-card.premium {

  background: var(--el-bg-color);
  position: relative;
}

.addon-card.premium::before {
  content: '추천';
  position: absolute;
  top: -8px;
  right: var(--spacing-md);
  background: var(--el-color-primary);
  color: white;
  padding: 2px 8px;
  border-radius: var(--el-border-radius-small);
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-medium);
}

.addon-header {
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
  gap: var(--spacing-md);
}

.addon-info {
  flex: 1;
}

.addon-name {
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-medium);
}

.addon-description {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
}

.addon-price {
  color: var(--el-color-primary);
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-medium);
  margin-top: 2px;
}

.addon-control {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.unit {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
}

.price-display {
  color: var(--el-color-primary);
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-medium);
  margin-left: var(--spacing-sm);
}

.image-calculator {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: var(--spacing-sm);
}

.calculator-title {
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-primary);
  margin-bottom: var(--spacing-sm);
}

.product-count {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
  font-weight: var(--el-font-weight-normal);
}

.calculator-input {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  flex-wrap: wrap;
}

.calculator-input label {
  color: var(--el-text-color-primary);
  font-weight: var(--el-font-weight-medium);
}

.image-options {
  margin: var(--spacing-sm) 0 0 0;
}

.image-type-buttons {
  display: flex;
}

.image-type-buttons .el-button {
  flex: 1;
  min-width: 70px;
}

.auto-fill-suggestion {
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--el-border-color-lighter);
  text-align: center;
}

.calculator-result {
  background: var(--el-bg-color-page);
  padding: var(--spacing-sm);
  border-radius: var(--el-border-radius-base);
  margin-bottom: var(--spacing-sm);
}

.image-breakdown {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.breakdown-item,
.breakdown-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.breakdown-total {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: var(--spacing-sm);
  margin-top: var(--spacing-sm);
  font-weight: var(--el-font-weight-medium);
}

.total-count {
  color: var(--el-color-primary);
  font-weight: var(--el-font-weight-bold);
}

.savings-info {
  margin-top: var(--spacing-md);
}

.payment-summary {
  margin-top: 0;
}

.summary-title {
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  margin-bottom: var(--spacing-sm);
}

.summary-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-md);
}

.billing-period {
  margin-bottom: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.billing-title {
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.discount-info {
  margin-top: 4px;
}

.summary-section {
  margin-bottom: var(--spacing-md);
}

.summary-subtitle {
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-primary);
  margin-bottom: var(--spacing-xs);
}

.summary-item,
.summary-subtotal,
.total-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.summary-subtotal {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: var(--spacing-xs);
  margin-top: var(--spacing-sm);
  font-weight: var(--el-font-weight-medium);
}

.summary-total {
  border-top: 2px solid var(--el-border-color);
  padding-top: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.total-item {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
  margin-bottom: 0;
}

.amount,
.total-amount {
  color: var(--el-color-primary);
  font-weight: var(--el-font-weight-medium);
}

.original-amount {
  color: var(--el-text-color-secondary);
  text-decoration: line-through;
}

.discount-amount {
  color: var(--el-color-success);
  font-weight: var(--el-font-weight-medium);
}

.total-amount {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
}

.payment-actions {
  text-align: center;
}

.payment-button {
  width: 100%;
  height: 50px;
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-medium);
}

.no-plan-selected {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-lg);
  text-align: center;
}

.no-plan-selected p {
  color: var(--el-text-color-secondary);
  margin: 0;
}

/* 반응형 디자인 */
@media (max-width: 1200px) {
  .content-layout {
    flex-direction: column;
    gap: 24px;
  }
  
  .summary-sidebar {
    position: static;
    width: 100%;
    order: -1;
  }
  
  .main-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .pricing-column {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
  }
  
  .pricing-card.vertical {
    min-height: auto;
  }
}

@media (max-width: 768px) {
  .payment-page {
    padding: var(--spacing-sm);
  }
  
  .pricing-column {
    grid-template-columns: 1fr;
  }
  
  .addon-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
  
  .addon-control {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .price-display {
    margin-left: 0;
    margin-top: 4px;
  }
  
  .calculator-input {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .image-type-buttons {
    flex-direction: column;
  }
  
  .image-type-buttons .el-button {
    width: 100%;
    min-width: auto;
  }
  
  .summary-card {
    padding: var(--spacing-sm);
  }
  
  .pricing-card.vertical {
    padding: var(--spacing-md);
  }
}
</style>