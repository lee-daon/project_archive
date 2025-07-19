import { putProductRepository } from '../repository/putProduct.js';

export const putProductService = {
  // 키워드 포맷 확인 및 수정 ([시작, ]끝 확인)
  formatKeywords(keywords) {
    if (!keywords) return '';
    
    let formattedKeywords = keywords.trim();
    
    // [로 시작하지 않으면 추가
    if (!formattedKeywords.startsWith('[')) {
      formattedKeywords = '[' + formattedKeywords;
    }
    
    // ]로 끝나지 않으면 추가
    if (!formattedKeywords.endsWith(']')) {
      formattedKeywords = formattedKeywords + ']';
    }
    
    return formattedKeywords;
  },

  // 상품 정보 수정 메인 로직
  async updateProduct(userid, productid, updateData) {
    try {
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
      } = updateData;

      // 1. 기본 정보 업데이트 (title_optimized, keywords)
      const formattedKeywords = this.formatKeywords(keywords);
      await putProductRepository.updateProductDetails(userid, productid, {
        title_optimized,
        keywords: formattedKeywords
      });

      // 2. 이미지 삭제 처리
      if (deleted_main_images && deleted_main_images.length > 0) {
        await putProductRepository.deleteMainImages(userid, productid, deleted_main_images);
      }

      if (deleted_description_images && deleted_description_images.length > 0) {
        await putProductRepository.deleteDescriptionImages(userid, productid, deleted_description_images);
      }

      if (deleted_nukki_images && deleted_nukki_images.length > 0) {
        await putProductRepository.deleteNukkiImages(userid, productid, deleted_nukki_images);
      }

      // 3. 대표 이미지 타입에 따른 처리
      if (representative_image_type === 'main') {
        // 누끼 이미지 모두 삭제
        await putProductRepository.deleteAllNukkiImages(userid, productid);
        
        // 메인 이미지 순서 변경 (representative_image_order를 0번으로)
        // 이미 0번이면 swap하지 않음
        if (representative_image_order !== undefined && representative_image_order !== 0) {
          await putProductRepository.swapMainImageOrder(userid, productid, representative_image_order);
        }
      }
      // representative_image_type이 'nukki'인 경우 별도 처리 없음 (누끼 이미지가 대표이므로)

      // 4. 옵션 업데이트
      if (updated_options && updated_options.length > 0) {
        await putProductRepository.updateOptions(userid, productid, updated_options);
      }

      // 5. 속성 업데이트
      if (updated_properties && updated_properties.length > 0) {
        await putProductRepository.updateProperties(userid, productid, updated_properties);
      }

      return {
        success: true,
        message: '상품 정보가 성공적으로 수정되었습니다.'
      };

    } catch (error) {
      console.error('상품 정보 수정 중 오류 발생:', error);
      throw new Error('상품 정보 수정에 실패했습니다.');
    }
  },

  // 입력 데이터 검증
  validateUpdateData(updateData) {
    const {
      productid,
      title_optimized,
      representative_image_type,
      representative_image_order
    } = updateData;

    // 필수 필드 검증
    if (!productid) {
      throw new Error('상품 ID가 필요합니다.');
    }

    if (!title_optimized || title_optimized.trim() === '') {
      throw new Error('상품명이 필요합니다.');
    }

    // 대표 이미지 타입 검증
    if (representative_image_type && !['main', 'nukki'].includes(representative_image_type)) {
      throw new Error('대표 이미지 타입은 main 또는 nukki만 가능합니다.');
    }

    // 대표 이미지 순서 검증
    if (representative_image_type === 'main' && representative_image_order !== undefined) {
      if (typeof representative_image_order !== 'number' || representative_image_order < 0) {
        throw new Error('대표 이미지 순서는 0 이상의 숫자여야 합니다.');
      }
    }

    return true;
  }
};
