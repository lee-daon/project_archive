<template>
  <div class="settings">
    <div class="page-header">
      <h2 class="page-title">설정</h2>
      <p class="page-description">시스템 설정을 관리하세요.</p>
    </div>

    <div class="content-container">
      <div class="settings-grid">
        <!-- 마켓등록 카드 -->
        <router-link to="/settings/market" class="setting-card">
          <el-icon class="card-icon"><Shop /></el-icon>
          <h3>마켓등록</h3>
          <p>네이버 스마트스토어와 쿠팡 파트너스 계정을 등록하고 관리합니다.</p>
        </router-link>

        <!-- 네이버정책 카드 -->
        <router-link to="/settings/naver-policy" class="setting-card">
          <el-icon class="card-icon"><Platform /></el-icon>
          <h3>네이버정책</h3>
          <p>네이버 스마트스토어 등록을 위한 정책 설정을 관리합니다.</p>
        </router-link>

        <!-- 공통정책설정 카드 -->
        <router-link to="/settings/common-policy" class="setting-card">
          <el-icon class="card-icon"><Setting /></el-icon>
          <h3>공통정책설정</h3>
          <p>상품 등록 시 공통으로 적용될 정책을 설정합니다.</p>
        </router-link>

        <!-- 쿠팡정책 카드 -->
        <router-link to="/settings/coupang-policy" class="setting-card">
          <el-icon class="card-icon"><Goods /></el-icon>
          <h3>쿠팡정책</h3>
          <p>쿠팡 판매를 위한 정책 설정을 관리합니다.</p>
        </router-link>

        <!-- 경고 키워드 설정 카드 -->
        <router-link to="/settings/ban-words" class="setting-card">
          <el-icon class="card-icon"><Warning /></el-icon>
          <h3>경고 키워드 설정</h3>
          <p>상품에 포함하면 안되는 경고 키워드를 관리합니다.</p>
        </router-link>

        <!-- 상세페이지설정 카드 -->
        <router-link to="/settings/detail-page-setting" class="setting-card">
          <el-icon class="card-icon"><Document /></el-icon>
          <h3>상세페이지설정</h3>
          <p>상품 상세페이지에 표시될 이미지와 설정을 관리합니다.</p>
        </router-link>

        <!-- 기타 세팅 카드 -->
        <router-link to="/settings/process-setting" class="setting-card">
          <el-icon class="card-icon"><Tools /></el-icon>
          <h3>기타 세팅</h3>
          <p>프로세스 관련 기타 설정을 관리합니다.</p>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { Shop, Platform, Setting, Goods, Warning, Document, Tools } from '@element-plus/icons-vue';

export default {
  name: 'SettingsView',
  setup() {
    return {
      Shop,
      Platform,
      Setting,
      Goods,
      Warning,
      Document,
      Tools
    };
  }
}
</script>

<style scoped>
.settings {
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
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
}

.setting-card {
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-xl);
  box-shadow: var(--el-box-shadow-base);
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  border: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.setting-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(91, 108, 242, 0.15);
  border-color: var(--el-color-primary);
}

.card-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
  color: var(--el-color-primary);
}

.setting-card h3 {
  color: var(--el-text-color-primary);
  margin-bottom: var(--spacing-sm);
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
}

.setting-card p {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
  line-height: 1.5;
  margin: 0;
}

@media (max-width: 768px) {
  .content-container {
    padding: var(--spacing-sm);
  }
  
  .page-header {
    padding: var(--spacing-sm);
  }
  
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style> 