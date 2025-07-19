<template>
  <div class="auth-layout">
    <div class="auth-container">
      <div class="logo-container">
        <img src="../assets/loopton3.png" alt="loopToN 로고" class="logo" />
      </div>
      <router-view />
    </div>
  </div>
</template>

<script>
export default {
  name: 'AuthLayout'
}
</script>

<style scoped>
.auth-layout {
  height: 100vh;
  background-color: var(--el-bg-color-page);
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
}

.auth-container {
  width: 100%;
  max-width: 450px;
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-medium);
  box-shadow: var(--el-box-shadow-base);
  padding: 40px;
  box-sizing: border-box;
  margin: 20px 0;
}

.logo-container {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  max-width: 150px;
  height: auto;
}

/* 태블릿 */
@media (max-width: 768px) {
  .auth-layout {
    padding: 15px;
    align-items: flex-start;
    padding-top: 40px;
  }
  
  .auth-container {
    max-width: 100%;
    padding: 30px;
    margin: 0;
  }
  
  .logo {
    max-width: 120px;
  }
}

/* 모바일 */
@media (max-width: 480px) {
  .auth-layout {
    padding: 10px;
    padding-top: 20px;
  }
  
  .auth-container {
    padding: 20px;
    box-shadow: none;
  }
  
  .logo {
    max-width: 100px;
  }
  
  .logo-container {
    margin-bottom: 20px;
  }
}

/* 짧은 화면 높이 */
@media (max-height: 600px) {
  .auth-layout {
    align-items: flex-start;
    padding-top: 10px;
  }
  
  .auth-container {
    margin: 0;
    padding: 15px;
  }
  
  .logo-container {
    margin-bottom: 15px;
  }
}

/* 매우 짧은 화면 */
@media (max-height: 500px) {
  .auth-layout {
    padding-top: 5px;
  }
  
  .auth-container {
    padding: 10px;
  }
  
  .logo-container {
    margin-bottom: 10px;
  }
}
</style> 