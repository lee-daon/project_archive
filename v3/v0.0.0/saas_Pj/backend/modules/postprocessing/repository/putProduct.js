import { promisePool as db } from '../../../common/utils/connectDB.js';

export const putProductRepository = {
  // 상품 기본 정보 업데이트 (title_optimized, keywords)
  async updateProductDetails(userid, productid, { title_optimized, keywords }) {
    const query = `
      UPDATE products_detail 
      SET title_optimized = ?, keywords = ? 
      WHERE userid = ? AND productid = ?
    `;
    return await db.execute(query, [
      title_optimized ?? null, 
      keywords ?? null, 
      userid, 
      productid
    ]);
  },

  // 메인 이미지 삭제
  async deleteMainImages(userid, productid, imageorders) {
    if (!imageorders || imageorders.length === 0) return;
    
    const placeholders = imageorders.map(() => '?').join(',');
    const query = `
      DELETE FROM private_main_image 
      WHERE userid = ? AND productid = ? AND imageorder IN (${placeholders})
    `;
    const params = [userid, productid, ...imageorders];
    return await db.execute(query, params);
  },

  // 상세 이미지 삭제
  async deleteDescriptionImages(userid, productid, imageorders) {
    if (!imageorders || imageorders.length === 0) return;
    
    const placeholders = imageorders.map(() => '?').join(',');
    const query = `
      DELETE FROM private_description_image 
      WHERE userid = ? AND productid = ? AND imageorder IN (${placeholders})
    `;
    const params = [userid, productid, ...imageorders];
    return await db.execute(query, params);
  },

  // 누끼 이미지 삭제
  async deleteNukkiImages(userid, productid, imageorders) {
    if (!imageorders || imageorders.length === 0) return;
    
    const placeholders = imageorders.map(() => '?').join(',');
    const query = `
      DELETE FROM private_nukki_image 
      WHERE userid = ? AND productid = ? AND image_order IN (${placeholders})
    `;
    const params = [userid, productid, ...imageorders];
    return await db.execute(query, params);
  },

  // 모든 누끼 이미지 삭제 (representative_image_type이 main일 때)
  async deleteAllNukkiImages(userid, productid) {
    const query = `
      DELETE FROM private_nukki_image 
      WHERE userid = ? AND productid = ?
    `;
    return await db.execute(query, [userid, productid]);
  },

  // 메인 이미지 순서 바꾸기 - 특정 imageorder를 0으로, 기존 0을 해당 order로
  async swapMainImageOrder(userid, productid, targetOrder) {
    // targetOrder가 0이면 swap할 필요 없음
    if (targetOrder === 0) return;
    
    // 트랜잭션으로 처리
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 기존 0번 이미지를 임시 순서로 변경
      await connection.execute(
        'UPDATE private_main_image SET imageorder = -1 WHERE userid = ? AND productid = ? AND imageorder = 0',
        [userid, productid]
      );

      // 타겟 이미지를 0번으로 변경
      await connection.execute(
        'UPDATE private_main_image SET imageorder = 0 WHERE userid = ? AND productid = ? AND imageorder = ?',
        [userid, productid, targetOrder]
      );

      // 임시 순서였던 이미지를 타겟 순서로 변경
      await connection.execute(
        'UPDATE private_main_image SET imageorder = ? WHERE userid = ? AND productid = ? AND imageorder = -1',
        [targetOrder, userid, productid]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // 옵션 업데이트
  async updateOptions(userid, productid, options) {
    if (!options || options.length === 0) return;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      for (const option of options) {
        const { prop_path, private_optionname, private_optionvalue } = option;
        
        await connection.execute(
          `UPDATE private_options 
           SET private_optionname = ?, private_optionvalue = ? 
           WHERE userid = ? AND productid = ? AND prop_path = ?`,
          [
            private_optionname ?? null, 
            private_optionvalue ?? null, 
            userid, 
            productid, 
            prop_path ?? null
          ]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // 속성 업데이트 - 실제 요청 데이터 구조에 맞게 수정
  async updateProperties(userid, productid, properties) {
    if (!properties || properties.length === 0) return;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      for (const property of properties) {
        const { property_order, property_name, property_value } = property;
        
        await connection.execute(
          `UPDATE private_properties 
           SET property_name = ?, property_value = ? 
           WHERE userid = ? AND productid = ? AND property_order = ?`,
          [
            property_name ?? null, 
            property_value ?? null, 
            userid, 
            productid, 
            property_order ?? null
          ]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};
