import express from 'express';
import { getOutboundAddress, getInboundAddress, getSendCloseList } from '../service/elevenStoreAddress.js';

const router = express.Router();

/**
 * 11번가 주소 정보 및 발송마감 템플릿 조회 (출고지 + 반품지 + 발송마감 템플릿)
 * POST /setting/elevenstore-address/places
 */
router.post('/', async (req, res) => {
  try {
    const { apiKey } = req.body;

    // 필수 파라미터 검증
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'apiKey는 필수입니다.',
        data: null
      });
    }

    console.log('11번가 주소 및 발송마감 템플릿 조회 시작');

    // 출고지 조회
    const outboundResult = await getOutboundAddress(apiKey);
    
    // 반품지 조회
    const inboundResult = await getInboundAddress(apiKey);

    // 발송마감 템플릿 조회
    const sendCloseResult = await getSendCloseList(apiKey);

    // 에러 처리
    if (!outboundResult.success) {
      return res.status(400).json({
        success: false,
        message: `출고지 조회 실패: ${outboundResult.error}`,
        data: null
      });
    }

    if (!inboundResult.success) {
      return res.status(400).json({
        success: false,
        message: `반품지 조회 실패: ${inboundResult.error}`,
        data: null
      });
    }

    if (!sendCloseResult.success) {
      return res.status(400).json({
        success: false,
        message: `발송마감 템플릿 조회 실패: ${sendCloseResult.error}`,
        data: null
      });
    }

    // 출고지 데이터 가공
    const outboundPlaces = outboundResult.data || [];
    
    // 반품지 데이터 가공
    const inboundPlaces = inboundResult.data || [];

    // 발송마감 템플릿 데이터 가공
    const sendCloseTemplates = sendCloseResult.data || [];

    // 성공 응답
    res.json({
      success: true,
      message: '11번가 주소 및 발송마감 템플릿 조회 성공',
      data: {
        outboundPlaces: {
          count: outboundPlaces.length,
          items: outboundPlaces
        },
        inboundPlaces: {
          count: inboundPlaces.length,
          items: inboundPlaces
        },
        sendCloseTemplates: {
          count: sendCloseTemplates.length,
          items: sendCloseTemplates
        },
        summary: {
          totalOutbound: outboundPlaces.length,
          totalInbound: inboundPlaces.length,
          totalTemplates: sendCloseTemplates.length
        }
      }
    });

  } catch (error) {
    console.error('11번가 주소 및 발송마감 템플릿 조회 중 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 내부 오류가 발생했습니다.',
      error: error.message,
      data: null
    });
  }
});

export default router;
