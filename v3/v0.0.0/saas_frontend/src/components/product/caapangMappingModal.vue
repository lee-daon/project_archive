<template>
  <div v-if="isVisible" class="modal-overlay" @mousedown="closeModal">
    <div class="modal-container" @mousedown.stop>
      <!-- 모달 헤더 -->
      <div class="modal-header">
        <h3>쿠팡 옵션 매핑</h3>
        <button @click="closeModal" class="close-button">×</button>
      </div>

      <!-- 로딩 상태 -->
      <div v-if="loading" class="modal-loading">
        <div class="loading-spinner"></div>
        <p>매핑 데이터를 불러오는 중...</p>
      </div>

      <!-- 에러 상태 -->
      <div v-else-if="error" class="modal-error">
        <div class="error-icon">⚠️</div>
        <h4>데이터 로딩 실패</h4>
        <p>{{ error }}</p>
        <button @click="loadMappingData" class="btn btn-primary">다시 시도</button>
      </div>

      <!-- 메인 컨텐츠 -->
      <div v-else class="modal-content">
        <!-- 상품 정보 -->
        <div class="product-info">
          <img :src="getMainImage()" :alt="productInfo?.title" class="product-image" />
          <div class="product-details">
            <h4>{{ productInfo?.title }}</h4>
            <p>상품 ID: {{ productInfo?.productid }}</p>
          </div>
        </div>

        <!-- 옵션 매핑 -->
        <div class="mapping-section">
          <div class="section-header">
            <h5>옵션 매핑</h5>
            <button @click="addNewOption" :disabled="mappedOptions.length >= 3" class="btn btn-sm">
              + 새 옵션 추가 ({{ mappedOptions.length }}/3)
            </button>
          </div>

          <div v-if="mappedOptions.length" class="options-list">
            <div v-for="(option, index) in mappedOptions" :key="option.id" class="option-card">
                             <div class="option-header">
                 <select v-model="option.coupangName" class="coupang-select" @change="updateVariants">
                   <option value="">쿠팡 속성 선택</option>
                   <option v-for="attr in categoryAttributes" :key="attr.name" :value="attr.name">
                     {{ attr.name }} ({{ attr.required }}){{ attr.basicUnit ? ' - ' + attr.basicUnit : '' }}
                   </option>
                 </select>
                 <button @click="removeOption(index)" class="btn btn-danger btn-sm">삭제</button>
               </div>

              <div class="option-info">
                <div v-if="option.isOriginal" class="original-info">
                  <span class="label">원본 옵션:</span>
                  <span class="value">{{ option.originalName }}</span>
                  <div class="values">
                    <span v-for="value in option.values" :key="value.id" class="value-tag">
                      {{ value.name }}
                    </span>
                  </div>
                </div>
                <div v-else class="new-option-values">
                  <span class="label">새 옵션 값들:</span>
                  <div v-if="getSelectedAttribute(option)" class="attribute-info">
                    <small class="text-muted">
                      타입: {{ getSelectedAttribute(option).dataType }}
                      {{ getSelectedAttribute(option).basicUnit ? ' | 단위: ' + getSelectedAttribute(option).basicUnit : '' }}
                    </small>
                  </div>
                  <div class="values-input">
                    <div v-for="(value, vIndex) in option.values" :key="value.id" class="value-input-row">
                      <!-- SELECT 타입인 경우 드롭다운 -->
                      <select 
                        v-if="isSelectType(option)"
                        v-model="value.name" 
                        class="value-select"
                        @change="updateVariants"
                      >
                        <option value="">값 선택</option>
                        <option 
                          v-for="inputValue in getInputValues(option)" 
                          :key="inputValue" 
                          :value="inputValue"
                        >
                          {{ inputValue }}
                        </option>
                      </select>
                      
                      <!-- 일반 입력 타입 -->
                      <input 
                        v-else
                        v-model="value.name" 
                        type="text" 
                        :placeholder="getValuePlaceholder(option)"
                        class="value-input"
                        @input="validateValue(option, value, $event)"
                        @blur="formatValue(option, value)"
                      />
                      
                      <button @click="removeValue(index, vIndex)" class="btn btn-sm btn-danger">×</button>
                    </div>
                    <button @click="addValue(index)" class="btn btn-outline btn-sm">+ 값 추가</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="no-options">
            매핑할 옵션이 없습니다. 새 옵션을 추가하거나 원본 옵션을 가져오세요.
            <div class="init-buttons">
              <button @click="loadOriginalOptions" v-if="originalData?.optionSchema?.length" class="btn btn-outline">
                원본 옵션 가져오기
              </button>
            </div>
          </div>
        </div>

        <!-- 제약조건 검증 -->
        <div class="validation-section">
          <h5>제약조건 검증</h5>
          <div class="validation-list">
            <div v-for="validation in validationResults" :key="validation.type" 
                 :class="['validation-item', validation.status]">
              <span class="validation-icon">{{ getValidationIcon(validation.status) }}</span>
              <span class="validation-text">{{ validation.message }}</span>
            </div>
          </div>
        </div>

        <!-- 변형 미리보기 -->
        <div v-if="previewVariants.length" class="preview-section">
          <h5>변형 미리보기 ({{ previewVariants.length }}개)</h5>
          <div class="preview-list">
            <div v-for="(variant, index) in previewVariants.slice(0, 8)" :key="index" class="preview-item">
              <span class="price">{{ formatPrice(variant.price) }}위안</span>
              <span class="stock">재고: {{ variant.stockQuantity }}</span>
              <div class="combinations">
                <span v-for="combo in variant.optionCombination" :key="combo.optionId + combo.valueId" class="combo">
                  {{ getComboText(combo) }}
                </span>
              </div>
            </div>
            <div v-if="previewVariants.length > 8" class="more-items">
              + {{ previewVariants.length - 8 }}개 더...
            </div>
          </div>
        </div>
      </div>

      <!-- 모달 푸터 -->
      <div v-if="!loading && !error" class="modal-footer">
        <div class="footer-left">
          <button @click="discardProduct" :disabled="isDiscarding" class="btn btn-danger">
            {{ isDiscarding ? '폐기 중...' : '폐기' }}
          </button>
        </div>
        <div class="footer-right">
          <button @click="closeModal" class="btn">취소</button>
          <button @click="saveMapping" :disabled="!canSave || isSaving" class="btn btn-primary">
            {{ isSaving ? '저장 중...' : '저장' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { getProductMappingData, saveManualMapping, discardCoopangMapping } from '@/services/register.js';

export default {
  name: 'CaapangMappingModal',
  props: {
    isVisible: { type: Boolean, default: false },
    productId: { type: String, default: '' }
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    // 상태
    const loading = ref(false);
    const error = ref('');
    const isSaving = ref(false);
    const isDiscarding = ref(false);
    
    // 데이터
    const productInfo = ref(null);
    const originalData = ref(null);
    const categoryAttributes = ref([]);
    const mappedOptions = ref([]);
    const validationResults = ref([]);

    // 계산된 속성
    const previewVariants = computed(() => {
      if (!mappedOptions.value.length || !originalData.value?.variants) return [];
      
      const validOptions = mappedOptions.value.filter(opt => 
        opt.coupangName && opt.values.some(v => v.name.trim())
      );
      
      if (!validOptions.length) return [];
      
      const variants = [];
      const originalVariants = originalData.value.variants;
      
      // 모든 조합 생성
      const generateCombinations = (optionIndex = 0, combo = [], baseVariantIndex = 0) => {
        if (optionIndex >= validOptions.length) {
          // 원본 variant 순서대로 사용
          const sourceVariant = originalVariants[baseVariantIndex % originalVariants.length];
          variants.push({
            price: sourceVariant.price,
            stockQuantity: sourceVariant.stockQuantity,
            optionCombination: [...combo]
          });
          return;
        }
        
        const option = validOptions[optionIndex];
        const validValues = option.values.filter(v => v.name.trim());
        
        validValues.forEach((value, valueIndex) => {
          generateCombinations(
            optionIndex + 1, 
            [...combo, { optionId: option.id, valueId: value.id }],
            baseVariantIndex * validValues.length + valueIndex
          );
        });
      };
      
      generateCombinations();
      return variants;
    });

    const canSave = computed(() => {
      return mappedOptions.value.length > 0 && 
             mappedOptions.value.some(opt => opt.coupangName && opt.values.some(v => v.name.trim()));
    });

    // 메서드
    const loadMappingData = async () => {
      if (!props.productId) return;
      
      loading.value = true;
      error.value = '';
      
      try {
        const response = await getProductMappingData(props.productId);
        if (response.success) {
          productInfo.value = response.data.productInfo;
          originalData.value = response.data.productInfo.json_data;
          categoryAttributes.value = response.data.categoryAttributes.attributes || [];
          mappedOptions.value = [];
          validateConstraints(); // 초기 검증
        } else {
          error.value = response.error || '데이터 로딩 실패';
        }
      } catch (err) {
        error.value = '서버 연결 실패';
        console.error('로딩 오류:', err);
      } finally {
        loading.value = false;
      }
    };

    // 원본 옵션들을 가져와서 매핑 시작
    const loadOriginalOptions = () => {
      if (!originalData.value?.optionSchema) return;
      
      mappedOptions.value = originalData.value.optionSchema.map(option => ({
        id: option.optionId,
        coupangName: '',
        originalName: option.optionName,
        isOriginal: true,
        values: option.optionValues.map(value => ({
          id: value.valueId,
          name: value.valueName
        }))
      }));
    };

    // 메인 이미지 가져오기
    const getMainImage = () => {
      return originalData.value?.productInfo?.representativeImage || 
             originalData.value?.productInfo?.images?.[0] || 
             productInfo.value?.imageurl || 
             '';
    };

    // 제약조건 검증
    const validateConstraints = () => {
      const results = [];
      
      // 1. 최대 3개 옵션 제한
      const validOptions = mappedOptions.value.filter(opt => opt.coupangName);
      if (validOptions.length > 3) {
        results.push({
          type: 'max_options',
          status: 'error',
          message: `옵션은 최대 3개까지만 가능합니다. (현재: ${validOptions.length}개)`
        });
      } else {
        results.push({
          type: 'max_options',
          status: 'success',
          message: `옵션 개수 제한 준수 (${validOptions.length}/3개)`
        });
      }

      // 2. MANDATORY 속성 검증
      const mandatoryAttrs = categoryAttributes.value.filter(attr => attr.required === 'MANDATORY');
      const usedAttrNames = validOptions.map(opt => opt.coupangName).filter(Boolean);
      const missingMandatory = mandatoryAttrs.filter(attr => !usedAttrNames.includes(attr.name));
      
      if (missingMandatory.length > 0) {
        results.push({
          type: 'mandatory',
          status: 'warning',
          message: `필수 속성 누락: ${missingMandatory.map(attr => attr.name).join(', ')}`
        });
      } else {
        results.push({
          type: 'mandatory',
          status: 'success',
          message: '모든 필수 속성 포함됨'
        });
      }

      // 3. SELECT 타입 검증
      validOptions.forEach(option => {
        const attr = categoryAttributes.value.find(a => a.name === option.coupangName);
        if (attr && attr.inputType === 'SELECT' && attr.inputValues) {
          const invalidValues = option.values.filter(val => 
            val.name.trim() && !attr.inputValues.includes(val.name.trim())
          );
          
          if (invalidValues.length > 0) {
            results.push({
              type: 'select_values',
              status: 'error',
              message: `${attr.name}: 허용되지 않은 값 (${invalidValues.map(v => v.name).join(', ')})`
            });
          }
        }
        
        // 4. 숫자 타입 검증
        if (attr && attr.dataType === 'NUMBER') {
          const invalidNumbers = option.values.filter(val => {
            const value = val.name.trim();
            if (!value) return false;
            
            // basicUnit이 있는 경우
            if (attr.basicUnit) {
              if (!value.endsWith(attr.basicUnit)) {
                return true; // 단위가 없으면 오류
              }
              const numericPart = value.slice(0, -attr.basicUnit.length);
              return isNaN(parseFloat(numericPart));
            } else {
              return isNaN(parseFloat(value));
            }
          });
          
          if (invalidNumbers.length > 0) {
            results.push({
              type: 'number_values',
              status: 'error',
              message: `${attr.name}: 숫자 형식 오류${attr.basicUnit ? ` (${attr.basicUnit} 단위 필요)` : ''}`
            });
          }
        }
      });

      validationResults.value = results;
    };

    const getValidationIcon = (status) => {
      switch (status) {
        case 'success': return '✓';
        case 'warning': return '⚠';
        case 'error': return '✗';
        default: return '•';
      }
    };

    // 선택된 속성 정보 가져오기
    const getSelectedAttribute = (option) => {
      return categoryAttributes.value.find(attr => attr.name === option.coupangName);
    };

    // 값 입력 placeholder 생성
    const getValuePlaceholder = (option) => {
      const attr = getSelectedAttribute(option);
      if (!attr) return '값 입력';
      
      if (attr.dataType === 'NUMBER') {
        return attr.basicUnit ? `숫자 입력 (${attr.basicUnit})` : '숫자 입력';
      }
      
      return attr.basicUnit ? `값 입력 (${attr.basicUnit} 포함)` : '값 입력';
    };

    // 값 검증
    const validateValue = (option, value, event) => {
      const attr = getSelectedAttribute(option);
      if (!attr) return;
      
      const inputValue = event.target.value;
      
      // 숫자 타입 검증
      if (attr.dataType === 'NUMBER') {
        // 숫자와 소수점, 단위만 허용
        const numericPattern = attr.basicUnit 
          ? new RegExp(`^[0-9]*\\.?[0-9]*${attr.basicUnit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}?$`)
          : /^[0-9]*\.?[0-9]*$/;
          
        if (!numericPattern.test(inputValue)) {
          event.target.style.borderColor = '#dc3545';
          return;
        }
      }
      
      event.target.style.borderColor = '#ddd';
    };

    // 값 포맷팅 (blur 시)
    const formatValue = (option, value) => {
      const attr = getSelectedAttribute(option);
      if (!attr) return;
      
      if (attr.dataType === 'NUMBER' && attr.basicUnit) {
        // 숫자 타입이고 단위가 있는 경우
        const trimmed = value.name.trim();
        if (trimmed && !trimmed.endsWith(attr.basicUnit)) {
          // 숫자만 있는 경우 단위 자동 추가
          const numericPart = trimmed.replace(/[^0-9.]/g, '');
          if (numericPart) {
            value.name = numericPart + attr.basicUnit;
          }
        }
      }
      
      updateVariants();
    };

    // 새 옵션 추가
    const addNewOption = () => {
      if (mappedOptions.value.length >= 3) return;
      
      const newOption = {
        id: `new_${Date.now()}`,
        coupangName: '',
        originalName: '',
        isOriginal: false,
        values: [{ id: `val_${Date.now()}`, name: '' }]
      };
      
      mappedOptions.value.push(newOption);
      
      // 새 옵션이 추가되면 기존 variant들을 분리
      updateVariants();
    };

    const removeOption = (index) => {
      mappedOptions.value.splice(index, 1);
      updateVariants();
    };

    const addValue = (optionIndex) => {
      mappedOptions.value[optionIndex].values.push({
        id: `val_${Date.now()}`,
        name: ''
      });
      updateVariants();
    };

    const removeValue = (optionIndex, valueIndex) => {
      const option = mappedOptions.value[optionIndex];
      if (option.values.length > 1) {
        option.values.splice(valueIndex, 1);
        updateVariants();
      }
    };

    const updateVariants = () => {
      // 변형 업데이트는 computed로 자동 처리됨
      validateConstraints(); // 검증도 함께 실행
    };

    // SELECT 타입 체크
    const isSelectType = (option) => {
      const attr = getSelectedAttribute(option);
      return attr && attr.inputType === 'SELECT' && attr.inputValues;
    };

    // 선택 가능한 값들 가져오기
    const getInputValues = (option) => {
      const attr = getSelectedAttribute(option);
      return attr?.inputValues || [];
    };

    // 상품 폐기
    const discardProduct = async () => {
      if (!props.productId) return;
      
      const confirmed = confirm('이 상품을 폐기하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
      if (!confirmed) return;
      
      isDiscarding.value = true;
      
      try {
        const response = await discardCoopangMapping(props.productId);
        
        if (response.success) {
          ElMessage.success('상품이 성공적으로 폐기되었습니다.');
          emit('saved', { productId: props.productId, action: 'discard' });
          closeModal();
        } else {
          // 서버로부터 받은 에러 메시지 사용
          const errorMessage = response.error || '폐기 실패';
          ElMessage.error(errorMessage);
        }
      } catch (err) {
        console.error('폐기 오류:', err);
        // 서버로부터 받은 에러 메시지 사용
        const errorMessage = err.response?.data?.message || '폐기 중 오류 발생';
        ElMessage.error(errorMessage);
      } finally {
        isDiscarding.value = false;
      }
    };

    const formatPrice = (price) => parseFloat(price).toFixed(2);

    const getComboText = (combo) => {
      const option = mappedOptions.value.find(opt => opt.id === combo.optionId);
      if (!option) return '값';
      
      const value = option.values.find(val => val.id === combo.valueId);
      return value?.name || '값';
    };

    const saveMapping = async () => {
      if (!canSave.value) return;
      
      isSaving.value = true;
      
      try {
        // 쿠팡 형식으로 변환
        const mappedData = {
          optionSchema: mappedOptions.value
            .filter(opt => opt.coupangName && opt.values.some(v => v.name.trim()))
            .map(opt => ({
              optionId: opt.id,
              optionName: opt.coupangName,
              optionValues: opt.values
                .filter(val => val.name.trim())
                .map(val => ({
                  valueId: val.id,
                  valueName: val.name,
                  imageUrl: ''
                }))
            })),
          variants: previewVariants.value
        };
        
        const response = await saveManualMapping(props.productId, mappedData);
        
        if (response.success) {
          ElMessage.success('매핑이 성공적으로 저장되었습니다.');
          emit('saved', { productId: props.productId, mappedData });
          closeModal();
        } else {
          // 서버로부터 받은 에러 메시지 사용
          const errorMessage = response.error || '저장 실패';
          ElMessage.error(errorMessage);
        }
      } catch (err) {
        console.error('저장 오류:', err);
        // 서버로부터 받은 에러 메시지 사용
        const errorMessage = err.response?.data?.message || '저장 중 오류 발생';
        ElMessage.error(errorMessage);
      } finally {
        isSaving.value = false;
      }
    };

    const closeModal = () => {
      emit('close');
      // 상태 초기화
      productInfo.value = null;
      originalData.value = null;
      categoryAttributes.value = [];
      mappedOptions.value = [];
      error.value = '';
    };

    // 감시자
    watch(() => props.isVisible, (newValue) => {
      if (newValue && props.productId) {
        loadMappingData();
      }
    });

    return {
      loading,
      error,
      isSaving,
      isDiscarding,
      productInfo,
      originalData,
      categoryAttributes,
      mappedOptions,
      previewVariants,
      validationResults,
      canSave,
      loadMappingData,
      loadOriginalOptions,
      addNewOption,
      removeOption,
      addValue,
      removeValue,
      updateVariants,
      formatPrice,
      getComboText,
      saveMapping,
      closeModal,
      getMainImage,
      getValidationIcon,
      getSelectedAttribute,
      getValuePlaceholder,
      validateValue,
      formatValue,
      isSelectType,
      getInputValues,
      discardProduct
    };
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-md);
}

.modal-container {
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-dark);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: var(--spacing-xs);
  color: var(--el-text-color-secondary);
  transition: color 0.2s ease;
}

.close-button:hover {
  color: var(--el-text-color-primary);
}

.modal-loading, .modal-error {
  padding: var(--spacing-xxl);
  text-align: center;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid var(--el-border-color-lighter);
  border-top: 3px solid var(--el-color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--spacing-md);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
}

.product-info {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--el-bg-color-page);
  border-radius: var(--el-border-radius-base);
}

.product-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: var(--el-border-radius-small);
}

.product-info h4 {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-semibold);
}

.product-info p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
}

.mapping-section {
  margin-bottom: var(--spacing-md);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.section-header h5 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-semibold);
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.option-card {
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-md);
  background: var(--el-bg-color);
}

.option-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.coupang-select {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-sm);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-small);
  font-size: var(--el-font-size-small);
  transition: border-color 0.2s ease;
}

.coupang-select:focus {
  outline: none;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
}

.option-info {
  background: var(--el-bg-color-page);
  padding: var(--spacing-sm);
  border-radius: var(--el-border-radius-small);
}

.original-info .label,
.new-option-values .label {
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-secondary);
  display: block;
  margin-bottom: var(--spacing-sm);
  font-size: var(--el-font-size-small);
}

.original-info .value {
  color: var(--el-text-color-primary);
  font-weight: var(--el-font-weight-medium);
  margin-bottom: var(--spacing-sm);
  display: block;
  font-size: var(--el-font-size-small);
}

.values {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.value-tag {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-small);
  font-size: var(--el-font-size-extra-small);
  color: var(--el-text-color-regular);
}

.values-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.value-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.value-input {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-small);
  font-size: var(--el-font-size-small);
  transition: border-color 0.2s ease;
}

.value-input:focus {
  outline: none;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
}

.value-select {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-small);
  background: var(--el-bg-color);
  font-size: var(--el-font-size-small);
  transition: border-color 0.2s ease;
}

.value-select:focus {
  outline: none;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
}

.no-options {
  text-align: center;
  padding: var(--spacing-xxl);
  color: var(--el-text-color-secondary);
  border: 2px dashed var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  font-size: var(--el-font-size-small);
}

.init-buttons {
  margin-top: 16px;
}

.preview-section {
  margin-bottom: 16px;
}

.preview-section h5 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-semibold);
}

.preview-list {
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-sm);
  max-height: 200px;
  overflow-y: auto;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.preview-item:last-child {
  border-bottom: none;
}

.price {
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-color-primary);
  min-width: 80px;
  font-size: var(--el-font-size-small);
}

.stock {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
  min-width: 80px;
}

.combinations {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.combo {
  padding: 2px var(--spacing-xs);
  background: var(--el-bg-color-page);
  border-radius: var(--el-border-radius-small);
  font-size: var(--el-font-size-extra-small);
  color: var(--el-text-color-regular);
}

.more-items {
  text-align: center;
  color: var(--el-text-color-secondary);
  font-style: italic;
  margin-top: var(--spacing-sm);
  font-size: var(--el-font-size-small);
}

.modal-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--el-border-color-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left {
  display: flex;
}

.footer-right {
  display: flex;
  gap: var(--spacing-sm);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  cursor: pointer;
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-medium);
  transition: all 0.2s ease;
}

.btn:hover {
  background: var(--el-bg-color-page);
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--el-color-primary);
  color: var(--el-color-white);
  border-color: var(--el-color-primary);
}

.btn-primary:hover:not(:disabled) {
  background: var(--el-color-primary-dark-2);
}

.btn-outline {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.btn-outline:hover {
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

.btn-danger {
  background: var(--el-color-danger);
  color: var(--el-color-white);
  border-color: var(--el-color-danger);
}

.btn-danger:hover:not(:disabled) {
  background: var(--el-color-danger);
  opacity: 0.9;
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--el-font-size-extra-small);
}

/* 상품 정보 스타일 */
.product-info {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.product-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #ddd;
  flex-shrink: 0;
}

.product-details {
  flex: 1;
}

/* 속성 정보 스타일 */
.attribute-info {
  margin-bottom: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--el-bg-color-page);
  border-radius: var(--el-border-radius-small);
  border-left: 3px solid var(--el-color-primary);
}

.text-muted {
  color: var(--el-text-color-secondary);
}

/* 검증 결과 스타일 */
.validation-section {
  margin-bottom: var(--spacing-md);
}

.validation-section h5 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-semibold);
}

.validation-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.validation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
}

.validation-item.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.validation-item.warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.validation-item.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.validation-icon {
  font-weight: bold;
  font-size: 16px;
}
</style>
