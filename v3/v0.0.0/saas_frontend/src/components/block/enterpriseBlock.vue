<template>
  <div class="enterprise-block">
    <div class="blocked-container">
      <div class="blocked-icon">
        <el-icon size="64"><Lock /></el-icon>
      </div>
      <h2 class="blocked-title">{{ title }}</h2>
      <p class="blocked-description">
        {{ description }}<br/>
        플랜을 업그레이드하시면 더 많은 고급 기능을 이용하실 수 있습니다.
      </p>
      <div class="blocked-features">
        <h3>Enterprise 플랜 혜택:</h3>
        <ul>
          <li>무제한 소싱</li>
          <li>무제한 상품등록</li>
          <li>상품별 조회수 통계 분석</li>
          <li>일괄 상품 관리 기능</li>
          <li>AI 기반 딥 필터링</li>
          <li>상표권 DB 연동</li>
          <li>OCR 브랜드 추출</li>
          <li>쿠팡 AI 일괄 매핑</li>
          <li>API 연동</li>
          <li>필요기능 맞춤 개발</li>
        </ul>
      </div>
      <el-button 
        type="primary" 
        size="large" 
        class="upgrade-button"
        @click="handleUpgradeClick"
      >
        플랜 업그레이드
      </el-button>
    </div>
  </div>
</template>

<script>
import { Lock } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

export default {
  name: 'EnterpriseBlock',
  props: {
    title: {
      type: String,
      default: 'Enterprise 전용 기능'
    },
    description: {
      type: String,
      default: '이 기능은 Enterprise 플랜에서만 사용할 수 있습니다.'
    }
  },
  setup() {
    const router = useRouter();
    
    const handleUpgradeClick = () => {
      // 결제 페이지로 이동
      router.push('/user/payment');
    };

    return {
      Lock,
      handleUpgradeClick
    };
  }
};
</script>

<style scoped>
.enterprise-block {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--el-bg-color-page);
}

.blocked-container {
  text-align: center;
  max-width: 600px;
  padding: var(--spacing-lg) var(--spacing-md);
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-lighter);
}

.blocked-icon {
  margin-bottom: var(--spacing-md);
  color: var(--el-color-warning);
}

.blocked-title {
  font-size: var(--el-font-size-extra-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-md) 0;
}

.blocked-description {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-base);
  line-height: 1.6;
  margin: 0 0 var(--spacing-lg) 0;
}

.blocked-features {
  text-align: left;
  background: var(--el-bg-color-page);
  padding: var(--spacing-md);
  border-radius: var(--el-border-radius-small);
  margin-bottom: var(--spacing-lg);
}

.blocked-features h3 {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-md) 0;
}

.blocked-features ul {
  margin: 0;
  padding-left: var(--spacing-lg);
  color: var(--el-text-color-regular);
}

.blocked-features li {
  margin-bottom: var(--spacing-xs);
  line-height: 1.5;
}

.upgrade-button {
  padding: var(--spacing-sm) var(--spacing-xl);
  font-size: var(--el-font-size-base);
  font-weight: var(--el-font-weight-medium);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .blocked-container {
    max-width: 100%;
    padding: var(--spacing-md);
  }
  
  .blocked-title {
    font-size: var(--el-font-size-large);
  }
  
  .blocked-features {
    padding: var(--spacing-sm);
  }
}

@media (max-width: 480px) {
  .enterprise-block {
    padding: var(--spacing-sm);
  }
  
  .blocked-container {
    padding: var(--spacing-sm);
  }
  
  .blocked-icon {
    margin-bottom: var(--spacing-sm);
  }
  
  .blocked-icon .el-icon {
    font-size: 48px !important;
  }
  
  .blocked-title {
    font-size: var(--el-font-size-medium);
  }
  
  .blocked-description {
    font-size: var(--el-font-size-small);
  }
  
  .blocked-features {
    padding: var(--spacing-xs);
  }
  
  .blocked-features h3 {
    font-size: var(--el-font-size-medium);
  }
  
  .blocked-features li {
    font-size: var(--el-font-size-small);
  }
}
</style>
