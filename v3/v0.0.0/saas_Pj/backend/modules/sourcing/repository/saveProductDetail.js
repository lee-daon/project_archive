import { promisePool } from '../../../common/utils/connectDB.js';
import { cleanImageUrl } from '../../../common/utils/Validator.js';
import { addToQueue } from '../../../common/utils/redisClient.js';
import { QUEUE_NAMES } from '../../../common/config/settings.js';

/**
 * API 응답 데이터를 받아 해당 상품의 상세정보를 DB의 여러 상품상세정보 테이블에 저장하는 함수
 * @param {Object} productDetail - API 응답 데이터
 * @param {number} userid - 사용자 ID
 * @param {string} productId - 상품 ID
 */
export async function saveProductDetail(productDetail, userid, productId) {
  const connection = await promisePool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. categorymapping 테이블
    let catid = productDetail.result.item.cat_id;
    
    // catid가 없는 경우 14자리 랜덤 정수 생성
    if (!catid) {
      catid = Math.floor(Math.random() * 90000000000000) + 10000000000000;
      console.log(`saveProductDetail에서 catid 없어서 랜덤 생성 [productId: ${productId}, catid: ${catid}]`);
    }
    
    await connection.execute(
      `INSERT IGNORE INTO categorymapping (userid, catid, catname, coopang_cat_id, naver_cat_id)
       VALUES (?, ?, ?, NULL, NULL)`,
      [userid, catid, productDetail.result.item.cat_name]
    );

    // 2. products_detail 테이블 (상품명은 title_raw만 저장)
    await connection.execute(
      `INSERT INTO products_detail (userid, productid, title_raw, catid, brand_name, detail_url, delivery_fee, sellerid, shopid, video, video_thumbnail)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title_raw = VALUES(title_raw)`,
      [
        userid,
        productId,
        productDetail.result.item.title,
        catid,
        productDetail.result.item.brandName,
        productDetail.result.item.detail_url,
        productDetail.result.delivery.delivery_fee,
        productDetail.result.seller.seller_id,
        productDetail.result.seller.shop_id,
        productDetail.result.item.video,
        productDetail.result.item.video_thumbnail
      ]
    );

    // 3. item_images_raw 테이블 (images 배열)
    if (productDetail.result.item.images && Array.isArray(productDetail.result.item.images)) {
      for (let i = 0; i < productDetail.result.item.images.length; i++) {
        const cleanedImageUrl = cleanImageUrl(productDetail.result.item.images[i]);
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

    // 4. item_images_des_raw 테이블 (desc_imgs 배열)
    if (productDetail.result.item.desc_imgs && Array.isArray(productDetail.result.item.desc_imgs)) {
      for (let i = 0; i < productDetail.result.item.desc_imgs.length; i++) {
        const cleanedImageUrl = cleanImageUrl(productDetail.result.item.desc_imgs[i]);
        if (cleanedImageUrl) {
          await connection.execute(
            `INSERT INTO item_images_des_raw (productid, imageurl, imageorder)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE imageurl = VALUES(imageurl)`,
            [productId, cleanedImageUrl, i]
          );
          
          // DB 저장 성공 후 이미지 다운로드 큐에 추가
          await addToQueue(QUEUE_NAMES.IMAGE_DOWNLOAD_QUEUE, {
            productid: productId,
            imageurl: cleanedImageUrl,
            imageType: 'description',
            imageorder: i
          });
        }
      }
    }

    // 5. ban_seller 테이블 (sellerid) - INSERT IGNORE로 중복시 기존값 유지
    const sellerId = productDetail.result.seller.seller_id;
    await connection.execute(
      `INSERT IGNORE INTO ban_seller (userid, sellerid, ban)
       VALUES (?, ?, ?)`,
      [userid, sellerId, false]
    );

    // 6. ban_shop 테이블 (shopid) - INSERT IGNORE로 중복시 기존값 유지
    const shopId = productDetail.result.seller.shop_id;
    await connection.execute(
      `INSERT IGNORE INTO ban_shop (userid, shopid, ban)
       VALUES (?, ?, ?)`,
      [userid, shopId, false]
    );

    // 7. properties 테이블 (properties 배열)
    if (productDetail.result.item.properties && Array.isArray(productDetail.result.item.properties)) {
      for (let i = 0; i < productDetail.result.item.properties.length; i++) {
        const prop = productDetail.result.item.properties[i];
        try {
          await connection.execute(
            `INSERT INTO properties (productid, name_raw, value_raw, prop_order)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name_raw = VALUES(name_raw), value_raw = VALUES(value_raw)`,
            [productId, prop.name, prop.value, i]
          );
        } catch (err) {
          if (err.code === 'ER_DATA_TOO_LONG') {
            console.warn(`상품 ${productId}의 properties 컬럼 value_raw 데이터가 너무 길어 해당 항목은 저장하지 않습니다: ${prop.name}`);
          } else {
            throw err;
          }
        }
      }
    }

    // 8. skus 테이블 (sku_base 배열)
    if (productDetail.result.item.sku_base && Array.isArray(productDetail.result.item.sku_base)) {
      for (let i = 0; i < productDetail.result.item.sku_base.length; i++) {
        const sku = productDetail.result.item.sku_base[i];
        await connection.execute(
          `INSERT INTO skus (productid, prop_path, price, promotionprice, quantity, skus_order)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE prop_path = VALUES(prop_path), price = VALUES(price), 
           promotionprice = VALUES(promotionprice), quantity = VALUES(quantity)`,
          [productId, sku.propPath, sku.price, sku.promotion_price, sku.quantity, i]
        );
      }
    }

    // 9. product_options 테이블 저장 (sku_props의 values에서 이미지 정보 획득)
    if (productDetail.result.item.sku_props && Array.isArray(productDetail.result.item.sku_props)) {
      for (let skuProp of productDetail.result.item.sku_props) {
        const optionName = skuProp.name;
        const pid = skuProp.pid;
        
        if (skuProp.values && Array.isArray(skuProp.values)) {
          for (let value of skuProp.values) {
            const vid = value.vid;
            const optionValue = value.name;
            const propPath = `${pid}:${vid}`;
            
            // 이미지 URL 가져오기 (sku_props의 values에서 직접 획득)
            let imageUrl = null;
            if (value.image) {
              imageUrl = cleanImageUrl(value.image);
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
    console.log(`상품 ${productId} DB 저장 성공 [userid: ${userid}]`);
    
    return {
      success: true,
      message: '상품 상세 정보가 성공적으로 저장되었습니다.',
      data: {
        productId,
        sellerId,
        shopId
      }
    };
  } catch (err) {
    await connection.rollback();
    console.error(`상품 ${productId} DB 저장 중 오류 [userid: ${userid}]:`, err);
    
    return {
      success: false,
      message: `상품 상세 정보 저장 중 오류가 발생했습니다: ${err.message}`,
      data: null
    };
  } finally {
    connection.release();
  }
}
