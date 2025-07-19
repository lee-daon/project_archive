// productService.js
import { promisePool } from '../../../common/utils/connectDB.js';
import { cleanImageUrl } from '../../../common/utils/Validator.js';
import { addToQueue } from '../../../common/utils/redisClient.js';
import { QUEUE_NAMES } from '../../../common/config/settings.js';

/**
 * API 응답 데이터를 받아 해당 상품의 상세정보를 DB의 여러 상품상세정보 테이블에 저장하는 함수
 * @param {Object} productDetail - API 응답 데이터
 * @param {number} userid - 사용자 ID
 * @param {Object} job - 작업 데이터 (productId, productName 등)
 */
export async function saveProductDetail(productDetail, userid, job) {
  const executionId = Math.random().toString(36).substr(2, 9);
  const productId = job.productId;
  const productName = job.productName || '';
  const connection = await promisePool.getConnection();

  console.log(`saveProductDetail 시작 [execId: ${executionId}, productId: ${productId}, userid: ${userid}]`);

  try {
    await connection.beginTransaction();
    console.log(`트랜잭션 시작 [execId: ${executionId}, productId: ${productId}]`);

    // 2. categorymapping 테이블
    let catid;
    if (job.sameCategoryId) {
      catid = job.sameCategoryId;
      console.log(`saveProductDetail에서 sameCategoryId 사용 [execId: ${executionId}, productId: ${productId}, catid: ${catid}]`);
    } else {
      catid = productDetail.result.item.cat_id;
      // catid가 없는 경우 15자리 랜덤 정수 생성
      // catid의 자릿수는 deleteBatchProductStatus 함수에서 삭제할 때 사용, 변경 금지
      if (!catid) {
        // 10^14 ~ (10^15 - 1) 범위의 15자리 정수 생성
        const min = 100000000000000; // 10^14
        const max = 999999999999999; // 10^15 - 1
        catid = String(Math.floor(Math.random() * (max - min + 1)) + min);
        console.log(`saveProductDetail에서 catid 없어서 15자리 랜덤 생성 [execId: ${executionId}, productId: ${productId}, catid: ${catid}]`);
      }
    }
    
    console.log(`categorymapping 테이블 저장 시작 [productId: ${productId}]`);
    await connection.execute(
      `INSERT IGNORE INTO categorymapping (userid, catid, catname, coopang_cat_id, naver_cat_id)
       VALUES (?, ?, ?, NULL, NULL)`,
      [userid, catid, productDetail.result.item.cat_name]
    );
    console.log(`categorymapping 테이블 저장 완료 [productId: ${productId}]`);

    // 3. products_detail 테이블
    console.log(`products_detail 테이블 저장 시작 [productId: ${productId}]`);
    await connection.execute(
      `INSERT INTO products_detail (userid, productid, title_raw, title_translated, catid, brand_name, detail_url, delivery_fee, sellerid, shopid, video, video_thumbnail)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title_raw = VALUES(title_raw)`,
      [
        userid,
        productId,
        productDetail.result.item.title,
        productName,
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
    console.log(`products_detail 테이블 저장 완료 [productId: ${productId}]`);

    // 4. item_images_raw 테이블 (images 배열)
    console.log(`item_images_raw 테이블 저장 시작 [productId: ${productId}]`);
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
          console.log(`이미지 다운로드 큐 추가 [execId: ${executionId}, productId: ${productId}, imageType: main, order: ${i}]`);
          try {
            await addToQueue(QUEUE_NAMES.IMAGE_DOWNLOAD_QUEUE, {
              productid: productId,
              imageurl: cleanedImageUrl,
              imageType: 'main',
              imageorder: i
            });
            console.log(`이미지 다운로드 큐 추가 성공 [productId: ${productId}, imageType: main, order: ${i}]`);
          } catch (queueError) {
            console.error(`이미지 다운로드 큐 추가 실패 [productId: ${productId}, imageType: main, order: ${i}]:`, queueError);
            throw queueError;
          }
        }
      }
    }
    console.log(`item_images_raw 테이블 저장 완료 [productId: ${productId}]`);

    // 5. item_images_des_raw 테이블 (desc_imgs 배열)
    console.log(`item_images_des_raw 테이블 저장 시작 [productId: ${productId}]`);
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
    console.log(`item_images_des_raw 테이블 저장 완료 [productId: ${productId}]`);

    // 6. ban_seller 테이블 (sellerid) - INSERT IGNORE로 중복시 기존값 유지
    console.log(`ban_seller 테이블 저장 시작 [productId: ${productId}]`);
    const sellerId = productDetail.result.seller.seller_id;
    await connection.execute(
      `INSERT IGNORE INTO ban_seller (userid, sellerid, ban)
       VALUES (?, ?, ?)`,
      [userid, sellerId, false]
    );
    console.log(`ban_seller 테이블 저장 완료 [productId: ${productId}]`);

    // 7. ban_shop 테이블 (shopid) - INSERT IGNORE로 중복시 기존값 유지
    console.log(`ban_shop 테이블 저장 시작 [productId: ${productId}]`);
    const shopId = productDetail.result.seller.shop_id;
    await connection.execute(
      `INSERT IGNORE INTO ban_shop (userid, shopid, ban)
       VALUES (?, ?, ?)`,
      [userid, shopId, false]
    );
    console.log(`ban_shop 테이블 저장 완료 [productId: ${productId}]`);

    // 8. properties 테이블 (properties 배열)
    console.log(`properties 테이블 저장 시작 [productId: ${productId}]`);
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
    console.log(`properties 테이블 저장 완료 [productId: ${productId}]`);

    // 9. skus 테이블 (sku_base 배열)
    console.log(`skus 테이블 저장 시작 [productId: ${productId}]`);
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
    console.log(`skus 테이블 저장 완료 [productId: ${productId}]`);

    // 10. product_options 테이블 저장 (sku_props의 values에서 이미지 정보 획득)
    console.log(`product_options 테이블 저장 시작 [productId: ${productId}]`);
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
    console.log(`product_options 테이블 저장 완료 [productId: ${productId}]`);

    console.log(`트랜잭션 커밋 시작 [productId: ${productId}]`);
    await connection.commit();
    console.log(`상품 ${productId} DB 저장 성공 [userid: ${userid}]`);
    
    return {
      success: true,
      message: '상품 상세 정보가 성공적으로 저장되었습니다.',
      data: {
        productId,
        productName,
        sellerId,
        shopId
      }
    };
  } catch (err) {
    console.log(`트랜잭션 롤백 시작 [productId: ${productId}]`);
    await connection.rollback();
    console.error(`상품 ${productId} DB 저장 중 오류 [userid: ${userid}]:`, err);
    
    return {
      success: false,
      message: `상품 상세 정보 저장 중 오류가 발생했습니다: ${err.message}`,
      data: null
    };
  } finally {
    connection.release();
    console.log(`DB 연결 해제 완료 [productId: ${productId}]`);
  }
} 