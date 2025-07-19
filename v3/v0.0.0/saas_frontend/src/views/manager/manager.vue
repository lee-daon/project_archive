<template>
  <div class="manager-main">
    <!-- 기본 홈 화면 (자식 라우트가 없을 때) -->
    <div v-if="$route.name === 'ManagerMain'" class="home">
      <div class="welcome-card">
        <h1>등록상품관리</h1>
        <p>등록된 상품을 효율적으로 관리하고 분석할 수 있습니다.</p>
        <div class="quick-links">
          <router-link to="/manager/register-check" class="quick-link">
            <el-icon class="quick-link-icon"><Document /></el-icon>
            <div class="quick-link-text">
              <h3>등록현황</h3>
              <p>상품 등록 진행 상태를 모니터링하세요</p>
            </div>
          </router-link>
          
          <router-link to="/manager/analytics" class="quick-link">
            <el-icon class="quick-link-icon"><TrendCharts /></el-icon>
            <div class="quick-link-text">
              <h3>애널리틱스</h3>
              <p>등록 상품 현황과 통계를 확인하세요</p>
            </div>
          </router-link>
          
          <router-link to="/manager/product-search" class="quick-link">
            <el-icon class="quick-link-icon"><Search /></el-icon>
            <div class="quick-link-text">
              <h3>주문 상품 검색</h3>
              <p>등록된 상품을 빠르게 찾고 관리하세요</p>
            </div>
          </router-link>
        </div>
      </div>
    </div>
    
    <!-- 자식 라우트 표시 -->
    <router-view v-else />
  </div>
</template>

<script>
import { TrendCharts, Document, Search } from '@element-plus/icons-vue';

export default {
  name: 'ManagerMain',
  components: {
    TrendCharts,
    Document,
    Search
  },
  setup() {
    return {
      TrendCharts,
      Document,
      Search
    };
  }
}
</script>

<style scoped>
.manager-main {
  width: 100%;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
}

.home {
  padding: var(--spacing-lg);
}

.welcome-card {
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-xl);
  box-shadow: var(--el-box-shadow-light);
}

.welcome-card h1 {
  margin-top: 0;
  color: var(--el-text-color-primary);
}

.welcome-card p {
  color: var(--el-text-color-regular);
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-xl);
}

.quick-link {
  display: flex;
  align-items: center;
  padding: var(--spacing-lg);
  background-color: var(--el-fill-color-light);
  border-radius: var(--el-border-radius-base);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, box-shadow 0.2s;
}

.quick-link:hover {
  transform: translateY(-3px);
  box-shadow: var(--el-box-shadow-base);
}

.quick-link-icon {
  font-size: 2rem;
  margin-right: var(--spacing-lg);
  color: var(--el-color-primary);
}

.quick-link-text h3 {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--el-text-color-primary);
}

.quick-link-text p {
  margin: 0;
  color: var(--el-text-color-regular);
  font-size: var(--el-font-size-base);
}

/* 반응형 */
@media (max-width: 768px) {
  .home {
    padding: var(--spacing-md);
  }
  
  .welcome-card {
    padding: var(--spacing-lg);
  }
  
  .quick-links {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .quick-link {
    padding: var(--spacing-md);
  }
  
  .quick-link-icon {
    font-size: 2rem;
    margin-right: var(--spacing-md);
  }
}
</style>
