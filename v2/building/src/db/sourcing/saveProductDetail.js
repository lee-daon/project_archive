// productService.js
import { promisePool } from '../../db/connectDB.js';

/**
 * API 응답 데이터를 받아 해당 상품의 상세정보를 DB의 여러 상품상세정보 테이블에 저장하는 함수
 * @param {Object} product - { productId, productName }
 * @param {Object} data - API 응답 데이터
 */
export async function saveProductDetail(product, data) {
  const { productId, productName } = product;
  const connection = await promisePool.getConnection();

  //console.log("saveProductDetail 실행")

  try {
    await connection.beginTransaction();

    // 2. categorymapping 테이블
    const catid = data.result.item.cat_id;
    await connection.query(
      `INSERT IGNORE INTO categorymapping (catid, catname, coopang_cat_id, naver_cat_id)
       VALUES (?, ?, NULL, NULL)`,
      [catid, data.result.item.cat_name]
    );

    // 3. products_detail 테이블
    await connection.query(
      `INSERT INTO products_detail (productid, title_raw, title_translated, catid, brand_name, detail_url, delivery_fee, sellerid, shopid, video, video_thumbnail)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title_raw = VALUES(title_raw)`,
      [
        productId,
        data.result.item.title,
        productName,
        catid,
        data.result.item.brandName,
        data.result.item.detail_url,
        data.result.delivery.delivery_fee,
        data.result.seller.seller_id,
        data.result.seller.shop_id,
        data.result.item.video,
        data.result.item.video_thumbnail
      ]
    );

    // 4. item_images_raw 테이블 (images 배열)
    if (data.result.item.images && Array.isArray(data.result.item.images)) {
      for (let i = 0; i < data.result.item.images.length; i++) {
        await connection.query(
          `INSERT INTO item_images_raw (productid, imageurl, imageorder)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE imageurl = VALUES(imageurl)`,
          [productId, data.result.item.images[i], i]
        );
      }
    }

    // 5. item_images_des_raw 테이블 (desc_imgs 배열)
    if (data.result.item.desc_imgs && Array.isArray(data.result.item.desc_imgs)) {
      for (let i = 0; i < data.result.item.desc_imgs.length; i++) {
        await connection.query(
          `INSERT INTO item_images_des_raw (productid, imageurl, imageorder)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE imageurl = VALUES(imageurl)`,
          [productId, data.result.item.desc_imgs[i], i]
        );
      }
    }

    // 6. ban_seller 테이블 (sellerid)
    const sellerId = data.result.seller.seller_id;
    await connection.query(
      `INSERT IGNORE INTO ban_seller (sellerid, ban)
       VALUES (?, ?)`,
      [sellerId, false]
    );

    // 7. ban_shop 테이블 (shopid)
    const shopId = data.result.seller.shop_id;
    await connection.query(
      `INSERT IGNORE INTO ban_shop (shopid, ban)
       VALUES (?, ?)`,
      [shopId, false]
    );

    // 8. properties 테이블 (properties 배열)
    if (data.result.item.properties && Array.isArray(data.result.item.properties)) {
      for (let i = 0; i < data.result.item.properties.length; i++) {
        const prop = data.result.item.properties[i];
        try {
          await connection.query(
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

    // 9. skus 테이블 (sku_base 배열)
    if (data.result.item.sku_base && Array.isArray(data.result.item.sku_base)) {
      for (let i = 0; i < data.result.item.sku_base.length; i++) {
        const sku = data.result.item.sku_base[i];
        await connection.query(
          `INSERT INTO skus (productid, prop_path, price, promotionprice, quantity, skus_order)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE prop_path = VALUES(prop_path), price = VALUES(price), 
           promotionprice = VALUES(promotionprice), quantity = VALUES(quantity)`,
          [productId, sku.propPath, sku.price, sku.promotion_price, sku.quantity, i]
        );
      }
    }

    // 10. product_options 테이블 저장 (기존 sku_prop_key, sku_prop_value, sku_images를 통합)
    if (data.result.item.sku_props && Array.isArray(data.result.item.sku_props)) {
      for (let skuProp of data.result.item.sku_props) {
        const optionName = skuProp.name;
        const pid = skuProp.pid;
        
        if (skuProp.values && Array.isArray(skuProp.values)) {
          for (let value of skuProp.values) {
            const vid = value.vid;
            const optionValue = value.name;
            const propPath = `${pid}:${vid}`;
            
            // 이미지 URL 가져오기 (있는 경우)
            let imageUrl = null;
            if (data.result.item.sku_images && data.result.item.sku_images[propPath]) {
              imageUrl = data.result.item.sku_images[propPath];
            }
            
            await connection.query(
              `INSERT INTO product_options 
               (prop_path, optionname, optionvalue, imageurl) 
               VALUES (?, ?, ?, ?) 
               ON DUPLICATE KEY UPDATE 
               optionname = VALUES(optionname), 
               optionvalue = VALUES(optionvalue), 
               imageurl = VALUES(imageurl)`,
              [propPath, optionName, optionValue, imageUrl]
            );
          }
        }
      }
    }

    await connection.commit();
    console.log(`상품 ${productId} DB 저장 성공`);
  } catch (err) {
    await connection.rollback();
    console.error(`상품 ${productId} DB 저장 중 오류:`, err);
    throw err;
  } finally {
    connection.release();
  }
} 