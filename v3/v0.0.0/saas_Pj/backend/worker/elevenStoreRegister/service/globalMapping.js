/**
 * 11번가 등록용 매핑 모듈
 * optionChoice의 결과를 11번가 XML 구조로 직접 생성합니다.
 */

/**
 * 11번가 등록용 XML 데이터 생성
 * @param {object} filteredJsonData - optionChoice에서 필터링된 JSON 데이터
 * @param {number} representativePrice - 대표 가격
 * @param {object} config - 설정 데이터 (getConfig 결과)
 * @param {string} productGroupCode - 상품 그룹 코드
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Promise<{ success: boolean, xmlString: string, message: string }>}
 */
export async function createElevenstoreMapping(filteredJsonData, representativePrice, config, productGroupCode, userid, productid) {
    try {
        console.log('11번가 매핑 시작 - 상품:', filteredJsonData.productName);

        const xmlString = createXmlString(filteredJsonData, representativePrice, config, productGroupCode, userid, productid);

        console.log('11번가 매핑 완료 - 옵션 수:', filteredJsonData.variants?.length || 0);

        return {
            success: true,
            xmlString,
            message: '11번가 매핑 성공'
        };

    } catch (error) {
        console.error('11번가 매핑 오류:', error);
        return {
            success: false,
            xmlString: null,
            message: `매핑 오류: ${error.message}`
        };
    }
}

/**
 * 11번가 XML 문자열 직접 생성
 */
function createXmlString(data, representativePrice, config, productGroupCode, userid, productid) {
    const now = new Date();
    const aplBgnDy = now.toISOString().split('T')[0].replace(/-/g, '/');
    
    // 이미지 처리
    const images = [data.representativeImage, ...(data.images || [])].filter(Boolean);
    
    // 배송 정보 (priceCalculator에서 이미 처리됨)
    const freeShipping = data.deliveryInfo?.freeShipping || false;
    const deliveryFee = data.deliveryInfo?.deliveryFee || 0;

    return `<?xml version="1.0" encoding="euc-kr" ?>
<Product>
  <abrdBuyPlace>D</abrdBuyPlace>
  <abrdSizetableDispYn>${config.elevenstoreConfig.overseasSizeChartDisplay ? 'Y' : ''}</abrdSizetableDispYn>
  <selMthdCd>01</selMthdCd>
  <dispCtgrNo>${data.elevenstoreCatId}</dispCtgrNo>
  <prdTypCd>01</prdTypCd>
  <prdNm>${escapeXml(data.productName)}</prdNm>
  <brand>&#39;알수없음&#39;</brand>
  
  <rmaterialTypCd>04</rmaterialTypCd>
  <orgnTypCd>02</orgnTypCd>
  <orgnTypDtlsCd>1287</orgnTypDtlsCd>
  <beefTraceStat>02</beefTraceStat>
  
  <sellerPrdCd>${productid}</sellerPrdCd>
  <suplDtyfrPrdClfCd>01</suplDtyfrPrdClfCd>
  <yearEndTaxYn>N</yearEndTaxYn>
  <forAbrdBuyClf>02</forAbrdBuyClf>
  <importFeeCd>${config.priceConfig.includeImportDuty ? '01' : '02'}</importFeeCd>
  <prdStatCd>01</prdStatCd>
  <minorSelCnYn>Y</minorSelCnYn>
  
  <prdImage01>${escapeXml(images[0] || '')}</prdImage01>
  <prdImage02>${escapeXml(images[1] || '')}</prdImage02>
  <prdImage03>${escapeXml(images[2] || '')}</prdImage03>
  <prdImage04>${escapeXml(images[3] || '')}</prdImage04>
  
  <htmlDetail>${escapeXml(data.contents || '')}</htmlDetail>
  
  <ProductCertGroup>
    <crtfGrpTypCd>01</crtfGrpTypCd>
    <crtfGrpObjClfCd>03</crtfGrpObjClfCd>
    <crtfGrpExptTypCd>02</crtfGrpExptTypCd>
  </ProductCertGroup>
  <ProductCertGroup>
    <crtfGrpTypCd>02</crtfGrpTypCd>
    <crtfGrpObjClfCd>03</crtfGrpObjClfCd>
    <crtfGrpExptTypCd>02</crtfGrpExptTypCd>
  </ProductCertGroup>
  <ProductCertGroup>
    <crtfGrpTypCd>03</crtfGrpTypCd>
    <crtfGrpObjClfCd>03</crtfGrpObjClfCd>
    <crtfGrpExptTypCd>02</crtfGrpExptTypCd>
  </ProductCertGroup>
  <ProductCertGroup>
    <crtfGrpTypCd>04</crtfGrpTypCd>
    <crtfGrpObjClfCd>03</crtfGrpObjClfCd>
    <crtfGrpExptTypCd>02</crtfGrpExptTypCd>
  </ProductCertGroup>
  
  <selPrdClfCd>0:100</selPrdClfCd>
  <aplBgnDy>${aplBgnDy}</aplBgnDy>
  <aplEndDy>2999/12/31</aplEndDy>
  <selTermUseYn>N</selTermUseYn>
  
  <selPrc>${representativePrice}</selPrc>
  
  <cuponcheck>Y</cuponcheck>
  <dscAmtPercnt>${data.discountRate || 0}</dscAmtPercnt>
  <cupnDscMthdCd>02</cupnDscMthdCd>
  <cupnUseLmtDyYn>N</cupnUseLmtDyYn>
  
  <pay11YN>${config.elevenstoreConfig.elevenstorePointAmount ? 'Y' : 'N'}</pay11YN>
  <pay11Value>${config.elevenstoreConfig.elevenstorePointAmount || 0}</pay11Value>
  <pay11WyCd>02</pay11WyCd>
  
  ${createOptionXml(data, representativePrice, productid)}
  
  <selMinLimitTypCd>00</selMinLimitTypCd>
  <selLimitTypCd>00</selLimitTypCd>
  
  <dlvCnAreaCd>01</dlvCnAreaCd>
  <dlvWyCd>01</dlvWyCd>
  <dlvEtprsCd>${config.elevenstoreConfig.deliveryCompanyCode || '00045'}</dlvEtprsCd>
  <dlvCstInstBasiCd>${freeShipping ? '01' : '02'}</dlvCstInstBasiCd>
  <dlvCst1>${deliveryFee}</dlvCst1>
  <bndlDlvCnYn>N</bndlDlvCnYn>
  <dlvCstPayTypCd>03</dlvCstPayTypCd>
  
  <addrSeqOut>${config.elevenstoreConfig.returnInfo.shippingAddressId}</addrSeqOut>
  <outsideYnOut>Y</outsideYnOut>
  <addrSeqIn>${config.elevenstoreConfig.returnInfo.returnAddressId}</addrSeqIn>
  
  <abrdCnDlvCst>${config.elevenstoreConfig.returnInfo.returnCost}</abrdCnDlvCst>
  <rtngdDlvCst>${config.elevenstoreConfig.returnInfo.returnCost}</rtngdDlvCst>
  <exchDlvCst>${config.elevenstoreConfig.returnInfo.exchangeCost}</exchDlvCst>
  
  <asDetail>${escapeXml(config.elevenstoreConfig.asGuide || '')}</asDetail>
  <rtngExchDetail>${escapeXml(config.elevenstoreConfig.returnExchangeGuide || '')}</rtngExchDetail>
  
  <ProductNotification>
    <type>891045</type>
    <item>
      <code>11800</code>
      <name>상품상세설명 참조</name>
    </item>
    <item>
      <code>11905</code>
      <name>상품상세설명 참조</name>
    </item>
    <item>
      <code>23760413</code>
      <name>상품상세설명 참조</name>
    </item>
    <item>
      <code>23759100</code>
      <name>상품상세설명 참조</name>
    </item>
    <item>
      <code>23756033</code>
      <name>상품상세설명 참조</name>
    </item>
  </ProductNotification>
  
  <useGiftYn>N</useGiftYn>
  <gftPackTypCd>01</gftPackTypCd>
  <bcktExYn>N</bcktExYn>
  <prcCmpExpYn>Y</prcCmpExpYn>
  <prcDscCmpExpYn>Y</prcDscCmpExpYn>
  <martCPSAgreeYn>Y</martCPSAgreeYn>
  <stdPrdYn>Y</stdPrdYn>
</Product>`;
}

/**
 * 옵션 정보 XML 생성 (복잡하므로 함수로 유지)
 */
function createOptionXml(data, representativePrice, productid) {
    const variants = data.variants || [];
    const optionSchema = data.optionSchema || [];

    // 옵션이 없는 경우
    if (variants.length === 0 || optionSchema.length === 0) {
        return `
  <optSelectYn>N</optSelectYn>
  <txtColCnt>1</txtColCnt>
  <optionAllQty>9999</optionAllQty>
  <optionAllAddPrc>0</optionAllAddPrc>
  <prdExposeClfCd>03</prdExposeClfCd>
  <optMixYn>N</optMixYn>`;
    }

    // 옵션이 있는 경우
    const rootOptionsXml = optionSchema.map(option => `
  <ProductRootOption>
    <colTitle>${escapeXml(option.optionName)}</colTitle>
    ${option.optionValues.map(value => `
    <ProductOption>
      <colOptPrice>0</colOptPrice>
      <colValue0>${escapeXml(value.valueName)}</colValue0>
      <optionImage>${escapeXml(value.imageUrl || '')}</optionImage>
    </ProductOption>`).join('')}
  </ProductRootOption>`).join('');

    const optionExtXml = variants.map(variant => {
        const optionMappingKey = createOptionMappingKey(variant.optionCombination, optionSchema);
        const colOptPrice = variant.optionPrice || 0;
        
        return `
    <ProductOption>
      <useYn>Y</useYn>
      <colOptPrice>${colOptPrice}</colOptPrice>
      <colOptCount>${variant.stockQuantity || 9999}</colOptCount>
      <colSellerStockCd>${productid}</colSellerStockCd>
      <optionMappingKey>${escapeXml(optionMappingKey)}</optionMappingKey>
    </ProductOption>`;
    }).join('');

    return `
  <optSelectYn>Y</optSelectYn>
  <txtColCnt>1</txtColCnt>
  <optionAllQty>9999</optionAllQty>
  <optionAllAddPrc>0</optionAllAddPrc>
  <prdExposeClfCd>03</prdExposeClfCd>
  <optMixYn>N</optMixYn>
  ${rootOptionsXml}
  <ProductOptionExt>
    ${optionExtXml}
  </ProductOptionExt>`;
}

/**
 * 옵션 매핑키 생성
 * @param {array} optionCombination - 옵션 조합 [{ optionId, valueId }]
 * @param {array} optionSchema - 옵션 스키마
 * @returns {string} 옵션 매핑키
 */
function createOptionMappingKey(optionCombination, optionSchema) {
    if (!optionCombination || optionCombination.length === 0) {
        return '';
    }

    if (!optionSchema || optionSchema.length === 0) {
        return '';
    }

    const mappingParts = optionCombination.map(combo => {
        if (!combo || !combo.optionId || !combo.valueId) {
            return 'Unknown:Unknown';
        }

        // optionId로 옵션 찾기
        const option = optionSchema.find(opt => opt.optionId === combo.optionId) || 
                      optionSchema.find(opt => opt.optionName) || 
                      optionSchema[0];
        
        const optionName = option?.optionName || 'Unknown';
        
        // valueId로 옵션 값 찾기
        const value = option?.optionValues?.find(val => val.valueId === combo.valueId) || 
                     option?.optionValues?.find(val => val.valueName) || 
                     option?.optionValues?.[0];
        
        const valueName = value?.valueName || 'Unknown';
        
        return `${optionName}:${valueName}`;
    });

    return mappingParts.join('†');
}

/**
 * XML 특수문자 이스케이프
 * @param {string} text - 이스케이프할 텍스트
 * @returns {string} 이스케이프된 텍스트
 */
function escapeXml(text) {
    if (typeof text !== 'string') {
        return String(text || '');
    }
    
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
