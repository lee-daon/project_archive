# XML 응답 처리 주의사항

## 11번가 API XML 인코딩 이슈

### 문제 상황
11번가 Open API는 XML 응답을 `euc-kr` 인코딩으로 반환하는데, 일반적인 `response.text()`로 처리할 경우 한글이 깨져서 나옵니다.

### 예시 - 문제가 있는 코드
```javascript
// ❌ 잘못된 방법 - 한글 깨짐
const xmlData = await response.text();
console.log(xmlData); // �Ƴ���, ��⵵ ������ 등으로 출력됨
```

### 해결 방법
`iconv-lite` 라이브러리를 사용하여 `euc-kr` 인코딩을 명시적으로 처리해야 합니다.

```javascript
// ✅ 올바른 방법
import iconv from 'iconv-lite';

const buffer = await response.arrayBuffer();
const xmlData = iconv.decode(Buffer.from(buffer), 'euc-kr');
console.log(xmlData); // 한글이 정상적으로 출력됨
```

### 설치 필요 라이브러리
```bash
npm install iconv-lite
```

### 11번가 API 응답 구조 특징
1. **인코딩**: `euc-kr` (UTF-8이 아님)
2. **네임스페이스**: `ns2:` 접두사 사용
3. **결과 메시지**: `ns2:result_message` 필드가 항상 있는 것은 아님
4. **성공 판단**: 데이터 존재 여부로 판단 (result_message 보다는)

### 파싱 시 주의사항
```javascript
// 데이터 존재 여부로 성공/실패 판단
const addresses = jsonData['ns2:inOutAddresss']?.['ns2:inOutAddress'] || [];

if (!addresses || addresses.length === 0) {
  throw new Error('주소 데이터가 없습니다.');
}

// result_message는 선택적으로 확인
const resultMessage = jsonData['ns2:inOutAddresss']?.['ns2:result_message']?.[0];
```

### 실제 응답 예시

#### 원본 XML (euc-kr 인코딩)
```xml
<?xml version="1.0" encoding="euc-kr" standalone="yes"?>
<ns2:inOutAddresss xmlns:ns2="http://skt.tmall.business.openapi.spring.service.client.domain/">
  <ns2:inOutAddress>
    <addr>경기도 성남시 분당구 인구동220번지 6-75 (은탄동) 은탄동 3층 W1호(은탄동)</addr>
    <addrNm>은탄동</addrNm>
    <addrSeq>2</addrSeq>
    <gnrlTlphnNo>010-4840-8754</gnrlTlphnNo>
    <memNo>75862888</memNo>
    <prtblTlphnNo>010-4840-8754</prtblTlphnNo>
    <rcvrNm>은탄</rcvrNm>
  </ns2:inOutAddress>
</ns2:inOutAddresss>
```

#### 파싱된 JSON 구조
```json
{
  "ns2:inOutAddresss": {
    "$": {
      "xmlns:ns2": "http://skt.tmall.business.openapi.spring.service.client.domain/"
    },
    "ns2:inOutAddress": [
      {
        "addr": ["경기도 성남시 분당구 인구동220번지 6-75 (은탄동) 은탄동 3층 W1호(은탄동)"],
        "addrNm": ["은탄동"],
        "addrSeq": ["2"],
        "gnrlTlphnNo": ["010-4840-8754"],
        "memNo": ["75862888"],
        "prtblTlphnNo": ["010-4840-8754"],
        "rcvrNm": ["은탄"]
      }
    ]
  }
}
```

### 데이터 추출 시 주의사항
XML을 JSON으로 파싱할 때 모든 값이 배열로 변환되므로 `[0]` 인덱스로 접근해야 합니다.

```javascript
// 각 필드는 배열 형태로 파싱됨
const processedAddresses = addresses.map(addr => ({
  addrSeq: addr.addrSeq?.[0],     // [0] 인덱스 필요
  addrNm: addr.addrNm?.[0],       // [0] 인덱스 필요
  addr: addr.addr?.[0],           // [0] 인덱스 필요
  // ...
}));
```

### 에러 처리 권장사항
1. **HTTP 상태 코드 확인**: `response.ok` 체크
2. **데이터 존재 확인**: 주소 배열이 비어있지 않은지 확인
3. **인코딩 처리**: `iconv-lite`로 적절한 디코딩
4. **네임스페이스 처리**: `ns2:` 접두사 고려

### 다른 XML API 대응 시 고려사항
- 각 API마다 인코딩이 다를 수 있음
- XML 스키마와 네임스페이스가 다를 수 있음
- 에러 응답 구조가 다를 수 있음
- API 문서의 응답 예시를 참고하여 파싱 로직 구현 필요
