<template>
  <div class="market-card" :class="{ 'editing': isEditing }">
    <div class="card-header">
      <h3>{{ marketData.esm_market_memo || 'ESM 마켓 정보 (옥션 + G마켓)' }}</h3>
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
          <span v-else>{{ marketData.esm_market_memo }}</span>
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
          <span v-else>{{ marketData.esm_market_number }}</span>
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
          <span v-else>{{ marketData.esm_maximun_sku_count }}</span>
        </div>

        <div class="form-group">
          <label>옥션 ID</label>
          <el-input 
            v-if="isEditing" 
            v-model="editData.auctionId" 
            placeholder="옥션 사용자 ID를 입력하세요"
            size="small"
          />
          <span v-else>{{ marketData.auction_id || '설정되지 않음' }}</span>
        </div>

        <div class="form-group">
          <label>G마켓 ID</label>
          <el-input 
            v-if="isEditing" 
            v-model="editData.gmarketId" 
            placeholder="G마켓 사용자 ID를 입력하세요"
            size="small"
          />
          <span v-else>{{ marketData.gmarket_id || '설정되지 않음' }}</span>
        </div>

        <div class="form-group">
          <label>배송정보 템플릿 코드</label>
          <el-input 
            v-if="isEditing" 
            v-model.number="editData.deliveryTemplateCode" 
            type="number"
            placeholder="배송정보 템플릿 코드를 입력하세요"
            size="small"
          />
          <span v-else>{{ marketData.delivery_template_code || '설정되지 않음' }}</span>
        </div>

        <div class="form-group">
          <label>고시정보 템플릿 코드</label>
          <el-input 
            v-if="isEditing" 
            v-model.number="editData.disclosureTemplateCode" 
            type="number"
            placeholder="고시정보 템플릿 코드를 입력하세요"
            size="small"
          />
          <span v-else>{{ marketData.disclosure_template_code || '설정되지 않음' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ElMessageBox, ElButton, ElInput } from 'element-plus';

export default {
  name: 'EsmMarketCard',
  components: {
    ElButton,
    ElInput
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
      editData: {}
    }
  },
  methods: {
    startEdit() {
      this.isEditing = true;
      this.editData = {
        memo: this.marketData.esm_market_memo || '',
        marketNumber: this.marketData.esm_market_number || '',
        maxSkuCount: this.marketData.esm_maximun_sku_count || '',
        auctionId: this.marketData.auction_id || '',
        gmarketId: this.marketData.gmarket_id || '',
        deliveryTemplateCode: this.marketData.delivery_template_code || '',
        disclosureTemplateCode: this.marketData.disclosure_template_code || ''
      };
    },
    
    cancelEdit() {
      this.isEditing = false;
      this.editData = {};
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
          '정말로 이 ESM 마켓을 삭제하시겠습니까?',
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
    
    buildUpdateData() {
      return {
        esm_market_memo: this.editData.memo,
        esm_market_number: this.editData.marketNumber,
        esm_maximun_sku_count: this.editData.maxSkuCount,
        auction_id: this.editData.auctionId || null,
        gmarket_id: this.editData.gmarketId || null,
        delivery_template_code: this.editData.deliveryTemplateCode || null,
        disclosure_template_code: this.editData.disclosureTemplateCode || null
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

/* 반응형 디자인 */
@media (max-width: 768px) {
  .fields-row {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .form-group {
    flex: none;
  }
}
</style>
