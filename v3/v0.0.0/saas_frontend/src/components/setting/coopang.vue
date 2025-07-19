<template>
  <div class="market-card" :class="{ 'editing': isEditing }">
    <div class="card-header">
      <h3>{{ marketData.coopang_market_memo || '쿠팡 마켓 정보' }}</h3>
      <div class="card-actions">
        <el-button v-if="!isEditing" @click="startEdit" type="primary" size="small">수정</el-button>
        <el-button v-if="isEditing" @click="saveChanges" type="success" size="small">저장</el-button>
        <el-button v-if="isEditing" @click="cancelEdit" type="info" size="small">취소</el-button>
        <el-button @click="deleteMarket" type="danger" size="small">삭제</el-button>
      </div>
    </div>

    <div class="card-content">
      <div class="fields-row">
        <div class="form-group">
          <label>메모</label>
          <el-input 
            v-if="isEditing" 
            v-model="editData.memo" 
            placeholder="마켓 메모를 입력하세요"
            size="small"
          />
          <span v-else>{{ marketData.coopang_market_memo }}</span>
        </div>

        <div class="form-group">
          <label>마켓 번호</label>
          <el-input 
            v-if="isEditing" 
            v-model.number="editData.marketNumber" 
            type="number" 
            placeholder="마켓 번호를 입력하세요"
            size="small"
          />
          <span v-else>{{ marketData.coopang_market_number }}</span>
        </div>

        <div class="form-group">
          <label>최대 상품 수</label>
          <el-input 
            v-if="isEditing" 
            v-model.number="editData.maxSkuCount" 
            type="number" 
            placeholder="최대 상품 수를 입력하세요"
            size="small"
          />
          <span v-else>{{ marketData.coopang_maximun_sku_count }}</span>
        </div>

        <div class="form-group">
          <label>벤더 ID</label>
          <el-input 
            v-if="isEditing" 
            v-model="editData.vendorId" 
            placeholder="쿠팡 벤더 ID를 입력하세요"
            size="small"
          />
          <span v-else>{{ marketData.coopang_vendor_id || '설정되지 않음' }}</span>
        </div>

        <div class="form-group">
          <label>액세스 키</label>
          <el-input 
            v-if="isEditing" 
            v-model="editData.accessKey" 
            type="password" 
            placeholder="쿠팡 액세스 키를 입력하세요"
            size="small"
            show-password
          />
          <span v-else>{{ maskSensitiveData(marketData.coopang_access_key) }}</span>
        </div>

        <div class="form-group">
          <label>시크릿 키</label>
          <el-input 
            v-if="isEditing" 
            v-model="editData.secretKey" 
            type="password" 
            placeholder="쿠팡 시크릿 키를 입력하세요"
            size="small"
            show-password
          />
          <span v-else>{{ maskSensitiveData(marketData.coopang_secret_key) }}</span>
        </div>

        <div class="form-group">
          <label>실사용자 아이디 (쿠팡 Wing ID)</label>
          <el-input 
            v-if="isEditing" 
            v-model="editData.vendorUserId" 
            placeholder="쿠팡 Wing ID를 입력하세요"
            size="small"
          />
          <span v-else>{{ marketData.coopang_vendor_user_id || '설정되지 않음' }}</span>
        </div>
      </div>

      <!-- 쿠팡 배송지/반품지 설정 -->
      <!-- 배송지/반품지 설정 (편집 모드) -->
      <div v-if="isEditing" class="address-section">
        <h4>배송지/반품지 설정</h4>
        <div class="address-actions">
          <el-button 
            @click="loadCoupangShippingPlaces" 
            :disabled="loadingAddresses || !editData.vendorId || !editData.accessKey || !editData.secretKey"
            :loading="loadingAddresses"
            type="info"
            size="small"
          >
            배송지 불러오기
          </el-button>
        </div>

        <div v-if="coupangPlaces.outboundPlaces && coupangPlaces.outboundPlaces.length > 0" class="address-selection">
          <div class="form-group">
            <label>상품출고지</label>
            <el-select v-model="editData.outboundShippingPlaceCode" placeholder="출고지를 선택하세요" size="small">
              <el-option value="" label="출고지를 선택하세요" />
              <el-option 
                v-for="place in coupangPlaces.outboundPlaces" 
                :key="place.outboundShippingPlaceCode" 
                :value="place.outboundShippingPlaceCode"
                :label="`${place.shippingPlaceName} - ${place.returnAddress}`"
              />
            </el-select>
          </div>

          <div class="form-group">
            <label>반품지</label>
            <el-select v-model="editData.returnCenterCode" placeholder="반품지를 선택하세요" size="small">
              <el-option value="" label="반품지를 선택하세요" />
              <el-option 
                v-for="center in coupangPlaces.returnCenters" 
                :key="center.returnCenterCode" 
                :value="center.returnCenterCode"
                :label="`${center.shippingPlaceName} - ${center.returnAddress}`"
              />
            </el-select>
          </div>
        </div>
      </div>

      <!-- 저장된 배송지 정보 표시 (읽기 모드) -->
      <div v-else class="saved-addresses">
        <div class="form-group">
          <label>상품출고지</label>
          <span>{{ getCoupangAddressDisplayText(marketData.coopang_outbound_shipping_place_code, 'outbound') }}</span>
        </div>
        <div class="form-group">
          <label>반품지</label>
          <span>{{ getCoupangAddressDisplayText(marketData.coopang_return_center_code, 'return') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getCoupangShippingPlaces } from '../../services/settings';
import { ElMessageBox, ElMessage, ElButton, ElInput, ElSelect, ElOption } from 'element-plus';

export default {
  name: 'CoupangMarketCard',
  components: {
    ElButton,
    ElInput,
    ElSelect,
    ElOption
  },
  props: {
    marketData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      isEditing: false,
      editData: {},
      loadingAddresses: false,
      coupangPlaces: {}
    }
  },
  methods: {
    startEdit() {
      this.isEditing = true;
      this.editData = {
        memo: this.marketData.coopang_market_memo || '',
        marketNumber: this.marketData.coopang_market_number || '',
        maxSkuCount: this.marketData.coopang_maximun_sku_count || '',
        vendorId: this.marketData.coopang_vendor_id || '',
        accessKey: this.marketData.coopang_access_key || '',
        secretKey: this.marketData.coopang_secret_key || '',
        outboundShippingPlaceCode: this.marketData.coopang_outbound_shipping_place_code || '',
        returnCenterCode: this.marketData.coopang_return_center_code || '',
        vendorUserId: this.marketData.coopang_vendor_user_id || ''
      };
      
      // 배송지 데이터 초기화
      this.coupangPlaces = {};
    },

    cancelEdit() {
      this.isEditing = false;
      this.editData = {};
      this.coupangPlaces = {};
    },

    saveChanges() {
      const updateData = {
        coopang_market_memo: this.editData.memo,
        coopang_market_number: this.editData.marketNumber,
        coopang_maximun_sku_count: this.editData.maxSkuCount,
        coopang_vendor_id: this.editData.vendorId,
        coopang_access_key: this.editData.accessKey,
        coopang_secret_key: this.editData.secretKey,
        coopang_outbound_shipping_place_code: this.editData.outboundShippingPlaceCode,
        coopang_return_center_code: this.editData.returnCenterCode,
        coopang_vendor_user_id: this.editData.vendorUserId,
        ...this.getSelectedAddressDetails()
      };

      this.$emit('update-market', {
        shopid: this.marketData.shopid,
        data: updateData
      });
      this.isEditing = false;
    },

    async deleteMarket() {
      try {
        await ElMessageBox.confirm(
          '정말로 이 쿠팡 마켓을 삭제하시겠습니까?',
          '마켓 삭제',
          {
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
            type: 'warning',
            confirmButtonClass: 'el-button--danger'
          }
        );
        
        this.$emit('delete-market', this.marketData.shopid);
      } catch (error) {
        // 사용자가 취소를 클릭한 경우는 아무것도 하지 않음
      }
    },

    async loadCoupangShippingPlaces() {
      if (!this.editData.vendorId || !this.editData.accessKey || !this.editData.secretKey) {
        ElMessage.error('벤더 ID, 액세스 키, 시크릿 키를 모두 입력해주세요.');
        return;
      }

      this.loadingAddresses = true;

      try {
        const response = await getCoupangShippingPlaces(
          this.editData.accessKey,
          this.editData.secretKey, 
          this.editData.vendorId
        );
        
        if (response.success) {
          this.coupangPlaces = {
            outboundPlaces: response.data.outboundPlaces?.items || [],
            returnCenters: response.data.returnCenters?.items || []
          };
          
          if (this.coupangPlaces.outboundPlaces.length === 0 && this.coupangPlaces.returnCenters.length === 0) {
            ElMessage.warning('등록된 배송지가 없습니다.');
          }
        } else {
          ElMessage.error(response.message || '배송지를 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('쿠팡 배송지 로딩 실패:', error);
        ElMessage.error('배송지를 불러오는데 실패했습니다. 인증 정보를 확인해주세요.');
      } finally {
        this.loadingAddresses = false;
      }
    },

    getCoupangAddressDisplayText(code, type) {
      if (!code) return '설정되지 않음';
      
      if (type === 'outbound') {
        const place = this.coupangPlaces.outboundPlaces?.find(place => 
          place.outboundShippingPlaceCode === code
        );
        if (place) {
          return `${place.shippingPlaceName} - ${place.returnAddress}`;
        }
      } else if (type === 'return') {
        const center = this.coupangPlaces.returnCenters?.find(center => 
          center.returnCenterCode === code
        );
        if (center) {
          return `${center.shippingPlaceName} - ${center.returnAddress}`;
        }
      }
      
      return `코드: ${code}`;
    },

    maskSensitiveData(data) {
      if (!data) return '설정되지 않음';
      return '•'.repeat(Math.max(data.length, 8));
    },

    getSelectedAddressDetails() {
      const details = {};
      
      // 선택된 반품지 정보 추출
      if (this.editData.returnCenterCode && this.coupangPlaces.returnCenters) {
        const selectedReturnCenter = this.coupangPlaces.returnCenters.find(
          center => center.returnCenterCode === this.editData.returnCenterCode
        );
        
        if (selectedReturnCenter) {
          details.coopang_return_charge_name = selectedReturnCenter.shippingPlaceName || '';
          details.coopang_company_contact_number = selectedReturnCenter.companyContactNumber || '';
          details.coopang_return_zip_code = selectedReturnCenter.returnZipCode || '';
          details.coopang_return_address = selectedReturnCenter.returnAddress || '';
          details.coopang_return_address_detail = selectedReturnCenter.returnAddressDetail || '';
        }
      }
      
      return details;
    }
  }
}
</script>

<style scoped>
.market-card {
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  padding-top: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
  padding-left: var(--spacing-lg);
  padding-right: var(--spacing-lg);
  margin-bottom: var(--spacing-sm);
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s ease;
  width: 100%;
  margin-top: 2px;
}

.market-card:hover {
  box-shadow: var(--el-box-shadow-base);
  border-color: var(--el-color-primary-light-7);
  background: var(--el-bg-color);
  transform: translateY(-1px);
}

.market-card.editing {
  border-color: var(--el-color-primary);
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-base);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--el-border-color-light);
}

.card-header h3 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
}

.card-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.fields-row {
  display: flex;
  gap: var(--spacing-lg);
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
}

.fields-row:last-child {
  margin-bottom: 0;
}

.form-group {
  flex: 1;
  min-width: 0;
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-small);
}

.form-group span {
  display: block;
  padding: var(--spacing-xs) 0;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-small);
  word-break: break-all;
  min-height: 20px;
}

/* 주소록 관련 스타일 */
.address-section {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-top: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color-page);
  border-radius: var(--el-border-radius-base);
}

.address-section h4 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-bold);
}

.address-actions {
  margin-bottom: var(--spacing-sm);
}

.address-selection {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-md);
}

.address-selection .form-group {
  margin-bottom: 0;
}

.saved-addresses {
  padding: var(--spacing-sm);
  border-top: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color-page);
  border-radius: var(--el-border-radius-base);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
}

.saved-addresses .form-group {
  margin-bottom: 0;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .fields-row {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .form-group {
    flex: none;
  }

  .address-selection {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }

  .saved-addresses {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }
}
</style>
