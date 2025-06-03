import express from 'express';
import translateattribute from '../../services/use_AI/translateattribute.js';
import translateOption from '../../services/use_AI/translateoption.js';
import translateProductName from '../../services/use_AI/translateProductName.js';
import translateWithKeyword from '../../services/use_AI/translateWithKeyword.js';
import KeywordGenerationfunc from '../../services/use_AI/KeywordGeneration.js';
import { imagetranslate } from '../../services/image_translation/productImageprocess.js';
import { processNukkiImages } from '../../services/processing/nukki.js';
import { updatePreprocessingStatus, recordErrorLog } from '../../db/savePreprocessing.js';
import { updatePreprocessingCompletedStatus } from '../../db/saveStatus.js';
import { translateOptionImages   } from '../../services/processing/optionImageTranslate.js';
const router = express.Router();

router.post('/translatedetail', async (req, res) => {
    try {
        console.log('req.body', req.body)
        let {
            productAttributeTranslation,
            productOptionTranslation,
            productImageTranslation,
            optionImageTranslation,
            productNameTranslation,
            includeKeywordInNameTranslation,
            customKeywords,
            keywordGeneration,
            nukki_thumbnail,
            thumb_number
        } = req.body;

        // app.locals.processinginfo에서 필요한 데이터 추출
        const { productIds, propPaths } = req.app.locals.processinginfo;
        console.log('translatedetail 호출됨');
        
        // 속성(attribute) 번역 처리
        if (productAttributeTranslation) {
            try {
                await translateattribute(productIds);
                console.log('productAttributeTranslation 완료');
                
                // preprocessing 테이블 업데이트
                await updatePreprocessingStatus({
                    productIds,
                    updates: { attribute_translated: true }
                });
            } catch (error) {
                console.error('속성 번역 중 오류:', error.message);
                
                // 오류가 발생한 제품 ID를 찾아서 상태 업데이트 및 오류 로그 기록
                for (const productId of productIds) {
                    await recordErrorLog({
                        productId,
                        errorType: 'attribute_translated'
                    });
                }
            }
        }

        // 옵션 번역 처리
        if (productOptionTranslation) {
            try {
                await translateOption(propPaths);
                console.log('productOptionTranslation 완료');
                
                // 옵션 번역에는 별도의 preprocessing 상태가 없으므로 업데이트하지 않음
            } catch (error) {
                console.error('옵션 번역 중 오류:', error.message);
                // 옵션 번역에 대한 오류 처리는 별도의 테이블 필드가 없으므로 생략
            }
        }

        // 상품명 번역 처리
        if (productNameTranslation) {
            try {
                if (includeKeywordInNameTranslation) {
                    await translateWithKeyword(productIds, customKeywords);
                    console.log('translateWithKeyword 완료');
                } else {
                    await translateProductName(productIds);
                    console.log('productNameTranslation 완료');
                }
                
                // preprocessing 테이블 업데이트
                await updatePreprocessingStatus({
                    productIds,
                    updates: { name_translated: true }
                });
            } catch (error) {
                console.error('상품명 번역 중 오류:', error.message);
                
                // 오류가 발생한 제품 ID를 찾아서 상태 업데이트 및 오류 로그 기록
                for (const productId of productIds) {
                    await recordErrorLog({
                        productId,
                        errorType: 'name_translated'
                    });
                }
            }
        }

        // 키워드 생성 처리
        if (keywordGeneration) {
            try {
                await KeywordGenerationfunc(productIds);
                console.log('keywordGeneration 완료');
                
                // preprocessing 테이블 업데이트
                await updatePreprocessingStatus({
                    productIds,
                    updates: { keyword_generated: true }
                });
            } catch (error) {
                console.error('키워드 생성 중 오류:', error.message);
                
                // 오류가 발생한 제품 ID를 찾아서 상태 업데이트 및 오류 로그 기록
                for (const productId of productIds) {
                    await recordErrorLog({
                        productId,
                        errorType: 'keyword_generated'
                    });
                }
            }
        }

        // 이미지 번역 처리
        if (productImageTranslation) {
            try {
                const result = await imagetranslate(productIds);
                console.log('result', result);
                
                // preprocessing 테이블 업데이트
                await updatePreprocessingStatus({
                    productIds,
                    updates: { image_translated: true }
                });
            } catch (error) {
                console.error('이미지 번역 중 오류:', error.message);
                
                // 오류가 발생한 제품 ID를 찾아서 상태 업데이트 및 오류 로그 기록
                for (const productId of productIds) {
                    await recordErrorLog({
                        productId,
                        errorType: 'image_translated'
                    });
                }
            }
        }

        // 누끼 이미지 처리
        if (nukki_thumbnail) {
            try {
                await processNukkiImages(productIds, thumb_number, true);
                console.log('nukki_thumbnail 완료');
                
                // preprocessing 테이블 업데이트
                await updatePreprocessingStatus({
                    productIds,
                    updates: { nukki_created: true }
                });
            } catch (error) {
                console.error('누끼 이미지 생성 중 오류:', error.message);
                
                // 오류가 발생한 제품 ID를 찾아서 상태 업데이트 및 오류 로그 기록
                for (const productId of productIds) {
                    await recordErrorLog({
                        productId,
                        errorType: 'nukki_created'
                    });
                }
            }
        }

        // 옵션 이미지 번역 처리
        if (optionImageTranslation) {
            try {
                await translateOptionImages(productIds);
                console.log('optionImageTranslation 완료');
            } catch (error) {
                console.error('옵션 이미지 번역 중 오류:', error.message);
            }
        }
        
        
        // 모든 처리가 성공적으로 완료된 후 status 테이블 업데이트
        try {
            await updatePreprocessingCompletedStatus(productIds);
        } catch (statusError) {
            // 상태 업데이트 중 오류가 발생해도 전체 실패로 간주하지 않고 로그만 남길 수 있습니다.
            // 또는 필요에 따라 오류를 다시 throw하여 클라이언트에게 알릴 수도 있습니다.
            console.error('Status 테이블의 preprocessing_completed 업데이트 중 오류:', statusError.message);
        }

        console.log('---------------------------------전과정완료---------------------------------')
        return res.status(200).send({ message: 'Translation completed successfully.' });
    } catch (error) {
      console.error('Translation failed:', error.message);
      return res.status(500).send({ error: 'Translation failed.', details: error.message });
    }
  });
  
export default router;
