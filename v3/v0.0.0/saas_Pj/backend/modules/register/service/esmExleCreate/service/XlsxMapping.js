import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Excel(sharedStrings.xml)에서 금지되는 제어문자 제거 & 길이 제한
function cleanForExcel(str = '') {
  // 1) 금지 제어문자 제거 (탭/CR/LF 제외 0x00-0x1F)
  let cleaned = str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

  // 2) 32,767자(UTF-16 code unit) 제한 – 조금 여유 두고 잘라냄
  if (cleaned.length > 32760) {
    cleaned = cleaned.slice(0, 32760);
  }
  return cleaned;
}

/**
 * ESM 엑셀 형식으로 데이터를 변환합니다.
 * 각 옵션 조합(variant)을 개별 상품으로 분리하여 등록합니다.
 * @param {Array} processedData - 처리된 상품 데이터 배열
 * @param {Object} esmConfig - ESM 설정 정보 (max_option_count 포함)
 * @returns {Array} - 엑셀용 데이터 배열
 */
async function transformToEsmFormat(processedData, esmConfig) {
  const excelData = [];

  for (const data of processedData) {
    const { initialJson, accountInfo } = data;
    
    // variants가 있는 경우 각각을 개별 상품으로 생성 (max_option_count만큼만)
    if (initialJson.variants && initialJson.variants.length > 0) {
      const maxOptions = esmConfig.maxOptionCount || 1;
      const variantsToProcess = Math.min(initialJson.variants.length, maxOptions);
      
      for (let i = 0; i < variantsToProcess; i++) {
        const variant = initialJson.variants[i];
        
        // 각 variant의 개별 가격 사용
        const calculatedPrice = Number(variant.calculatedPrice) || 0;
        
        // 할인률 기반 정가/판매가 계산 (ESM 역산 로직)
        const discountRate = initialJson.discountRate || 0;
        const safeSalePrice = Number.isFinite(calculatedPrice) && calculatedPrice > 0 ? calculatedPrice : 0;

        const originalPrice = discountRate > 0 && safeSalePrice > 0
          ? Math.ceil(safeSalePrice / (1 - discountRate / 100) / 10) * 10  // 정가 역산 (10원 단위 올림)
          : safeSalePrice;
        const salePrice = safeSalePrice;  // 실제 판매가

        // 상품명 사용 (옵션 정보 추가하지 않음)
        let productName = initialJson.productName || '';
        
        // 상품명 길이 제한 (최대 50글자)
        if (productName.length > 50) {
          productName = productName.slice(0, 50);
        }

        // 이미지 URL 처리
        const mainImage = initialJson.representativeImage || '';
        const additionalImages = initialJson.images && initialJson.images.length > 1 
          ? initialJson.images.slice(1).join(',') 
          : '';

        // 상품 상세설명 (원본 HTML 유지하되 Excel 금지문자 제거)
        const description = cleanForExcel(initialJson.contents || '');

        // 엑셀 행 데이터 생성 (각 variant를 개별 상품으로 처리)
        const rowData = {
          B: "옥션/G마켓",                                    // B열: 고정 텍스트
          C: accountInfo.auction_id || '',                    // C열: 옥션ID
          D: accountInfo.gmarket_id || '',                   // D열: G마켓ID
          E: productName,                                     // E열: 상품명 (옵션 정보 포함)
          K: initialJson.esmCatId || '',                     // K열: ESM 카테고리코드
          L: initialJson.auctionCatId || '',                 // L열: 옥션 카테고리코드
          M: initialJson.gmarketCatId || '',                 // M열: G마켓 카테고리코드
          O: originalPrice,                                   // O열: (할인 전) 판매가
          P: originalPrice,                                   // P열: 판매가 복사값
          Q: discountRate > 0 ? '정률(%)' : '',              // Q열: 할인 방식 (할인률이 있을 때만)
          S: discountRate > 0 ? '정률(%)' : '',              // S열: 할인 방식 (복사값)
          R: discountRate,                                   // R열: 할인률
          T: discountRate,                                   // T열: 할인률(복사값)
          W: "미사용",                                        // W열: 옵션 타입 (항상 미사용)
          X: "",                                             // X열: 옵션명 (빈 값)
          Y: "",                                             // Y열: 추천옵션 (빈 값)
          Z: mainImage,                                       // Z열: 기본이미지
          AA: additionalImages,                               // AA열: 추가이미지URL
          AB: description,                                    // AB열: 상품상세설명
          AC: accountInfo.delivery_template_code || '',       // AC열: 배송정보 템플릿 코드
          AL: 35,                                            // AL열: 고정값 35
          AM: accountInfo.disclosure_template_code || ''      // AM열: 고시정보 템플릿 코드
        };

        excelData.push(rowData);
      }
    } else {
      // variants가 없는 경우 기본 상품으로 처리
      const calculatedPrice = Number(initialJson.price) || 0;
      
      // 할인률 기반 정가/판매가 계산
      const discountRate = initialJson.discountRate || 0;
      const safeSalePrice = Number.isFinite(calculatedPrice) && calculatedPrice > 0 ? calculatedPrice : 0;

      const originalPrice = discountRate > 0 && safeSalePrice > 0
          ? Math.ceil(safeSalePrice / (1 - discountRate / 100) / 10) * 10  // 정가 역산 (10원 단위 올림)
          : safeSalePrice;

      // 이미지 URL 처리
      const mainImage = initialJson.representativeImage || '';
      const additionalImages = initialJson.images && initialJson.images.length > 1 
        ? initialJson.images.slice(1).join(',') 
        : '';

      // 상품 상세설명
      const description = cleanForExcel(initialJson.contents || '');

      // 상품명 길이 제한 (최대 50글자)
      let productName = initialJson.productName || '';
      if (productName.length > 50) {
        productName = productName.slice(0, 50);
      }

      // 엑셀 행 데이터 생성
      const rowData = {
        B: "옥션/G마켓",
        C: accountInfo.auction_id || '',
        D: accountInfo.gmarket_id || '',
        E: productName,
        K: initialJson.esmCatId || '',
        L: initialJson.auctionCatId || '',
        M: initialJson.gmarketCatId || '',
        O: originalPrice,
        P: originalPrice,
        Q: discountRate > 0 ? '정률(%)' : '',
        S: discountRate > 0 ? '정률(%)' : '',
        R: discountRate,
        T: discountRate,
        W: "미사용",                                        // W열: 옵션 타입 (항상 미사용)
        X: "",                                             // X열: 옵션명 (빈 값)
        Y: "",                                             // Y열: 추천옵션 (빈 값)
        Z: mainImage,
        AA: additionalImages,
        AB: description,
        AC: accountInfo.delivery_template_code || '',       // AC열: 배송정보 템플릿 코드
        AL: 35,                                            // AL열: 고정값 35
        AM: accountInfo.disclosure_template_code || ''      // AM열: 고시정보 템플릿 코드
      };

      excelData.push(rowData);
    }
  }

  return excelData;
}

/**
 * 기존 엑셀 템플릿을 읽어와 가공된 데이터로 채운 후, 새 파일로 저장합니다.
 * @param {Array} processedDataForExcel - 엑셀로 만들 가공된 상품 데이터 배열
 * @param {number} userid - 사용자 ID
 * @param {Object} esmConfig - ESM 설정 정보 (max_option_count 포함)
 * @returns {Promise<object>} - 생성된 엑셀 파일 정보 { fileName, filePath, downloadUrl }
 */
export async function createExcelFile(processedDataForExcel, userid, esmConfig) {
    try {
        // 1. 엑셀 데이터 변환
        const excelData = await transformToEsmFormat(processedDataForExcel, esmConfig);

        // 파일 이름 및 경로 설정
        const fileName = `ESM_products_${userid}_${Date.now()}.xlsx`;
        const uploadsDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const filePath = path.join(uploadsDir, fileName);
        
        // 템플릿 파일 경로 지정
        const templatePath = path.join(__dirname, '../db/new_basic_bulk.xlsx'); 
        if (!fs.existsSync(templatePath)) {
            throw new Error(`ESM 엑셀 템플릿 파일을 찾을 수 없습니다: ${templatePath}`);
        }
        
        // 2. 템플릿을 새 파일로 복사
        fs.copyFileSync(templatePath, filePath);

        // 3. 복사된 엑셀 파일을 열고 데이터 채우기
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        // 첫 번째 워크시트 사용
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            throw new Error('엑셀 템플릿에서 워크시트를 찾을 수 없습니다.');
        }
        
        // 데이터 작성을 시작할 행 번호 (헤더 다음 행부터)
        const startRow = 8;

        // 엑셀 데이터 채우기
        excelData.forEach((rowData, index) => {
            const currentRowNumber = startRow + index;
            const currentRow = worksheet.getRow(currentRowNumber);
            
            // 각 컬럼에 데이터 입력
            Object.keys(rowData).forEach(columnKey => {
                const cellValue = rowData[columnKey];
                currentRow.getCell(columnKey).value = cellValue;
            });
            
            currentRow.commit();
        });
        
        // 4. 변경된 내용으로 파일 덮어쓰기
        await workbook.xlsx.writeFile(filePath);

        console.log(`ESM 엑셀 파일 생성 완료: ${fileName}, 상품 수: ${excelData.length}`);

        return {
            fileName,
            filePath,
            downloadUrl: `/reg/download/excel/${fileName}`,
        };
        
    } catch (error) {
        console.error('ESM 엑셀 파일 생성 중 오류:', error);
        throw new Error(`엑셀 파일 생성 실패: ${error.message}`);
    }
}
