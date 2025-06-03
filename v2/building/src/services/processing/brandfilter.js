import { pool } from '../../db/connectDB.js';
import bannedWords from '../../config/bannedWords.js';
import { translateBrandNamePrompt } from '../use_AI/gemini.js';

/**
 * 텍스트에 중국어 문자가 포함되어 있는지 확인하는 함수
 */
function isChineseCharacter(text) {
  // 중국어 유니코드 범위 (간체 및 번체)
  const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf\u20000-\u2a6df\u2a700-\u2b73f\u2b740-\u2b81f\u2b820-\u2ceaf\uf900-\ufaff]/;
  return chineseRegex.test(text);
}

/**
 * 번역된 브랜드 이름을 데이터베이스에 업데이트하는 함수
 */
async function updateBrandNameTranslated(productId, translatedName) {
  return new Promise((resolve, reject) => {
    const updateSql = 'UPDATE products_detail SET brand_name_translated = ? WHERE productid = ?';
    pool.query(updateSql, [translatedName, productId], (updateError, updateResult) => {
      if (updateError) {
        console.error(`브랜드명 번역 업데이트 중 오류 발생: ${productId}`, updateError);
        // 업데이트 실패 시에도 로직은 계속 진행하도록 reject 대신 resolve(null) 또는 다른 방식으로 처리할 수 있습니다.
        // 여기서는 오류를 로깅하고 계속 진행하기 위해 resolve()를 호출합니다.
        resolve();
      } else {
        console.log(`브랜드명 번역 업데이트 완료: ${productId}`);
        resolve();
      }
    });
  });
}

/**
 * productIds 배열을 받아서, products_detail 테이블에서 해당 productid의 brand_name이 존재하는 경우
 * 금지어가 포함되어 있는지 확인하고, 포함된 경우 { productId, brandName, url } 객체를 배열에 담아 반환하는 함수.
 * brand_name_translated가 있으면 사용하고, 없으면 번역 후 저장합니다.
 */
export async function filterBannedBrands(productIds) {
    return new Promise(async (resolve, reject) => {
      // SQL 쿼리: brand_name_translated 컬럼 추가 조회
      const sql = `
        SELECT productid, brand_name, brand_name_translated, detail_url
        FROM products_detail
        WHERE productid IN (?)
      `;

      pool.query(sql, [productIds], async (error, results) => {
        if (error) return reject(error);

        try {
          const processedResults = [];
          // 각 상품에 대해 브랜드명 처리
          for (const row of results) {
            let brandToCheck = ''; // 금지어 검사에 사용할 최종 브랜드명

            if (row.brand_name_translated) {
              // brand_name_translated 값이 있으면 사용
              brandToCheck = row.brand_name_translated;
              console.log(`기존 번역된 브랜드명 사용: ${row.productid} - ${brandToCheck}`);
            } else if (row.brand_name && isChineseCharacter(row.brand_name)) {
              // brand_name_translated가 없고, brand_name이 중국어인 경우 번역
              try {
                console.log(`중국어 브랜드명 번역 시작: ${row.productid} - ${row.brand_name}`);
                const translatedBrandName = await translateBrandNamePrompt(row.brand_name);
                console.log(`번역 완료: ${row.productid} - ${translatedBrandName}`);
                brandToCheck = translatedBrandName;

                // 번역된 결과를 DB에 업데이트
                await updateBrandNameTranslated(row.productid, translatedBrandName);

              } catch (translationError) {
                console.error(`브랜드명 번역 중 오류 발생: ${row.productid} - ${row.brand_name}`, translationError);
                // 번역 실패 시 원본 brand_name을 사용 (또는 다른 정책 적용 가능)
                brandToCheck = row.brand_name;
              }
            } else {
              // brand_name_translated가 없고, 중국어가 아니거나 brand_name이 없는 경우 원본 brand_name 사용
              brandToCheck = row.brand_name || ''; // brand_name이 null일 경우 빈 문자열로 처리
            }

            // 금지어 검사를 위해 처리된 결과 저장
            processedResults.push({
              ...row,
              effective_brand_name: brandToCheck // 금지어 검사에 사용할 브랜드명
            });
          }

          // 결과 배열에서 effective_brand_name에 금지어가 포함된 경우만 필터링
          const brandban = processedResults.filter(row =>
            row.effective_brand_name && bannedWords.some(word => row.effective_brand_name.includes(word))
          ).map(row => ({
            productId: row.productid,
            brandName: row.effective_brand_name, // 금지어 검사에 사용된 이름 반환
            url: row.detail_url
          }));

          resolve(brandban);
        } catch (err) {
          reject(err);
        }
      });
    });
  };