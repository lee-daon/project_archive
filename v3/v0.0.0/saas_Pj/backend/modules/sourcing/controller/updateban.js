import express from 'express';
import { updateProduct } from '../repository/Productlist.js';
import { deleteFromTempTable } from '../../../common/utils/assistDb/temp.js';
import { updateTotalFilteredProducts } from '../../../common/QuotaUsageLimit/Usage/updateUsage.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { updatedData } = req.body;
    
    // userid 가져오기
    let userid;
    if (req.user && req.user.userid) {
      userid = req.user.userid;
    } else if (req.query.userid) {
      userid = parseInt(req.query.userid, 10);
    } else {
      return res.status(400).json({ 
        success: false,
        message: '유효한 사용자 ID가 제공되지 않았습니다.' 
      });
    }
    
    if (!Array.isArray(updatedData)) {
      return res.status(400).json({ 
        success: false,
        message: "updatedData는 배열이어야 합니다." 
      });
    }

    // 각 productId에 대해 ban 상태를 업데이트합니다.
    await Promise.all(
      updatedData.map(data => updateProduct({
        userid: userid,
        productId: data.productId, 
        ban: data.ban 
      }))
    );

    // ban이 true인 상품 수 계산 및 누적 필터링된 상품수 업데이트
    const bannedCount = updatedData.filter(data => data.ban === true).length;
    if (bannedCount > 0) {
      await updateTotalFilteredProducts(userid, bannedCount);
    }

    // temp 테이블에서 type_number 1인 데이터 삭제
    const deleteResult = await deleteFromTempTable(userid, 1);
    if (deleteResult.success) {
      console.log(`사용자 ${userid}의 임시 데이터가 성공적으로 삭제되었습니다.`);
    } else {
      console.error(`사용자 ${userid}의 임시 데이터 삭제 중 오류:`, deleteResult.error);
    }

    res.json({ 
      success: true,
      message: 'Ban 상태 업데이트 성공' 
    });
    console.log(`사용자 ${userid}의 ${updatedData.length}개 상품 Ban 상태 업데이트 성공`);
  } catch (error) {
    console.error('Ban 상태 업데이트 중 에러 발생:', error);
    res.status(500).json({ 
      success: false,
      message: '서버 에러' 
    });
  }
});

export default router; 