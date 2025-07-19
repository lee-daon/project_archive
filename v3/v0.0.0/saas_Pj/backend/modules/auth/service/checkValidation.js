const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: '유효하지 않은 이메일 형식입니다.' };
  }
  return { valid: true };
};

const validatePassword = (password) => {
  // 8글자 이상, 숫자, 문자, 특수문자 포함
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return { valid: false, message: '비밀번호는 8글자 이상이고 숫자, 문자, 특수문자를 포함해야 합니다.' };
  }
  return { valid: true };
};

const validateName = (name) => {
  // 이름은 숫자가 포함되지 않아야 함
  const nameRegex = /^[^0-9]+$/;
  if (!nameRegex.test(name)) {
    return { valid: false, message: '이름에는 숫자가 포함될 수 없습니다.' };
  }
  return { valid: true };
};

const validateId = (id) => {
  // 기본적인 ID 형식 검증 (영문자, 숫자 조합으로 4글자 이상)
  const idRegex = /^[A-Za-z0-9]{4,}$/;
  if (!idRegex.test(id)) {
    return { valid: false, message: '아이디는 4글자 이상의 영문자와 숫자 조합이어야 합니다.' };
  }
  return { valid: true };
};

export { validateEmail, validatePassword, validateName, validateId };
