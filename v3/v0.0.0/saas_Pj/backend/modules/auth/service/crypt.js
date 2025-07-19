import bcrypt from 'bcrypt';

const encryptPassword = async (password) => {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    throw new Error('비밀번호 암호화 중 오류가 발생했습니다.');
  }
};

const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error('비밀번호 비교 중 오류가 발생했습니다.');
  }
};

export { encryptPassword, comparePassword };
