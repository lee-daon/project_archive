/**
 * 문자열을 배열로 변환합니다
 * @param {string} str - 쉼표로 구분된 문자열
 * @returns {Array} 변환된 배열
 */
export const stringToArray = (str) => {
  if (!str || typeof str !== 'string') return [];
  return str.split(',')
    .map(item => item.trim())
    .filter(item => item !== '');
};
