import express from 'express';
import { putProductService } from '../service/putProduct.js';

const router = express.Router();

/**
 * @route PUT /postprc/putproduct/:productid
 * @desc 상품 정보 수정
 * @param {number} productid - 상품 ID (URL 파라미터)
 * @param {string} title_optimized - 최적화된 상품명
 * @param {string} keywords - 키워드 (쉼표로 구분, 자동으로 [] 형식 적용)
 * @param {string} representative_image_type - 대표이미지 타입 ('main' | 'nukki')
 * @param {number} representative_image_order - 대표이미지 순서
 * @param {number[]} deleted_main_images - 삭제할 메인이미지 순서 배열
 * @param {number[]} deleted_description_images - 삭제할 상세이미지 순서 배열
 * @param {number[]} deleted_nukki_images - 삭제할 누끼이미지 순서 배열
 * @param {object[]} updated_options - 수정할 옵션 배열 [{prop_path, private_optionname, private_optionvalue}]
 * @param {object[]} updated_properties - 수정할 속성 배열 [{property_order, property_name, property_value}]
 */
router.put('/:productid', async (req, res) => {
  try {
    // URL 파라미터에서 productid 추출
    const productid = parseInt(req.params.productid);
    
    // 인증된 사용자 ID 추출
    const userid = req.user.userid;
    
    // 요청 바디 데이터 추출
    const {
      title_optimized,
      keywords,
      representative_image_type,
      representative_image_order,
      deleted_main_images,
      deleted_description_images,
      deleted_nukki_images,
      updated_options,
      updated_properties
    } = req.body;

    // 업데이트 데이터 객체 생성
    const updateData = {
      productid,
      title_optimized,
      keywords,
      representative_image_type,
      representative_image_order,
      deleted_main_images,
      deleted_description_images,
      deleted_nukki_images,
      updated_options,
      updated_properties
    };

    // 입력 데이터 검증
    putProductService.validateUpdateData(updateData);

    // productid가 유효한지 확인
    if (!productid || isNaN(productid)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID입니다.'
      });
    }

    // 서비스 로직 호출
    const result = await putProductService.updateProduct(userid, productid, updateData);

    // 성공 응답
    return res.status(200).json(result);

  } catch (error) {
    console.error('상품 정보 수정 API 오류:', error);
    
    // 검증 오류인 경우 400 응답
    if (error.message.includes('필요합니다') || 
        error.message.includes('가능합니다') || 
        error.message.includes('숫자여야')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // 그 외 서버 오류는 500 응답
    return res.status(500).json({
      success: false,
      message: '서버 내부 오류가 발생했습니다.'
    });
  }
});

export default router;
