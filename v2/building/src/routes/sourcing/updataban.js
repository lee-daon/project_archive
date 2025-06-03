import express from 'express';
import { updateProduct } from '../../db/sourcing/Productlist.js';

const router = express.Router();

router.post('/updateban', async (req, res) => {
  try {
    const { updatedData } = req.body;
    if (!Array.isArray(updatedData)) {
      return res.status(400).json({ message: "updatedData는 배열이어야 합니다." });
    }

    // 각 productId에 대해 ban 상태를 업데이트합니다.
    await Promise.all(
      updatedData.map(data => updateProduct({ productId: data.productId, ban: data.ban }))
    );

    res.json({ message: 'Ban 상태 업데이트 성공' });
    console.log('Ban 상태 업데이트 성공');
    //console.log(updatedData.length);
  } catch (error) {
    console.error('Ban 상태 업데이트 중 에러 발생:', error);
    res.status(500).json({ message: '서버 에러' });
  }
});

export default router; 