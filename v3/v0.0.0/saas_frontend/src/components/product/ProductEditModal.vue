<template>
  <div class="modal-overlay" @mousedown.self="closeModal">
    <div class="modal-container">
      <div class="modal-header">
        <h3>상품 정보 수정</h3>
        <button @click="closeModal" class="close-btn">&times;</button>
      </div>
      
      <div v-if="loading" class="loading">
        상품 정보를 불러오는 중...
      </div>
      
      <div v-else class="modal-content">
        <!-- 상품명 수정 -->
        <div class="form-section">
          <label class="form-label">상품명</label>
          <input 
            type="text" 
            v-model="productData.title_optimized"
            class="form-input"
            placeholder="상품명을 입력하세요"
          />
        </div>

        <!-- 키워드 수정 -->
        <div class="form-section">
          <label class="form-label">키워드 (쉼표로 구분)</label>
          <textarea 
            v-model="productData.keywords"
            class="form-textarea"
            placeholder="키워드1, 키워드2, 키워드3"
            rows="3"
          ></textarea>
        </div>

        <!-- 메인 이미지 섹션 -->
        <div class="form-section">
          <label class="form-label">메인 이미지</label>
          <div class="image-grid">
            <div 
              v-for="(image, index) in productData.main_images" 
              :key="'main-' + index"
              class="image-item"
              :class="{ 'representative': image.is_representative }"
            >
              <img 
                :src="image.imageurl" 
                :alt="`메인 이미지 ${index + 1}`"
                @click="openImageZoom(image.imageurl)"
                class="zoomable-image"
              />
              <div class="image-controls">
                <button 
                  @click="setRepresentativeImage('main', image.imageorder)"
                  class="control-btn representative-btn"
                  :class="{ active: image.is_representative }"
                >
                  대표
                </button>
                <button 
                  @click="deleteImage('main', image.imageorder)"
                  class="control-btn delete-btn"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 누끼 이미지 섹션 -->
        <div class="form-section" v-if="productData.nukki_images?.length > 0">
          <label class="form-label">누끼 이미지</label>
          <div class="image-grid">
            <div 
              v-for="(image, index) in productData.nukki_images" 
              :key="'nukki-' + index"
              class="image-item"
              :class="{ 'representative': representativeImageType === 'nukki' && representativeImageOrder === image.image_order }"
            >
              <img 
                :src="image.image_url" 
                :alt="`누끼 이미지 ${index + 1}`"
                @click="openImageZoom(image.image_url)"
                class="zoomable-image"
              />
              <div class="image-controls">
                <button 
                  @click="setRepresentativeImage('nukki', image.image_order)"
                  class="control-btn representative-btn"
                  :class="{ active: representativeImageType === 'nukki' && representativeImageOrder === image.image_order }"
                >
                  대표
                </button>
                <button 
                  @click="deleteImage('nukki', image.image_order)"
                  class="control-btn delete-btn"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 상세 이미지 섹션 -->
        <div class="form-section" v-if="productData.description_images?.length > 0">
          <label class="form-label">상세 이미지</label>
          <div class="image-grid">
            <div 
              v-for="(image, index) in productData.description_images" 
              :key="'desc-' + index"
              class="image-item"
            >
              <img 
                :src="image.imageurl" 
                :alt="`상세 이미지 ${index + 1}`"
                @click="openImageZoom(image.imageurl)"
                class="zoomable-image"
              />
              <div class="image-controls">
                <button 
                  @click="deleteImage('description', image.imageorder)"
                  class="control-btn delete-btn"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 속성 정보 -->
        <div class="form-section" v-if="productData.properties?.length > 0">
          <label class="form-label">상품 속성</label>
          <div class="properties-list">
            <div 
              v-for="(property, index) in productData.properties" 
              :key="'prop-' + index"
              class="property-item"
            >
              <div class="property-field">
                <label>속성명:</label>
                <input 
                  type="text" 
                  v-model="property.property_name"
                  class="property-input"
                />
              </div>
              <div class="property-field">
                <label>속성값:</label>
                <input 
                  type="text" 
                  v-model="property.property_value"
                  class="property-input"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 옵션 정보 -->
        <div class="form-section" v-if="productData.options?.length > 0">
          <label class="form-label">상품 옵션</label>
          <div class="options-list">
            <div 
              v-for="(option, index) in productData.options" 
              :key="'opt-' + index"
              class="option-item"
            >
              <div class="option-info">
                <div class="option-field">
                  <label>옵션명:</label>
                  <input 
                    type="text" 
                    v-model="option.private_optionname"
                    class="option-input"
                  />
                </div>
                <div class="option-field">
                  <label>옵션값:</label>
                  <input 
                    type="text" 
                    v-model="option.private_optionvalue"
                    class="option-input"
                  />
                </div>
              </div>
              <div v-if="option.private_imageurl" class="option-image">
                <img 
                  :src="option.private_imageurl" 
                  :alt="option.private_optionname"
                  @click="openImageZoom(option.private_imageurl)"
                  class="zoomable-image"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="closeModal" class="cancel-btn">취소</button>
        <button @click="saveChanges" :disabled="saving" class="save-btn">
          {{ saving ? '저장 중...' : '확인' }}
        </button>
      </div>
    </div>

    <!-- 이미지 확대 모달 -->
    <div v-if="showImageZoom" class="image-zoom-overlay" @click="closeImageZoom">
      <div class="image-zoom-container" @click.stop>
        <button @click="closeImageZoom" class="zoom-close-btn">&times;</button>
        <img :src="zoomedImageUrl" :alt="'확대된 이미지'" class="zoomed-image" @click="closeImageZoom" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { getProductDetail, updateProductInfo } from '../../services/inspection';

export default {
  name: 'ProductEditModal',
  props: {
    productId: {
      type: Number,
      required: true
    }
  },
  emits: ['close', 'updated'],
  setup(props, { emit }) {
    const loading = ref(false);
    const saving = ref(false);
    const representativeImageType = ref('main'); // 'main' or 'nukki'
    const representativeImageOrder = ref(0);
    const showImageZoom = ref(false);
    const zoomedImageUrl = ref('');
    
    const productData = reactive({
      product_info: {},
      main_images: [],
      nukki_images: [],
      description_images: [],
      properties: [],
      options: [],
      title_optimized: '',
      keywords: ''
    });

    const deletedImages = reactive({
      main: [],
      description: [],
      nukki: []
    });

    // 상품 상세 정보 로드
    const loadProductDetail = async () => {
      try {
        loading.value = true;
        const response = await getProductDetail(props.productId);
        
        Object.assign(productData, response.data);
        productData.title_optimized = response.data.product_info.title_optimized || '';
        productData.keywords = response.data.product_info.keywords || '';
        
        // 대표 이미지 설정
        const representativeMain = productData.main_images.find(img => img.is_representative);
        if (representativeMain) {
          representativeImageType.value = 'main';
          representativeImageOrder.value = representativeMain.imageorder;
        }
      } catch (error) {
        console.error('상품 상세 정보 로딩 실패:', error);
        // 서버로부터 받은 에러 메시지 사용
        const errorMessage = error.response?.data?.message || '상품 정보를 불러오는데 실패했습니다.';
        ElMessage.error(errorMessage);
      } finally {
        loading.value = false;
      }
    };

    // 대표 이미지 설정
    const setRepresentativeImage = (type, order) => {
      representativeImageType.value = type;
      representativeImageOrder.value = order;
      
      // 메인 이미지들의 representative 상태 업데이트
      productData.main_images.forEach(img => {
        img.is_representative = (type === 'main' && img.imageorder === order);
      });
    };

    // 이미지 삭제
    const deleteImage = (type, order) => {
      deletedImages[type].push(order);
      
      if (type === 'main') {
        productData.main_images = productData.main_images.filter(img => img.imageorder !== order);
      } else if (type === 'description') {
        productData.description_images = productData.description_images.filter(img => img.imageorder !== order);
      } else if (type === 'nukki') {
        productData.nukki_images = productData.nukki_images.filter(img => img.image_order !== order);
      }
    };

    // 변경사항 저장
    const saveChanges = async () => {
      try {
        saving.value = true;
        
        const updateData = {
          productid: props.productId,
          title_optimized: productData.title_optimized,
          keywords: productData.keywords,
          // 대표 이미지 정보를 더 명확하게 전달
          representative_image_type: representativeImageType.value, // 'main' 또는 'nukki'
          representative_image_order: representativeImageOrder.value,
          deleted_main_images: deletedImages.main,
          deleted_description_images: deletedImages.description,
          deleted_nukki_images: deletedImages.nukki,
          updated_options: productData.options.map(option => ({
            prop_path: option.prop_path,
            private_optionname: option.private_optionname,
            private_optionvalue: option.private_optionvalue
          })),
          updated_properties: productData.properties.map(property => ({
            property_order: property.property_order,
            property_name: property.property_name,
            property_value: property.property_value
          }))
        };

        await updateProductInfo(updateData);
        ElMessage.success('상품 정보가 성공적으로 수정되었습니다.');
        emit('updated');
        closeModal();
      } catch (error) {
        console.error('상품 정보 수정 실패:', error);
        // 서버로부터 받은 에러 메시지 사용
        const errorMessage = error.response?.data?.message || '상품 정보 수정에 실패했습니다.';
        ElMessage.error(errorMessage);
      } finally {
        saving.value = false;
      }
    };

    // 모달 닫기
    const closeModal = () => {
      emit('close');
    };

    // 이미지 확대 열기
    const openImageZoom = (imageUrl) => {
      zoomedImageUrl.value = imageUrl;
      showImageZoom.value = true;
      // ESC 키 이벤트 리스너 추가
      document.addEventListener('keydown', handleEscKey);
    };

    // 이미지 확대 닫기
    const closeImageZoom = () => {
      showImageZoom.value = false;
      zoomedImageUrl.value = '';
      // ESC 키 이벤트 리스너 제거
      document.removeEventListener('keydown', handleEscKey);
    };

    // ESC 키 핸들러
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        closeImageZoom();
      }
    };

    // 초기 로드
    onMounted(() => {
      loadProductDetail();
    });

    return {
      loading,
      saving,
      productData,
      representativeImageType,
      representativeImageOrder,
      showImageZoom,
      zoomedImageUrl,
      setRepresentativeImage,
      deleteImage,
      saveChanges,
      closeModal,
      openImageZoom,
      closeImageZoom
    };
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--el-box-shadow-dark);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-xl);
  border-bottom: 1px solid var(--el-border-color-light);
}

.modal-header h3 {
  margin: 0;
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: var(--el-text-color-primary);
}

.loading {
  text-align: center;
  padding: var(--spacing-xxl) 0;
  font-size: var(--el-font-size-medium);
  color: var(--el-text-color-secondary);
}

.modal-content {
  padding: var(--spacing-xl);
}

.form-section {
  margin-bottom: var(--spacing-xl);
}

.form-label {
  display: block;
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-primary);
  margin-bottom: var(--spacing-sm);
  font-size: var(--el-font-size-small);
}

.form-input, .form-textarea {
  width: 100%;
  padding: var(--spacing-sm);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  font-size: var(--el-font-size-small);
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
}

.image-item {
  position: relative;
  border: 2px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
  background: var(--el-bg-color);
  transition: all 0.2s ease;
}

.image-item.representative {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
}

.image-item img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}

.image-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs);
}

.control-btn {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: none;
  border-radius: var(--el-border-radius-small);
  cursor: pointer;
  font-size: var(--el-font-size-extra-small);
  color: var(--el-color-white);
  font-weight: var(--el-font-weight-medium);
  transition: all 0.2s ease;
}

.representative-btn {
  background: var(--el-color-info);
}

.representative-btn.active {
  background: var(--el-color-primary);
}

.delete-btn {
  background: var(--el-color-danger);
}

.delete-btn:hover {
  background: var(--el-color-danger);
  opacity: 0.9;
}

.properties-list {
  display: grid;
  gap: var(--spacing-md);
}

.property-item {
  display: grid;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  background: var(--el-bg-color-page);
}

.property-field {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: var(--spacing-sm);
  align-items: center;
}

.property-field label {
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-regular);
}

.property-input {
  padding: var(--spacing-sm);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-small);
  font-size: var(--el-font-size-small);
  transition: border-color 0.2s ease;
}

.property-input:focus {
  outline: none;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
}

.options-list {
  display: grid;
  gap: var(--spacing-md);
}

.option-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  background: var(--el-bg-color-page);
}

.option-info {
  display: grid;
  gap: var(--spacing-sm);
}

.option-field {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: var(--spacing-sm);
  align-items: center;
}

.option-field label {
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-regular);
}

.option-input {
  padding: var(--spacing-sm);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-small);
  font-size: var(--el-font-size-small);
  transition: border-color 0.2s ease;
}

.option-input:focus {
  outline: none;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
}

.option-image {
  width: 80px;
  height: 80px;
}

.option-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  border-top: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color-page);
}

.cancel-btn, .save-btn {
  padding: var(--spacing-sm) var(--spacing-xl);
  border: none;
  border-radius: var(--el-border-radius-base);
  cursor: pointer;
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-medium);
  transition: all 0.2s ease;
}

.cancel-btn {
  background: var(--el-color-info);
  color: var(--el-color-white);
}

.cancel-btn:hover {
  background: var(--el-color-info);
  opacity: 0.9;
  transform: translateY(-1px);
}

.save-btn {
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

.save-btn:hover:not(:disabled) {
  background: var(--el-color-primary-light-3);
  transform: translateY(-1px);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    max-height: 95vh;
  }
  
  .image-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .option-item {
    grid-template-columns: 1fr;
  }
  
  .option-field {
    grid-template-columns: 1fr;
  }
}

/* 이미지 확대 모달 스타일 추가 */
.image-zoom-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000; /* 기본 모달보다 높은 z-index */
  backdrop-filter: blur(2px);
}

.image-zoom-container {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-lg);
  box-shadow: var(--el-box-shadow-dark);
}

.zoom-close-btn {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: var(--el-border-radius-circle);
  width: 40px;
  height: 40px;
  color: var(--el-color-white);
  font-size: var(--el-font-size-large);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2001;
  transition: background-color 0.2s ease;
}

.zoom-close-btn:hover {
  background: rgba(0, 0, 0, 0.9);
}

.zoomed-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  display: block;
  border-radius: 4px;
}

.zoomable-image {
  cursor: zoom-in;
  transition: opacity 0.2s;
}

.zoomable-image:hover {
  opacity: 0.8;
}
</style> 