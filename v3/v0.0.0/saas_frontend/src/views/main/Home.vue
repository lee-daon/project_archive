<template>
  <div class="home-dashboard">
    <div class="dashboard-content">
      <el-row :gutter="24" class="dashboard-row">
        
        <!-- 메인 컨텐츠 영역 (8 columns) -->
        <el-col :span="16" class="main-content">
          
          <!-- KPI Ribbon (8 col) -->
          <div class="kpi-ribbon">
            <div v-if="stats" class="kpi-rows-container">
              <div class="kpi-row">
                <div class="kpi-item">
                  <div class="kpi-number">{{ animatedStats.totalSourcedProducts.toLocaleString() }}</div>
                  <div class="kpi-label">누적 소싱 상품수</div>
                </div>
                <div class="kpi-item">
                  <div class="kpi-number">{{ animatedStats.totalCollectedProducts.toLocaleString() }}</div>
                  <div class="kpi-label">누적 수집 상품수</div>
                </div>
                <div class="kpi-item">
                  <div class="kpi-number">{{ animatedStats.totalProcessedProducts.toLocaleString() }}</div>
                  <div class="kpi-label">누적 가공 상품수</div>
                </div>
                <div class="kpi-item">
                  <div class="kpi-number">{{ animatedStats.totalRegisteredProducts.toLocaleString() }}</div>
                  <div class="kpi-label">누적 등록 상품수</div>
                </div>
              </div>
              <div class="kpi-row">
                <div class="kpi-item">
                  <div class="kpi-number">{{ animatedStats.duplicateFilteredProducts.toLocaleString() }}</div>
                  <div class="kpi-label">중복 제외 상품수</div>
                </div>
                <div class="kpi-item">
                  <div class="kpi-number">{{ animatedStats.totalFilteredProducts.toLocaleString() }}</div>
                  <div class="kpi-label">누적 필터링 상품수</div>
                </div>
                <div class="kpi-item">
                  <div class="kpi-number">{{ animatedStats.totalTranslatedImages.toLocaleString() }}</div>
                  <div class="kpi-label">누적 이미지 번역수</div>
                </div>
                <div class="kpi-item"></div>
              </div>
            </div>
            <div v-else-if="loading">
              로딩 중...
            </div>
             <div v-else-if="error">
              {{ error }}
            </div>
          </div>

          <!-- Notice Board & Notepad -->
          <div class="dual-section-container">
            <div class="notice-board">
              <div class="section-header">
                <h3>공지사항</h3>
                <a href="https://catnip-ruby-a63.notion.site/21561ebafb1d80f49c97f5ee356f46be" target="_blank" rel="noopener noreferrer" class="more-link">
                  더보기
                  <el-icon><ArrowRightBold /></el-icon>
                </a>
              </div>
              <div class="notice-content">
                <div v-for="notice in notices" :key="notice.id" class="notice-item" @click="handleShowNoticeDetail(notice.id)">
                  <el-tag :type="notice.tagType" size="small" class="notice-tag">{{ notice.type }}</el-tag>
                  <span class="notice-text">{{ notice.title }}</span>
                  <span class="notice-date">{{ notice.date }}</span>
                </div>
              </div>
            </div>

            <!-- 메모장 -->
            <div class="notepad-section">
              <div class="section-header">
                <h3>메모장</h3>
                <div class="memo-actions" @click="handleNewMemo">
                  <span class="add-memo-text">추가</span>
                  <el-icon class="add-memo-icon"><Plus /></el-icon>
                </div>
              </div>
              <div class="memo-list-content">
                <div
                  v-for="memo in memos"
                  :key="memo.id"
                  class="memo-list-item"
                  @click="handleEditMemo(memo)"
                >
                  <div class="memo-item-main">
                    <div class="memo-title">{{ memo.title }}</div>
                    <div class="memo-date">{{ formatDate(memo.updated_at) }}</div>
                  </div>
                  <el-button
                    type="danger"
                    size="small"
                    class="memo-delete-button"
                    @click.stop="handleDeleteMemo(memo.id)"
                    text
                    circle
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 바로가기 블록 -->
          <div class="shortcut-block">
            <div class="section-header">
              <h3>바로가기</h3>
            </div>
            <div class="shortcut-grid">
              <router-link v-for="shortcut in shortcuts" :key="shortcut.name" :to="shortcut.path" class="shortcut-button">
                <el-icon class="shortcut-icon" :size="28"><component :is="shortcut.icon" /></el-icon>
                <span class="shortcut-label">{{ shortcut.name }}</span>
              </router-link>
            </div>
          </div>

        </el-col>

        <!-- 우측 패널 (4 columns) -->
        <el-col :span="8" class="right-panel">
          
          <!-- 사용자 정보 카드 -->
          <div class="user-info-card">
            <div class="card-title">사용자 정보</div>
            <div v-if="userInfo" class="user-content">
              <div class="user-details">
                <div class="user-greeting">
                  <span class="user-name">{{ displayName }}</span>
                  <span class="welcome-text">님, 환영합니다.</span>
                </div>
                <div class="user-email">{{ userInfo.email }}</div>
              </div>
              <div class="user-right-section">
                <div class="user-plan-badge" :class="planClass">{{ planText }}</div>
                <div v-if="userInfo.expired_at" class="expiry-badge">
                  {{ expiryText }}
                </div>
              </div>
            </div>
            <div v-else>
              사용자 정보를 불러오는 중입니다...
            </div>
          </div>

          <!-- 할당량 요약 -->
          <div class="quota-summary-card">
            <div class="card-title">사용 현황</div>
            <div v-if="quota && userInfo" class="quota-content">
              <div class="quota-progress-container">
                <div class="progress-item">
                  <el-progress
                    type="circle"
                    :percentage="isEnterpriseSourcing ? 100 : sourcingPercentage"
                    :width="110"
                    :stroke-width="8"
                    color="#409eff"
                  >
                    <template #default>
                      <div class="progress-text-value">{{ isEnterpriseSourcing ? '∞' : animatedQuota.dailySourcingRemaining.toLocaleString() }}</div>
                      <div class="progress-text-label">소싱/일</div>
                    </template>
                  </el-progress>
                </div>
                <div class="progress-item">
                  <el-progress
                    type="circle"
                    :percentage="imageProcessingPercentage"
                    :width="110"
                    :stroke-width="8"
                    color="#409eff"
                  >
                    <template #default>
                      <div class="progress-text-value">{{ animatedQuota.dailyImageProcessingRemaining.toLocaleString() }}</div>
                      <div class="progress-text-label">이미지 가공/일</div>
                    </template>
                  </el-progress>
                </div>
              </div>
              <div class="other-quota-list">
                <div class="other-quota-item">
                  <span class="quota-label">이미지 가공 (All-in-one)</span>
                  <span class="quota-value">{{ animatedQuota.imageProcessingAllinoneCount.toLocaleString() }} <span class="quota-unit">상품</span></span>
                </div>
                <div class="other-quota-item">
                  <span class="quota-label">이미지 가공 (낱장)</span>
                  <span class="quota-value">{{ animatedQuota.imageProcessingSingleCount.toLocaleString() }} <span class="quota-unit">장</span></span>
                </div>
                <div class="other-quota-item">
                  <span class="quota-label">딥브랜드 필터링</span>
                  <span class="quota-value">{{ animatedQuota.deepBrandFilterCount.toLocaleString() }} <span class="quota-unit">상품</span></span>
                </div>
              </div>
            </div>
            <div v-else>
              사용량 정보를 불러오는 중입니다...
            </div>
          </div>
          
          <div class="shortcut-card">
            <router-link to="/user/payment" class="shortcut-item">
              <el-icon class="shortcut-item-icon"><CreditCard /></el-icon>
              <span>플랜 및 결제 정보</span>
            </router-link>
            <router-link to="/settings/process-setting" class="shortcut-item">
              <el-icon class="shortcut-item-icon"><Setting /></el-icon>
              <span>딥 필터링 설정</span>
            </router-link>
          </div>

        </el-col>
      </el-row>
    </div>

    <el-dialog
      v-model="showNoticeModal"
      :title="selectedNoticeDetail?.title"
      width="50%"
      top="10vh"
      class="notice-dialog"
    >
      <div v-if="noticeLoading" class="dialog-loading">
        <el-icon class="is-loading" size="26"><Loading /></el-icon>
        <span>공지 내용을 불러오는 중입니다...</span>
      </div>
      <div v-else-if="selectedNoticeDetail" class="notice-detail-content">
        <div class="notice-detail-header">
          <el-tag :type="selectedNoticeDetail.tagType" size="small">{{ selectedNoticeDetail.type }}</el-tag>
          <span class="notice-detail-date">{{ selectedNoticeDetail.date }}</span>
        </div>
        <div class="notice-detail-body" v-html="selectedNoticeDetail.content"></div>
      </div>
    </el-dialog>

    <!-- 메모장 상세/편집 모달 -->
    <el-dialog v-model="showMemoModal" :title="editingMemo && editingMemo.id ? '메모 편집' : '새 메모 작성'" width="40%" top="15vh" class="memo-dialog">
      <div v-if="editingMemo">
        <el-form label-position="top">
          <el-form-item label="제목">
            <el-input v-model="editingMemo.title" placeholder="제목을 입력하세요" />
          </el-form-item>
          <el-form-item label="내용">
            <el-input
              v-model="editingMemo.content"
              type="textarea"
              :rows="10"
              placeholder="내용을 입력하세요..."
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button 
            v-if="editingMemo && editingMemo.id" 
            type="danger" 
            @click="handleDeleteMemoFromModal"
          >
            삭제
          </el-button>
          <div class="dialog-footer-right">
            <el-button @click="showMemoModal = false">취소</el-button>
            <el-button type="primary" @click="handleSaveMemo">저장</el-button>
          </div>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  getUserInfo, 
  getNotices,
  getNoticeDetail,
  getMemos,
  createMemo,
  updateMemo,
  deleteMemo
} from '@/services/home.js';
import {
  Link,
  DocumentChecked,
  Setting,
  View,
  ShoppingCartFull,
  DataLine,
  PieChart,
  Box,
  Plus,
  Delete,
  Loading,
  ArrowRightBold,
  CreditCard
} from '@element-plus/icons-vue';

const PLAN_LIMITS = {
  sourcing: { free: 30, basic: 100, enterprise: Infinity },
  imageProcessing: { free: 10, basic: 50, enterprise: 300 },
};

export default {
  name: 'HomeView',
  components: {
    Link,
    DocumentChecked,
    Setting,
    View,
    ShoppingCartFull,
    DataLine,
    PieChart,
    Box,
    Plus,
    Delete,
    Loading,
    ArrowRightBold,
    CreditCard
  },
  data() {
    return {
      stats: null,
      animatedStats: {
        totalSourcedProducts: 0,
        totalCollectedProducts: 0,
        totalProcessedProducts: 0,
        totalRegisteredProducts: 0,
        duplicateFilteredProducts: 0,
        totalFilteredProducts: 0,
        totalTranslatedImages: 0,
      },
      userInfo: null,
      quota: null,
      animatedQuota: {
        dailySourcingRemaining: 0,
        dailyImageProcessingRemaining: 0,
        imageProcessingAllinoneCount: 0,
        imageProcessingSingleCount: 0,
        deepBrandFilterCount: 0,
      },
      loading: true,
      error: null,
      notices: [],
      showNoticeModal: false,
      selectedNoticeDetail: null,
      noticeLoading: false,
      memos: [],
      editingMemo: null,
      showMemoModal: false,
      shortcuts: [
        { name: 'URL 수집', path: '/product/sourcing/url', icon: 'Link' },
        { name: '수집결과 확인', path: '/product/results', icon: 'DocumentChecked' },
        { name: '가공 설정', path: '/product/processing/settings', icon: 'Setting' },
        { name: '상품 검수', path: '/product/inspection', icon: 'View' },
        { name: '상품 등록', path: '/product/registration', icon: 'ShoppingCartFull' },
        { name: '등록 현황', path: '/manager/register-check', icon: 'DataLine' },
        { name: '애널리틱스', path: '/manager/analytics', icon: 'PieChart' },
        { name: '주문 검색', path: '/manager/product-search', icon: 'Box' }
      ]
    };
  },
  computed: {
    displayName() {
      if (!this.userInfo) return '사용자';
      return this.userInfo.id || this.userInfo.email.split('@')[0];
    },
    planText() {
      if (!this.userInfo) return '';
      switch (this.userInfo.plan) {
        case 'enterprise':
          return '엔터프라이즈 플랜';
        case 'basic':
          return '베이직 플랜';
        case 'free':
          return '프리 플랜';
        default:
          return this.userInfo.plan;
      }
    },
    planClass() {
      if (!this.userInfo) return '';
      return `plan-${this.userInfo.plan}`;
    },
    isEnterpriseSourcing() {
      return this.userInfo?.plan === 'enterprise';
    },
    sourcingLimit() {
      if (!this.userInfo) return 0;
      return PLAN_LIMITS.sourcing[this.userInfo.plan] || 0;
    },
    imageProcessingLimit() {
      if (!this.userInfo) return 0;
      return PLAN_LIMITS.imageProcessing[this.userInfo.plan] || 0;
    },
    sourcingPercentage() {
      if (!this.userInfo || !this.quota || this.sourcingLimit === Infinity || this.sourcingLimit === 0) {
        return 0;
      }
      const percentage = (this.animatedQuota.dailySourcingRemaining / this.sourcingLimit) * 100;
      return Math.max(0, percentage);
    },
    imageProcessingPercentage() {
      if (!this.userInfo || !this.quota || this.imageProcessingLimit === 0) {
        return 0;
      }
      const percentage = (this.animatedQuota.dailyImageProcessingRemaining / this.imageProcessingLimit) * 100;
      return Math.max(0, percentage);
    },
    expiryText() {
      if (!this.userInfo || !this.userInfo.expired_at) return '';
      const expiredDate = new Date(this.userInfo.expired_at);
      const today = new Date();
      
      // 시간을 00:00:00으로 맞춰서 날짜만 비교
      expiredDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      const diffTime = expiredDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return 'D-Day';
      } else if (diffDays < 0) {
        return `D+${Math.abs(diffDays)}`;
      } else {
        return `D-${diffDays}`;
      }
    }
  },
  watch: {
    stats(newStats) {
      if (newStats) {
        this.animateAllStats(newStats);
      }
    },
    quota(newQuota) {
      if (newQuota) {
        this.animateAllQuotas(newQuota);
      }
    }
  },
  methods: {
    async fetchDashboardData() {
      this.loading = true;
      try {
        const [userInfoRes, noticesRes, memosRes] = await Promise.all([
          getUserInfo(),
          getNotices(),
          getMemos()
        ]);

        // 사용자 정보 처리 (직접 응답 데이터 사용)
        if (userInfoRes && userInfoRes.success) {
          this.stats = userInfoRes.data.statistics;
          this.userInfo = userInfoRes.data.userInfo;
          this.quota = userInfoRes.data.quota;
        } else {
          this.error = userInfoRes?.message || '사용자 정보를 불러오는데 실패했습니다.';
        }

        // 공지사항 처리 (httpClient 응답 구조)
        if (noticesRes && noticesRes.data && noticesRes.data.success) {
          this.notices = noticesRes.data.data;
        }

        // 메모 처리 (httpClient 응답 구조)
        if (memosRes && memosRes.data && memosRes.data.success) {
          this.memos = memosRes.data.data;
        }

      } catch (err) {
        this.error = err.response?.data?.message || '데이터를 불러오는 중 오류가 발생했습니다.';
        console.error(err);
      } finally {
        this.loading = false;
      }
    },
    animateValue(targetObject, property, endValue, duration = 1500) {
      let startValue = 0;
      let startTime = null;

      const animationStep = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const currentValue = Math.floor(progress * (endValue - startValue) + startValue);
        targetObject[property] = currentValue;

        if (progress < 1) {
          requestAnimationFrame(animationStep);
        }
      };
      requestAnimationFrame(animationStep);
    },
    animateAllStats(targetStats) {
      for (const key in targetStats) {
        if (Object.hasOwnProperty.call(this.animatedStats, key)) {
          this.animateValue(this.animatedStats, key, targetStats[key]);
        }
      }
    },
    animateAllQuotas(targetQuotas) {
      for (const key in targetQuotas) {
        if (Object.hasOwnProperty.call(this.animatedQuota, key)) {
          this.animateValue(this.animatedQuota, key, targetQuotas[key]);
        }
      }
    },
    // Notice Methods
    async handleShowNoticeDetail(id) {
      this.noticeLoading = true;
      this.showNoticeModal = true;
      try {
        const response = await getNoticeDetail(id);
        if (response.data.success) {
          this.selectedNoticeDetail = response.data.data;
        } else {
          ElMessage.error('공지 내용을 불러오는데 실패했습니다.');
          this.showNoticeModal = false;
        }
      } catch (e) {
        ElMessage.error(e.response?.data?.message || '공지 내용을 불러오는 중 오류가 발생했습니다.');
        this.showNoticeModal = false;
      } finally {
        this.noticeLoading = false;
      }
    },
    // Memo Methods
    handleNewMemo() {
      this.editingMemo = { id: null, title: '새 메모', content: '' };
      this.showMemoModal = true;
    },
    handleEditMemo(memo) {
      this.editingMemo = { ...memo }; // copy to avoid mutating original object
      this.showMemoModal = true;
    },
    async handleSaveMemo() {
      if (!this.editingMemo || !this.editingMemo.title.trim()) {
        ElMessage.warning('메모 제목을 입력해주세요.');
        return;
      }
      
      const memoData = {
        title: this.editingMemo.title,
        content: this.editingMemo.content
      };

      try {
        const response = this.editingMemo.id
          ? await updateMemo(this.editingMemo.id, memoData)
          : await createMemo(memoData);

        if (response.data.success) {
          ElMessage.success('메모가 저장되었습니다.');
          this.showMemoModal = false;
          this.editingMemo = null;
          const memosRes = await getMemos();
          if (memosRes.data.success) this.memos = memosRes.data.data;
        }
      } catch(e) {
        ElMessage.error(e.response?.data?.message || '메모 저장에 실패했습니다.');
      }
    },
    async handleDeleteMemo(id) {
      try {
        await ElMessageBox.confirm('정말로 이 메모를 삭제하시겠습니까?', '메모 삭제 확인', {
          confirmButtonText: '삭제', cancelButtonText: '취소', type: 'warning'
        });

        const response = await deleteMemo(id);
        if (response.data.success) {
          ElMessage.success('메모가 삭제되었습니다.');
          if (this.editingMemo && this.editingMemo.id === id) {
            this.showMemoModal = false;
            this.editingMemo = null;
          }
          const memosRes = await getMemos();
          if (memosRes.data.success) this.memos = memosRes.data.data;
        }
      } catch (error) {
        if (error !== 'cancel') ElMessage.error(error.response?.data?.message || '메모 삭제에 실패했습니다.');
      }
    },
    async handleDeleteMemoFromModal() {
      if (!this.editingMemo || !this.editingMemo.id) return;
      
      try {
        await ElMessageBox.confirm('정말로 이 메모를 삭제하시겠습니까?', '메모 삭제 확인', {
          confirmButtonText: '삭제', cancelButtonText: '취소', type: 'warning'
        });

        const response = await deleteMemo(this.editingMemo.id);
        if (response.data.success) {
          ElMessage.success('메모가 삭제되었습니다.');
          this.showMemoModal = false;
          this.editingMemo = null;
          const memosRes = await getMemos();
          if (memosRes.data.success) this.memos = memosRes.data.data;
        }
      } catch (error) {
        if (error !== 'cancel') ElMessage.error(error.response?.data?.message || '메모 삭제에 실패했습니다.');
      }
    },
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
  },
  created() {
    this.fetchDashboardData();
  },
}
</script>

<style scoped>
.home-dashboard {
  height: 100%;
  overflow-y: auto;
  background-color: var(--el-fill-color-light);
}

.dashboard-content {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-row {
  min-height: calc(100vh - 120px);
}

/* 메인 컨텐츠 영역 */
.main-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* KPI Ribbon */
.kpi-ribbon {
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
  height: auto;
  padding: var(--spacing-lg);
  gap: var(--spacing-md);
}

.kpi-rows-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.kpi-row {
  display: flex;
  justify-content: space-around;
  width: 100%;
}

.kpi-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-right: 1px solid var(--el-border-color);
}

.kpi-item:last-child {
  border-right: none;
}

.kpi-number {
  font-size: 24px;
  font-weight: var(--el-font-weight-bold);
  color: var(--el-color-primary);
  margin-bottom: 4px;
}

.kpi-label {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
}

/* Notice Board & Notepad */
.dual-section-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
  min-height: 220px; /* Adjusted height */
}

.notice-board,
.notepad-section {
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.section-header h3 {
  margin: 0;
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-primary);
}

.more-link {
  display: inline-flex;
  align-items: center;
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
  text-decoration: none;
  transition: color 0.2s;
}
.more-link:hover {
  color: var(--el-color-primary);
}
.more-link .el-icon {
  margin-left: 4px;
}

.notice-content {
  flex: 1;
  overflow-y: auto;
  margin-top: var(--spacing-md);
  max-height: 180px;
  padding-right: var(--spacing-xs);
}

.notice-content::-webkit-scrollbar {
  width: 4px;
}

.notice-content::-webkit-scrollbar-track {
  background: transparent;
}

.notice-content::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: var(--el-border-radius-base);
}

.notice-content::-webkit-scrollbar-thumb:hover {
  background: var(--el-text-color-secondary);
}

.notice-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) 0;
  cursor: pointer;
}
.notice-item:hover .notice-text {
  color: var(--el-color-primary);
}

.notice-tag {
  flex-shrink: 0;
  width: 60px;
  text-align: center;
}

.notice-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s;
}

/* 메모장 */
.notepad-section .section-header {
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.memo-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.memo-actions:hover {
  color: var(--el-color-primary);
}

.memo-actions:hover .add-memo-icon {
  color: var(--el-color-primary);
  transform: scale(1.1);
}

.add-memo-text {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
  font-weight: var(--el-font-weight-medium);
  transition: color 0.2s ease;
}

.add-memo-icon {
  color: var(--el-text-color-secondary);
  font-size: 18px;
  transition: all 0.2s ease;
}

.memo-list-content {
  flex: 1;
  overflow-y: auto;
  margin-top: var(--spacing-md);
  max-height: 180px;
  padding-right: var(--spacing-xs);
}

.memo-list-content::-webkit-scrollbar {
  width: 4px;
}

.memo-list-content::-webkit-scrollbar-track {
  background: transparent;
}

.memo-list-content::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: var(--el-border-radius-base);
}

.memo-list-content::-webkit-scrollbar-thumb:hover {
  background: var(--el-text-color-secondary);
}

.memo-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm);
  border-radius: var(--el-border-radius-small);
  cursor: pointer;
  transition: all 0.2s ease;
}
.memo-list-item:hover {
  background-color: var(--el-fill-color-light);
  transform: translateX(2px);
}


.memo-item-main {
  flex: 1;
  min-width: 0;
}

.memo-title {
  font-weight: var(--el-font-weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-primary);
}
.memo-date {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.memo-delete-button {
  opacity: 0.7;
  transition: all 0.2s ease;
}
.memo-delete-button:hover {
  opacity: 1;
  transform: scale(1.1);
}
.memo-delete-button .el-icon {
  color: var(--el-text-color-placeholder);
}
.memo-delete-button:hover .el-icon {
  color: var(--el-color-danger);
}

/* 바로가기 블록 */
.shortcut-block {
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
  padding: var(--spacing-lg);
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
}

.shortcut-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
  border-radius: var(--el-border-radius-base);
  text-decoration: none;
  color: var(--el-text-color-primary);
  background-color: var(--el-bg-color-page);
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.2s ease;
  height: 100px;
}

.shortcut-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow-base);
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-7);
}

.shortcut-icon {
  margin-bottom: var(--spacing-sm);
  color: var(--el-color-primary);
}

.shortcut-label {
  font-size: var(--el-font-size-base);
  font-weight: 500;
}

/* 우측 패널 */
.right-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* 공통 카드 스타일 */
.user-info-card,
.quota-summary-card {
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
  padding: var(--spacing-lg);
}

.card-title {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-primary);
  margin-bottom: var(--spacing-md);
}

/* 사용자 정보 */
.user-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 1;
  min-width: 0;
}

.user-greeting {
    display: flex;
    align-items: baseline;
    gap: 6px;
}

.user-name {
  font-size: 1.2rem;
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
}

.welcome-text {
    font-size: 1rem;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
}

.user-right-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.user-plan-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: var(--el-font-size-small);
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0; /* Prevents the badge from shrinking */
}

.plan-free {
  background-color: var(--el-color-info-light-9);
  color: var(--el-color-info);
  border: 1px solid var(--el-color-info-light-8);
}

.plan-basic {
  background-color: var(--el-color-success-light-9);
  color: var(--el-color-success);
  border: 1px solid var(--el-color-success-light-8);
}

.plan-enterprise {
  background-color: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
  border: 1px solid var(--el-color-warning-light-8);
}

.expiry-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: var(--el-font-size-small);
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0; /* Prevents the badge from shrinking */
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  border: 1px solid var(--el-border-color-light);
}

.user-email {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 사용 현황 */
.quota-summary-card .card-title {
  margin-bottom: var(--spacing-lg);
}

.quota-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.quota-progress-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.progress-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.el-progress .progress-text-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.el-progress .progress-text-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.other-quota-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  border-top: 1px solid var(--el-border-color-extra-light);
  padding-top: var(--spacing-lg);
}

.other-quota-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--el-font-size-base);
}

.other-quota-item .quota-label {
  color: var(--el-text-color-secondary);
}

.other-quota-item .quota-value {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.other-quota-item .quota-unit {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-placeholder);
  margin-left: 4px;
}

.shortcut-card {
  display: flex;
  gap: var(--spacing-lg);
  background-color: transparent;
  box-shadow: none;
}

.shortcut-item {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-md);
  color: var(--el-text-color-primary);
  text-decoration: none;
  transition: all 0.2s ease;
  font-weight: 500;
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-lighter);
}

.shortcut-item:hover {
  transform: translateY(-2px);
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  box-shadow: var(--el-box-shadow-base);
}

.shortcut-item-icon {
  margin-right: var(--spacing-sm);
  font-size: 1.1rem;
  color: var(--el-text-color-secondary);
}

.shortcut-item:hover .shortcut-item-icon {
    color: var(--el-color-primary);
}

/* 반응형 디자인 */
@media (max-width: 1200px) {
  
  .right-panel {
    flex-direction: row;
    flex-wrap: wrap;
    margin-top: var(--spacing-lg);
  }
  
  .right-panel > div {
    flex: 1;
    min-width: 300px;
  }
}

@media (max-width: 768px) {
  .home-dashboard {
    padding: var(--spacing-md);
  }
  
  .kpi-ribbon {
    flex-direction: column;
    height: auto;
    padding: var(--spacing-md);
  }
  
  .kpi-item {
    border-right: none;
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding: var(--spacing-sm) 0;
  }
  
  .kpi-item:last-child {
    border-bottom: none;
  }
  
  .right-panel {
    flex-direction: column;
  }
}

/* Notice Dialog */
.dialog-loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-lg);
  min-height: 200px;
  color: var(--el-text-color-secondary);
}

.notice-detail-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.notice-detail-date {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
}

.notice-detail-body {
  line-height: 1.8;
  color: var(--el-text-color-regular);
  padding: var(--spacing-sm) 0;
  max-height: 60vh;
  overflow-y: auto;
}

.notice-detail-body :deep(p) {
  margin-bottom: 1em;
}

.notice-detail-body :deep(ul) {
  padding-left: 20px;
  margin-bottom: 1em;
}

.notice-detail-body :deep(strong) {
  font-weight: bold;
  color: var(--el-text-color-primary);
}

/* Memo Dialog */
.memo-dialog .el-form-item {
  margin-bottom: var(--spacing-md);
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.dialog-footer-right {
  display: flex;
  gap: var(--spacing-sm);
}
</style>