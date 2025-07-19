<template>
  <div class="market-settings">
    <div class="page-header">
      <h2 class="page-title">마켓등록</h2>
      <p class="page-description">네이버 스마트스토어와 쿠팡 파트너스 계정을 등록하고 관리하세요.</p>
    </div>

    <div class="content-container">
      <!-- 마켓 선택 탭 -->
      <div class="market-tabs">
        <el-button 
          v-for="market in availableMarkets" 
          :key="market.key"
          @click="selectedMarket = market.key"
          :type="selectedMarket === market.key ? 'primary' : 'default'"
          class="tab-button"
          :class="{ active: selectedMarket === market.key }"
        >
          {{ market.name }}
          <span v-if="market.note" class="market-note">({{ market.note }})</span>
        </el-button>
      </div>

      <div class="content-area">
        <AppLoading v-if="isProcessing" :overlay="true" text="처리 중..." />
        <!-- 상단 액션 버튼 -->
        <div class="action-bar">
          <el-button 
            @click="showAddModal = true" 
            type="primary"
            :icon="Plus"
          >
            {{ getMarketName(selectedMarket) }} 마켓 추가
          </el-button>
        </div>

        <!-- 로딩 상태 -->
        <AppLoading v-if="loading" text="마켓 정보를 불러오는 중..." />

        <!-- 마켓 카드 리스트 -->
        <div v-else-if="currentMarkets.length > 0" class="markets-container">
          <div class="markets-list">
            <template v-if="selectedMarket === 'naver'">
              <MarketCard
                v-for="market in currentMarkets"
                :key="market.shopid"
                :market-data="market"
                :market-type="selectedMarket"
                @update-market="handleUpdateMarket"
                @delete-market="handleDeleteMarket"
              />
            </template>
            <template v-if="selectedMarket === 'coopang'">
              <CoupangMarketCard
                v-for="market in currentMarkets"
                :key="market.shopid"
                :market-data="market"
                @update-market="handleUpdateMarket"
                @delete-market="handleDeleteMarket"
              />
            </template>
            <template v-if="selectedMarket === 'elevenstore'">
              <ElevenStoreMarketCard
                v-for="market in currentMarkets"
                :key="market.shopid"
                :market-data="market"
                @update-market="handleUpdateMarket"
                @delete-market="handleDeleteMarket"
              />
            </template>
            <template v-if="selectedMarket === 'esm'">
              <EsmMarketCard
                v-for="market in currentMarkets"
                :key="market.shopid"
                :market-data="market"
                @update-market="handleUpdateMarket"
                @delete-market="handleDeleteMarket"
              />
            </template>
          </div>
        </div>

        <!-- 빈 상태 -->
        <div v-else class="empty-state">
          <el-icon class="empty-icon"><Shop /></el-icon>
          <h3>등록된 {{ getMarketName(selectedMarket) }} 마켓이 없습니다</h3>
          <p>새로운 마켓을 추가하여 시작하세요.</p>
          <el-button 
            @click="showAddModal = true" 
            type="primary"
            size="large"
            :icon="Plus"
          >
            첫 번째 마켓 추가하기
          </el-button>
        </div>
      </div>
    </div>

    <!-- 마켓 추가 모달 -->
    <AddMarketModal
      :is-visible="showAddModal"
      :market-type="selectedMarket"
      @close="showAddModal = false"
      @add-market="handleAddMarket"
    />

  </div>
</template>

<script>
import { getMarketSettings, createMarketSetting, updateMarketSetting, deleteMarketSetting } from '../../services/settings';
import MarketCard from '../../components/setting/naver.vue';
import AddMarketModal from '../../components/setting/AddMarketModal.vue';
import CoupangMarketCard from '../../components/setting/coopang.vue';
import ElevenStoreMarketCard from '../../components/setting/elevenstore.vue';
import EsmMarketCard from '../../components/setting/esm.vue';
import AppLoading from '../../components/app/loading.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Shop } from '@element-plus/icons-vue';

export default {
  name: 'MarketSettings',
  components: {
    MarketCard,
    AddMarketModal,
    CoupangMarketCard,
    ElevenStoreMarketCard,
    EsmMarketCard,
    AppLoading
  },
  data() {
    return {
      selectedMarket: 'naver',
      availableMarkets: [
        { key: 'naver', name: '네이버 스마트스토어' },
        { key: 'coopang', name: '쿠팡 파트너스' },
        { key: 'elevenstore', name: '11번가' },
        { key: 'esm', name: 'ESM (옥션 + G마켓)', note: '현재 액셀 일괄등록 방식만 지원' }
      ],
      markets: {
        naver: [],
        coopang: [],
        elevenstore: [],
        esm: []
      },
      loading: false,
      showAddModal: false,
      isProcessing: false,

      // Element Plus Icons
      Plus,
      Shop
    }
  },
  computed: {
    currentMarkets() {
      return this.markets[this.selectedMarket] || [];
    }
  },
  watch: {
    selectedMarket: {
      handler(newMarket) {
        this.loadMarketData(newMarket);
      },
      immediate: true
    }
  },
  methods: {
    async loadMarketData(market) {
      this.loading = true;
      try {
        const response = await getMarketSettings(market);
        if (response.success) {
          this.markets[market] = response.data.markets || [];
        }
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '마켓 정보를 불러오는데 실패했습니다.');
        console.error('마켓 데이터 로딩 실패:', error);
      } finally {
        this.loading = false;
      }
    },

    async handleAddMarket(marketData) {
      this.isProcessing = true;
      try {
        const response = await createMarketSetting(this.selectedMarket, marketData);
        if (response.success) {
          ElMessage.success(`${this.getMarketName(this.selectedMarket)} 마켓이 성공적으로 추가되었습니다.`);
          await this.loadMarketData(this.selectedMarket);
        }
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '마켓 추가에 실패했습니다.');
        console.error('마켓 추가 실패:', error);
      } finally {
        this.isProcessing = false;
      }
    },

    async handleUpdateMarket({ shopid, data }) {
      this.isProcessing = true;
      try {
        const response = await updateMarketSetting(shopid, this.selectedMarket, data);
        if (response.success) {
          ElMessage.success('마켓 정보가 성공적으로 업데이트되었습니다.');
          await this.loadMarketData(this.selectedMarket);
        }
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '마켓 정보 업데이트에 실패했습니다.');
        console.error('마켓 업데이트 실패:', error);
      } finally {
        this.isProcessing = false;
      }
    },

    async handleDeleteMarket(shopid) {
      ElMessageBox.confirm(
        '마켓 삭제시 관련 마켓에 등록된 상품의 이미지호스팅 및 트레픽이 지원되지 않습니다. 정말로 삭제하시겠습니까?',
        '마켓 삭제 경고',
        {
          confirmButtonText: '삭제',
          cancelButtonText: '취소',
          type: 'warning',
        }
      ).then(async () => {
        this.isProcessing = true;
        try {
          const response = await deleteMarketSetting(shopid, this.selectedMarket);
          if (response.success) {
            ElMessage.success('마켓이 성공적으로 삭제되었습니다.');
            await this.loadMarketData(this.selectedMarket);
          }
        } catch (error) {
          ElMessage.error(error.response?.data?.message || '마켓 삭제에 실패했습니다.');
          console.error('마켓 삭제 실패:', error);
        } finally {
          this.isProcessing = false;
        }
      }).catch(() => {
        ElMessage.info('마켓 삭제가 취소되었습니다.');
      });
    },

    getMarketName(marketKey) {
      const market = this.availableMarkets.find(m => m.key === marketKey);
      return market ? market.name : marketKey;
    }




  }
}
</script>

<style scoped>
.market-settings {
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

.market-tabs {
  display: flex;
  gap: var(--spacing-xs);
  border-bottom: 1px solid var(--el-border-color-light);
}

.tab-button {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  background: none;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  font-size: var(--el-font-size-base);
  font-weight: var(--el-font-weight-medium);
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}

.tab-button:hover {
  color: var(--el-color-primary);
  background-color: var(--el-fill-color-light);
}

.tab-button.active {
  color: var(--el-color-primary);
  border-bottom-color: var(--el-color-primary);
}

.market-note {
  font-size: var(--el-font-size-extra-small);
  color: var(--el-text-color-secondary);
  font-weight: normal;
  margin-left: var(--spacing-xs);
}

.content-area {
  position: relative;
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-sm) var(--spacing-lg) var(--spacing-sm) var(--spacing-lg);
  box-shadow: var(--el-box-shadow-base);
  border: 1px solid var(--el-border-color-lighter);
  height: calc(100vh - 230px);
  display: flex;
  flex-direction: column;
}

  .action-bar {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: var(--spacing-xs);
    padding-bottom: var(--spacing-xs);
    border-bottom: 1px solid var(--el-border-color-light);
    flex-shrink: 0;
  }



.markets-container {
  flex: 1;
  overflow: hidden;
  margin-top: var(--spacing-lg);
}

.markets-list {
  height: 100%;
  overflow-y: auto;
  padding-right: var(--spacing-sm);
}

.markets-list::-webkit-scrollbar {
  width: 6px;
}

.markets-list::-webkit-scrollbar-track {
  background: var(--el-fill-color-light);
  border-radius: 3px;
}

.markets-list::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}

.markets-list::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-dark);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xxl);
  color: var(--el-text-color-secondary);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: var(--spacing-lg);
  color: var(--el-text-color-secondary);
}

.empty-state h3 {
  margin-bottom: var(--spacing-sm);
  color: var(--el-text-color-primary);
}

.empty-state p {
  margin-bottom: var(--spacing-xl);
  font-size: var(--el-font-size-base);
}



@media (max-width: 768px) {
  .content-container {
    padding: var(--spacing-sm);
  }
  
  .page-header {
    padding: var(--spacing-sm);
  }
  
  .content-area {
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .action-bar {
    justify-content: center;
  }
  
  .empty-state {
    padding: var(--spacing-xl);
  }
}
</style>
