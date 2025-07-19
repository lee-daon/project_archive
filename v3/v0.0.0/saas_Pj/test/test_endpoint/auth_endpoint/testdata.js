/**
 * 인증 API 테스트용 샘플 데이터
 */

// 유효한 사용자 데이터
const validUsers = [
  {
    id: 'testuser1',
    password: 'Test123!@#',
    name: '테스트유저일',
    email: 'test1@example.com'
  },
  {
    id: 'testuser2',
    password: 'Pass456!@#',
    name: '테스트유저이',
    email: 'test2@example.com'
  },
  {
    id: 'admin123',
    password: 'Admin789!@#',
    name: '관리자',
    email: 'admin@example.com'
  }
];

// 잘못된 형식의 사용자 데이터
const invalidUsers = {
  invalidEmail: {
    id: 'testuser3',
    password: 'Test123!@#',
    name: '테스트유저삼',
    email: 'invalid-email'
  },
  invalidPassword: {
    id: 'testuser4',
    password: '123', // 조건에 맞지 않는 비밀번호
    name: '테스트유저사',
    email: 'test4@example.com'
  },
  invalidName: {
    id: 'testuser5',
    password: 'Test123!@#',
    name: '테스트유저5', // 숫자 포함
    email: 'test5@example.com'
  },
  invalidId: {
    id: 'te', // 짧은 아이디
    password: 'Test123!@#',
    name: '테스트유저육',
    email: 'test6@example.com'
  }
};


// 전역 변수로 노출
window.authTestData = {
  validUsers,
  invalidUsers
}; 