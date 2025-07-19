import express from 'express';
import { getOutboundShippingPlaces, getReturnShippingCenters } from '../service/findshippingPlace.js';

const router = express.Router();

/**
 * 쿠팡 배송지 정보 조회 (출고지 + 반품지)
 * POST /setting/coupang-shipping/places
 */
router.post('/', async (req, res) => {
  try {
    const { accessKey, secretKey, vendorId } = req.body;

    // 필수 파라미터 검증
    if (!accessKey || !secretKey || !vendorId) {
      return res.status(400).json({
        success: false,
        message: 'accessKey, secretKey, vendorId는 필수입니다.',
        data: null
      });
    }

    console.log(`쿠팡 배송지 조회 시작 - VendorId: ${vendorId}`);

    // 출고지 조회
    const outboundResult = await getOutboundShippingPlaces(accessKey, secretKey);
    
    // 반품지 조회
    const returnResult = await getReturnShippingCenters(accessKey, secretKey, vendorId);

    // 에러 처리
    if (!outboundResult.success) {
      return res.status(500).json({
        success: false,
        message: `출고지 조회 실패: ${outboundResult.error}`,
        data: null
      });
    }

    if (!returnResult.success) {
      return res.status(500).json({
        success: false,
        message: `반품지 조회 실패: ${returnResult.error}`,
        data: null
      });
    }

    // 출고지 데이터 가공 (usable이 true인 것만 필터링)
    const allOutboundPlaces = outboundResult.data?.content || [];
    const usableOutboundPlaces = allOutboundPlaces.filter(place => place.usable === true);
    
    const outboundPlaces = usableOutboundPlaces.map(place => {
      const address = place.placeAddresses?.[0] || {};
      return {
        outboundShippingPlaceCode: place.outboundShippingPlaceCode,
        shippingPlaceName: place.shippingPlaceName,
        addressType: address.addressType,
        companyContactNumber: address.companyContactNumber,
        returnZipCode: address.returnZipCode,
        returnAddress: address.returnAddress,
        returnAddressDetail: address.returnAddressDetail,
        usable: place.usable
      };
    });

    // 반품지 데이터 가공 (usable이 true인 것만 필터링)
    const allReturnCenters = returnResult.data?.data?.content || [];
    const usableReturnCenters = allReturnCenters.filter(center => center.usable === true);
    
    const returnCenters = usableReturnCenters.map(center => {
      const address = center.placeAddresses?.[0] || {};
      return {
        returnCenterCode: center.returnCenterCode,
        shippingPlaceName: center.shippingPlaceName,
        addressType: address.addressType,
        returnChargeName: center.shippingPlaceName, // 반품지명을 returnChargeName으로 사용
        companyContactNumber: address.companyContactNumber,
        returnZipCode: address.returnZipCode,
        returnAddress: address.returnAddress,
        returnAddressDetail: address.returnAddressDetail,
        usable: center.usable
      };
    });

    // 성공 응답
    res.json({
      success: true,
      message: '쿠팡 배송지 조회 성공',
      data: {
        outboundPlaces: {
          count: outboundPlaces.length,
          items: outboundPlaces
        },
        returnCenters: {
          count: returnCenters.length,
          items: returnCenters
        },
        summary: {
          totalUsableOutbound: outboundPlaces.length,
          totalUsableReturn: returnCenters.length
        }
      }
    });

  } catch (error) {
    console.error('쿠팡 배송지 조회 중 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 내부 오류가 발생했습니다.',
      error: error.message,
      data: null
    });
  }
});

export default router;

