import express from 'express';
const router = express.Router();
import { getProcessingTargets, getPropPathsFromSkus, getUntranslatedPropPaths } from "../../db/processing/preprocessing_start.js";

// 가공 시작
router.post('/processing_start', async (req, res) => {
    try {
      const { target, options } = req.body;
      
      // 가공 대상 조회 (DB 함수 사용)
      const products = await getProcessingTargets(target);
      
      if (products.length === 0) {
        return res.json({ 
          success: false, 
          message: '가공할 대상이 없습니다.' 
        });
      }
      
      // 가공 대상 상품의 productId 배열 생성
      const productIds = products.map(product => product.productid);
      
      // 상품 옵션 번역을 위한 prop_path 조회 (DB 함수 사용)
      const allPropPaths = await getPropPathsFromSkus(productIds);
      console.log(`총 ${allPropPaths.length}개의 속성 경로를 찾았습니다.`);
      
      // 번역이 필요한 prop_path만 필터링
      const untranslatedPropPaths = await getUntranslatedPropPaths(allPropPaths);
      console.log(`이 중 ${untranslatedPropPaths.length}개의 속성 경로에 번역이 필요합니다.`);
      
      // 앱 전역 변수에 가공 대상 정보 저장
      req.app.locals.processinginfo = {
        totalCount: products.length,
        productIds: productIds,
        propPaths: untranslatedPropPaths
      };
      
      // 가공 시작 (translatedetail 라우터로 요청) //전역변수의 의존도를 줄이기 위해, 추후 수정
      const processingOptions = {
        productAttributeTranslation: options.productAttributeTranslation,
        productOptionTranslation: options.productOptionTranslation,
        productImageTranslation: options.productImageTranslation,
        optionImageTranslation: options.optionImageTranslation,
        productNameTranslation: options.productNameTranslation,
        includeKeywordInNameTranslation: options.includeKeywordInNameTranslation,
        customKeywords: options.customKeywords,
        keywordGeneration: options.keywordGeneration,
        nukki_thumbnail: options.nukki_thumbnail,
        thumb_number: options.thumb_number
      };
      req.app.locals.translateoption = processingOptions;
      
      // 브랜드 필터링 처리
      if (options.brandFiltering) {
        try {
          // 브랜드 필터링 API 호출 - 내부 경로로 직접 호출
          const brandResponse = await fetch('http://localhost:3000/prc/brandfilter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },

          });
          
          const brandResult = await brandResponse.json();
          console.log('브랜드 필터링 결과:', brandResult);
          
          // 브랜드 필터링 결과에 redirectTo가 있으면 응답에 포함
          if (brandResult.redirectTo) {
            return res.json({
              success: true,
              message: '브랜드 필터링이 시작되었습니다.',
              redirectTo: brandResult.redirectTo,
              total: products.length
            });
          }
        } catch (error) {
          console.error('브랜드 필터링 중 오류:', error);
        }
      }else{
        console.log('브랜드 필터링 처리 없음');
        // 번역 및 가공 처리
        try {
          const translateResponse = await fetch('http://localhost:3000/prc/translatedetail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(processingOptions)
          });
          
          const translateResult = await translateResponse.json();
          console.log('번역 및 가공 결과:', translateResult);
          
        } catch (error) {
          console.error('번역 및 가공 중 오류:', error);
        }
      }
      
      res.json({
        success: true,
        message: '가공이 시작되었습니다.',
        total: products.length
      });
    } catch (error) {
      console.error('가공 시작 오류:', error);
      res.status(500).json({ 
        success: false, 
        message: '가공을 시작하는 중 오류가 발생했습니다.' 
      });
    }
  });
  
export default router;
