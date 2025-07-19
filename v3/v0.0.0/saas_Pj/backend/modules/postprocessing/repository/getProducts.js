import { promisePool } from '../../../common/utils/connectDB.js';

// 상품 리스트 조회
async function getProductsList(userid, page, limit, order, search) {
  const connection = await promisePool.getConnection();
  
  try {
    const offset = (page - 1) * limit;
    const orderBy = order === 'latest' ? 'DESC' : 'ASC';
    
    // 검색 조건 생성
    let whereClause = 'WHERE ps.userid = ? AND ps.status = ?';
    let queryParams = [userid, 'commit'];
    
    if (search && search.trim()) {
      whereClause += ' AND pr.product_group_code LIKE ?';
      queryParams.push(`%${search.trim()}%`);
    }
    
    // 총 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total_count
      FROM processing_status ps
      JOIN pre_register pr ON ps.userid = pr.userid AND ps.productid = pr.productid
      ${whereClause}
    `;
    
    const [countResult] = await connection.execute(countQuery, queryParams);
    const totalCount = countResult[0].total_count;
    
    // 상품 리스트 조회 - LIMIT과 OFFSET을 직접 쿼리에 포함
    const listQuery = `
      SELECT 
        ps.productid,
        pr.product_group_code,
        COALESCE(pd.title_optimized, pd.title_translated) as title_optimized,
        COALESCE(
          (SELECT image_url FROM private_nukki_image pni 
           WHERE pni.userid = ps.userid AND pni.productid = ps.productid 
           ORDER BY image_order ASC LIMIT 1),
          (SELECT imageurl FROM private_main_image pmi 
           WHERE pmi.userid = ps.userid AND pmi.productid = ps.productid 
           ORDER BY imageorder ASC LIMIT 1)
        ) as main_image_url
      FROM processing_status ps
      JOIN pre_register pr ON ps.userid = pr.userid AND ps.productid = pr.productid
      LEFT JOIN products_detail pd ON ps.userid = pd.userid AND ps.productid = pd.productid
      ${whereClause}
      ORDER BY pr.created_at ${orderBy}
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;
    
    const [products] = await connection.execute(listQuery, queryParams);
    
    return {
      products,
      totalCount
    };
    
  } finally {
    connection.release();
  }
}

// 상품 상세 정보 조회
async function getProductDetail(userid, productid) {
  const connection = await promisePool.getConnection();
  
  try {
    // 기본 상품 정보 조회
    const productQuery = `
      SELECT 
        ps.productid,
        COALESCE(pd.title_optimized, pd.title_translated) as title_optimized,
        pd.keywords,
        pr.product_group_code
      FROM processing_status ps
      JOIN pre_register pr ON ps.userid = pr.userid AND ps.productid = pr.productid
      LEFT JOIN products_detail pd ON ps.userid = pd.userid AND ps.productid = pd.productid
      WHERE ps.userid = ? AND ps.productid = ? AND ps.status = 'commit'
    `;
    
    const [productResult] = await connection.execute(productQuery, [userid, productid]);
    
    if (productResult.length === 0) {
      return null;
    }
    
    const productInfo = productResult[0];
    
    // 메인 이미지 조회
    const mainImagesQuery = `
      SELECT imageurl, imageorder, 
             (imageorder = 0) as is_representative
      FROM private_main_image
      WHERE userid = ? AND productid = ?
      ORDER BY imageorder ASC
    `;
    
    const [mainImages] = await connection.execute(mainImagesQuery, [userid, productid]);
    
    // 누끼 이미지 조회
    const nukkiImagesQuery = `
      SELECT image_url, image_order
      FROM private_nukki_image
      WHERE userid = ? AND productid = ?
      ORDER BY image_order ASC
    `;
    
    const [nukkiImages] = await connection.execute(nukkiImagesQuery, [userid, productid]);
    
    // 상세 이미지 조회
    const descImagesQuery = `
      SELECT imageurl, imageorder
      FROM private_description_image
      WHERE userid = ? AND productid = ?
      ORDER BY imageorder ASC
    `;
    
    const [descImages] = await connection.execute(descImagesQuery, [userid, productid]);
    
    // 속성 조회
    const propertiesQuery = `
      SELECT property_name, property_value, property_order
      FROM private_properties
      WHERE userid = ? AND productid = ?
      ORDER BY property_order ASC
    `;
    
    const [properties] = await connection.execute(propertiesQuery, [userid, productid]);
    
    // 옵션 조회
    const optionsQuery = `
      SELECT prop_path, private_optionname, private_optionvalue, private_imageurl
      FROM private_options
      WHERE userid = ? AND productid = ?
    `;
    
    const [options] = await connection.execute(optionsQuery, [userid, productid]);
    
    return {
      product_info: productInfo,
      main_images: mainImages,
      nukki_images: nukkiImages,
      description_images: descImages,
      properties,
      options
    };
    
  } finally {
    connection.release();
  }
}

export {
  getProductsList,
  getProductDetail,
};
