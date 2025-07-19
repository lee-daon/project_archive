<template>
  <div class="user-management">
    <div class="page-header">
      <h1 class="page-title">사용자 관리</h1>
      <p class="page-description">사용자 정보와 통계를 조회하고 관리할 수 있습니다.</p>
    </div>

    <el-card class="main-card">
      <!-- 필터 섹션 -->
      <div class="filter-section">
        <el-row :gutter="16" align="middle">
          <el-col :span="5">
            <el-input
              v-model="filters.userid"
              placeholder="사용자 ID로 필터링"
              clearable
              @clear="loadUsers"
              @keyup.enter="loadUsers"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="6">
            <el-input
              v-model="searchIdentifier"
              placeholder="이메일 또는 사용자 ID로 검색"
              clearable
              @keyup.enter="searchUser"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="3">
            <el-button type="primary" @click="loadUsers" :icon="Search">
              목록 검색
            </el-button>
          </el-col>
          <el-col :span="3">
            <el-button type="success" @click="searchUser" :icon="User">
              사용자 검색
            </el-button>
          </el-col>
          <el-col :span="3">
            <el-button type="primary" @click="showCreateDialog" :icon="Plus">
              계정 생성
            </el-button>
          </el-col>
          <el-col :span="4">
            <el-button type="info" @click="refreshData" :icon="Refresh">
              새로고침
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 통계 카드 섹션 -->
      <div class="stats-section">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon primary">
                  <el-icon><User /></el-icon>
                </div>
                <div class="stat-text">
                  <h3>{{ totalUsers }}</h3>
                  <p>총 사용자 수</p>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon success">
                  <el-icon><CircleCheck /></el-icon>
                </div>
                <div class="stat-text">
                  <h3>{{ activeUsers }}</h3>
                  <p>활성 사용자</p>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon warning">
                  <el-icon><Star /></el-icon>
                </div>
                <div class="stat-text">
                  <h3>{{ premiumUsers }}</h3>
                  <p>프리미엄 사용자</p>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon info">
                  <el-icon><Calendar /></el-icon>
                </div>
                <div class="stat-text">
                  <h3>{{ newUsersToday }}</h3>
                  <p>오늘 가입</p>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 사용자 테이블 -->
      <el-table 
        :data="users" 
        v-loading="loading"
        empty-text="데이터가 없습니다"
        class="user-table"
        @row-click="handleRowClick"
      >
        <el-table-column prop="userid" label="사용자 ID" width="100" sortable />
        <el-table-column prop="id" label="로그인 ID" width="120" />
        <el-table-column prop="name" label="이름" width="100" />
        <el-table-column prop="email" label="이메일" min-width="180" />
        <el-table-column prop="login_type" label="로그인 유형" width="120">
          <template #default="{ row }">
            <el-tag :type="getLoginTypeTagType(row.login_type)">
              {{ getLoginTypeText(row.login_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="plan" label="플랜" width="100">
          <template #default="{ row }">
            <el-tag :type="getPlanTagType(row.plan)">
              {{ getPlanText(row.plan) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="상태" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'">
              {{ row.is_active ? '활성' : '비활성' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="expired_at" label="만료일" width="120">
          <template #default="{ row }">
            {{ formatDate(row.expired_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="가입일" width="120">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="작업" width="180">
          <template #default="{ row }">
            <el-button 
              type="info" 
              size="small" 
              @click.stop="showUserDetail(row)"
              :icon="View"
            >
              상세보기
            </el-button>
            <el-button 
              type="warning" 
              size="small" 
              @click.stop="showEditDialog(row)"
              :icon="Edit"
            >
              수정
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 페이지네이션 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="loadUsers"
        @size-change="loadUsers"
        class="pagination"
      />
    </el-card>

    <!-- 사용자 상세 정보 다이얼로그 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="사용자 상세 정보"
      width="800px"
      :before-close="handleDetailClose"
    >
      <div v-if="selectedUser" class="user-detail">
        <!-- 기본 정보 -->
        <el-card class="detail-card">
          <template #header>
            <h3>기본 정보</h3>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="사용자 ID">{{ selectedUser.userid }}</el-descriptions-item>
            <el-descriptions-item label="로그인 ID">{{ selectedUser.id || '-' }}</el-descriptions-item>
            <el-descriptions-item label="이름">{{ selectedUser.name }}</el-descriptions-item>
            <el-descriptions-item label="이메일">{{ selectedUser.email }}</el-descriptions-item>
            <el-descriptions-item label="네이버 ID">{{ selectedUser.naver_id || '-' }}</el-descriptions-item>
            <el-descriptions-item label="로그인 유형">
              <el-tag :type="getLoginTypeTagType(selectedUser.login_type)">
                {{ getLoginTypeText(selectedUser.login_type) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="플랜">
              <el-tag :type="getPlanTagType(selectedUser.plan)">
                {{ getPlanText(selectedUser.plan) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="최대 사업자 수">{{ selectedUser.maximum_market_count }}</el-descriptions-item>
            <el-descriptions-item label="만료일">{{ formatDate(selectedUser.expired_at) }}</el-descriptions-item>
            <el-descriptions-item label="상태">
              <el-tag :type="selectedUser.is_active ? 'success' : 'danger'">
                {{ selectedUser.is_active ? '활성' : '비활성' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="가입일">{{ formatDate(selectedUser.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="수정일">{{ formatDate(selectedUser.updated_at) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 사용량 통계 -->
        <el-card class="detail-card">
          <template #header>
            <h3>사용량 통계</h3>
          </template>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-descriptions :column="1" border>
                <el-descriptions-item label="일일 소싱 잔여량">{{ selectedUser.daily_sourcing_remaining }}</el-descriptions-item>
                <el-descriptions-item label="일일 이미지 가공 잔여량">{{ selectedUser.daily_image_processing_remaining }}</el-descriptions-item>
                <el-descriptions-item label="이미지 가공권 (일괄)">{{ selectedUser.image_processing_allinone_count }}</el-descriptions-item>
                <el-descriptions-item label="이미지 가공권 (낱장)">{{ selectedUser.image_processing_single_count }}</el-descriptions-item>
                <el-descriptions-item label="딥브랜드 필터 수량">{{ selectedUser.deep_brand_filter_count }}</el-descriptions-item>
              </el-descriptions>
            </el-col>
            <el-col :span="12">
              <el-descriptions :column="1" border>
                <el-descriptions-item label="누적 소싱 상품수">{{ selectedUser.total_sourced_products }}</el-descriptions-item>
                <el-descriptions-item label="중복 제외 상품수">{{ selectedUser.duplicate_filtered_products }}</el-descriptions-item>
                <el-descriptions-item label="누적 필터링 상품수">{{ selectedUser.total_filtered_products }}</el-descriptions-item>
                <el-descriptions-item label="누적 수집 상품수">{{ selectedUser.total_collected_products }}</el-descriptions-item>
                <el-descriptions-item label="누적 가공 상품수">{{ selectedUser.total_processed_products }}</el-descriptions-item>
                <el-descriptions-item label="누적 이미지 번역수">{{ selectedUser.total_translated_images }}</el-descriptions-item>
                <el-descriptions-item label="누적 등록 상품수">{{ selectedUser.total_registered_products }}</el-descriptions-item>
              </el-descriptions>
            </el-col>
          </el-row>
        </el-card>
      </div>
      
      <template #footer>
        <el-button @click="detailDialogVisible = false">닫기</el-button>
      </template>
    </el-dialog>

    <!-- 사용자 정보 수정 다이얼로그 -->
    <el-dialog
      v-model="editDialogVisible"
      title="사용자 정보 수정"
      width="600px"
      :before-close="handleEditClose"
    >
      <el-form 
        ref="editFormRef" 
        :model="editForm" 
        :rules="editFormRules"
        label-width="140px"
        v-loading="editLoading"
      >
        <el-form-item label="사용자 정보">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="사용자 ID">{{ editForm.userid }}</el-descriptions-item>
            <el-descriptions-item label="이름">{{ editForm.name }}</el-descriptions-item>
            <el-descriptions-item label="이메일">{{ editForm.email }}</el-descriptions-item>
          </el-descriptions>
        </el-form-item>

        <el-form-item label="플랜" prop="plan">
          <el-select v-model="editForm.plan" placeholder="플랜 선택">
            <el-option label="무료" value="free" />
            <el-option label="베이직" value="basic" />
            <el-option label="엔터프라이즈" value="enterprise" />
          </el-select>
        </el-form-item>

        <el-form-item label="최대 사업자 수" prop="maximum_market_count">
          <el-input-number
            v-model="editForm.maximum_market_count"
            :min="1"
            :max="100"
            placeholder="최대 사업자 수"
          />
        </el-form-item>

        <el-form-item label="만료일" prop="expired_at">
          <el-date-picker
            v-model="editForm.expired_at"
            type="date"
            placeholder="만료일 선택"
            format="YYYY/MM/DD"
            value-format="YYYY/MM/DD"
          />
        </el-form-item>

        <el-form-item label="이미지 가공권 (일괄)" prop="image_processing_allinone_count">
          <el-input-number
            v-model="editForm.image_processing_allinone_count"
            :min="0"
            :max="1000"
            placeholder="이미지 가공권 (일괄)"
          />
        </el-form-item>

        <el-form-item label="이미지 가공권 (낱장)" prop="image_processing_single_count">
          <el-input-number
            v-model="editForm.image_processing_single_count"
            :min="0"
            :max="1000"
            placeholder="이미지 가공권 (낱장)"
          />
        </el-form-item>

        <el-form-item label="딥브랜드 필터 수량" prop="deep_brand_filter_count">
          <el-input-number
            v-model="editForm.deep_brand_filter_count"
            :min="0"
            :max="100"
            placeholder="딥브랜드 필터 수량"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">취소</el-button>
        <el-button type="primary" @click="saveUserInfo" :loading="editLoading">
          저장
        </el-button>
      </template>
    </el-dialog>

    <!-- 계정 생성 다이얼로그 -->
    <el-dialog
      v-model="createDialogVisible"
      title="새 계정 생성"
      width="600px"
      :before-close="handleCreateClose"
    >
      <el-form 
        ref="createFormRef" 
        :model="createForm" 
        :rules="createFormRules"
        label-width="140px"
        v-loading="createLoading"
      >
        <el-form-item label="로그인 아이디" prop="id">
          <el-input
            v-model="createForm.id"
            placeholder="4글자 이상의 영문자와 숫자 조합"
            maxlength="20"
            show-word-limit
          />
          <div class="form-help">4글자 이상의 영문자와 숫자 조합</div>
        </el-form-item>

        <el-form-item label="비밀번호" prop="password">
          <el-input
            v-model="createForm.password"
            type="password"
            placeholder="8글자 이상, 숫자, 문자, 특수문자 포함"
            maxlength="50"
            show-password
          />
          <div class="form-help">8글자 이상, 숫자, 문자, 특수문자(@$!%*#?&) 포함</div>
        </el-form-item>



        <el-form-item label="이메일" prop="email">
          <el-input
            v-model="createForm.email"
            placeholder="유효한 이메일 주소"
            maxlength="100"
          />
        </el-form-item>

        <el-form-item label="플랜" prop="plan">
          <el-select v-model="createForm.plan" placeholder="플랜 선택">
            <el-option label="무료" value="free" />
            <el-option label="베이직" value="basic" />
            <el-option label="엔터프라이즈" value="enterprise" />
          </el-select>
        </el-form-item>

        <el-form-item label="만료일" prop="expired_at">
          <el-date-picker
            v-model="createForm.expired_at"
            type="date"
            placeholder="만료일 선택 (선택사항)"
            format="YYYY/MM/DD"
            value-format="YYYY/MM/DD"
          />
          <div class="form-help">선택사항 (기본값: 1년 후)</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createDialogVisible = false">취소</el-button>
        <el-button type="primary" @click="createAccount" :loading="createLoading">
          계정 생성
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { 
  Search, 
  Refresh, 
  User, 
  View, 
  CircleCheck, 
  Star, 
  Calendar,
  Edit,
  Plus
} from '@element-plus/icons-vue';
import { getUsersInfo, getUserByIdentifier, updateUserInfo, createLocalAccount } from '../../services/admin';

export default {
  name: 'UserManagement',
  setup() {
    const loading = ref(false);
    const users = ref([]);
    const selectedUser = ref(null);
    const detailDialogVisible = ref(false);
    const editDialogVisible = ref(false);
    const editFormRef = ref(null);
    const createDialogVisible = ref(false);
    const createFormRef = ref(null);
    
    // 필터 및 페이지네이션
    const filters = reactive({
      userid: ''
    });

    const searchIdentifier = ref('');
    
    const pagination = reactive({
      page: 1,
      limit: 10,
      total: 0
    });

    // 통계 계산
    const totalUsers = computed(() => users.value.length);
    const activeUsers = computed(() => users.value.filter(user => user.is_active).length);
    const premiumUsers = computed(() => users.value.filter(user => user.plan !== 'free').length);
    const newUsersToday = computed(() => {
      const today = new Date().toDateString();
      return users.value.filter(user => 
        user.created_at && new Date(user.created_at).toDateString() === today
      ).length;
    });

    // 사용자 정보 조회
    const loadUsers = async () => {
      loading.value = true;
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit
        };
        if (filters.userid) params.userid = filters.userid;
        
        const response = await getUsersInfo(params);
        if (response.success) {
          users.value = response.data || [];
          // API 응답에서 제공되는 실제 total 값 사용
          pagination.total = response.total || 0;
        }
      } catch (error) {
        ElMessage.error('사용자 정보 조회 중 오류가 발생했습니다.');
        console.error(error);
      } finally {
        loading.value = false;
      }
    };

    // 데이터 새로고침
    const refreshData = () => {
      filters.userid = '';
      searchIdentifier.value = '';
      pagination.page = 1;
      loadUsers();
    };

    // 행 클릭 처리
    const handleRowClick = (row) => {
      showUserDetail(row);
    };

    // 사용자 상세 정보 표시
    const showUserDetail = (user) => {
      selectedUser.value = user;
      detailDialogVisible.value = true;
    };

    // 상세 다이얼로그 닫기
    const handleDetailClose = () => {
      detailDialogVisible.value = false;
      selectedUser.value = null;
    };

    // 사용자 정보 수정 다이얼로그 표시
    const showEditDialog = (user) => {
      selectedUser.value = user; // 현재 행의 사용자 정보를 표시할 수 있도록 설정
      Object.assign(editForm, user); // 현재 행의 사용자 정보를 수정 폼에 반영
      if (editForm.expired_at) {
        editForm.expired_at = new Date(editForm.expired_at).toISOString().split('T')[0].replace(/-/g, '/');
      }
      editDialogVisible.value = true;
    };

    // 수정 다이얼로그 닫기
    const handleEditClose = () => {
      editDialogVisible.value = false;
      editFormRef.value?.resetFields(); // 폼 리셋
    };

    // 수정 폼 데이터
    const editForm = reactive({
      userid: '',
      name: '',
      email: '',
      plan: 'free',
      maximum_market_count: 3,
      expired_at: null,
      image_processing_allinone_count: 0,
      image_processing_single_count: 0,
      deep_brand_filter_count: 0
    });

    // 수정 폼 규칙
    const editFormRules = {
      userid: [{ required: true, message: '사용자 ID는 필수 입력입니다.', trigger: 'blur' }],
      name: [{ required: true, message: '이름은 필수 입력입니다.', trigger: 'blur' }],
      email: [{ type: 'email', message: '올바른 이메일 주소를 입력해주세요.', trigger: 'blur' }],
      plan: [{ required: true, message: '플랜을 선택해주세요.', trigger: 'change' }],
      maximum_market_count: [{ type: 'number', min: 1, max: 100, message: '1 이상 100 이하의 숫자를 입력해주세요.', trigger: 'blur' }],
      expired_at: [{ required: true, message: '만료일을 선택해주세요.', trigger: 'change' }],
      image_processing_allinone_count: [{ type: 'number', min: 0, max: 1000, message: '0 이상 1000 이하의 숫자를 입력해주세요.', trigger: 'blur' }],
      image_processing_single_count: [{ type: 'number', min: 0, max: 1000, message: '0 이상 1000 이하의 숫자를 입력해주세요.', trigger: 'blur' }],
      deep_brand_filter_count: [{ type: 'number', min: 0, max: 100, message: '0 이상 100 이하의 숫자를 입력해주세요.', trigger: 'blur' }]
    };

    // 수정 로딩 상태
    const editLoading = ref(false);

    // 계정 생성 폼 데이터
    const createForm = reactive({
      id: '',
      password: '',
      email: '',
      plan: 'free',
      expired_at: null
    });

    // 계정 생성 폼 유효성 검사 규칙
    const createFormRules = {
      id: [
        { required: true, message: '로그인 아이디는 필수 입력입니다.', trigger: 'blur' },
        { min: 4, message: '4글자 이상 입력해주세요.', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9]+$/, message: '영문자와 숫자만 입력 가능합니다.', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '비밀번호는 필수 입력입니다.', trigger: 'blur' },
        { min: 8, message: '8글자 이상 입력해주세요.', trigger: 'blur' },
        { pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/, message: '숫자, 문자, 특수문자(@$!%*#?&)를 포함해야 합니다.', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '이메일은 필수 입력입니다.', trigger: 'blur' },
        { type: 'email', message: '올바른 이메일 주소를 입력해주세요.', trigger: 'blur' }
      ],
      plan: [
        { required: true, message: '플랜을 선택해주세요.', trigger: 'change' }
      ]
    };

    // 계정 생성 로딩 상태
    const createLoading = ref(false);

    // 사용자 정보 수정 저장
    const saveUserInfo = async () => {
      if (!editFormRef.value) return;
      await editFormRef.value.validate(async (valid) => {
        if (valid) {
          editLoading.value = true;
          try {
            const identifier = editForm.email || editForm.id || editForm.userid;
            const updateData = {
              plan: editForm.plan,
              maximum_market_count: editForm.maximum_market_count,
              expired_at: editForm.expired_at,
              image_processing_allinone_count: editForm.image_processing_allinone_count,
              image_processing_single_count: editForm.image_processing_single_count,
              deep_brand_filter_count: editForm.deep_brand_filter_count
            };
            
            const response = await updateUserInfo(identifier, updateData);
            if (response.success) {
              ElMessage.success('사용자 정보가 성공적으로 수정되었습니다.');
              loadUsers(); // 테이블 새로고침
              editDialogVisible.value = false;
            } else {
              ElMessage.error(response.message || '사용자 정보 수정 중 오류가 발생했습니다.');
            }
          } catch (error) {
            ElMessage.error('사용자 정보 수정 중 오류가 발생했습니다.');
            console.error(error);
          } finally {
            editLoading.value = false;
          }
        }
      });
    };

    // 사용자 검색 (이메일 또는 사용자 ID로)
    const searchUser = async () => {
      if (!searchIdentifier.value) {
        ElMessage.warning('검색어를 입력해주세요.');
        return;
      }
      loading.value = true;
      try {
        const response = await getUserByIdentifier(searchIdentifier.value);
        if (response.success) {
          users.value = response.data ? [response.data] : [];
          pagination.total = response.data ? 1 : 0;
          if (!response.data) {
            ElMessage.warning(`"${searchIdentifier.value}" 사용자를 찾을 수 없습니다.`);
          }
        } else {
          ElMessage.error(response.message || '사용자 검색 중 오류가 발생했습니다.');
        }
      } catch (error) {
        ElMessage.error('사용자 검색 중 오류가 발생했습니다.');
        console.error(error);
      } finally {
        loading.value = false;
      }
    };

    // 계정 생성 다이얼로그 표시
    const showCreateDialog = () => {
      createDialogVisible.value = true;
    };

    // 계정 생성 다이얼로그 닫기
    const handleCreateClose = () => {
      createDialogVisible.value = false;
      createFormRef.value?.resetFields();
      Object.assign(createForm, {
        id: '',
        password: '',
        email: '',
        plan: 'free',
        expired_at: null
      });
    };

    // 계정 생성
    const createAccount = async () => {
      if (!createFormRef.value) return;
      await createFormRef.value.validate(async (valid) => {
        if (valid) {
          createLoading.value = true;
          try {
            const accountData = {
              id: createForm.id,
              password: createForm.password,
              email: createForm.email,
              plan: createForm.plan
            };
            
            if (createForm.expired_at) {
              accountData.expired_at = createForm.expired_at;
            }

            const response = await createLocalAccount(accountData);
            if (response.success) {
              ElMessage.success(`계정이 성공적으로 생성되었습니다. (사용자 ID: ${response.userid})`);
              loadUsers(); // 테이블 새로고침
              createDialogVisible.value = false;
              handleCreateClose(); // 폼 초기화
            } else {
              ElMessage.error(response.message || '계정 생성 중 오류가 발생했습니다.');
            }
          } catch (error) {
            ElMessage.error('계정 생성 중 오류가 발생했습니다.');
            console.error(error);
          } finally {
            createLoading.value = false;
          }
        }
      });
    };

    // 유틸리티 함수들
    const formatDate = (dateString) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('ko-KR');
    };

    const getLoginTypeTagType = (type) => {
      switch (type) {
        case 'naver': return 'success';
        case 'local': return 'info';
        case 'both': return 'warning';
        default: return '';
      }
    };

    const getLoginTypeText = (type) => {
      switch (type) {
        case 'naver': return '네이버';
        case 'local': return '로컬';
        case 'both': return '통합';
        default: return type;
      }
    };

    const getPlanTagType = (plan) => {
      switch (plan) {
        case 'free': return '';
        case 'basic': return 'warning';
        case 'enterprise': return 'danger';
        default: return '';
      }
    };

    const getPlanText = (plan) => {
      switch (plan) {
        case 'free': return '무료';
        case 'basic': return '베이직';
        case 'enterprise': return '엔터프라이즈';
        default: return plan;
      }
    };

    // 초기 로드
    onMounted(() => {
      loadUsers();
    });

    return {
      loading,
      users,
      selectedUser,
      detailDialogVisible,
      editDialogVisible,
      editFormRef,
      createDialogVisible,
      createFormRef,
      filters,
      searchIdentifier,
      pagination,
      totalUsers,
      activeUsers,
      premiumUsers,
      newUsersToday,
      loadUsers,
      refreshData,
      handleRowClick,
      showUserDetail,
      handleDetailClose,
      showEditDialog,
      handleEditClose,
      editForm,
      editFormRules,
      editLoading,
      saveUserInfo,
      searchUser,
      showCreateDialog,
      handleCreateClose,
      createForm,
      createFormRules,
      createLoading,
      createAccount,
      formatDate,
      getLoginTypeTagType,
      getLoginTypeText,
      getPlanTagType,
      getPlanText,
      Search,
      Refresh,
      User,
      View,
      CircleCheck,
      Star,
      Calendar,
      Edit,
      Plus
    };
  }
};
</script>

<style scoped>
.user-management {
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

.filter-section {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--el-bg-color-page);
  border-radius: var(--el-border-radius-base);
}

.stats-section {
  margin-bottom: var(--spacing-lg);
}

.stat-card {
  box-shadow: var(--el-box-shadow-light);
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color-light);
}

.stat-card:hover {
  border-color: var(--el-color-primary-light-7);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.primary {
  background-color: var(--el-color-primary);
}

.stat-icon.success {
  background-color: var(--el-color-success);
}

.stat-icon.warning {
  background-color: var(--el-color-warning);
}

.stat-icon.info {
  background-color: var(--el-color-info);
}

.stat-text h3 {
  margin: 0;
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
}

.stat-text p {
  margin: 0;
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
}

.user-table {
  margin-bottom: var(--spacing-lg);
}

.user-table .el-table__row {
  cursor: pointer;
}

.user-table .el-table__row:hover {
  background-color: var(--el-color-primary-light-9);
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-lg);
}

.user-detail {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.detail-card {
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-light);
}

.detail-card h3 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-weight: var(--el-font-weight-semibold);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .user-management {
    padding: var(--spacing-md);
  }
  
  .page-title {
    font-size: var(--el-font-size-large);
  }
  
  .filter-section {
    padding: var(--spacing-sm);
  }
  
  .stats-section .el-col {
    margin-bottom: var(--spacing-md);
  }
  
  .stat-content {
    gap: var(--spacing-sm);
  }
  
  .stat-icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
}

/* 폼 도움말 텍스트 */
.form-help {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
  margin-top: var(--spacing-xs);
}
</style> 