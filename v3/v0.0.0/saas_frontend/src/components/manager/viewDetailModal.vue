<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="handleClose"
    title="상품 상세 분석"
    width="80%"
    @close="handleClose"
    :before-close="handleClose"
  >
    <div v-if="productData" class="detail-modal-content">
      <!-- 상품 기본 정보 -->
      <div class="detail-product-info">
        <div class="detail-image">
          <img 
            :src="productData.imageUrl?.startsWith('//') ? 'https:' + productData.imageUrl : productData.imageUrl" 
            :alt="productData.productName"
          />
        </div>
        <div class="detail-info">
          <h3 class="detail-title">{{ productData.productName }}</h3>
          <div class="detail-meta">
            <div class="meta-row">
              <span class="meta-label">상품 ID:</span>
              <span class="meta-value">{{ productData.productId }}</span>
            </div>
            <div v-if="productData.groupCode" class="meta-row">
              <span class="meta-label">그룹 코드:</span>
              <span class="meta-value">{{ productData.groupCode }}</span>
            </div>
          </div>
          
          <!-- 플랫폼별 정보 -->
          <div class="platform-details">
            <div v-if="productData.platforms.elevenstore" class="platform-detail">
              <el-tag type="warning">11번가</el-tag>
              <span>{{ productData.platforms.elevenstore.productNumber }}</span>
              <span class="margin">마진: {{ productData.platforms.elevenstore.currentMargin }}%</span>
            </div>
            <div v-if="productData.platforms.coopang" class="platform-detail">
              <el-tag type="primary">쿠팡</el-tag>
              <span>{{ productData.platforms.coopang.productNumber }}</span>
              <span class="margin">마진: {{ productData.platforms.coopang.currentMargin }}%</span>
            </div>
            <div v-if="productData.platforms.naver" class="platform-detail">
              <el-tag type="success">네이버</el-tag>
              <span>{{ productData.platforms.naver.productNumber }}</span>
              <span class="margin">마진: {{ productData.platforms.naver.currentMargin }}%</span>
            </div>
            <div v-if="productData.platforms.esm" class="platform-detail">
              <el-tag type="warning">ESM</el-tag>
              <span>{{ productData.platforms.esm.productNumber }}</span>
              <span class="margin">마진: {{ productData.platforms.esm.currentMargin }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 기간 선택 -->
      <div class="chart-controls">
        <div class="control-item">
          <label class="control-label">분석 기간:</label>
          <el-select v-model="chartDays" @change="loadDetailData">
            <el-option label="1일" :value="1" />
            <el-option label="3일" :value="3" />
            <el-option label="7일" :value="7" />
            <el-option label="15일" :value="15" />
            <el-option label="30일" :value="30" />
            <el-option label="45일" :value="45" />
            <el-option label="60일" :value="60" />
            <el-option label="90일" :value="90" />
          </el-select>
        </div>
      </div>

      <!-- 일별 조회수 차트 영역 -->
      <div class="chart-container" v-loading="chartLoading">
        <div class="chart-header-section">
          <h4 class="chart-title">일별 조회수 추이</h4>
          <div class="total-views-summary" v-if="processedChartData.length > 0">
            <span class="total-label">총 조회수:</span>
            <span class="total-number">{{ getTotalViews() }}</span>
          </div>
        </div>
        
        <!-- 막대 그래프 형태로 표시 -->
        <div v-if="chartData.length > 0" class="chart-graph">
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-color elevenst"></span>
              <span class="legend-text">11번가</span>
            </div>
            <div class="legend-item">
              <span class="legend-color coopang"></span>
              <span class="legend-text">쿠팡</span>
            </div>
            <div class="legend-item">
              <span class="legend-color naver"></span>
              <span class="legend-text">네이버</span>
            </div>
            <div class="legend-item">
              <span class="legend-color others"></span>
              <span class="legend-text">ESM</span>
            </div>
          </div>
          
          <div class="chart-bars">
            <div 
              v-for="item in processedChartData" 
              :key="item.date"
              class="chart-bar-group"
            >
              <div class="chart-bars-container">
                <div 
                  class="chart-bar-stack"
                  :style="{ height: getBarHeight(item.totalViews) + '%' }"
                  @mouseenter="showTooltip(item, $event)"
                  @mouseleave="hideTooltip"
                  @mousemove="updateTooltipPosition($event)"
                >
                  <!-- 누적 막대 (아래부터 위로: 11번가 → 쿠팡 → 네이버 → 기타) -->
                  <div 
                    class="stack-segment elevenst"
                    :style="{ height: getStackHeight(item.eleViews, item.totalViews) + '%' }"
                  ></div>
                  <div 
                    class="stack-segment coopang"
                    :style="{ height: getStackHeight(item.couViews, item.totalViews) + '%' }"
                  ></div>
                  <div 
                    class="stack-segment naver"
                    :style="{ height: getStackHeight(item.navViews, item.totalViews) + '%' }"
                  ></div>
                  <div 
                    class="stack-segment others"
                    :style="{ height: getStackHeight(item.othersViews, item.totalViews) + '%' }"
                  ></div>
                </div>
              </div>
              <div class="chart-date-label">{{ formatDate(item) }}</div>
            </div>
          </div>
        </div>
        
        <div v-else class="no-chart-data">
          <el-empty description="조회 데이터가 없습니다" />
        </div>
        
        <!-- 커스텀 툴팁 -->
        <div 
          v-if="tooltipVisible && tooltipData" 
          class="custom-tooltip"
          :style="{ 
            left: tooltipPosition.x + 'px', 
            top: tooltipPosition.y + 'px' 
          }"
        >
          <div class="tooltip-header">
            <div class="tooltip-date">{{ formatDate(tooltipData) }}</div>
            <div class="tooltip-total">총 {{ tooltipData.totalViews }}회</div>
          </div>
          <div class="tooltip-body">
            <div class="tooltip-item">
              <div class="tooltip-color others"></div>
              <span class="tooltip-label">ESM</span>
              <span class="tooltip-value">{{ tooltipData.othersViews }}</span>
            </div>
            <div class="tooltip-item">
              <div class="tooltip-color naver"></div>
              <span class="tooltip-label">네이버</span>
              <span class="tooltip-value">{{ tooltipData.navViews }}</span>
            </div>
            <div class="tooltip-item">
              <div class="tooltip-color coopang"></div>
              <span class="tooltip-label">쿠팡</span>
              <span class="tooltip-value">{{ tooltipData.couViews }}</span>
            </div>
            <div class="tooltip-item">
              <div class="tooltip-color elevenst"></div>
              <span class="tooltip-label">11번가</span>
              <span class="tooltip-value">{{ tooltipData.eleViews }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { getTrackingDetails } from '@/services/manager';

export default {
  name: 'ViewDetail',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    productData: {
      type: Object,
      default: null
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const chartLoading = ref(false);
    const chartDays = ref(14);
    const chartData = ref([]);
    const processedChartData = ref([]);
    
    // 툴팁 상태 관리
    const tooltipVisible = ref(false);
    const tooltipData = ref(null);
    const tooltipPosition = ref({ x: 0, y: 0 });

    // 모달이 열릴 때 데이터 로드
    watch(() => props.visible, (newVal) => {
      if (newVal && props.productData) {
        chartDays.value = 14;
        loadDetailData();
      } else {
        // 모달이 닫힐 때 데이터 초기화
        chartData.value = [];
        processedChartData.value = [];
      }
    });

    // 기간 변경 시 데이터 재처리
    watch(() => chartDays.value, () => {
      if (props.visible && props.productData) {
        loadDetailData();
      }
    });

    const loadDetailData = async () => {
      if (!props.productData) return;
      
      chartLoading.value = true;
      try {
        const response = await getTrackingDetails({
          productId: props.productData.productId,
          days: chartDays.value
        });
        
        if (response.success && response.data.dailyStats) {
          chartData.value = response.data.dailyStats;
        } else {
          chartData.value = [];
        }
        
        // 현재 시점 기준 과거 n일 모든 날짜로 데이터 가공
        processChartData();
        
      } catch (error) {
        console.error('상세 데이터 로드 실패:', error);
        ElMessage.error('상세 데이터 로드 중 오류가 발생했습니다.');
        chartData.value = [];
        processedChartData.value = [];
      } finally {
        chartLoading.value = false;
      }
    };

    // 기간에 따른 간격 계산
    const getInterval = (days) => {
      if (days <= 15) return 1;        // 15일 이하: 일별
      if (days <= 30) return 2;        // 30일: 2일 간격
      if (days <= 60) return 4;        // 60일: 4일 누적
      return 6;                        // 90일: 6일 누적
    };

    // 현재 시점 기준 데이터 처리 (간격 적용)
    const processChartData = () => {
      const today = new Date();
      const totalDays = chartDays.value;
      const interval = getInterval(totalDays);
      const allDates = [];
      
      // 간격에 따라 데이터 포인트 생성 (최대 15개)
      const maxPoints = 15;
      const actualPoints = Math.min(maxPoints, Math.ceil(totalDays / interval));
      
      for (let i = actualPoints - 1; i >= 0; i--) {
        const endDate = new Date(today);
        endDate.setDate(today.getDate() - (i * interval));
        
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - interval + 1);
        
        // 해당 구간의 모든 데이터 합계 계산
        let totalViews = 0, couViews = 0, navViews = 0, eleViews = 0, esmViews = 0;
        
        for (let d = 0; d < interval; d++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + d);
          const dateString = currentDate.toISOString().split('T')[0];
          
          const apiData = chartData.value.find(item => item.date === dateString);
          if (apiData) {
            totalViews += apiData.totalViews || 0;
            couViews += apiData.couViews || 0;
            navViews += apiData.navViews || 0;
            eleViews += apiData.eleViews || 0;
            esmViews += apiData.esmViews || 0;
          }
        }
        
        allDates.push({
          date: endDate.toISOString().split('T')[0],
          startDate: startDate.toISOString().split('T')[0],
          interval: interval,
          totalViews,
          couViews,
          navViews,
          eleViews,
          esmViews,
          othersViews: esmViews // ESM만
        });
      }
      
      processedChartData.value = allDates;
    };

    const handleClose = () => {
      emit('close');
    };

    const formatDate = (item) => {
      if (typeof item === 'string') {
        // 호환성을 위한 기존 방식
        const date = new Date(item);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }
      
      // 새로운 방식: 간격에 따른 포맷
      const endDate = new Date(item.date);
      if (item.interval === 1) {
        // 일별: 단순 날짜
        return `${endDate.getMonth() + 1}/${endDate.getDate()}`;
      } else {
        // 누적: 기간 표시
        const startDate = new Date(item.startDate);
        return `${startDate.getMonth() + 1}/${startDate.getDate()}-${endDate.getMonth() + 1}/${endDate.getDate()}`;
      }
    };

    // 막대 그래프 높이 계산 (최대값 기준 상대 높이)
    const getBarHeight = (value) => {
      if (!processedChartData.value.length) return 0;
      
      const maxValue = Math.max(
        ...processedChartData.value.map(item => item.totalViews || 0)
      );
      
      if (maxValue === 0) return 0;
      
      // 최소 높이 5%, 최대 높이 100%
      const percentage = (value / maxValue) * 100;
      return Math.max(percentage, value > 0 ? 5 : 0);
    };

    // 누적 막대에서 각 세그먼트의 비율 계산
    const getStackHeight = (segmentValue, totalValue) => {
      if (totalValue === 0) return 0;
      return (segmentValue / totalValue) * 100;
    };

    // 전체 기간 총 조회수 계산
    const getTotalViews = () => {
      if (!processedChartData.value.length) return 0;
      return processedChartData.value.reduce((sum, item) => sum + (item.totalViews || 0), 0);
    };

    // 툴팁 이벤트 핸들러
    const showTooltip = (item, event) => {
      tooltipData.value = item;
      tooltipPosition.value = {
        x: event.clientX + 10,
        y: event.clientY - 10
      };
      tooltipVisible.value = true;
    };

    const hideTooltip = () => {
      tooltipVisible.value = false;
      tooltipData.value = null;
    };

    const updateTooltipPosition = (event) => {
      if (tooltipVisible.value) {
        tooltipPosition.value = {
          x: event.clientX + 10,
          y: event.clientY - 10
        };
      }
    };

    return {
      chartLoading,
      chartDays,
      chartData,
      processedChartData,
      loadDetailData,
      handleClose,
      formatDate,
      getBarHeight,
      getStackHeight,
      getTotalViews,
      tooltipVisible,
      tooltipData,
      tooltipPosition,
      showTooltip,
      hideTooltip,
      updateTooltipPosition
    };
  }
}
</script>

<style scoped>
/* 모달 스타일 */
.detail-modal-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.detail-product-info {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--el-bg-color-page);
  border-radius: var(--el-border-radius-base);
}

.detail-image img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color-lighter);
}

.detail-info {
  flex: 1;
}

.detail-title {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.detail-meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.meta-row {
  display: flex;
  gap: var(--spacing-sm);
}

.meta-label {
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-secondary);
  min-width: 80px;
}

.meta-value {
  color: var(--el-text-color-primary);
  font-family: monospace;
}

.platform-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.platform-detail {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.margin {
  color: var(--el-color-primary-dark-2);
  font-weight: var(--el-font-weight-medium);
}

/* 차트 컨트롤 */
.chart-controls {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: var(--spacing-sm);
  background-color: var(--el-bg-color-page);
  border-radius: var(--el-border-radius-base);
}

.control-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.control-label {
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-secondary);
}

/* 차트 테이블 */
.chart-container {
  min-height: 250px;
}

.chart-header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.chart-title {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  margin: 0;
}

.total-views-summary {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-bg-color-page));
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: var(--el-border-radius-base);
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.1);
}

.total-label {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
  font-weight: var(--el-font-weight-medium);
}

.total-number {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-color-primary-dark-2);
}

/* 그래프 스타일 */
.chart-graph {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: var(--el-border-radius-small);
}

.legend-color.elevenst {
  background-color: var(--el-color-warning);
}

.legend-color.coopang {
  background-color: var(--el-color-primary);
}

.legend-color.naver {
  background-color: var(--el-color-success);
}

.legend-color.others {
  background-color: var(--el-color-primary-light-7);
}

.legend-text {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-regular);
  font-weight: var(--el-font-weight-medium);
}

.chart-bars {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--spacing-sm);
  height: 240px;
  padding: var(--spacing-sm);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  background: linear-gradient(to top, var(--el-bg-color-page) 0%, var(--el-bg-color) 100%);
}

.chart-bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 80px;
}

.chart-bars-container {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 180px;
  margin-bottom: var(--spacing-xs);
}

.chart-bar-stack {
  position: relative;
  width: 20px;
  min-height: 2px;
  border-radius: var(--el-border-radius-small) var(--el-border-radius-small) 0 0;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.2);
}

.chart-bar-stack:hover {
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.35);
}

.stack-segment {
  width: 100%;
  transition: all 0.3s ease;
}

.stack-segment.elevenst {
  background: linear-gradient(to top, #FF8C00, #FFA500);
  border-radius: 0;
}

.stack-segment.coopang {
  background: linear-gradient(to top, var(--el-color-primary), var(--el-color-primary-light-3));
  border-radius: 0;
}

.stack-segment.naver {
  background: linear-gradient(to top, #00C896, #67C23A);
  border-radius: 0;
}

.stack-segment.others {
  background: linear-gradient(to top, var(--el-color-primary-light-7), var(--el-color-primary-light-9));
  border-radius: var(--el-border-radius-small) var(--el-border-radius-small) 0 0;
}

/* 커스텀 툴팁 */
.custom-tooltip {
  position: fixed;
  z-index: 9999;
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--el-border-color-light);
  min-width: 160px;
  max-width: 200px;
  pointer-events: none;
  opacity: 0;
  animation: tooltipFadeIn 0.2s ease-out forwards;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tooltip-header {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-8));
  border-bottom: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base) var(--el-border-radius-base) 0 0;
}

.tooltip-date {
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  margin-bottom: var(--spacing-xs);
}

.tooltip-total {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-color-primary-dark-2);
}

.tooltip-body {
  padding: var(--spacing-xs);
}

.tooltip-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) 0;
}

.tooltip-item:not(:last-child) {
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.tooltip-color {
  width: 12px;
  height: 12px;
  border-radius: var(--el-border-radius-small);
  flex-shrink: 0;
}

.tooltip-color.elevenst {
  background: linear-gradient(135deg, #FF8C00, #FFA500);
}

.tooltip-color.coopang {
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
}

.tooltip-color.naver {
  background: linear-gradient(135deg, #00C896, #67C23A);
}

.tooltip-color.others {
  background: linear-gradient(135deg, var(--el-color-primary-light-7), var(--el-color-primary-light-9));
}

.tooltip-label {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-regular);
  flex: 1;
}

.tooltip-value {
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  font-family: monospace;
}

.chart-date-label {
  font-size: var(--el-font-size-extra-small);
  color: var(--el-text-color-secondary);
  text-align: center;
  font-weight: var(--el-font-weight-medium);
  transform: rotate(-45deg);
  white-space: nowrap;
  margin-top: var(--spacing-xs);
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-chart-data {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .detail-product-info {
    flex-direction: column;
  }
  
  .chart-header-section {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .chart-legend {
    gap: var(--spacing-md);
  }
  
  .chart-bars {
    height: 200px;
    padding: var(--spacing-xs);
  }
  
  .chart-bars-container {
    height: 150px;
  }
  
  .chart-bar-stack {
    width: 16px;
  }
  
  .chart-date-label {
    font-size: var(--el-font-size-extra-small);
  }
  
  .custom-tooltip {
    min-width: 160px;
    max-width: 200px;
  }
  
  .tooltip-header {
    padding: var(--spacing-xs) var(--spacing-sm);
  }
  
  .tooltip-date {
    font-size: var(--el-font-size-extra-small);
  }
  
  .tooltip-total {
    font-size: var(--el-font-size-medium);
  }
}

@media (max-width: 480px) {
  .total-views-summary {
    padding: var(--spacing-xs) var(--spacing-sm);
  }
  
  .total-label {
    font-size: var(--el-font-size-extra-small);
  }
  
  .total-number {
    font-size: var(--el-font-size-medium);
  }
  
  .chart-legend {
    gap: var(--spacing-sm);
    justify-content: center;
  }
  
  .legend-item {
    gap: var(--spacing-xs);
  }
  
  .legend-color {
    width: 12px;
    height: 12px;
  }
  
  .legend-text {
    font-size: var(--el-font-size-extra-small);
  }
  
  .chart-bars {
    height: 160px;
    gap: 1px;
    padding: var(--spacing-xs);
  }
  
  .chart-bars-container {
    height: 120px;
    gap: 1px;
  }
  
  .chart-bar-stack {
    width: 14px;
  }
  
  .chart-bar-group {
    max-width: 60px;
  }
  
  .custom-tooltip {
    min-width: 140px;
    max-width: 180px;
  }
  
  .tooltip-color {
    width: 10px;
    height: 10px;
  }
  
  .tooltip-label,
  .tooltip-value {
    font-size: var(--el-font-size-extra-small);
  }
}
</style>
