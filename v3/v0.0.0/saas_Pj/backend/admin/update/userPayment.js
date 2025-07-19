import express from 'express';
import { promisePool } from '../../common/utils/connectDB.js';
import logger from '../../common/utils/logger.js';

const router = express.Router();

// GET /userPayment/users/:identifier - 특정 유저 조회 (email 또는 id로)
router.get('/users/:identifier', async (req, res) => {
  const { identifier } = req.params;

  if (!identifier || identifier.trim() === '') {
    return res.status(400).json({
      success: false,
      message: '유효한 식별자가 필요합니다 (email 또는 id).'
    });
  }

  try {
    let query = `
      SELECT ui.userid, ui.id, ui.name, ui.email, ui.plan, ui.maximum_market_count, ui.expired_at, ui.created_at, ui.updated_at, ui.is_active,
             us.image_processing_allinone_count, us.image_processing_single_count, 
             us.deep_brand_filter_count, us.total_sourced_products, us.total_registered_products
      FROM user_info ui 
      LEFT JOIN user_statistics us ON ui.userid = us.userid
      WHERE `;
    
    let params = [];
    
    // 이메일 형태인 경우 email로 조회
    if (identifier.includes('@')) {
      query += 'ui.email = ?';
      params.push(identifier);
    }
    // 그 외의 경우 id로 조회
    else {
      query += 'ui.id = ?';
      params.push(identifier);
    }

    const [rows] = await promisePool.execute(query, params);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '해당 유저를 찾을 수 없습니다.'
      });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      success: false,
      message: '유저 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// PUT /userPayment/users/:identifier - 유저 정보 수정 (email 또는 id로)
router.put('/users/:identifier', async (req, res) => {
  const { identifier } = req.params;
  const { 
    expired_at, 
    plan, 
    maximum_market_count,
    image_processing_allinone_count,
    image_processing_single_count,
    deep_brand_filter_count
  } = req.body;

  if (!identifier || identifier.trim() === '') {
    return res.status(400).json({
      success: false,
      message: '유효한 식별자가 필요합니다 (email 또는 id).'
    });
  }

  // plan 유효성 검증
  if (plan && !['free', 'basic', 'enterprise'].includes(plan)) {
    return res.status(400).json({
      success: false,
      message: 'plan은 free, basic, enterprise 중 하나여야 합니다.'
    });
  }

  // 숫자 필드 유효성 검증
  const numericFields = [
    'image_processing_allinone_count',
    'image_processing_single_count',
    'deep_brand_filter_count'
  ];
  
  for (const field of numericFields) {
    if (req.body[field] !== undefined && (isNaN(req.body[field]) || req.body[field] < 0)) {
      return res.status(400).json({
        success: false,
        message: `${field}는 0 이상의 숫자여야 합니다.`
      });
    }
  }

  // maximum_market_count 유효성 검증 (1 이상의 정수)
  if (maximum_market_count !== undefined && (isNaN(maximum_market_count) || maximum_market_count < 1 || !Number.isInteger(Number(maximum_market_count)))) {
    return res.status(400).json({
      success: false,
      message: 'maximum_market_count는 1 이상의 정수여야 합니다.'
    });
  }

  try {
    // 먼저 사용자를 찾아서 userid를 얻기
    let findUserQuery = 'SELECT userid FROM user_info WHERE ';
    let findUserParams = [];
    
    if (identifier.includes('@')) {
      findUserQuery += 'email = ?';
      findUserParams.push(identifier);
    } else {
      findUserQuery += 'id = ?';
      findUserParams.push(identifier);
    }

    const [userResult] = await promisePool.execute(findUserQuery, findUserParams);
    
    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: '해당 유저를 찾을 수 없습니다.'
      });
    }

    const userid = userResult[0].userid;

    const connection = await promisePool.getConnection();
    await connection.beginTransaction();

    try {
      // user_info 테이블 업데이트 (expired_at, plan, maximum_market_count)
      const userInfoUpdates = [];
      const userInfoParams = [];
      
      if (expired_at !== undefined) {
        userInfoUpdates.push('expired_at = ?');
        userInfoParams.push(expired_at);
      }
      
      if (plan !== undefined) {
        userInfoUpdates.push('plan = ?');
        userInfoParams.push(plan);
      }

      if (maximum_market_count !== undefined) {
        userInfoUpdates.push('maximum_market_count = ?');
        userInfoParams.push(parseInt(maximum_market_count, 10));
      }

      if (userInfoUpdates.length > 0) {
        userInfoUpdates.push('updated_at = NOW()');
        userInfoParams.push(userid);
        
        const [userInfoResult] = await connection.execute(
          `UPDATE user_info SET ${userInfoUpdates.join(', ')} WHERE userid = ?`,
          userInfoParams
        );

        if (userInfoResult.affectedRows === 0) {
          await connection.rollback();
          return res.status(404).json({
            success: false,
            message: '유저 정보 업데이트에 실패했습니다.'
          });
        }
      }

      // user_statistics 테이블 업데이트 (플랜 변경 시에는 트리거에 의해 자동 업데이트되므로 수동 업데이트 제외)
      const statisticsUpdates = [];
      const statisticsParams = [];
      
      // daily_sourcing_remaining 과 daily_image_processing_remaining는 DB 트리거로만 제어되므로 API에서 직접 수정하지 않음
      
      if (image_processing_allinone_count !== undefined) {
        statisticsUpdates.push('image_processing_allinone_count = ?');
        statisticsParams.push(parseInt(image_processing_allinone_count, 10));
      }
      
      if (image_processing_single_count !== undefined) {
        statisticsUpdates.push('image_processing_single_count = ?');
        statisticsParams.push(parseInt(image_processing_single_count, 10));
      }
      
      if (deep_brand_filter_count !== undefined) {
        statisticsUpdates.push('deep_brand_filter_count = ?');
        statisticsParams.push(parseInt(deep_brand_filter_count, 10));
      }

      if (statisticsUpdates.length > 0) {
        statisticsUpdates.push('updated_at = NOW()');
        statisticsParams.push(userid);
        
        await connection.execute(
          `UPDATE user_statistics SET ${statisticsUpdates.join(', ')} WHERE userid = ?`,
          statisticsParams
        );
      }

      await connection.commit();
      
      res.json({
        success: true,
        message: '유저 정보가 성공적으로 수정되었습니다.'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      success: false,
      message: '유저 정보 수정 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});



export default router;
