# 11번가 상품등록 API XML 구조 (조합형 옵션)

## API 개요
- **서비스**: 11번가 상품등록/신규상품등록 API
- **Method**: POST
- **URL**: http://api.11st.co.kr/rest/prodservices/product
- **Content-Type**: XML
- **API Key**: HTTP Headers에서 읽음
- **데이터**: Request Body에 XML 형태로 전송

## XML 루트 구조 (조합형 옵션용)

```xml
<Product>
    <!-- 기본 상품 정보 -->
    <abrdBuyPlace>D</abrdBuyPlace>
    <abrdSizetableDispYn></abrdSizetableDispYn> 
    #조견표 노출 여부 (Y/N)
    <selMthdCd>01</selMthdCd>
    <dispCtgrNo></dispCtgrNo>
    #카테고리 번호
    
    <!-- 상품 기본 정보 -->
    <prdTypCd>01</prdTypCd>
    <prdNm></prdNm>#상품명
    <brand>&#39;알수없음&#39;</brand>
    
    <!-- 원산지 정보 -->
    <rmaterialTypCd>04</rmaterialTypCd>
    <orgnTypCd>02</orgnTypCd>
    <orgnTypDtlsCd>1287</orgnTypDtlsCd>
    
    <!-- 축산물 이력번호 -->
    <beefTraceStat>02</beefTraceStat>
    
    <!-- 판매자 정보 -->
    <sellerPrdCd></sellerPrdCd>#판매자 코드
    <suplDtyfrPrdClfCd>01</suplDtyfrPrdClfCd>
    <yearEndTaxYn>N</yearEndTaxYn>
    <forAbrdBuyClf>02</forAbrdBuyClf>
    <importFeeCd></importFeeCd>#관세포함여부(01포함02미포함)
    
    <!-- 상품 상태 -->
    <prdStatCd>01</prdStatCd>
    <minorSelCnYn>Y</minorSelCnYn>
    
    <!-- 이미지 정보 -->
    <prdImage01></prdImage01>
    <prdImage02></prdImage02>
    <prdImage03></prdImage03>
    <prdImage04></prdImage04>
    
    <!-- 상세설명 -->
    <htmlDetail></htmlDetail>
    
    <!-- 인증정보그룹 -->
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
    
    <!-- 판매기간 설정 -->
    <selPrdClfCd>0:100</selPrdClfCd>
    <aplBgnDy></aplBgnDy>#판매시작일=지금시간
    <aplEndDy>2999/12/31</aplEndDy>
    <selTermUseYn>N</selTermUseYn>
    
    <!-- 가격 정보 -->
    <selPrc></selPrc>
    
    <!-- 할인 정보 -->
    <cuponcheck>Y</cuponcheck>#할인
    <dscAmtPercnt></dscAmtPercnt>#수치(%)
    <cupnDscMthdCd>02</cupnDscMthdCd>
    <cupnUseLmtDyYn>N</cupnUseLmtDyYn>
    
    <!-- 11pay 포인트 -->
    <pay11YN></pay11YN>#포인트지급여부
    <pay11Value></pay11Value>#포인트 지급액
    <pay11WyCd>02</pay11WyCd>

    <!-- 조합형 옵션 설정 (개별 가격설정용) -->
    <optSelectYn>Y</optSelectYn>
    <txtColCnt>1</txtColCnt>
    <optionAllQty>9999</optionAllQty>#일괄재고수량
    <optionAllAddPrc>0</optionAllAddPrc>#일괄옵션가(0원고정)
    <prdExposeClfCd>03</prdExposeClfCd>#옵션값 노출방식
    <optMixYn>N</optMixYn>#개별가격설정용: 정의한 조합만 생성
    
    <!-- 루트 옵션 (UI 구조화를 위한 옵션명/값 정의) -->
    <ProductRootOption>
        <colTitle></colTitle>#첫번째 옵션명 (예: 색상)
        <ProductOption>
            <colOptPrice>0</colOptPrice>
            <colValue0></colValue0>#첫번째 옵션값 (예: 빨강)
            <optionImage></optionImage>#옵션이미지 URL
        </ProductOption>
        <ProductOption>
            <colOptPrice>0</colOptPrice>
            <colValue0></colValue0>#두번째 옵션값 (예: 파랑)
            <optionImage></optionImage>
        </ProductOption>
    </ProductRootOption>
    
    <ProductRootOption>
        <colTitle></colTitle>#두번째 옵션명 (예: 사이즈)
        <ProductOption>
            <colOptPrice>0</colOptPrice>
            <colValue0></colValue0>#첫번째 옵션값 (예: S)
        </ProductOption>
        <ProductOption>
            <colOptPrice>0</colOptPrice>
            <colValue0></colValue0>#두번째 옵션값 (예: M)
        </ProductOption>
    </ProductRootOption>
    
    <!-- 확장 옵션 (조합별 개별 가격설정) -->
    <ProductOptionExt>
        <ProductOption>
            <useYn>Y</useYn>#옵션상태
            <colOptPrice></colOptPrice>#개별 옵션가 설정 가능!
            <colSellerStockCd></colSellerStockCd>#셀러재고번호
            <optionMappingKey></optionMappingKey>#옵션매핑Key (예: 색상:빨강†사이즈:S)
        </ProductOption>
        <ProductOption>
            <useYn>Y</useYn>#옵션상태(품절x여부)
            <colOptPrice></colOptPrice>#두번째 조합의 개별 가격
            <colSellerStockCd></colSellerStockCd>
            <optionMappingKey></optionMappingKey>#다른 조합 키
        </ProductOption>
    </ProductOptionExt>
    
    <!-- 재고 및 구매 제한 -->
    <prdSelQty></prdSelQty>#재고수량(옵션있으면 자동계산)
    <selMinLimitTypCd>00</selMinLimitTypCd>#최소구매수량 설정(00:제한안함)
    <selLimitTypCd>00</selLimitTypCd>#최대구매수량 설정(00:제한안함)
    
    <!-- 사은품 정보 -->
    <useGiftYn>N</useGiftYn>
    
    <!-- 선물포장 -->
    <gftPackTypCd>01</gftPackTypCd>#선물포장(01:불가)
    
    <!-- 배송 정보 -->
    <dlvCnAreaCd>01</dlvCnAreaCd>#배송가능지역(01:전국)
    <dlvWyCd>01</dlvWyCd>#배송방법(01:택배)
    <dlvEtprsCd></dlvEtprsCd>#발송택배사
    
    <!-- 배송비 설정 -->
    <dlvCstInstBasiCd></dlvCstInstBasiCd>#01 : 무료  02 : 고정 배송비
    <dlvCst1></dlvCst1> # 배송비
    <bndlDlvCnYn>N</bndlDlvCnYn>
    <dlvCstPayTypCd>03</dlvCstPayTypCd>
    
    <!-- 주소 정보 -->
    <addrSeqOut></addrSeqOut>
    <outsideYnOut>Y</outsideYnOut>
    <addrSeqIn></addrSeqIn>
   
    <!-- 배송비 정보 -->
    <abrdCnDlvCst></abrdCnDlvCst>#취소(반품과 동일)
    <rtngdDlvCst></rtngdDlvCst>#취소
    <exchDlvCst></exchDlvCst>#교환 
    
    <!-- A/S 및 반품/교환 -->
    <asDetail></asDetail>
    <rtngExchDetail></rtngExchDetail> #반품/교환 안내
    
    <!-- 상품정보제공고시 -->
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
    
    <!-- 기타 설정 -->
    <bcktExYn>N</bcktExYn>
    <prcCmpExpYn>Y</prcCmpExpYn>
    <prcDscCmpExpYn>Y</prcDscCmpExpYn>
    <martCPSAgreeYn>Y</martCPSAgreeYn>
    <stdPrdYn>Y</stdPrdYn>
   
</Product>
```

## 조합형 옵션(멀티옵션) 필수 설정

### 1. 기본 옵션 설정
- `optSelectYn`: Y (옵션 사용)
- `txtColCnt`: 1 (고정값)
- `optionAllQty`: 일괄재고수량 설정
- `optionAllAddPrc`: 0 (멀티옵션은 0원 고정)
- `optMixYn`: N (개별가격설정용: 정의한 조합만 생성)

### 2. ProductRootOption (옵션명 정의) - 권장
- **UI 구조화**를 위해 포함하는 것을 **강력 권장**
- 깔끔한 옵션 드롭다운과 사용자 경험 향상
- `colTitle`: 옵션명 (예: 색상, 사이즈)
- `ProductOption`: 해당 옵션의 값들 정의
- ⚠️ **주의**: 여기에 정의하지 않은 옵션값은 매핑키에서 사용 불가

### 3. ProductOptionExt (개별 조합 설정) - 필수
- `optionMappingKey`: 옵션 조합 키 (예: "색상:빨강†사이즈:S")
- `colOptPrice`: **각 조합별 개별 가격** 설정 가능!
- `colOptCount`: **각 조합별 개별 재고** 설정 가능!
- `useYn`: 옵션 사용 여부

## 옵션 매핑 키 규칙
```
형식: "옵션명1:옵션값1†옵션명2:옵션값2"
예시: "색상:빨강†사이즈:S", "색상:파랑†사이즈:M"
```

## 제거된 불필요한 요소들
- ~~ProductCustOption~~ (구매자 작성형 옵션)
- ~~계산형 옵션 관련 필드들~~
- ~~단순 ProductOption~~ (싱글옵션용)
- ~~복수구매할인, 무이자할부, 희망후원~~ (선택사항)
- ~~추가구성상품~~ (선택사항)
- ~~의료기기, 리뷰설정, 휴대폰약정~~ (특수카테고리용)

## 참고사항
- 조합형 옵션은 최대 3차원까지 지원
- 옵션 이미지는 첫번째 옵션에만 설정 가능
- API로는 옵션별 개별 재고/가격 설정 불가 (일괄설정만 가능)
- 초기 개발 시 Seller Office와 병행 개발 필수

## 🎯 권장 사용법 (개별 가격설정 + UI 구조화)

| 상황 | 권장 방식 | 설정 방법 |
|------|-----------|-----------|
| **조합별 다른 가격/재고** | optMixYn=N + ProductRootOption ⭐ | UI 구조화 + 개별 가격 설정 |
| **간단한 개별 가격설정** | optMixYn=N만 사용 | ProductRootOption 없이 빠른 설정 |
| **모든 조합 동일 조건** | ProductRootOption만 사용 | 전체 조합 자동 생성 |

## ✨ 완전한 개별 가격설정 예시 (UI 구조화 포함)

```xml
<!-- 기본 설정 -->
<optSelectYn>Y</optSelectYn>
<optMixYn>N</optMixYn> <!-- 개별 가격설정의 핵심! -->

<!-- UI 구조화: 옵션명과 값 정의 -->
<ProductRootOption>
  <colTitle>색상</colTitle>
  <ProductOption>
    <colOptPrice>0</colOptPrice>
    <colValue0>빨강</colValue0>
    <optionImage>https://example.com/red.jpg</optionImage>
  </ProductOption>
  <ProductOption>
    <colOptPrice>0</colOptPrice>
    <colValue0>파랑</colValue0>
    <optionImage>https://example.com/blue.jpg</optionImage>
  </ProductOption>
</ProductRootOption>

<ProductRootOption>
  <colTitle>사이즈</colTitle>
  <ProductOption>
    <colOptPrice>0</colOptPrice>
    <colValue0>S</colValue0>
  </ProductOption>
  <ProductOption>
    <colOptPrice>0</colOptPrice>
    <colValue0>M</colValue0>
  </ProductOption>
  <ProductOption>
    <colOptPrice>0</colOptPrice>
    <colValue0>L</colValue0>
  </ProductOption>
</ProductRootOption>

<!-- 개별 조합별 가격/재고 설정 -->
<ProductOptionExt>
  <ProductOption>
    <useYn>Y</useYn>
    <colOptPrice>0</colOptPrice>        <!-- 빨강+S: 기본가 -->
    <colOptCount>100</colOptCount>      <!-- 재고 100개 -->
    <colSellerStockCd>RED-S-001</colSellerStockCd>
    <optionMappingKey>색상:빨강†사이즈:S</optionMappingKey>
  </ProductOption>
  <ProductOption>
    <useYn>Y</useYn>
    <colOptPrice>1000</colOptPrice>     <!-- 빨강+L: +1000원 -->
    <colOptCount>80</colOptCount>       <!-- 재고 80개 -->
    <colSellerStockCd>RED-L-001</colSellerStockCd>
    <optionMappingKey>색상:빨강†사이즈:L</optionMappingKey>
  </ProductOption>
  <ProductOption>
    <useYn>Y</useYn>
    <colOptPrice>500</colOptPrice>      <!-- 파랑+M: +500원 -->
    <colOptCount>120</colOptCount>      <!-- 재고 120개 -->
    <colSellerStockCd>BLUE-M-001</colSellerStockCd>
    <optionMappingKey>색상:파랑†사이즈:M</optionMappingKey>
  </ProductOption>
  <!-- 판매하고 싶은 조합만 추가 -->
</ProductOptionExt>
```

## ⚠️ 주의사항 (개별 가격설정 + UI 구조화)

1. **optMixYn=N** 필수: 개별 가격/재고 설정을 위해 반드시 N으로 설정
2. **ProductRootOption 강력 권장**: UI 구조화와 사용자 경험 향상을 위해 포함 권장
3. **ProductOptionExt 필수**: 판매할 모든 조합을 명시적으로 정의해야 함
4. **옵션값 일치**: ProductRootOption에 정의한 값과 매핑키의 값이 정확히 일치해야 함
5. **조합별 개별 설정**: 
   - `colOptPrice`: 각 조합별 다른 가격 설정 가능
   - `colOptCount`: 각 조합별 다른 재고 설정 가능
   - `colSellerStockCd`: 조합별 고유 재고번호 설정 권장
6. **옵션 이미지**: 첫번째 옵션(색상 등)에만 설정 가능
7. **기본 판매가**: `selPrc`는 가장 낮은 옵션가를 기준으로 설정 권장

## 🎨 UI 구조화의 장점

✅ **깔끔한 옵션 드롭다운**: 색상, 사이즈별로 구분된 선택 박스  
✅ **옵션 이미지 표시**: 색상별 미리보기 이미지  
✅ **사용자 친화적**: 직관적인 옵션 선택 경험  
✅ **관리 편의성**: 옵션 구조가 명확하게 정의됨

## 📋 옵션 설정 방식 비교

### 🏆 권장: UI 구조화 + 개별 가격설정
```xml
<optMixYn>N</optMixYn>
<ProductRootOption><!-- 옵션 구조 정의 --></ProductRootOption>
<ProductOptionExt><!-- 개별 가격/재고 설정 --></ProductOptionExt>
```
**장점**: 깔끔한 UI + 완전한 가격 제어

## 💰 옵션가 계산 방식

### 기본 구조
```
최종 옵션 가격 = 기본 판매가(selPrc) + 옵션가(colOptPrice)
```

### 옵션가 설정 예시
```xml
<selPrc>10000</selPrc> <!-- 기본 판매가: 10,000원 -->

<ProductOptionExt>
  <ProductOption>
    <colOptPrice>0</colOptPrice>        <!-- 기본가: 10,000원 (10,000 + 0) -->
    <optionMappingKey>색상:빨강†사이즈:S</optionMappingKey>
  </ProductOption>
  <ProductOption>
    <colOptPrice>2000</colOptPrice>     <!-- +2,000원: 12,000원 (10,000 + 2,000) -->
    <optionMappingKey>색상:빨강†사이즈:L</optionMappingKey>
  </ProductOption>
  <ProductOption>
    <colOptPrice>-1000</colOptPrice>    <!-- -1,000원: 9,000원 (10,000 - 1,000) -->
    <optionMappingKey>색상:파랑†사이즈:S</optionMappingKey>
  </ProductOption>
</ProductOptionExt>
```

### 가격 표시 결과
| 옵션 조합 | 옵션가 | 최종 가격 |
|-----------|--------|-----------|
| 빨강 + S | +0원 | **10,000원** |
| 빨강 + L | +2,000원 | **12,000원** |
| 파랑 + S | -1,000원 | **9,000원** |

## 💡 가격 설정 팁

1. **기본 판매가**: 가장 저렴한 옵션 가격으로 설정 권장
2. **0원 옵션**: 기본가와 동일한 가격의 옵션은 `colOptPrice="0"`
3. **할인 옵션**: 기본가보다 저렴한 옵션은 음수로 설정 가능
4. **프리미엄 옵션**: 기본가보다 비싼 옵션은 양수로 설정
