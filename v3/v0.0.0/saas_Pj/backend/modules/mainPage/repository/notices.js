import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 공지사항 목록 조회
 * @returns {Promise<Array>} 공지사항 목록
 */
export const getNoticesList = async () => {
  const query = `
    SELECT 
      id,
      type,
      tag_type as tagType,
      title,
      DATE_FORMAT(created_at, '%Y-%m-%d') as date
    FROM notices 
    WHERE is_active = TRUE 
    ORDER BY created_at DESC
  `;
  
  const [rows] = await promisePool.execute(query);
  return rows;
};

/**
 * 공지사항 상세 조회
 * @param {number} noticeId - 공지사항 ID
 * @returns {Promise<Object|null>} 공지사항 상세 정보
 */
export const getNoticeById = async (noticeId) => {
  const query = `
    SELECT 
      id,
      type,
      tag_type as tagType,
      title,
      content,
      DATE_FORMAT(created_at, '%Y-%m-%d') as date
    FROM notices 
    WHERE id = ? AND is_active = TRUE
  `;
  
  const [rows] = await promisePool.execute(query, [noticeId]);
  return rows.length > 0 ? rows[0] : null;
};
