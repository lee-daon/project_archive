// saveProductDetailV2.js - sourcing 모듈용 V2 API 저장 함수
import { promisePool } from '../../../common/utils/connectDB.js';
import { cleanImageUrl } from '../../../common/utils/Validator.js';
import { addToQueue } from '../../../common/utils/redisClient.js';
import { QUEUE_NAMES } from '../../../common/config/settings.js';

/**
 * V2 API 응답 데이터를 받아 해당 상품의 상세정보를 DB의 여러 상품상세정보 테이블에 저장하는 함수 (sourcing 모듈용)
 * @param {Object} productDetailV2 - V2 API 응답 데이터
 * @param {number} userid - 사용자 ID
 * @param {string} productId - 상품 ID
 */
export async function saveProductDetailV2(productDetailV2, userid, productId) {
  const connection = await promisePool.getConnection();

  try {
    await connection.beginTransaction();

    const data = productDetailV2.data;

    // V2 API에서는 카테고리 정보가 명시적이지 않으므로 랜덤 생성
    // 15자리 랜덤 정수 생성
    const min = 100000000000000; // 10^14
    const max = 999999999999999; // 10^15 - 1
    const catid = String(Math.floor(Math.random() * (max - min + 1)) + min);
    const catName = '기타 카테고리'; // 기본 카테고리명

    // attributies에서 브랜드 정보 추출
    let brandName = '';
    if (data.attributies && Array.isArray(data.attributies)) {
      const brandAttr = data.attributies.find(attr => attr.name === '品牌');
      if (brandAttr) {
        brandName = brandAttr.value.replace(/;$/, ''); // 끝의 세미콜론 제거
      }
    }

    // shopUrl에서 shopId 추출 (예: https://shop105432059.taobao.com -> 105432059)
    let shopId = '';
    if (data.shopUrl) {
      const shopMatch = data.shopUrl.match(/shop(\d+)\.taobao\.com/);
      if (shopMatch) {
        shopId = shopMatch[1];
      }
    }

    // medias에서 비디오 정보 추출
    let videoUrl = null;
    let videoThumbnail = null;
    if (data.medias && Array.isArray(data.medias)) {
      const videoMedia = data.medias.find(media => media.isVideo === true);
      if (videoMedia) {
        videoUrl = videoMedia.link;
        // 비디오 썸네일은 V2 API에서 별도로 제공되지 않음
      }
    }

    // 1. categorymapping 테이블
    await connection.execute(
      `INSERT IGNORE INTO categorymapping (userid, catid, catname, coopang_cat_id, naver_cat_id)
       VALUES (?, ?, ?, NULL, NULL)`,
      [userid, catid, catName]
    );

    // 2. products_detail 테이블 (상품명은 title_raw만 저장)
    await connection.execute(
      `INSERT INTO products_detail (userid, productid, title_raw, catid, brand_name, detail_url, delivery_fee, sellerid, shopid, video, video_thumbnail)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title_raw = VALUES(title_raw)`,
      [
        userid,
        productId,
        data.title,
        catid,
        brandName,
        `https://detail.tmall.com/item.htm?id=${data.itemId}`, // V2에서는 detail_url이 없으므로 생성
        0, // V2에서는 배송비 정보가 없으므로 기본값 0
        data.sellerId,
        shopId,
        videoUrl, // medias에서 추출한 비디오 URL
        videoThumbnail  // V2에서는 비디오 썸네일이 별도로 제공되지 않음
      ]
    );

    // 3. item_images_raw 테이블 (medias 배열에서 이미지만 필터링)
    if (data.medias && Array.isArray(data.medias)) {
      const images = data.medias.filter(media => !media.isVideo);
      for (let i = 0; i < images.length; i++) {
        const cleanedImageUrl = cleanImageUrl(images[i].link);
        if (cleanedImageUrl) {
          await connection.execute(
            `INSERT INTO item_images_raw (productid, imageurl, imageorder)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE imageurl = VALUES(imageurl)`,
            [productId, cleanedImageUrl, i]
          );
          
          // DB 저장 성공 후 이미지 다운로드 큐에 추가
          await addToQueue(QUEUE_NAMES.IMAGE_DOWNLOAD_QUEUE, {
            productid: productId,
            imageurl: cleanedImageUrl,
            imageType: 'main',
            imageorder: i
          });
        }
      }
    }

    // 4. item_images_des_raw 테이블 (description HTML에서 이미지 추출)
    if (data.description) {
      // HTML에서 img 태그의 src 추출
      const imgRegex = /<img[^>]+src="([^"]+)"/g;
      let match;
      let imageOrder = 0;
      
      while ((match = imgRegex.exec(data.description)) !== null) {
        const cleanedImageUrl = cleanImageUrl(match[1]);
        if (cleanedImageUrl) {
          await connection.execute(
            `INSERT INTO item_images_des_raw (productid, imageurl, imageorder)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE imageurl = VALUES(imageurl)`,
            [productId, cleanedImageUrl, imageOrder]
          );
          
          // DB 저장 성공 후 이미지 다운로드 큐에 추가
          await addToQueue(QUEUE_NAMES.IMAGE_DOWNLOAD_QUEUE, {
            productid: productId,
            imageurl: cleanedImageUrl,
            imageType: 'description',
            imageorder: imageOrder
          });
          
          imageOrder++;
        }
      }
    }

    // 5. ban_seller 테이블 (sellerId) - INSERT IGNORE로 중복시 기존값 유지
    await connection.execute(
      `INSERT IGNORE INTO ban_seller (userid, sellerid, ban)
       VALUES (?, ?, ?)`,
      [userid, data.sellerId, false]
    );

    // 6. ban_shop 테이블 (shopId) - INSERT IGNORE로 중복시 기존값 유지
    await connection.execute(
      `INSERT IGNORE INTO ban_shop (userid, shopid, ban)
       VALUES (?, ?, ?)`,
      [userid, shopId, false]
    );

    // 7. properties 테이블 (attributies 배열에서 변환)
    if (data.attributies && Array.isArray(data.attributies)) {
      for (let i = 0; i < data.attributies.length; i++) {
        const attr = data.attributies[i];
        try {
          await connection.execute(
            `INSERT INTO properties (productid, name_raw, value_raw, prop_order)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name_raw = VALUES(name_raw), value_raw = VALUES(value_raw)`,
            [productId, attr.name, attr.value, i]
          );
        } catch (err) {
          if (err.code === 'ER_DATA_TOO_LONG') {
            console.warn(`상품 ${productId}의 properties 컬럼 value_raw 데이터가 너무 길어 해당 항목은 저장하지 않습니다: ${attr.name}`);
          } else {
            throw err;
          }
        }
      }
    }

    // 8. skus 테이블 (skuInfos 배열)
    if (data.skuInfos && Array.isArray(data.skuInfos)) {
      for (let i = 0; i < data.skuInfos.length; i++) {
        const sku = data.skuInfos[i];
        // referenceId의 쉼표를 세미콜론으로 변환 (1627207:28332,20509:28314 -> 1627207:28332;20509:28314)
        const propPath = sku.referenceId ? sku.referenceId.replace(/,/g, ';') : '';
        
        await connection.execute(
          `INSERT INTO skus (productid, prop_path, price, promotionprice, quantity, skus_order)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE prop_path = VALUES(prop_path), price = VALUES(price), 
           promotionprice = VALUES(promotionprice), quantity = VALUES(quantity)`,
          [productId, propPath, sku.price, sku.promotionPrice, sku.amountOnSale, i]
        );
      }
    }

    // 9. product_options 테이블 저장 (properties에서 옵션 정보 추출)
    if (data.properties && Array.isArray(data.properties)) {
      for (let prop of data.properties) {
        const optionName = prop.name;
        const pid = prop.id;
        
        if (prop.values && Array.isArray(prop.values)) {
          for (let value of prop.values) {
            const vid = value.id;
            const optionValue = value.name;
            const propPath = `${pid}:${vid}`;
            
            // 이미지 URL 가져오기
            let imageUrl = null;
            if (value.imageUrl) {
              imageUrl = cleanImageUrl(value.imageUrl);
            }
            
            await connection.execute(
              `INSERT INTO product_options 
               (prop_path, optionname, optionvalue, imageurl) 
               VALUES (?, ?, ?, ?) 
               ON DUPLICATE KEY UPDATE 
               optionname = VALUES(optionname), 
               optionvalue = VALUES(optionvalue), 
               imageurl = VALUES(imageurl)`,
              [propPath, optionName, optionValue, imageUrl]
            );
            
            // DB 저장 성공 후 옵션 이미지가 있는 경우 다운로드 큐에 추가
            if (imageUrl) {
              await addToQueue(QUEUE_NAMES.IMAGE_DOWNLOAD_QUEUE, {
                imageurl: imageUrl,
                imageType: 'option',
                prop_path: propPath
              });
            }
          }
        }
      }
    }

    await connection.commit();
    
    return {
      success: true,
      message: '상품 상세 정보가 성공적으로 저장되었습니다. (V2)',
      data: {
        productId,
        sellerId: data.sellerId,
        shopId
      }
    };
  } catch (err) {
    await connection.rollback();
    console.error(`상품 ${productId} V2 DB 저장 중 오류 [userid: ${userid}]:`, err);
    
    return {
      success: false,
      message: `상품 상세 정보 저장 중 오류가 발생했습니다: ${err.message}`,
      data: null
    };
  } finally {
    connection.release();
  }
}
