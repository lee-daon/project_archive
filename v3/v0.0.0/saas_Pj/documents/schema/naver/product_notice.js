//그냥 일단은 다 기타재화 사용하면 될듯?
//50005542
//50007198 이 두개의 대카테고리는 취급불가 상품임, json구조체 제작단계에서 걸러내야 함




const 패션의류류_50000000 = [
    { productInfoProvidedNoticeTypeName: '생활화학제품' },
    { productInfoProvidedNoticeTypeName: '살생물제품' },
    { productInfoProvidedNoticeTypeName: '기타 재화' },
    { productInfoProvidedNoticeTypeName: '의류' }
  ];
  
  const 패션잡화_50000001 = [
    { productInfoProvidedNoticeTypeName: '가방' },
    { productInfoProvidedNoticeTypeName: '생활화학제품' },
    { productInfoProvidedNoticeTypeName: '살생물제품' },
    { productInfoProvidedNoticeTypeName: '기타 재화' },
    { productInfoProvidedNoticeTypeName: '패션잡화(모자/벨트/액세서리 등)' },
    { productInfoProvidedNoticeTypeName: '귀금속/보석/시계류' },
    { productInfoProvidedNoticeTypeName: '구두/신발' }
  ];
  
  const 화장품미용_50000002 = [
    { productInfoProvidedNoticeTypeName: '생활화학제품' },
    { productInfoProvidedNoticeTypeName: '살생물제품' },
    { productInfoProvidedNoticeTypeName: '화장품' },
    { productInfoProvidedNoticeTypeName: '기타 재화' },
    { productInfoProvidedNoticeTypeName: '기타 용역' },
    { productInfoProvidedNoticeTypeName: '상품권/쿠폰' },
    { productInfoProvidedNoticeTypeName: '가정용전기제품(냉장고/세탁기/식기세척기/전자레인지 등)' },
    { productInfoProvidedNoticeTypeName: '의료기기' },
    { productInfoProvidedNoticeTypeName: '모바일쿠폰' }
  ];
  
  const 디지털가전_50000003 = [
    { productInfoProvidedNoticeTypeName: '생활화학제품' },
    { productInfoProvidedNoticeTypeName: '살생물제품' },
    { productInfoProvidedNoticeTypeName: '자동차용품 (자동차부품/기타 자동차용품 등)' },
    { productInfoProvidedNoticeTypeName: '휴대폰 통신기기(휴대폰/태블릿 등)' },
    { productInfoProvidedNoticeTypeName: '디지털콘텐츠(음원,게임,인터넷강의 등)' },
    { productInfoProvidedNoticeTypeName: '기타 재화' },
    { productInfoProvidedNoticeTypeName: '가정용전기제품(냉장고/세탁기/식기세척기/전자레인지 등)' },
    { productInfoProvidedNoticeTypeName: '영상가전(TV류)' },
    { productInfoProvidedNoticeTypeName: '모바일쿠폰' },
    { productInfoProvidedNoticeTypeName: '소형전자(MP3/전자사전 등)' },
    { productInfoProvidedNoticeTypeName: '내비게이션' },
    { productInfoProvidedNoticeTypeName: '사무용기기(컴퓨터/노트북/프린터 등)' },
    { productInfoProvidedNoticeTypeName: '광학기기(디지털카메라/캠코더 등)' },
    { productInfoProvidedNoticeTypeName: '물품대여서비스(서적,유아용품,행사용품 등)' },
    { productInfoProvidedNoticeTypeName: '물품대여서비스(정수기,비데,공기청정기 등)' },
    { productInfoProvidedNoticeTypeName: '계절가전(에어컨/온풍기 등)' }
  ];
  
  const 가구인테리어_50000004 = [
    { productInfoProvidedNoticeTypeName: '생활화학제품' },
    { productInfoProvidedNoticeTypeName: '살생물제품' },
    { productInfoProvidedNoticeTypeName: '기타 재화' },
    { productInfoProvidedNoticeTypeName: '가구(침대/소파/싱크대/DIY제품 등)' },
    { productInfoProvidedNoticeTypeName: '가정용전기제품(냉장고/세탁기/식기세척기/전자레인지 등)' },
    { productInfoProvidedNoticeTypeName: '물품대여서비스(서적,유아용품,행사용품 등)' },
    { productInfoProvidedNoticeTypeName: '물품대여서비스(정수기,비데,공기청정기 등)' },
    { productInfoProvidedNoticeTypeName: '침구류/커튼' }
  ];
  
  const 출산육아용품_50000005 = [
    { productInfoProvidedNoticeTypeName: '가방' },
    { productInfoProvidedNoticeTypeName: '생활화학제품' },
    { productInfoProvidedNoticeTypeName: '살생물제품' },
    { productInfoProvidedNoticeTypeName: '서적' },
    { productInfoProvidedNoticeTypeName: '화장품' },
    { productInfoProvidedNoticeTypeName: '디지털콘텐츠(음원,게임,인터넷강의 등)' },
    { productInfoProvidedNoticeTypeName: '건강기능식품' },
    { productInfoProvidedNoticeTypeName: '기타 재화' },
    { productInfoProvidedNoticeTypeName: '식품(농.축.수산물)' },
    { productInfoProvidedNoticeTypeName: '가구(침대/소파/싱크대/DIY제품 등)' },
    { productInfoProvidedNoticeTypeName: '가공식품' },
    { productInfoProvidedNoticeTypeName: '패션잡화(모자/벨트/액세서리 등)' },
    { productInfoProvidedNoticeTypeName: '어린이제품' },
    { productInfoProvidedNoticeTypeName: '침구류/커튼' },
    { productInfoProvidedNoticeTypeName: '구두/신발' },
    { productInfoProvidedNoticeTypeName: '스포츠용품' },
    { productInfoProvidedNoticeTypeName: '의류' }
  ];
  
  const 식품_50000006 = [
    { productInfoProvidedNoticeTypeName: '디지털콘텐츠(음원,게임,인터넷강의 등)' },
    { productInfoProvidedNoticeTypeName: '건강기능식품' },
    { productInfoProvidedNoticeTypeName: '기타 재화' },
    { productInfoProvidedNoticeTypeName: '식품(농.축.수산물)' },
    { productInfoProvidedNoticeTypeName: '가공식품' },
    { productInfoProvidedNoticeTypeName: '모바일쿠폰' }
  ];
  
  const 스포츠용품_50000007 = [
    { productInfoProvidedNoticeTypeName: '가방' },
    { productInfoProvidedNoticeTypeName: '생활화학제품' },
    { productInfoProvidedNoticeTypeName: '살생물제품' },
    { productInfoProvidedNoticeTypeName: '자동차용품 (자동차부품/기타 자동차용품 등)' },
    { productInfoProvidedNoticeTypeName: '기타 재화' },
    { productInfoProvidedNoticeTypeName: '가정용전기제품(냉장고/세탁기/식기세척기/전자레인지 등)' },
    { productInfoProvidedNoticeTypeName: '패션잡화(모자/벨트/액세서리 등)' },
    { productInfoProvidedNoticeTypeName: '영화/공연' },
    { productInfoProvidedNoticeTypeName: '물품대여서비스(서적,유아용품,행사용품 등)' },
    { productInfoProvidedNoticeTypeName: '구두/신발' },
    { productInfoProvidedNoticeTypeName: '스포츠용품' },
    { productInfoProvidedNoticeTypeName: '의류' }
  ];
  
  const 생활건강_50000008 = [
    { productInfoProvidedNoticeTypeName: '생활화학제품' },
    { productInfoProvidedNoticeTypeName: '살생물제품' },
    { productInfoProvidedNoticeTypeName: '서적' },
    { productInfoProvidedNoticeTypeName: '자동차용품 (자동차부품/기타 자동차용품 등)' },
    { productInfoProvidedNoticeTypeName: '화장품' },
    { productInfoProvidedNoticeTypeName: '디지털콘텐츠(음원,게임,인터넷강의 등)' },
    { productInfoProvidedNoticeTypeName: '기타 재화' },
    { productInfoProvidedNoticeTypeName: '가공식품' },
    { productInfoProvidedNoticeTypeName: '가정용전기제품(냉장고/세탁기/식기세척기/전자레인지 등)' },
    { productInfoProvidedNoticeTypeName: '주방용품' },
    { productInfoProvidedNoticeTypeName: '의료기기' },
    { productInfoProvidedNoticeTypeName: '모바일쿠폰' },
    { productInfoProvidedNoticeTypeName: '소형전자(MP3/전자사전 등)' },
    { productInfoProvidedNoticeTypeName: '악기' },
    { productInfoProvidedNoticeTypeName: '물품대여서비스(서적,유아용품,행사용품 등)' },
    { productInfoProvidedNoticeTypeName: '물품대여서비스(정수기,비데,공기청정기 등)' },
    { productInfoProvidedNoticeTypeName: '침구류/커튼' },
    { productInfoProvidedNoticeTypeName: '스포츠용품' }
  ];