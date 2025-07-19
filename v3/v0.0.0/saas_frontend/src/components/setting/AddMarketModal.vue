<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ getMarketTypeName(marketType) }} 마켓 추가</h2>
        <el-button @click="closeModal" type="info" circle>
          <el-icon><Close /></el-icon>
        </el-button>
      </div>

      <form @submit.prevent="submitForm" class="modal-body">
        <div class="form-group">
          <label for="memo">메모 *</label>
          <el-input 
            id="memo"
            v-model="formData.memo" 
            placeholder="마켓 메모를 입력하세요"
            required
          />
        </div>

        <div class="form-group">
          <label for="marketNumber">마켓 번호 *</label>
          <el-input 
            id="marketNumber"
            v-model.number="formData.marketNumber" 
            type="number" 
            placeholder="마켓 번호를 입력하세요"
            required
            :min="1"
          />
        </div>

        <div class="form-group">
          <label for="maxSkuCount">최대 상품 수 *</label>
          <el-input 
            id="maxSkuCount"
            v-model.number="formData.maxSkuCount" 
            type="number" 
            placeholder="최대 상품 수를 입력하세요"
            required
            :min="1"
          />
        </div>

        <!-- 네이버 전용 필드 -->
        <template v-if="marketType === 'naver'">
          <div class="form-group">
            <label for="clientId">클라이언트 ID</label>
            <el-input 
              id="clientId"
              v-model="formData.clientId" 
              type="password" 
              placeholder="네이버 클라이언트 ID를 입력하세요"
              show-password
            />
          </div>

          <div class="form-group">
            <label for="clientSecret">클라이언트 시크릿</label>
            <el-input 
              id="clientSecret"
              v-model="formData.clientSecret" 
              type="password" 
              placeholder="네이버 클라이언트 시크릿을 입력하세요"
              show-password
            />
          </div>

          <!-- 배송지/반품지 설정 -->
          <div class="address-section">
            <h4>배송지/반품지 설정</h4>
            <div class="address-actions">
              <el-button 
                @click="loadAddressBook" 
                :disabled="loadingAddresses || !formData.clientId || !formData.clientSecret"
                :loading="loadingAddresses"
                type="info"
              >
                주소록 불러오기
              </el-button>
            </div>

            <div v-if="addresses.length > 0" class="address-selection naver-address">
              <div class="form-group">
                <label for="releaseAddress">상품출고지</label>
                <el-select id="releaseAddress" v-model="formData.releaseAddressNo" placeholder="출고지를 선택하세요">
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
                <label for="refundAddress">반품교환지</label>
                <el-select id="refundAddress" v-model="formData.refundAddressNo" placeholder="반품교환지를 선택하세요">
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
        </template>

        <!-- 11번가 전용 필드 -->
        <template v-if="marketType === 'elevenstore'">
          <div class="form-group">
            <label for="apiKey">API 키 *</label>
            <el-input 
              id="apiKey"
              v-model="formData.apiKey" 
              type="password" 
              placeholder="11번가 API 키를 입력하세요"
              show-password
              required
            />
          </div>

          <!-- 배송지/반품지 설정 -->
          <div class="address-section">
            <h4>배송지/반품지 설정</h4>
            <div class="address-actions">
              <el-button 
                @click="loadElevenStoreAddresses" 
                :disabled="loadingAddresses || !formData.apiKey"
                :loading="loadingAddresses"
                type="info"
              >
                주소록 불러오기
              </el-button>
            </div>

            <div v-if="elevenStoreAddresses.outboundPlaces && elevenStoreAddresses.outboundPlaces.length > 0" class="address-selection elevenstore-address">
              <div class="form-group">
                <label for="shippingAddress">상품출고지</label>
                <el-select id="shippingAddress" v-model="formData.shippingAddressId" placeholder="출고지를 선택하세요">
                  <el-option value="" label="출고지를 선택하세요" />
                  <el-option 
                    v-for="address in elevenStoreAddresses.outboundPlaces" 
                    :key="address.addrSeq" 
                    :value="address.addrSeq"
                    :label="`${address.addrNm} - ${address.addr}`"
                  />
                </el-select>
              </div>

              <div class="form-group">
                <label for="returnAddress">반품교환지</label>
                <el-select id="returnAddress" v-model="formData.returnAddressId" placeholder="반품교환지를 선택하세요">
                  <el-option value="" label="반품교환지를 선택하세요" />
                  <el-option 
                    v-for="address in elevenStoreAddresses.inboundPlaces" 
                    :key="address.addrSeq" 
                    :value="address.addrSeq"
                    :label="`${address.addrNm} - ${address.addr}`"
                  />
                </el-select>
              </div>

              <div class="form-group">
                <label for="templateNo">발송마감 템플릿</label>
                <el-select id="templateNo" v-model="formData.templateNo" placeholder="발송마감 템플릿을 선택하세요">
                  <el-option value="" label="발송마감 템플릿을 선택하세요" />
                  <el-option 
                    v-for="template in elevenStoreAddresses.sendCloseTemplates" 
                    :key="template.prdInfoTmpltNo" 
                    :value="template.prdInfoTmpltNo"
                    :label="template.prdInfoTmpltNm"
                  />
                </el-select>
              </div>
            </div>
          </div>
        </template>

        <!-- 쿠팡 전용 필드 -->
        <template v-if="marketType === 'coopang'">
          <div class="form-group">
            <label for="vendorId">벤더 ID *</label>
            <el-input 
              id="vendorId"
              v-model="formData.vendorId" 
              placeholder="쿠팡 벤더 ID를 입력하세요"
              required
            />
          </div>

          <div class="form-group">
            <label for="accessKey">액세스 키 *</label>
            <el-input 
              id="accessKey"
              v-model="formData.accessKey" 
              type="password" 
              placeholder="쿠팡 액세스 키를 입력하세요"
              show-password
              required
            />
          </div>

          <div class="form-group">
            <label for="secretKey">시크릿 키 *</label>
            <el-input 
              id="secretKey"
              v-model="formData.secretKey" 
              type="password" 
              placeholder="쿠팡 시크릿 키를 입력하세요"
              show-password
              required
            />
          </div>

          <div class="form-group">
            <label for="vendorUserId">실사용자 아이디 (쿠팡 Wing ID)</label>
            <el-input 
              id="vendorUserId"
              v-model="formData.vendorUserId" 
              placeholder="쿠팡 Wing ID를 입력하세요"
            />
          </div>

          <!-- 배송지/반품지 설정 -->
          <div class="address-section">
            <h4>배송지/반품지 설정</h4>
            <div class="address-actions">
              <el-button 
                @click="loadCoupangShippingPlaces" 
                :disabled="loadingAddresses || !formData.vendorId || !formData.accessKey || !formData.secretKey"
                :loading="loadingAddresses"
                type="info"
              >
                배송지 불러오기
              </el-button>
            </div>

            <div v-if="coupangPlaces.outboundPlaces && coupangPlaces.outboundPlaces.length > 0" class="address-selection coupang-address">
              <div class="form-group">
                <label for="outboundPlace">상품출고지</label>
                <el-select id="outboundPlace" v-model="formData.outboundShippingPlaceCode" placeholder="출고지를 선택하세요">
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
                <label for="returnCenter">반품지</label>
                <el-select id="returnCenter" v-model="formData.returnCenterCode" placeholder="반품지를 선택하세요">
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
        </template>

        <!-- ESM 전용 필드 -->
        <template v-if="marketType === 'esm'">
          <div class="esm-notice">
            <el-icon class="notice-icon"><InfoFilled /></el-icon>
            <p>ESM(옥션+G마켓)은 현재 액셀 일괄등록 방식만을 지원하고 있습니다.</p>
          </div>
          
          <div class="form-group">
            <label for="auctionId">옥션 ID</label>
            <el-input 
              id="auctionId"
              v-model="formData.auctionId" 
              placeholder="옥션 사용자 ID를 입력하세요"
            />
          </div>

          <div class="form-group">
            <label for="gmarketId">G마켓 ID</label>
            <el-input 
              id="gmarketId"
              v-model="formData.gmarketId" 
              placeholder="G마켓 사용자 ID를 입력하세요"
            />
          </div>

          <div class="form-group">
            <label for="deliveryTemplateCode">배송정보 템플릿 코드</label>
            <el-input 
              id="deliveryTemplateCode"
              v-model.number="formData.deliveryTemplateCode" 
              type="number"
              placeholder="배송정보 템플릿 코드를 입력하세요"
            />
          </div>

          <div class="form-group">
            <label for="disclosureTemplateCode">고시정보 템플릿 코드</label>
            <el-input 
              id="disclosureTemplateCode"
              v-model.number="formData.disclosureTemplateCode" 
              type="number"
              placeholder="고시정보 템플릿 코드를 입력하세요"
            />
          </div>
        </template>

        <div class="modal-footer">
          <el-button @click="closeModal">취소</el-button>
          <el-button type="primary" @click="submitForm" :disabled="!isFormValid">추가</el-button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { getNaverAddressBook, getCoupangShippingPlaces, getElevenStoreAddress } from '../../services/settings';
import { ElMessage, ElButton, ElInput, ElSelect, ElOption, ElIcon } from 'element-plus';
import { Close, InfoFilled } from '@element-plus/icons-vue';

export default {
  name: 'AddMarketModal',
  components: {
    ElButton,
    ElInput,
    ElSelect,
    ElOption,
    ElIcon,
    Close,
    InfoFilled
  },
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    marketType: {
      type: String,
      required: true,
      validator: value => ['naver', 'coopang', 'elevenstore', 'esm'].includes(value)
    }
  },
  data() {
    return {
      formData: {
        memo: '',
        marketNumber: null,
        maxSkuCount: null,
        clientId: '',
        clientSecret: '',
        releaseAddressNo: '',
        refundAddressNo: '',
        vendorId: '',
        accessKey: '',
        secretKey: '',
        outboundShippingPlaceCode: '',
        returnCenterCode: '',
        vendorUserId: '',
        apiKey: '',
        shippingAddressId: '',
        returnAddressId: '',
        templateNo: '',
        auctionId: '',
        gmarketId: '',
        deliveryTemplateCode: null,
        disclosureTemplateCode: null
      },
      addresses: [],
      loadingAddresses: false,
      coupangPlaces: {},
      elevenStoreAddresses: {
        outboundPlaces: [],
        inboundPlaces: [],
        sendCloseTemplates: []
      }
    }
  },
     computed: {
     releaseAddresses() {
       return this.addresses.filter(addr => addr.addressType === 'RELEASE');
     },
     refundAddresses() {
       return this.addresses.filter(addr => addr.addressType === 'REFUND_OR_EXCHANGE');
     },
     isFormValid() {
       // 기본 필드 검증
       const basicValid = this.formData.memo && 
                          this.formData.marketNumber && 
                          this.formData.maxSkuCount;
       
       if (!basicValid) return false;
       
       // 마켓 타입별 필수 필드 검증
       if (this.marketType === 'naver') {
         return this.formData.clientId && 
                this.formData.clientSecret &&
                this.formData.releaseAddressNo &&
                this.formData.refundAddressNo;
       } else if (this.marketType === 'coopang') {
         return this.formData.vendorId &&
                this.formData.accessKey &&
                this.formData.secretKey &&
                this.formData.outboundShippingPlaceCode &&
                this.formData.returnCenterCode;
       } else if (this.marketType === 'elevenstore') {
         return this.formData.apiKey &&
                this.formData.shippingAddressId &&
                this.formData.returnAddressId &&
                this.formData.templateNo;
       } else if (this.marketType === 'esm') {
         return true; // ESM은 기본 필드만 필요하므로 기본 검증만 수행
       }
       
       return false;
     }
   },
  watch: {
    isVisible(newVal) {
      if (newVal) {
        this.resetForm();
      }
    }
  },
  methods: {
    closeModal() {
      this.$emit('close');
    },
    resetForm() {
      this.formData = {
        memo: '',
        marketNumber: null,
        maxSkuCount: null,
        clientId: '',
        clientSecret: '',
        releaseAddressNo: '',
        refundAddressNo: '',
        vendorId: '',
        accessKey: '',
        secretKey: '',
        outboundShippingPlaceCode: '',
        returnCenterCode: '',
        vendorUserId: '',
        apiKey: '',
        shippingAddressId: '',
        returnAddressId: '',
        templateNo: '',
        auctionId: '',
        gmarketId: '',
        deliveryTemplateCode: null,
        disclosureTemplateCode: null
      };
      this.addresses = [];
      this.coupangPlaces = {};
      this.elevenStoreAddresses = {
        outboundPlaces: [],
        inboundPlaces: [],
        sendCloseTemplates: []
      };
    },

    async loadAddressBook() {
      if (!this.formData.clientId || !this.formData.clientSecret) {
        ElMessage.error('클라이언트 ID와 시크릿을 먼저 입력해주세요.');
        return;
      }

      this.loadingAddresses = true;

      try {
        const response = await getNaverAddressBook(this.formData.clientId, this.formData.clientSecret);
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
    submitForm() {
      if (!this.isFormValid) return;

      const marketData = this.buildMarketData();
      this.$emit('add-market', marketData);
      this.closeModal();
    },
    buildMarketData() {
      if (this.marketType === 'naver') {
        return {
          naver_market_memo: this.formData.memo,
          naver_market_number: this.formData.marketNumber,
          naver_maximun_sku_count: this.formData.maxSkuCount,
          naver_client_id: this.formData.clientId,
          naver_client_secret: this.formData.clientSecret,
          naver_release_address_no: this.formData.releaseAddressNo,
          naver_refund_address_no: this.formData.refundAddressNo
        };
      } else if (this.marketType === 'elevenstore') {
        return {
          elevenstore_market_memo: this.formData.memo,
          elevenstore_market_number: this.formData.marketNumber,
          elevenstore_maximun_sku_count: this.formData.maxSkuCount,
          elevenstore_api_key: this.formData.apiKey,
          elevenstore_shipping_address_id: this.formData.shippingAddressId ? parseInt(this.formData.shippingAddressId) : null,
          elevenstore_return_address_id: this.formData.returnAddressId ? parseInt(this.formData.returnAddressId) : null,
          elevenstore_template_no: this.formData.templateNo || null
        };
      } else if (this.marketType === 'esm') {
        return {
          esm_market_memo: this.formData.memo,
          esm_market_number: this.formData.marketNumber,
          esm_maximun_sku_count: this.formData.maxSkuCount,
          auction_id: this.formData.auctionId || null,
          gmarket_id: this.formData.gmarketId || null,
          delivery_template_code: this.formData.deliveryTemplateCode || null,
          disclosure_template_code: this.formData.disclosureTemplateCode || null
        };
      } else {
        return {
          coopang_market_memo: this.formData.memo,
          coopang_market_number: this.formData.marketNumber,
          coopang_maximun_sku_count: this.formData.maxSkuCount,
          coopang_vendor_id: this.formData.vendorId,
          coopang_access_key: this.formData.accessKey,
          coopang_secret_key: this.formData.secretKey,
          coopang_outbound_shipping_place_code: this.formData.outboundShippingPlaceCode,
          coopang_return_center_code: this.formData.returnCenterCode,
          coopang_vendor_user_id: this.formData.vendorUserId,
          ...this.getSelectedAddressDetails()
        };
      }
    },
    async loadCoupangShippingPlaces() {
      if (!this.formData.vendorId || !this.formData.accessKey || !this.formData.secretKey) {
        ElMessage.error('벤더 ID, 액세스 키, 시크릿 키를 모두 입력해주세요.');
        return;
      }

      this.loadingAddresses = true;

      try {
        const response = await getCoupangShippingPlaces(
          this.formData.accessKey,
          this.formData.secretKey, 
          this.formData.vendorId
        );
        
        console.log('쿠팡 배송지 API 응답:', response);
        
        if (response && response.success) {
          this.coupangPlaces = {
            outboundPlaces: response.data.outboundPlaces?.items || [],
            returnCenters: response.data.returnCenters?.items || []
          };
          
          if (this.coupangPlaces.outboundPlaces.length === 0 && this.coupangPlaces.returnCenters.length === 0) {
            ElMessage.warning('등록된 배송지가 없습니다.');
          }
        } else {
          // API 응답이 있고 success가 false인 경우 서버 메시지 표시
          if (response && response.message) {
            ElMessage.error(response.message);
          } else {
            ElMessage.error('배송지를 불러오는데 실패했습니다.');
          }
          console.log('API 에러 메시지:', response?.message || '배송지를 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('쿠팡 배송지 로딩 실패:', error);
        // 서버로부터 받은 에러 메시지 사용
        ElMessage.error(error.response?.data?.message || '배송지를 불러오는데 실패했습니다. 인증 정보를 확인해주세요.');
      } finally {
        this.loadingAddresses = false;
      }
    },
    getSelectedAddressDetails() {
      const details = {};
      
      // 선택된 반품지 정보 추출
      if (this.formData.returnCenterCode && this.coupangPlaces.returnCenters) {
        const selectedReturnCenter = this.coupangPlaces.returnCenters.find(
          center => center.returnCenterCode === this.formData.returnCenterCode
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
    },
    async loadElevenStoreAddresses() {
      if (!this.formData.apiKey) {
        ElMessage.error('API 키를 먼저 입력해주세요.');
        return;
      }

      this.loadingAddresses = true;

      try {
        const response = await getElevenStoreAddress(this.formData.apiKey);
        console.log('11번가 주소록 API 응답:', response);
        
        if (response && response.success) {
          this.elevenStoreAddresses = {
            outboundPlaces: response.data?.outboundPlaces?.items || [],
            inboundPlaces: response.data?.inboundPlaces?.items || [],
            sendCloseTemplates: response.data?.sendCloseTemplates?.items || []
          };
          
          if (this.elevenStoreAddresses.outboundPlaces.length === 0 && 
              this.elevenStoreAddresses.inboundPlaces.length === 0 &&
              this.elevenStoreAddresses.sendCloseTemplates.length === 0) {
            ElMessage.warning('등록된 주소록 또는 템플릿이 없습니다.');
          }
        } else {
          // API 응답이 있고 success가 false인 경우 서버 메시지 표시
          if (response && response.message) {
            ElMessage.error(response.message);
          } else {
            ElMessage.error('주소록을 불러오는데 실패했습니다.');
          }
          console.log('API 에러 메시지:', response?.message || '주소록을 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('11번가 주소록 로딩 실패:', error);
        // 서버로부터 받은 에러 메시지 사용
        ElMessage.error(error.response?.data?.message || '주소록을 불러오는데 실패했습니다. API 키를 확인해주세요.');
      } finally {
        this.loadingAddresses = false;
      }
    },
    
    getMarketTypeName(marketType) {
      const marketNames = {
        'naver': '네이버',
        'coopang': '쿠팡',
        'elevenstore': '11번가',
        'esm': 'ESM (옥션 + G마켓)'
      };
      return marketNames[marketType] || marketType;
    }
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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--el-box-shadow-dark);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--el-border-color-light);
}

.modal-header h2 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
}

.modal-body {
  padding: var(--spacing-md);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-small);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--el-border-color-light);
  margin-top: var(--spacing-md);
}

/* 주소록 관련 스타일 */
.address-section {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--el-border-color-light);
}

.address-section h4 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-bold);
}

.address-actions {
  margin-bottom: var(--spacing-md);
}

.address-selection {
  display: grid;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-md);
}

/* 네이버, 쿠팡: 2열 그리드 */
.address-selection.naver-address,
.address-selection.coupang-address {
  grid-template-columns: 1fr 1fr;
}

/* 11번가: 3열 그리드 */
.address-selection.elevenstore-address {
  grid-template-columns: 1fr 1fr 1fr;
}

/* ESM 안내 메시지 */
.esm-notice {
  display: flex;
  align-items: flex-start;
  background-color: var(--el-color-info-light-9);
  border: 1px solid var(--el-color-info-light-7);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.esm-notice .notice-icon {
  color: var(--el-color-info);
  margin-right: var(--spacing-sm);
  margin-top: 2px;
  flex-shrink: 0;
}

.esm-notice p {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-small);
  line-height: 1.5;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .address-selection.naver-address,
  .address-selection.coupang-address,
  .address-selection.elevenstore-address {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .modal-content {
    width: 95%;
    max-width: none;
  }
  
  .modal-body {
    padding: var(--spacing-sm);
  }
}
</style> 