<template>
  <div class="detail-page-setting">
    <div class="page-header">
      <h2 class="page-title">상세페이지설정</h2>
      <p class="page-description">상품 상세페이지에 표시될 이미지와 설정을 관리하세요.</p>
    </div>

    <!-- 로딩 상태 -->
    <AppLoading v-if="loading" text="설정 정보를 불러오고 있습니다..." />

    <!-- 설정 폼 -->
    <div v-else class="content-container">
      <div class="content-area">
        <el-form
          ref="formRef"
          :model="formData"
          label-position="top"
          class="setting-form"
          @submit.prevent="handleSubmit"
        >
          <!-- 상단 이미지 설정 -->
          <div class="form-section">
            <h3 class="section-title">상단 이미지 설정</h3>
            <p class="section-description">상세페이지 맨 앞에 표시될 이미지를 설정하세요. (최대 3개)</p>
            <div class="image-upload-grid">
              <div 
                v-for="(image, index) in formData.top_images" 
                :key="`top-${index}`"
                class="image-upload-item"
              >
                <div class="image-preview" v-if="image.url">
                  <img :src="image.url" :alt="`상단 이미지 ${index + 1}`" />
                  <div class="image-overlay">
                    <el-button
                      type="danger"
                      size="small"
                      :icon="Delete"
                      circle
                      @click="removeImage('top_images', index)"
                    />
                  </div>
                </div>
                <div v-else class="image-upload-placeholder">
                  <el-upload
                    class="image-uploader"
                    :show-file-list="false"
                    :before-upload="(file) => beforeImageUpload(file, 'top_images', index)"
                    accept="image/*"
                  >
                    <el-icon class="upload-icon"><Plus /></el-icon>
                    <div class="upload-text">이미지 업로드</div>
                  </el-upload>
                </div>
              </div>
            </div>
          </div>

          <!-- 하단 이미지 설정 -->
          <div class="form-section">
            <h3 class="section-title">하단 이미지 설정</h3>
            <p class="section-description">상세페이지 맨 뒤에 표시될 이미지를 설정하세요. (최대 3개)</p>
            <div class="image-upload-grid">
              <div 
                v-for="(image, index) in formData.bottom_images" 
                :key="`bottom-${index}`"
                class="image-upload-item"
              >
                <div class="image-preview" v-if="image.url">
                  <img :src="image.url" :alt="`하단 이미지 ${index + 1}`" />
                  <div class="image-overlay">
                    <el-button
                      type="danger"
                      size="small"
                      :icon="Delete"
                      circle
                      @click="removeImage('bottom_images', index)"
                    />
                  </div>
                </div>
                <div v-else class="image-upload-placeholder">
                  <el-upload
                    class="image-uploader"
                    :show-file-list="false"
                    :before-upload="(file) => beforeImageUpload(file, 'bottom_images', index)"
                    accept="image/*"
                  >
                    <el-icon class="upload-icon"><Plus /></el-icon>
                    <div class="upload-text">이미지 업로드</div>
                  </el-upload>
                </div>
              </div>
            </div>
          </div>

          <!-- 상세페이지 옵션 설정 -->
          <div class="form-section">
            <h3 class="section-title">상세페이지 옵션 설정</h3>
            <el-row :gutter="32">
              <el-col :xs="24" :sm="12">
                <el-form-item label="속성 포함 여부" prop="include_properties">
                  <div class="option-with-tooltip">
                    <el-switch
                      v-model="formData.include_properties"
                      size="large"
                      active-text="포함"
                      inactive-text="미포함"
                    />
                    <el-tooltip
                      placement="top"
                      :show-after="500"
                      popper-class="example-tooltip"
                    >
                      <template #content>
                        <div class="tooltip-content">
                          <img src="../../assets/property.png" alt="속성 포함 예시" class="tooltip-image" />
                          <p>속성 정보가 포함된 상세페이지 예시</p>
                        </div>
                      </template>
                      <el-icon class="tooltip-icon">
                        <QuestionFilled />
                      </el-icon>
                    </el-tooltip>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="옵션 포함 여부" prop="include_options">
                  <div class="option-with-tooltip">
                    <el-switch
                      v-model="formData.include_options"
                      size="large"
                      active-text="포함"
                      inactive-text="미포함"
                    />
                    <el-tooltip
                      placement="top"
                      :show-after="500"
                      popper-class="example-tooltip"
                    >
                      <template #content>
                        <div class="tooltip-content">
                          <img src="../../assets/option.png" alt="옵션 포함 예시" class="tooltip-image" />
                          <p>옵션 정보가 포함된 상세페이지 예시</p>
                        </div>
                      </template>
                      <el-icon class="tooltip-icon">
                        <QuestionFilled />
                      </el-icon>
                    </el-tooltip>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 저장 버튼 -->
          <div class="form-actions">
            <el-button 
              type="primary" 
              size="large"
              :disabled="saving"
              :loading="saving"
              :icon="Check"
              @click="handleSubmit"
            >
              설정 저장
            </el-button>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { Check, Delete, Plus, QuestionFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import AppLoading from '../../components/app/loading.vue';
import { getDetailPageSetting, updateDetailPageSetting } from '@/services/settings';

export default {
  name: 'DetailPageSetting',
  components: {
    AppLoading
  },
  setup() {
    const formRef = ref();
    const loading = ref(false);
    const saving = ref(false);

    
    const formData = ref({
      top_images: [
        { url: '', file: null, changed: false },
        { url: '', file: null, changed: false },
        { url: '', file: null, changed: false }
      ],
      bottom_images: [
        { url: '', file: null, changed: false },
        { url: '', file: null, changed: false },
        { url: '', file: null, changed: false }
      ],
      include_properties: true,
      include_options: true
    });

    const loadSettings = async () => {
      loading.value = true;
      
      try {
        const response = await getDetailPageSetting();
        if (response.success && response.data) {
          formData.value = {
            ...response.data,
            top_images: response.data.top_images || formData.value.top_images,
            bottom_images: response.data.bottom_images || formData.value.bottom_images,
            // 숫자형을 boolean으로 변환
            include_properties: Boolean(response.data.include_properties),
            include_options: Boolean(response.data.include_options)
          };
        }
      } catch (err) {
        ElMessage.error(err.response?.data?.message || '설정 정보를 불러오는데 실패했습니다.');
        console.error('상세페이지 설정 로드 실패:', err);
      } finally {
        loading.value = false;
      }
    };

    const beforeImageUpload = (file, imageType, index) => {
      const isImage = file.type.startsWith('image/');
      const isLt5M = file.size / 1024 / 1024 < 5;

      if (!isImage) {
        ElMessage.error('이미지 파일만 업로드 가능합니다!');
        return false;
      }
      if (!isLt5M) {
        ElMessage.error('이미지 크기는 5MB를 초과할 수 없습니다!');
        return false;
      }

      // 이미지 미리보기를 위한 URL 생성
      const imageUrl = URL.createObjectURL(file);
      formData.value[imageType][index] = {
        url: imageUrl,
        file: file,
        changed: true
      };

      return false; // 자동 업로드 방지
    };

    const removeImage = (imageType, index) => {
      const currentImage = formData.value[imageType][index];
      
      // 메모리 해제 (Blob URL인 경우만)
      if (currentImage.url && currentImage.url.startsWith('blob:')) {
        URL.revokeObjectURL(currentImage.url);
      }
      
      // 이미지 삭제 상태로 설정
      formData.value[imageType][index] = {
        url: '',
        file: null,
        changed: true // 삭제도 변경사항으로 인식
      };
    };

    const handleSubmit = async () => {
      saving.value = true;

      try {
        // 변경된 이미지가 있는지 확인 (추가/수정/삭제 모두 포함)
        const hasChangedImages = [...formData.value.top_images, ...formData.value.bottom_images]
          .some(image => image.changed);

        const submitData = {
          include_properties: formData.value.include_properties,
          include_options: formData.value.include_options
        };

        // 이미지 변경사항이 있으면 항상 이미지 데이터 포함 (삭제도 변경사항)
        if (hasChangedImages) {
          submitData.top_images = formData.value.top_images;
          submitData.bottom_images = formData.value.bottom_images;
        }

        const response = await updateDetailPageSetting(submitData);
        if (response.success) {
          ElMessage.success('설정이 성공적으로 저장되었습니다.');
          // 변경 상태 초기화
          formData.value.top_images.forEach(img => img.changed = false);
          formData.value.bottom_images.forEach(img => img.changed = false);
        }
      } catch (err) {
        ElMessage.error(err.response?.data?.message || '설정 저장에 실패했습니다.');
        console.error('상세페이지 설정 저장 실패:', err);
      } finally {
        saving.value = false;
      }
    };

    onMounted(() => {
      loadSettings();
    });

    return {
      formRef,
      loading,
      saving,
      formData,
      beforeImageUpload,
      removeImage,
      handleSubmit,
      Check,
      Delete,
      Plus,
      QuestionFilled
    };
  }
}
</script>

<style scoped>
.detail-page-setting {
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
  overflow-y: auto;
  padding: var(--spacing-md);
}

.content-area {
  max-width: 1200px;
  margin: 0 auto;
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-xl);
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-lighter);
}

.setting-form {
  width: 100%;
}

.form-section {
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--el-border-color-light);
}

.form-section:last-of-type {
  border-bottom: none;
  margin-bottom: var(--spacing-lg);
}

.section-title {
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
  margin: 0 0 var(--spacing-sm) 0;
  display: flex;
  align-items: center;
}

.section-title:before {
  content: '';
  width: 4px;
  height: 20px;
  background-color: var(--el-color-primary);
  margin-right: var(--spacing-sm);
  border-radius: 2px;
}

.section-description {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
  margin: 0 0 var(--spacing-lg) 0;
}

/* 이미지 업로드 */
.image-upload-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.image-upload-item {
  aspect-ratio: 16/9;
  border: 2px dashed var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
  position: relative;
  transition: all 0.2s ease;
}

.image-upload-item:hover {
  border-color: var(--el-color-primary);
}

.image-preview {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.image-preview:hover .image-overlay {
  opacity: 1;
}

.image-upload-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-uploader {
  width: 100%;
  height: 100%;
}

:deep(.image-uploader .el-upload) {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

:deep(.image-uploader .el-upload:hover) {
  color: var(--el-color-primary);
}

.upload-icon {
  font-size: 32px;
  color: var(--el-text-color-placeholder);
  margin-bottom: var(--spacing-xs);
}

.upload-text {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
}

/* 옵션 설정 */
.option-with-tooltip {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.tooltip-icon {
  color: var(--el-text-color-placeholder);
  cursor: help;
  transition: color 0.2s ease;
}

.tooltip-icon:hover {
  color: var(--el-color-primary);
}

.tooltip-content {
  text-align: center;
}

.tooltip-image {
  max-width: 400px;
  max-height: 300px;
  border-radius: var(--el-border-radius-base);
  margin-bottom: var(--spacing-xs);
}

/* 폼 액션 */
.form-actions {
  text-align: center;
  padding-top: var(--spacing-lg);
}

/* Element Plus 커스터마이징 */
:deep(.el-form-item__label) {
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-small);
}

:deep(.el-switch__label) {
  font-size: var(--el-font-size-small);
}

:deep(.example-tooltip) {
  max-width: 250px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .content-container {
    padding: var(--spacing-sm);
  }
  
  .page-header {
    padding: var(--spacing-sm);
  }
  
  .content-area {
    padding: var(--spacing-lg);
  }
  
  .page-title {
    font-size: var(--el-font-size-large);
  }

  .image-upload-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 992px) and (min-width: 769px) {
  .image-upload-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
