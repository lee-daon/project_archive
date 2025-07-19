<template>
  <div class="log-management">
    <div class="page-header">
      <h1 class="page-title">로그 관리</h1>
      <p class="page-description">시스템 로그를 조회하고 관리할 수 있습니다.</p>
    </div>

    <el-card class="main-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 폐기 이미지 로그 탭 -->
        <el-tab-pane label="폐기 이미지 로그" name="not-used-image">
          <div class="tab-content">
            <div class="filter-section">
              <el-row :gutter="16">
                <el-col :span="6">
                  <el-input
                    v-model="filters.userid"
                    placeholder="사용자 ID로 필터링"
                    clearable
                    @clear="loadNotUsedImageLogs"
                    @keyup.enter="loadNotUsedImageLogs"
                  >
                    <template #prefix>
                      <el-icon><User /></el-icon>
                    </template>
                  </el-input>
                </el-col>
                <el-col :span="4">
                  <el-button type="primary" @click="loadNotUsedImageLogs" :icon="Search">
                    검색
                  </el-button>
                </el-col>
              </el-row>
            </div>

            <!-- 폐기 이미지 로그 테이블 -->
            <div class="excel-table-container" v-loading="loading">
              <table class="excel-table" v-if="!loading && notUsedImageLogs.length > 0">
                <thead>
                  <tr>
                    <th width="80">ID</th>
                    <th width="100">사용자 ID</th>
                    <th width="150">코드</th>
                    <th width="300">이미지 URL</th>
                    <th width="200">폐기 사유</th>
                    <th width="180">생성일</th>
                    <th width="100">작업</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in notUsedImageLogs" :key="row.id">
                    <td>{{ row.id }}</td>
                    <td>{{ row.userid }}</td>
                    <td>
                      <el-tag :type="getCodeTagType(row.code)" size="small">
                        {{ getCodeText(row.code) }}
                      </el-tag>
                    </td>
                    <td class="copyable-cell" @dblclick="selectText($event)" :title="row.image_url">
                      {{ row.image_url }}
                    </td>
                    <td class="copyable-cell" @dblclick="selectText($event)">
                      {{ row.reason || '-' }}
                    </td>
                    <td>{{ formatDate(row.created_at) }}</td>
                    <td>
                      <el-button 
                        type="danger" 
                        size="small" 
                        @click="deleteNotUsedImageLog(row.id)"
                        :icon="Delete"
                      >
                        삭제
                      </el-button>
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <div v-if="!loading && notUsedImageLogs.length === 0" class="empty-table">
                <el-empty description="데이터가 없습니다" />
              </div>
            </div>

            <el-pagination
              v-model:current-page="notUsedImagePagination.page"
              v-model:page-size="notUsedImagePagination.limit"
              :total="notUsedImagePagination.total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="loadNotUsedImageLogs"
              @size-change="loadNotUsedImageLogs"
              class="pagination"
            />
          </div>
        </el-tab-pane>

        <!-- 사용량 로그 탭 -->
        <el-tab-pane label="사용량 로그" name="usage">
          <div class="tab-content">
            <div class="filter-section">
              <el-row :gutter="16">
                <el-col :span="6">
                  <el-input
                    v-model="filters.userid"
                    placeholder="사용자 ID로 필터링"
                    clearable
                    @clear="loadUsageLogs"
                    @keyup.enter="loadUsageLogs"
                  >
                    <template #prefix>
                      <el-icon><User /></el-icon>
                    </template>
                  </el-input>
                </el-col>
                <el-col :span="4">
                  <el-button type="primary" @click="loadUsageLogs" :icon="Search">
                    검색
                  </el-button>
                </el-col>
              </el-row>
            </div>

            <!-- 사용량 로그 테이블 -->
            <div class="excel-table-container" v-loading="loading">
              <table class="excel-table" v-if="!loading && usageLogs.length > 0">
                <thead>
                  <tr>
                    <th width="80">ID</th>
                    <th width="100">사용자 ID</th>
                    <th width="150">사용 유형</th>
                    <th width="100">사용량</th>
                    <th width="180">사용 시간</th>
                    <th width="300">사용 내용</th>
                    <th width="100">작업</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in usageLogs" :key="row.id">
                    <td>{{ row.id }}</td>
                    <td>{{ row.userid }}</td>
                    <td>
                      <el-tag :type="getUsageTypeTagType(row.usage_type)" size="small">
                        {{ getUsageTypeText(row.usage_type) }}
                      </el-tag>
                    </td>
                    <td>{{ row.usage_amount }}</td>
                    <td>{{ formatDate(row.usage_time) }}</td>
                    <td class="copyable-cell" @dblclick="selectText($event)">
                      {{ row.comment || '-' }}
                    </td>
                    <td>
                      <el-button 
                        type="danger" 
                        size="small" 
                        @click="deleteUsageLog(row.id)"
                        :icon="Delete"
                      >
                        삭제
                      </el-button>
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <div v-if="!loading && usageLogs.length === 0" class="empty-table">
                <el-empty description="데이터가 없습니다" />
              </div>
            </div>

            <el-pagination
              v-model:current-page="usagePagination.page"
              v-model:page-size="usagePagination.limit"
              :total="usagePagination.total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="loadUsageLogs"
              @size-change="loadUsageLogs"
              class="pagination"
            />
          </div>
        </el-tab-pane>

        <!-- 에러 로그 탭 -->
        <el-tab-pane label="에러 로그" name="error">
          <div class="tab-content">
            <div class="filter-section">
              <el-row :gutter="16">
                <el-col :span="6">
                  <el-input
                    v-model="filters.userid"
                    placeholder="사용자 ID로 필터링"
                    clearable
                    @clear="loadErrorLogs"
                    @keyup.enter="loadErrorLogs"
                  >
                    <template #prefix>
                      <el-icon><User /></el-icon>
                    </template>
                  </el-input>
                </el-col>
                <el-col :span="4">
                  <el-button type="primary" @click="loadErrorLogs" :icon="Search">
                    검색
                  </el-button>
                </el-col>
              </el-row>
            </div>

            <!-- 에러 로그 테이블 -->
            <div class="excel-table-container" v-loading="loading">
              <table class="excel-table" v-if="!loading && errorLogs.length > 0">
                <thead>
                  <tr>
                    <th width="100">로그 ID</th>
                    <th width="100">사용자 ID</th>
                    <th width="120">상품 ID</th>
                    <th width="400">에러 메시지</th>
                    <th width="180">생성일</th>
                    <th width="100">작업</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in errorLogs" :key="row.log_id">
                    <td>{{ row.log_id }}</td>
                    <td>{{ row.userid }}</td>
                    <td>{{ row.productid }}</td>
                    <td class="copyable-cell error-message-cell" @dblclick="selectText($event)" :title="row.error_message">
                      <span class="truncated-text" :data-full-text="row.error_message">
                        {{ truncateErrorMessage(row.error_message) }}
                      </span>
                    </td>
                    <td>{{ formatDate(row.created_at) }}</td>
                    <td>
                      <el-button 
                        type="danger" 
                        size="small" 
                        @click="deleteErrorLog(row.log_id)"
                        :icon="Delete"
                      >
                        삭제
                      </el-button>
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <div v-if="!loading && errorLogs.length === 0" class="empty-table">
                <el-empty description="데이터가 없습니다" />
              </div>
            </div>

            <el-pagination
              v-model:current-page="errorPagination.page"
              v-model:page-size="errorPagination.limit"
              :total="errorPagination.total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="loadErrorLogs"
              @size-change="loadErrorLogs"
              class="pagination"
            />
          </div>
        </el-tab-pane>

        <!-- 정보 로그 탭 -->
        <el-tab-pane label="정보 로그" name="info">
          <div class="tab-content">
            <div class="filter-section">
              <p class="filter-note">※ 정보 로그는 사용자 필터링을 지원하지 않습니다</p>
            </div>

            <!-- 정보 로그 테이블 -->
            <div class="excel-table-container" v-loading="loading">
              <table class="excel-table" v-if="!loading && infoLogs.length > 0">
                <thead>
                  <tr>
                    <th width="100">로그 ID</th>
                    <th width="200">로그 레벨</th>
                    <th width="400">메시지</th>
                    <th width="180">생성일</th>
                    <th width="100">작업</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in infoLogs" :key="row.log_id">
                    <td>{{ row.log_id }}</td>
                    <td>
                      <el-tag :type="getInfoLevelTagType(extractLogLevel(row.info_message))" size="small">
                        {{ extractLogLevel(row.info_message) || '-' }}
                      </el-tag>
                    </td>
                    <td class="copyable-cell" @dblclick="selectText($event)" :title="row.info_message">
                      {{ row.info_message || '-' }}
                    </td>
                    <td>{{ formatDate(row.created_at) }}</td>
                    <td>
                      <el-button 
                        type="danger" 
                        size="small" 
                        @click="deleteInfoLog(row.log_id)"
                        :icon="Delete"
                      >
                        삭제
                      </el-button>
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <div v-if="!loading && infoLogs.length === 0" class="empty-table">
                <el-empty description="데이터가 없습니다" />
              </div>
            </div>

            <el-pagination
              v-model:current-page="infoPagination.page"
              v-model:page-size="infoPagination.limit"
              :total="infoPagination.total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="loadInfoLogs"
              @size-change="loadInfoLogs"
              class="pagination"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, } from 'element-plus';
import { Search, Delete, User } from '@element-plus/icons-vue';
import { 
  getNotUsedImageLogs, 
  getUsageLogs, 
  getErrorLogs,
  getInfoLogs,
  deleteNotUsedImageLog as deleteNotUsedImageLogAPI,
  deleteUsageLog as deleteUsageLogAPI,
  deleteErrorLog as deleteErrorLogAPI,
  deleteInfoLog as deleteInfoLogAPI
} from '../../services/admin';

export default {
  name: 'LogManagement',
  setup() {
    const activeTab = ref('not-used-image');
    const loading = ref(false);
    
    // 데이터 상태
    const notUsedImageLogs = ref([]);
    const usageLogs = ref([]);
    const errorLogs = ref([]);
    const infoLogs = ref([]);
    
    // 필터 및 페이지네이션 - 각 탭별로 분리
    const filters = reactive({
      userid: ''
    });
    
    const notUsedImagePagination = reactive({
      page: 1,
      limit: 10,
      total: 0
    });
    
    const usagePagination = reactive({
      page: 1,
      limit: 10,
      total: 0
    });
    
    const errorPagination = reactive({
      page: 1,
      limit: 10,
      total: 0
    });
    
    const infoPagination = reactive({
      page: 1,
      limit: 10,
      total: 0
    });

    // 폐기 이미지 로그 조회
    const loadNotUsedImageLogs = async () => {
      loading.value = true;
      try {
        const params = {
          page: notUsedImagePagination.page,
          limit: notUsedImagePagination.limit
        };
        if (filters.userid) params.userid = filters.userid;
        
        const response = await getNotUsedImageLogs(params);
        if (response.success) {
          notUsedImageLogs.value = response.data || [];
          // API 응답에서 제공되는 실제 total 값 사용
          notUsedImagePagination.total = response.total || 0;
        }
      } catch (error) {
        ElMessage.error('폐기 이미지 로그 조회 중 오류가 발생했습니다.');
        console.error(error);
      } finally {
        loading.value = false;
      }
    };

    // 사용량 로그 조회
    const loadUsageLogs = async () => {
      loading.value = true;
      try {
        const params = {
          page: usagePagination.page,
          limit: usagePagination.limit
        };
        if (filters.userid) params.userid = filters.userid;
        
        const response = await getUsageLogs(params);
        if (response.success) {
          usageLogs.value = response.data || [];
          usagePagination.total = response.total || 0;
        }
      } catch (error) {
        ElMessage.error('사용량 로그 조회 중 오류가 발생했습니다.');
        console.error(error);
      } finally {
        loading.value = false;
      }
    };

    // 에러 로그 조회
    const loadErrorLogs = async () => {
      loading.value = true;
      try {
        const params = {
          page: errorPagination.page,
          limit: errorPagination.limit
        };
        if (filters.userid) params.userid = filters.userid;
        
        const response = await getErrorLogs(params);
        if (response.success) {
          errorLogs.value = response.data || [];
          errorPagination.total = response.total || 0;
        }
      } catch (error) {
        ElMessage.error('에러 로그 조회 중 오류가 발생했습니다.');
        console.error(error);
      } finally {
        loading.value = false;
      }
    };

    // 정보 로그 조회
    const loadInfoLogs = async () => {
      loading.value = true;
      try {
        const params = {
          page: infoPagination.page,
          limit: infoPagination.limit
        };
        // info 로그는 userid 필터링이 없음
        
        const response = await getInfoLogs(params);
        if (response.success) {
          infoLogs.value = response.data || [];
          infoPagination.total = response.total || 0;
        }
      } catch (error) {
        ElMessage.error('정보 로그 조회 중 오류가 발생했습니다.');
        console.error(error);
      } finally {
        loading.value = false;
      }
    };

    // 폐기 이미지 로그 삭제
    const deleteNotUsedImageLog = async (id) => {
      try {
        const response = await deleteNotUsedImageLogAPI(id);
        if (response.success) {
          ElMessage.success('로그가 성공적으로 삭제되었습니다.');
          loadNotUsedImageLogs();
        }
      } catch (error) {
        ElMessage.error('로그 삭제 중 오류가 발생했습니다.');
        console.error(error);
      }
    };

    // 사용량 로그 삭제
    const deleteUsageLog = async (id) => {
      try {
        const response = await deleteUsageLogAPI(id);
        if (response.success) {
          ElMessage.success('로그가 성공적으로 삭제되었습니다.');
          loadUsageLogs();
        }
      } catch (error) {
        ElMessage.error('로그 삭제 중 오류가 발생했습니다.');
        console.error(error);
      }
    };

    // 에러 로그 삭제
    const deleteErrorLog = async (logId) => {
      try {
        const response = await deleteErrorLogAPI(logId);
        if (response.success) {
          ElMessage.success('로그가 성공적으로 삭제되었습니다.');
          loadErrorLogs();
        }
      } catch (error) {
        ElMessage.error('로그 삭제 중 오류가 발생했습니다.');
        console.error(error);
      }
    };

    // 정보 로그 삭제
    const deleteInfoLog = async (logId) => {
      try {
        const response = await deleteInfoLogAPI(logId);
        if (response.success) {
          ElMessage.success('로그가 성공적으로 삭제되었습니다.');
          loadInfoLogs();
        }
      } catch (error) {
        ElMessage.error('로그 삭제 중 오류가 발생했습니다.');
        console.error(error);
      }
    };

    // 탭 변경 처리
    const handleTabChange = (tabName) => {
      filters.userid = '';
      
      switch (tabName) {
        case 'not-used-image':
          loadNotUsedImageLogs();
          break;
        case 'usage':
          loadUsageLogs();
          break;
        case 'error':
          loadErrorLogs();
          break;
        case 'info':
          loadInfoLogs();
          break;
      }
    };

    // 유틸리티 함수들
    const formatDate = (dateString) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleString('ko-KR');
    };

    // 텍스트 선택 함수 (더블클릭 시 전체 텍스트 선택)
    const selectText = (event) => {
      const target = event.target.closest('.copyable-cell');
      const truncatedSpan = target.querySelector('.truncated-text');
      
      if (truncatedSpan && truncatedSpan.dataset.fullText) {
        // 전체 텍스트가 있는 경우 클립보드에 복사
        navigator.clipboard.writeText(truncatedSpan.dataset.fullText).then(() => {
          ElMessage.success('텍스트가 클립보드에 복사되었습니다.');
        }).catch(() => {
          // 클립보드 API가 실패한 경우 기존 방식 사용
          const tempElement = document.createElement('div');
          tempElement.textContent = truncatedSpan.dataset.fullText;
          target.appendChild(tempElement);
          
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(tempElement);
          selection.removeAllRanges();
          selection.addRange(range);
          
          setTimeout(() => {
            target.removeChild(tempElement);
          }, 100);
        });
      } else {
        // 일반 텍스트 선택
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(target);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    };

    // 에러 메시지 truncate 함수
    const truncateErrorMessage = (message) => {
      if (!message) return '-';
      const maxLength = 80;
      return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
    };

    const getCodeTagType = (code) => {
      switch (code) {
        case 'settingchange': return 'warning';
        case 'marketdelete': return 'danger';
        default: return 'info';
      }
    };

    const getCodeText = (code) => {
      switch (code) {
        case 'settingchange': return '상세페이지 변경';
        case 'marketdelete': return '마켓 삭제';
        default: return code;
      }
    };

    const getUsageTypeTagType = (type) => {
      switch (type) {
        case 'sourcing': return 'primary';
        case 'image_processing': return 'success';
        case 'register': return 'warning';
        case 'deep_brand_filter': return 'info';
        default: return '';
      }
    };

    const getUsageTypeText = (type) => {
      switch (type) {
        case 'sourcing': return '소싱';
        case 'image_processing': return '이미지 가공';
        case 'register': return '등록';
        case 'deep_brand_filter': return '딥브랜드 필터';
        default: return type;
      }
    };

    const getInfoLevelTagType = (level) => {
      switch (level) {
        case 'ERROR': return 'danger';
        case 'WARN': return 'warning';
        case 'INFO': return 'info';
        case 'DEBUG': return 'success';
        default: return '';
      }
    };

    // info_message에서 로그 레벨을 추출하는 함수
    const extractLogLevel = (message) => {
      if (!message) return '';
      
      // [INFO], [ERROR], [WARN], [DEBUG] 등을 찾는 정규식
      const levelMatch = message.match(/\[([A-Z]+)\]:/);
      return levelMatch ? levelMatch[1] : '';
    };

    // 초기 로드
    onMounted(() => {
      loadNotUsedImageLogs();
    });

    return {
      activeTab,
      loading,
      notUsedImageLogs,
      usageLogs,
      errorLogs,
      infoLogs,
      filters,
      notUsedImagePagination,
      usagePagination,
      errorPagination,
      infoPagination,
      loadNotUsedImageLogs,
      loadUsageLogs,
      loadErrorLogs,
      loadInfoLogs,
      deleteNotUsedImageLog,
      deleteUsageLog,
      deleteErrorLog,
      deleteInfoLog,
      handleTabChange,
      formatDate,
      selectText,
      truncateErrorMessage,
      getCodeTagType,
      getCodeText,
      getUsageTypeTagType,
      getUsageTypeText,
      getInfoLevelTagType,
      extractLogLevel,
      Search,
      Delete,
      User
    };
  }
};
</script>

<style scoped>
.log-management {
  padding: var(--spacing-lg);
  background-color: var(--el-bg-color-page);
  min-height: 100vh;
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: var(--el-font-size-extra-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.page-description {
  color: var(--el-text-color-secondary);
  margin: 0;
}

.main-card {
  box-shadow: var(--el-box-shadow-base);
}

.tab-content {
  padding: var(--spacing-md) 0;
}

.filter-section {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--el-bg-color-page);
  border-radius: var(--el-border-radius-base);
}

.filter-note {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
  margin: 0;
  padding: var(--spacing-sm);
  background-color: var(--el-fill-color-light);
  border-radius: var(--el-border-radius-small);
  border-left: 3px solid var(--el-color-info);
}

/* 액셀 스타일 테이블 */
.excel-table-container {
  width: 100%;
  overflow-x: auto;
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  background-color: var(--el-bg-color);
  min-height: 400px;
  position: relative;
}

.excel-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--el-font-size-small);
  background-color: var(--el-bg-color);
}

.excel-table th {
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-weight: var(--el-font-weight-semibold);
  padding: 12px 8px;
  text-align: left;
  border-bottom: 2px solid var(--el-border-color);
  border-right: 1px solid var(--el-border-color-lighter);
  position: sticky;
  top: 0;
  z-index: 10;
}

.excel-table th:last-child {
  border-right: none;
}

.excel-table td {
  padding: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  border-right: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-regular);
  word-break: break-word;
  vertical-align: top;
}

.excel-table td:last-child {
  border-right: none;
}

.excel-table tbody tr:hover {
  background-color: var(--el-color-primary-light-9);
}

.excel-table tbody tr:nth-child(even) {
  background-color: var(--el-fill-color-extra-light);
}

.excel-table tbody tr:nth-child(even):hover {
  background-color: var(--el-color-primary-light-9);
}

/* 복사 가능한 셀 스타일 */
.copyable-cell {
  cursor: text;
  user-select: text;
  position: relative;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copyable-cell:hover {
  background-color: var(--el-color-warning-light-9) !important;
  cursor: pointer;
}

.copyable-cell:hover::after {
  content: "더블클릭하여 복사";
  position: absolute;
  bottom: -20px;
  left: 0;
  font-size: 10px;
  color: var(--el-color-warning);
  background: var(--el-bg-color);
  padding: 2px 4px;
  border-radius: 2px;
  box-shadow: var(--el-box-shadow-light);
  z-index: 100;
  white-space: nowrap;
}

.error-message-cell {
  max-width: 400px;
  min-width: 300px;
  line-height: 1.4;
}

.error-message-cell .truncated-text {
  display: block;
  word-break: break-word;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  display: -webkit-box;
}

.error-message-cell:hover .truncated-text {
  color: var(--el-color-primary);
  font-weight: var(--el-font-weight-medium);
}

/* 빈 테이블 스타일 */
.empty-table {
  padding: var(--spacing-xl);
  text-align: center;
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-lg);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .log-management {
    padding: var(--spacing-md);
  }
  
  .page-title {
    font-size: var(--el-font-size-large);
  }
  
  .filter-section {
    padding: var(--spacing-sm);
  }
}
</style> 