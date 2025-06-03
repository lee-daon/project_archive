export let register_margin_setting = {
    minimum_margin: 5000,
    basic_minimum_margin_percentage: 10,
    basic_margin_percentage: 20,
    naver_cashback_price: 1000,
    buyingFee: 2,
    naver_sellingFee:6,
    importDuty: 8,
    importVat: 10,
    importvatlimit: 150,
    

}

export let exchangeRate = {
    china :210,
    usa : 1400,
}

export let random_discount_percentage = {
    min: 10,
    max: 30,
}

export let naver_register_config_extra_info = {
    deliveryCompany: "CJGLS",
    afterServiceTelephoneNumber: "010-4840-8754",
    afterServiceGuideContent: "A/S (개봉 및 택 제거 후 반품 교환 환불 불가)",
    naverpoint: 1000, // 네이버포인트 할인 적용 금액
    claimDeliveryInfo: { // 반품/교환 배송비 - 필수
      returnDeliveryFee: 5000, // 반품 배송비 (숫자) - 별도로직필요
      exchangeDeliveryFee: 5000, // 교환 배송비 (숫자) - 별도로직필요
      //shippingAddressId: "optional", // 출고지 주소 ID (네이버 커머스API 주소록 기능으로 조회) - 필수
      //returnAddressId: "optional", // 반품/교환지 주소 ID (네이버 커머스API 주소록 기능으로 조회) - 필수
      // freeReturnShippingType: null, // 무료 반품 조건 (예: WRONG_ORDER - 잘못된 주문)
    },
    purchasePoint: 1000,
    reviewPointPolicy: {
      textReviewPoint: 1000,
      photoVideoReviewPoint: 1000,
      afterUseTextReviewPoint: 1000,
      afterUsePhotoVideoReviewPoint: 1000,
      storeMemberReviewPoint: 2000,
    }
  }
  


