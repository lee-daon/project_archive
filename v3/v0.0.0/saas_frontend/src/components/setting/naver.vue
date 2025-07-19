<template>
  <div class="market-card" :class="{ 'editing': isEditing }">
    <div class="card-header">
      <h3>{{ marketData.naver_market_memo || '네이버 마켓 정보' }}</h3>
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
          <span v-else>{{ marketData.naver_market_memo }}</span>
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
          <span v-else>{{ marketData.naver_market_number }}</span>
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
          <span v-else>{{ marketData.naver_maximun_sku_count }}</span>
        </div>

        <div class="form-group">
          <label>클라이언트 ID</label>
          <el-input 
            v-if="isEditing" 
            v-model="editData.clientId" 
            type="password" 
            placeholder="네이버 클라이언트 ID를 입력하세요"
            size="small"
            show-password
          />
          <span v-else>{{ maskSensitiveData(marketData.naver_client_id) }}</span>
        </div>

        <div class="form-group">
          <label>클라이언트 시크릿</label>
          <el-input 
            v-if="isEditing" 
            v-model="editData.clientSecret" 
            type="password" 
            placeholder="네이버 클라이언트 시크릿을 입력하세요"
            size="small"
            show-password
          />
          <span v-else>{{ maskSensitiveData(marketData.naver_client_secret) }}</span>
        </div>
      </div>

      <!-- 네이버 배송지/반품지 설정 -->
      <!-- 배송지/반품지 설정 (편집 모드) -->
      <div v-if="isEditing" class="address-section">
        <h4>배송지/반품지 설정</h4>
        <div class="address-actions">
          <el-button 
            @click="loadAddressBook" 
            :disabled="loadingAddresses || !editData.clientId || !editData.clientSecret"
            :loading="loadingAddresses"
            type="info"
            size="small"
          >
            주소록 불러오기
          </el-button>
        </div>

        <div v-if="addresses.length > 0" class="address-selection">
          <div class="form-group">
            <label>상품출고지</label>
            <el-select v-model="editData.releaseAddressNo" placeholder="출고지를 선택하세요" size="small">
              <el-option value="" label="출고지를 선택하세요" />
              <el-option 
                v-for="address in releaseAddresses" 
                :key="address.addressBookNo" 
                :value="address.addressBookNo"
                :label="`${address.name} - ${address.baseAddress} ${address.detailAddress}`"
              />
            </el-select>
          </div>

          <div class="form-group">
            <label>반품교환지</label>
            <el-select v-model="editData.refundAddressNo" placeholder="반품교환지를 선택하세요" size="small">
              <el-option value="" label="반품교환지를 선택하세요" />
              <el-option 
                v-for="address in refundAddresses" 
                :key="address.addressBookNo" 
                :value="address.addressBookNo"
                :label="`${address.name} - ${address.baseAddress} ${address.detailAddress}`"
              />
            </el-select>
          </div>
        </div>
      </div>

      <!-- 저장된 주소 정보 표시 (읽기 모드) -->
      <div v-else class="saved-addresses">
        <div class="form-group">
          <label>상품출고지</label>
          <span>{{ getAddressDisplayText(marketData.naver_release_address_no, 'RELEASE') }}</span>
        </div>
        <div class="form-group">
          <label>반품교환지</label>
          <span>{{ getAddressDisplayText(marketData.naver_refund_address_no, 'REFUND_OR_EXCHANGE') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getNaverAddressBook } from '../../services/settings';
import { ElMessageBox, ElMessage, ElButton, ElInput, ElSelect, ElOption } from 'element-plus';

export default {
  name: 'MarketCard',
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
      addresses: [],
      loadingAddresses: false
    }
  },
  computed: {
    releaseAddresses() {
      return this.addresses.filter(addr => addr.addressType === 'RELEASE');
    },
    refundAddresses() {
      return this.addresses.filter(addr => addr.addressType === 'REFUND_OR_EXCHANGE');
    }
  },
  methods: {
    startEdit() {
      this.isEditing = true;
      this.editData = {
        memo: this.marketData.naver_market_memo || '',
        marketNumber: this.marketData.naver_market_number || '',
        maxSkuCount: this.marketData.naver_maximun_sku_count || '',
        clientId: this.marketData.naver_client_id || '',
        clientSecret: this.marketData.naver_client_secret || '',
        releaseAddressNo: this.marketData.naver_release_address_no || '',
        refundAddressNo: this.marketData.naver_refund_address_no || ''
      };
      
      // 주소록 데이터 초기화 (자동으로 불러오지 않음)
      this.addresses = [];
    },
    cancelEdit() {
      this.isEditing = false;
      this.editData = {};
      this.addresses = [];
    },
    saveChanges() {
      const updateData = this.buildUpdateData();
      this.$emit('update-market', {
        shopid: this.marketData.shopid,
        data: updateData
      });
      this.isEditing = false;
    },
    async deleteMarket() {
      try {
        await ElMessageBox.confirm(
          '정말로 이 네이버 마켓을 삭제하시겠습니까?',
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
    async loadAddressBook() {
      if (!this.editData.clientId || !this.editData.clientSecret) {
        ElMessage.error('클라이언트 ID와 시크릿을 먼저 입력해주세요.');
        return;
      }

      this.loadingAddresses = true;

      try {
        const response = await getNaverAddressBook(this.editData.clientId, this.editData.clientSecret);
        if (response.success) {
          this.addresses = response.data || [];
          if (this.addresses.length === 0) {
            ElMessage.warning('등록된 주소록이 없습니다.');
          }
        } else {
          ElMessage.error(response.message || '주소록을 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('주소록 로딩 실패:', error);
        // 서버로부터 받은 에러 메시지 사용
        ElMessage.error(error.response?.data?.message || '주소록을 불러오는데 실패했습니다. 클라이언트 정보를 확인해주세요.');
      } finally {
        this.loadingAddresses = false;
      }
    },

    getAddressDisplayText(addressNo, addressType) {
      if (!addressNo) return '설정되지 않음';
      
      const address = this.addresses.find(addr => 
        addr.addressBookNo === addressNo && addr.addressType === addressType
      );
      
      if (address) {
        return `${address.name} - ${address.baseAddress} ${address.detailAddress}`;
      }
      
      return `주소록 번호: ${addressNo}`;
    },

    maskSensitiveData(data) {
      if (!data) return '설정되지 않음';
      return '•'.repeat(Math.max(data.length, 8));
    },

    buildUpdateData() {
      return {
        naver_market_memo: this.editData.memo,
        naver_market_number: this.editData.marketNumber,
        naver_maximun_sku_count: this.editData.maxSkuCount,
        naver_client_id: this.editData.clientId,
        naver_client_secret: this.editData.clientSecret,
        naver_release_address_no: this.editData.releaseAddressNo,
        naver_refund_address_no: this.editData.refundAddressNo
      };
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
  gap: 8px;
}

.fields-row {
  display: flex;
  gap: var(--spacing-lg);
  align-items: flex-start;
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
  gap: var(--spacing-sm);
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
    gap: var(--spacing-md);
  }

  .saved-addresses {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
}
</style> 