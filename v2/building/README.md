
# 기능정리
## 소싱단계
1. 현재 잘 팔리는 직구 상품을 네이버에서 찾고
2. 동일상품을 타오바오 이미지검색으로 찾아서
3. 해당샵의 상품2~3개를 검토후
4. 괜찮으면 샵단위로 상품을 소싱 
4-1. 카테고리 단위 소싱 지원
4-2. 샵단위 소싱 지원원
4-3. 이미 소싱한 샵이면 경고메세지, 벤된 셀러or샵이라면 금지메세지
5. 브랜드명,상품명을 금지어 db기반 필터링
5-1.기본 금지어 db(지재권 문제가 있었던 4000개의 브랜드 제공공)

## 가공 단계
0. 금지어가 포함된 상품 소싱x
1. ai상품명생성,ai옵션명생성,ai키워드생성
2. 누끼썸네일생성 
3. 상품이미지 번역 
4. 옵션이미지번역
5. 브랜드 필터링 여부 확인인

## 등록 단계
1. 등록할 마켓 지정 
2. 상품군 단위 상품 관리 
3. 마켓별 상품 등록
4. 카테고리 관리
