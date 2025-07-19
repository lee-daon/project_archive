<template>
  <div class="notice-management">
    <div class="page-header">
      <h1 class="page-title">공지사항 관리</h1>
      <p class="page-description">공지사항을 작성하고 관리할 수 있습니다.</p>
    </div>

    <el-card class="main-card">
      <!-- 필터 및 액션 섹션 -->
      <div class="action-section">
        <el-row :gutter="16" justify="space-between" align="middle">
          <el-col :span="18">
            <el-row :gutter="16" align="middle">
              <el-col :span="6">
                <el-input
                  v-model="filters.type"
                  placeholder="타입으로 필터링"
                  clearable
                  @clear="loadNotices"
                  @keyup.enter="loadNotices"
                >
                  <template #prefix>
                    <el-icon><Filter /></el-icon>
                  </template>
                </el-input>
              </el-col>
              <el-col :span="6">
                <el-select 
                  v-model="filters.tag_type" 
                  placeholder="태그 타입 선택"
                  clearable
                  @change="loadNotices"
                  style="width: 100%"
                >
                  <el-option 
                    v-for="option in tagTypeOptions" 
                    :key="option.value"
                    :label="option.label" 
                    :value="option.value"
                  />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-select 
                  v-model="filters.is_active" 
                  placeholder="상태 선택"
                  clearable
                  @change="loadNotices"
                  style="width: 100%"
                >
                  <el-option label="활성" value="true" />
                  <el-option label="비활성" value="false" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-button type="primary" @click="loadNotices" :icon="Search" :loading="loading">
                  검색
                </el-button>
              </el-col>
            </el-row>
          </el-col>
          <el-col :span="6" style="text-align: right">
            <el-button 
              type="primary" 
              @click="showCreateDialog" 
              :icon="Plus"
            >
              새 공지사항 작성
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 공지사항 목록 -->
      <div class="notice-list">
        <div v-if="loading" class="loading-state">
          <el-skeleton :rows="5" animated />
        </div>
        
        <div v-else-if="notices.length === 0" class="empty-state">
          <el-empty description="작성된 공지사항이 없습니다" />
        </div>
        
        <div v-else class="notice-cards">
          <el-card 
            v-for="notice in notices" 
            :key="notice.id" 
            class="notice-card"
            shadow="hover"
          >
            <div class="notice-header">
              <div class="notice-meta">
                <el-tag :type="getTagTypeColor(notice.tag_type)" class="notice-tag">
                  {{ notice.type }}
                </el-tag>
                <span class="notice-date">{{ formatDate(notice.created_at) }}</span>
              </div>
              <div class="notice-actions">
                <el-button 
                  type="warning" 
                  size="small" 
                  @click="showEditDialog(notice)"
                  :icon="Edit"
                >
                  수정
                </el-button>
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="deleteNotice(notice.id)"
                  :icon="Delete"
                >
                  삭제
                </el-button>
              </div>
            </div>
            
            <h3 class="notice-title">{{ notice.title }}</h3>
            
            <div 
              v-if="notice.content" 
              class="notice-content"
              v-html="notice.content"
            ></div>
            
            <div class="notice-footer">
              <span class="notice-status">
                <el-tag :type="notice.is_active ? 'success' : 'info'">
                  {{ notice.is_active ? '활성' : '비활성' }}
                </el-tag>
              </span>
              <span class="notice-updated">
                최종 수정: {{ formatDate(notice.updated_at) }}
              </span>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 페이지네이션 -->
      <el-pagination
        v-if="notices.length > 0"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="loadNotices"
        @size-change="loadNotices"
        class="pagination"
      />
    </el-card>

    <!-- 공지사항 작성/수정 다이얼로그 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '공지사항 수정' : '새 공지사항 작성'"
      width="800px"
      :before-close="handleDialogClose"
    >
      <el-form 
        ref="noticeFormRef"
        :model="noticeForm" 
        :rules="noticeFormRules"
        label-width="120px"
      >
        <el-form-item label="공지사항 타입" prop="type" required>
          <el-input
            v-model="noticeForm.type"
            placeholder="예: 공지, 업데이트, 안내"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="태그 타입" prop="tag_type" required>
          <el-select 
            v-model="noticeForm.tag_type" 
            placeholder="태그 타입을 선택하세요"
            style="width: 100%"
          >
            <el-option 
              v-for="option in tagTypeOptions" 
              :key="option.value"
              :label="option.label" 
              :value="option.value"
            >
              <el-tag :type="option.value" size="small">{{ option.label }}</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="제목" prop="title" required>
          <el-input
            v-model="noticeForm.title"
            placeholder="공지사항 제목을 입력하세요"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="내용" prop="content">
          <el-input
            v-model="noticeForm.content"
            type="textarea"
            :rows="8"
            placeholder="공지사항 내용을 입력하세요 (HTML 형식 지원)"
          />
        </el-form-item>
        
        <el-form-item v-if="isEditing" label="상태" prop="is_active">
          <el-switch 
            v-model="noticeForm.is_active" 
            active-text="활성" 
            inactive-text="비활성"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">취소</el-button>
        <el-button 
          type="primary" 
          @click="submitNotice"
          :loading="submitting"
        >
          {{ isEditing ? '수정 완료' : '작성 완료' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, Edit, Search, Filter } from '@element-plus/icons-vue';
import { 
  getNotices,
  createNotice, 
  updateNotice,
  deleteNotice as deleteNoticeAPI 
} from '../../services/admin';

export default {
  name: 'NoticeManagement',
  setup() {
    const notices = ref([]);
    const dialogVisible = ref(false);
    const submitting = ref(false);
    const noticeFormRef = ref(null);
    const isEditing = ref(false);
    const editingId = ref(null);
    
    // 공지사항 폼 데이터
    const noticeForm = reactive({
      type: '',
      tag_type: '',
      title: '',
      content: '',
      is_active: true
    });
    
    // 폼 검증 규칙
    const noticeFormRules = {
      type: [
        { required: true, message: '공지사항 타입을 입력해주세요', trigger: 'blur' }
      ],
      tag_type: [
        { required: true, message: '태그 타입을 선택해주세요', trigger: 'change' }
      ],
      title: [
        { required: true, message: '제목을 입력해주세요', trigger: 'blur' }
      ]
    };
    
    // 태그 타입 옵션
    const tagTypeOptions = [
      { value: 'success', label: '성공/완료' },
      { value: 'warning', label: '경고/주의' },
      { value: 'info', label: '정보/안내' },
      { value: 'error', label: '에러/긴급' }
    ];

    // 필터 및 페이지네이션 관련 변수
    const filters = reactive({
      type: '',
      tag_type: '',
      is_active: ''
    });
    
    const pagination = reactive({
      page: 1,
      limit: 10,
      total: 0
    });
    
    const loading = ref(false);

    // 공지사항 목록 조회
    const loadNotices = async () => {
      loading.value = true;
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit
        };
        
        // 필터 적용
        if (filters.type) params.type = filters.type;
        if (filters.tag_type) params.tag_type = filters.tag_type;
        if (filters.is_active) params.is_active = filters.is_active;
        
        const response = await getNotices(params);
        
        if (response.success) {
          notices.value = response.data || [];
          // API 응답에서 제공되는 실제 total 값 사용
          pagination.total = response.total || 0;
        }
      } catch (error) {
        ElMessage.error('공지사항 목록 조회 중 오류가 발생했습니다.');
        console.error(error);
      } finally {
        loading.value = false;
      }
    };

    // 공지사항 작성 다이얼로그 표시
    const showCreateDialog = () => {
      resetForm();
      isEditing.value = false;
      editingId.value = null;
      dialogVisible.value = true;
    };

    // 공지사항 수정 다이얼로그 표시
    const showEditDialog = (notice) => {
      resetForm();
      isEditing.value = true;
      editingId.value = notice.id;
      
      // 폼에 기존 데이터 채우기
      noticeForm.type = notice.type;
      noticeForm.tag_type = notice.tag_type;
      noticeForm.title = notice.title;
      noticeForm.content = notice.content || '';
      noticeForm.is_active = notice.is_active;
      
      dialogVisible.value = true;
    };

    // 폼 초기화
    const resetForm = () => {
      noticeForm.type = '';
      noticeForm.tag_type = '';
      noticeForm.title = '';
      noticeForm.content = '';
      noticeForm.is_active = true;
      
      if (noticeFormRef.value) {
        noticeFormRef.value.resetFields();
      }
    };

    // 공지사항 작성/수정 제출
    const submitNotice = async () => {
      try {
        await noticeFormRef.value.validate();
        
        submitting.value = true;
        
        let response;
        
        if (isEditing.value) {
          // 수정
          response = await updateNotice(editingId.value, noticeForm);
          
          if (response.success) {
            ElMessage.success('공지사항이 성공적으로 수정되었습니다.');
          }
        } else {
          // 새로 작성
          response = await createNotice(noticeForm);
          
          if (response.success) {
            ElMessage.success('공지사항이 성공적으로 작성되었습니다.');
          }
        }
        
        dialogVisible.value = false;
        loadNotices(); // 목록 새로고침
        
      } catch (error) {
        if (error === false) {
          // 폼 검증 실패
          return;
        }
        
        const action = isEditing.value ? '수정' : '작성';
        ElMessage.error(`공지사항 ${action} 중 오류가 발생했습니다.`);
        console.error(error);
      } finally {
        submitting.value = false;
      }
    };

    // 공지사항 삭제
    const deleteNotice = async (id) => {
      try {
        await ElMessageBox.confirm(
          '이 공지사항을 삭제하시겠습니까?', 
          '확인', 
          {
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
            type: 'warning'
          }
        );
        
        const response = await deleteNoticeAPI(id);
        
        if (response.success) {
          ElMessage.success('공지사항이 성공적으로 삭제되었습니다.');
          loadNotices(); // 목록 새로고침
        }
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('공지사항 삭제 중 오류가 발생했습니다.');
          console.error(error);
        }
      }
    };

    // 다이얼로그 닫기 처리
    const handleDialogClose = () => {
      dialogVisible.value = false;
      resetForm();
      isEditing.value = false;
      editingId.value = null;
    };

    // 유틸리티 함수들
    const formatDate = (dateString) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleString('ko-KR');
    };

    const getTagTypeColor = (tagType) => {
      return tagType || 'info';
    };

    // 초기 로드
    onMounted(() => {
      loadNotices();
    });

    return {
      notices,
      dialogVisible,
      submitting,
      noticeFormRef,
      noticeForm,
      noticeFormRules,
      tagTypeOptions,
      filters,
      pagination,
      loading,
      isEditing,
      loadNotices,
      showCreateDialog,
      showEditDialog,
      resetForm,
      submitNotice,
      deleteNotice,
      handleDialogClose,
      formatDate,
      getTagTypeColor,
      Plus,
      Delete,
      Edit,
      Search,
      Filter
    };
  }
};
</script>

<style scoped>
.notice-management {
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

.action-section {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--el-bg-color-page);
  border-radius: var(--el-border-radius-base);
}

.notice-list {
  min-height: 400px;
}

.loading-state {
  padding: var(--spacing-lg);
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

.notice-cards {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.notice-card {
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color-light);
}

.notice-card:hover {
  border-color: var(--el-color-primary-light-7);
}

.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.notice-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.notice-tag {
  font-weight: var(--el-font-weight-medium);
}

.notice-date {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
}

.notice-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.notice-title {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-sm) 0;
  line-height: 1.4;
}

.notice-content {
  color: var(--el-text-color-regular);
  line-height: 1.6;
  margin-bottom: var(--spacing-md);
}

.notice-content :deep(p) {
  margin: 0 0 var(--spacing-sm) 0;
}

.notice-content :deep(p:last-child) {
  margin-bottom: 0;
}

.notice-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--el-border-color-lighter);
}

.notice-status {
  display: flex;
  align-items: center;
}

.notice-updated {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
}

/* 다이얼로그 내 폼 스타일 */
.el-form-item__label {
  font-weight: var(--el-font-weight-medium);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .notice-management {
    padding: var(--spacing-md);
  }
  
  .page-title {
    font-size: var(--el-font-size-large);
  }
  
  .action-section {
    padding: var(--spacing-sm);
  }
  
  .notice-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
  
  .notice-meta {
    width: 100%;
  }
  
  .notice-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .notice-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-lg);
}
</style> 