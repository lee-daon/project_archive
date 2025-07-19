# API 요구사항 명세서

## Home Dashboard API 전체 명세

---

### 2. 공지사항 API

#### **공지사항 목록 조회**
- **엔드포인트**: `GET /home/notices`
- **응답 (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "type": "공지",
        "tagType": "success",
        "title": "신규 기능이 추가되었습니다.",
        "date": "2024-01-15"
      },
      {
        "id": 2,
        "type": "업데이트",
        "tagType": "warning",
        "title": "시스템이 개선되었습니다.",
        "date": "2024-01-12"
      },
      {
        "id": 3,
        "type": "안내",
        "tagType": "info",
        "title": "서버 점검이 예정되어 있습니다.",
        "date": "2024-01-09"
      }
    ]
  }
  ```

#### **공지사항 상세 조회**
- **엔드포인트**: `GET /home/notices/{id}`
- **응답 (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "type": "공지",
      "tagType": "success",
      "title": "신규 기능이 추가되었습니다.",
      "date": "2024-01-15",
      "content": "<p>안녕하세요. 루프톤입니다.</p><p>이번 업데이트를 통해 <strong>새로운 대시보드 기능</strong>이 추가되었습니다. 이제 메인 화면에서 주요 현황을 한 눈에 파악할 수 있습니다.</p><ul><li>KPI 통계 정보</li><li>메모장 기능</li><li>주요 기능 바로가기</li></ul><p>많은 이용 부탁드립니다. 감사합니다.</p>"
    }
  }
  ```

---

### 3. 메모장 API

#### **메모 목록 조회**
- **엔드포인트**: `GET /home/memos`
- **응답 (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      { 
        "id": "memo-1", 
        "title": "오늘 할 일", 
        "content": "- 대시보드 개발 완료\n- 저녁 장보기", 
        "updated_at": "2024-07-23T10:00:00Z" 
      },
      { 
        "id": "memo-2", 
        "title": "아이디어", 
        "content": "새로운 기능 아이디어 스케치", 
        "updated_at": "2024-07-22T15:30:00Z" 
      }
    ]
  }
  ```

#### **메모 생성**
- **엔드포인트**: `POST /home/memos`
- **요청 본문**:
  ```json
  {
    "title": "새 메모",
    "content": "내용 없음"
  }
  ```
- **응답 (201 Created)**:
  ```json
  { 
    "success": true, 
    "data": { "id": "memo-3", "title": "새 메모", "content": "내용 없음", "updated_at": "2024-07-23T10:30:00Z" } 
  }
  ```

#### **메모 수정**
- **엔드포인트**: `PUT /home/memos/{id}`
- **요청 본문**:
  ```json
  {
    "title": "수정된 제목",
    "content": "수정된 내용"
  }
  ```
- **응답 (200 OK)**:
  ```json
  { 
    "success": true, 
    "data": { "id": "{id}", "title": "수정된 제목", "content": "수정된 내용", "updated_at": "2024-07-23T10:35:00Z" } 
  }
  ```

#### **메모 삭제**
- **엔드포인트**: `DELETE /home/memos/{id}`
- **응답 (200 OK)**:
  ```json
  { 
    "success": true, 
    "message": "메모가 삭제되었습니다." 
  }
  ```

---

### 4. 사용되는 모든 엔드포인트 요약

| API | 메서드 | 엔드포인트 | 설명 |
|-----|--------|------------|------|
| 공지사항 목록 | GET | `/home/notices` | 공지사항 목록 조회 |
| 공지사항 상세 | GET | `/home/notices/{id}` | 특정 공지사항 상세 조회 |
| 메모 목록 | GET | `/home/memos` | 메모 목록 조회 |
| 메모 생성 | POST | `/home/memos` | 새 메모 생성 |
| 메모 수정 | PUT | `/home/memos/{id}` | 메모 수정 |
| 메모 삭제 | DELETE | `/home/memos/{id}` | 메모 삭제 |

### 5. 프론트엔드 연동 참고사항

#### Home 대시보드 페이지에서 사용하는 주요 기능:
1. **KPI 애니메이션**: statistics 데이터를 0부터 실제 값까지 카운팅
2. **사용 현황 시각화**: quota 데이터를 원형 프로그레스 바로 표시
3. **공지사항 모달**: 목록 클릭 시 상세 내용을 모달로 표시
4. **메모장 CRUD**: 삼성 메모장 스타일의 UI로 메모 관리
5. **바로가기 기능**: 주요 페이지로 이동하는 아이콘 버튼들
