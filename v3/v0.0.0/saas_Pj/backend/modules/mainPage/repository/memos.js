import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 메모 목록 조회
 * @param {number} userid - 사용자 ID
 * @returns {Promise<Array>} 메모 목록
 */
export const getMemosList = async (userid) => {
  const query = `
    SELECT 
      id,
      title,
      content,
      updated_at
    FROM memos 
    WHERE userid = ? 
    ORDER BY updated_at DESC
  `;
  
  const [rows] = await promisePool.execute(query, [userid]);
  return rows;
};

/**
 * 메모 생성
 * @param {number} userid - 사용자 ID
 * @param {string} title - 메모 제목
 * @param {string} content - 메모 내용
 * @returns {Promise<Object>} 생성된 메모 정보
 */
export const createMemo = async (userid, title, content) => {
  const query = `
    INSERT INTO memos (userid, title, content)
    VALUES (?, ?, ?)
  `;
  
  const [result] = await promisePool.execute(query, [userid, title, content]);
  
  // 생성된 메모 정보 반환
  const selectQuery = `
    SELECT id, title, content, updated_at
    FROM memos 
    WHERE id = ?
  `;
  
  const [rows] = await promisePool.execute(selectQuery, [result.insertId]);
  return rows[0];
};

/**
 * 메모 수정
 * @param {number} memoId - 메모 ID
 * @param {number} userid - 사용자 ID
 * @param {string} title - 메모 제목
 * @param {string} content - 메모 내용
 * @returns {Promise<Object|null>} 수정된 메모 정보
 */
export const updateMemo = async (memoId, userid, title, content) => {
  const query = `
    UPDATE memos 
    SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND userid = ?
  `;
  
  const [result] = await promisePool.execute(query, [title, content, memoId, userid]);
  
  if (result.affectedRows === 0) {
    return null;
  }
  
  // 수정된 메모 정보 반환
  const selectQuery = `
    SELECT id, title, content, updated_at
    FROM memos 
    WHERE id = ? AND userid = ?
  `;
  
  const [rows] = await promisePool.execute(selectQuery, [memoId, userid]);
  return rows[0];
};

/**
 * 메모 삭제
 * @param {number} memoId - 메모 ID
 * @param {number} userid - 사용자 ID
 * @returns {Promise<boolean>} 삭제 성공 여부
 */
export const deleteMemo = async (memoId, userid) => {
  const query = `
    DELETE FROM memos 
    WHERE id = ? AND userid = ?
  `;
  
  const [result] = await promisePool.execute(query, [memoId, userid]);
  return result.affectedRows > 0;
};
