import fs from 'fs';

/**
 * 배열 b에만 있는 요소를 찾아 반환하는 함수
 * @param {Array} a - 첫 번째 배열
 * @param {Array} b - 두 번째 배열
 * @returns {Array} - b에만 존재하는 요소들의 배열
 */
function findElementsOnlyInB(a, b) {
    return b.filter(item => !a.includes(item));
  }
    
/**
 * 배열에서 중복된 요소를 찾아 반환하는 함수
 * @param {Array} arr - 입력 배열
 * @returns {Array} - 중복된 요소들의 배열
 */
function findDuplicates1(arr) {
    const seen = new Set(); // 이미 본 요소들을 저장할 Set
    const duplicates = new Set(); // 중복된 요소들을 저장할 Set
  
    for (const item of arr) {
      if (seen.has(item)) {
        // 이미 본 요소라면 중복 목록에 추가
        duplicates.add(item);
      } else {
        // 처음 보는 요소라면 seen Set에 추가
        seen.add(item);
      }
    }
  
    // Set을 배열로 변환하여 반환
    return Array.from(duplicates);
  }

/**
 * 배열에서 중복된 요소를 제거하는 함수
 * @param {Array} arr - 입력 배열
 * @returns {Array} - 중복이 제거된 새로운 배열
 */
function createUniqueArray(arr){
      // 중복 제거된 배열 얻기
      const uniqueArray = [...new Set(arr)];
      
      // 파일 경로 및 이름 설정 (원하는 경로와 이름으로 변경 가능)
      const filePath = 'unique_elements.js';
      
      // 배열을 JSON 문자열로 변환합니다.
      // JSON.stringify의 세 번째 인자(space)는 가독성을 위해 들여쓰기를 추가합니다. (예: 2칸 들여쓰기)
      const jsonString = JSON.stringify(uniqueArray, null, 2);
      
      try {
        // fs.writeFileSync를 사용하여 동기적으로 파일에 씁니다.
        fs.writeFileSync(filePath, jsonString, 'utf8');
        console.log(`중복 제거된 배열이 ${filePath} 파일로 성공적으로 저장되었습니다.`);
      } catch (err) {
        console.error('파일 저장 중 오류가 발생했습니다:', err);
      }
      
}

/**
 * 배열을 알파벳(a-z)과 한글(ㄱ-ㅎ) 순서로 정렬하는 함수
 * 알파벳은 a-z 순서로, 한글은 ㄱ-ㅎ 순서로 정렬되며
 * 알파벳이 한글보다 앞에 위치합니다.
 * @param {Array} arr - 정렬할 배열
 * @returns {Array} - 정렬된 새로운 배열
 */
function sortAlphabeticallyAndHangul(arr) {
  return [...arr].sort((a, b) => {
    // 둘 다 문자열로 변환
    const strA = String(a).toLowerCase();
    const strB = String(b).toLowerCase();
    
    // 알파벳과 한글 여부 확인
    const isAAlphabet = /^[a-z]/i.test(strA);
    const isBAlphabet = /^[a-z]/i.test(strB);
    const isAHangul = /^[ㄱ-ㅎㅏ-ㅣ가-힣]/i.test(strA);
    const isBHangul = /^[ㄱ-ㅎㅏ-ㅣ가-힣]/i.test(strB);
    const isANumber = /^\d/.test(strA);
    const isBNumber = /^\d/.test(strB);
    const isASpecial = /^[^\w가-힣ㄱ-ㅎㅏ-ㅣ\d]/.test(strA);
    const isBSpecial = /^[^\w가-힣ㄱ-ㅎㅏ-ㅣ\d]/.test(strB);
    
    // 정렬 우선순위: 알파벳 > 한글 > 숫자 > 특수문자
    // 1. 알파벳 정렬
    if (isAAlphabet && !isBAlphabet) return -1;
    if (!isAAlphabet && isBAlphabet) return 1;
    if (isAAlphabet && isBAlphabet) return strA.localeCompare(strB, 'en');
    
    // 2. 한글 정렬
    if (isAHangul && !isBHangul) return -1;
    if (!isAHangul && isBHangul) return 1;
    if (isAHangul && isBHangul) return strA.localeCompare(strB, 'ko');
    
    // 3. 숫자 정렬
    if (isANumber && !isBNumber) return -1;
    if (!isANumber && isBNumber) return 1;
    if (isANumber && isBNumber) {
      // 숫자는 수치적으로 정렬
      const numA = parseFloat(strA.match(/^\d+/)[0]);
      const numB = parseFloat(strB.match(/^\d+/)[0]);
      return numA - numB;
    }
    
    // 4. 특수문자 정렬
    if (isASpecial && !isBSpecial) return -1;
    if (!isASpecial && isBSpecial) return 1;
    
    // 5. 그 외 케이스는 일반 문자열 비교
    return strA.localeCompare(strB);
  });
}

/**
 * 배열을 알파벳/한글 순으로 정렬하고 파일로 저장하는 함수
 * @param {Array} arr - 입력 배열
 * @param {string} filePath - 저장할 파일 경로 (기본값: 'sorted_elements.js')
 * @returns {Array} - 정렬된 배열
 */
function sortAndSaveToFile(arr, filePath = 'sorted_elements.js') {
  // 배열 정렬
  const sortedArray = sortAlphabeticallyAndHangul(arr);
  
  // 배열을 JSON 문자열로 변환
  const jsonString = JSON.stringify(sortedArray, null, 2);
  
  try {
    // fs.writeFileSync를 사용하여 동기적으로 파일에 씁니다.
    fs.writeFileSync(filePath, jsonString, 'utf8');
    console.log(`정렬된 배열이 ${filePath} 파일로 성공적으로 저장되었습니다.`);
  } catch (err) {
    console.error('파일 저장 중 오류가 발생했습니다:', err);
  }
  
  return sortedArray;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////// 아래는 실제 테스트 환경 /////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////



