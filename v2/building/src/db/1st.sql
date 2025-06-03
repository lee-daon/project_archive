CREATE DATABASE IF NOT EXISTS products;
USE products;

-- 1. 기본 상품 목록 테이블 (첫 번째로 생성)
CREATE TABLE IF NOT EXISTS productlist (
  productid VARCHAR(50) NOT NULL,
  url VARCHAR(2083) NOT NULL,
  product_name VARCHAR(255),
  price DECIMAL(10,2),
  image_url VARCHAR(2083),
  sales_count INT,
  banwords VARCHAR(255) DEFAULT ' ',
  ban BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (productid)
) ENGINE=InnoDB;

-- 2. categorymapping 테이블
CREATE TABLE IF NOT EXISTS categorymapping (
  catid VARCHAR(50) NOT NULL,
  catname VARCHAR(255),
  coopang_cat_id INT,
  naver_cat_id INT,
  naver_cat_name VARCHAR(255),
  coopang_cat_name VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (catid)
) ENGINE=InnoDB;

-- 3. products_detail 테이블
CREATE TABLE IF NOT EXISTS products_detail (
  productid VARCHAR(50) NOT NULL,
  title_raw VARCHAR(255),
  title_translated VARCHAR(255),
  title_optimized VARCHAR(255),
  catid VARCHAR(50) NOT NULL,
  brand_name VARCHAR(255),
  brand_name_translated VARCHAR(255),
  detail_url VARCHAR(2083),
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  sellerid VARCHAR(50),
  shopid VARCHAR(50),
  video VARCHAR(255),
  video_thumbnail VARCHAR(255),   
  keywords TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (productid),
  FOREIGN KEY (productid) REFERENCES productlist(productid),
  FOREIGN KEY (catid) REFERENCES categorymapping(catid)
) ENGINE=InnoDB;

-- 4. ban_seller 테이블
CREATE TABLE IF NOT EXISTS ban_seller (
  sellerid VARCHAR(50) NOT NULL,
  ban BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (sellerid)
) ENGINE=InnoDB;

-- 5. ban_shop 테이블
CREATE TABLE IF NOT EXISTS ban_shop (
  shopid VARCHAR(50) NOT NULL,
  ban BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (shopid)
) ENGINE=InnoDB;

------여기까지가 상품,금지처리 관련 정보--------------------------------

-- 6. item_images_raw 테이블
CREATE TABLE IF NOT EXISTS item_images_raw (
  productid VARCHAR(50) NOT NULL,
  imageurl VARCHAR(2083),
  imageorder INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (productid) REFERENCES products_detail(productid),
  PRIMARY KEY (productid, imageorder)
) ENGINE=InnoDB;

-- 7. item_images_des_raw 테이블
CREATE TABLE IF NOT EXISTS item_images_des_raw (
  productid VARCHAR(50) NOT NULL,
  imageurl VARCHAR(2083),
  imageorder INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (productid) REFERENCES products_detail(productid),
  PRIMARY KEY (productid, imageorder)
) ENGINE=InnoDB;

-- 8. itme_image_translated 테이블
CREATE TABLE IF NOT EXISTS item_image_translated (
  productid VARCHAR(50) NOT NULL,
  imageurl VARCHAR(2083),
  imageorder INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (productid) REFERENCES products_detail(productid),
  PRIMARY KEY (productid, imageorder)
) ENGINE=InnoDB;

-- 9. itme_image_des_translated 테이블
CREATE TABLE IF NOT EXISTS item_image_des_translated (
  productid VARCHAR(50) NOT NULL,
  imageurl VARCHAR(2083),
  imageorder INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (productid) REFERENCES products_detail(productid),
  PRIMARY KEY (productid, imageorder)
) ENGINE=InnoDB;

-- 10. nukki_image 테이블
CREATE TABLE IF NOT EXISTS nukki_image (
    productid VARCHAR(50) PRIMARY KEY,
    image_url VARCHAR(2083),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (productid) REFERENCES products_detail(productid)
);

-- 11. propreties 테이블
CREATE TABLE IF NOT EXISTS properties (
  productid VARCHAR(50) NOT NULL,
  name_raw VARCHAR(255),
  value_raw VARCHAR(255),
  name_translated VARCHAR(255),
  value_translated TEXT,
  prop_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (productid, prop_order),
  FOREIGN KEY (productid) REFERENCES products_detail(productid)
) ENGINE=InnoDB;

------------------여기까지가 이미지,속성 관련 테이블--------------------------------

-- 12. skus 테이블
CREATE TABLE IF NOT EXISTS skus (
  productid VARCHAR(50) NOT NULL,
  prop_path VARCHAR(255),
  price DECIMAL(10,2),
  promotionprice DECIMAL(10,2),
  quantity INT,
  skus_order INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (productid, skus_order),
  FOREIGN KEY (productid) REFERENCES products_detail(productid)
) ENGINE=InnoDB;

-- 13. 통합된 product_options 테이블 (기존 sku_prop_key, sku_prop_value, sku_images 대체)
CREATE TABLE IF NOT EXISTS product_options (
  prop_path VARCHAR(255) NOT NULL,
  optionname VARCHAR(255),
  optionvalue VARCHAR(255),
  imageurl VARCHAR(2083),
  translated_optionname VARCHAR(255),
  translated_optionvalue VARCHAR(255),
  imageurl_translated VARCHAR(2083),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (prop_path)
) ENGINE=InnoDB;

------------------여기까지가 sku 관련 테이블--------------------------------

-- 14. naver_regist_info 테이블, 네이버 등록중 사용하는 정보
CREATE TABLE IF NOT EXISTS naver_regist_info (
  productid VARCHAR(50) PRIMARY KEY,
  discount_rate DECIMAL(5,2) DEFAULT 0,
  first_stage_json JSON,
  final_main_price INT,
  final_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (productid) REFERENCES products_detail(productid)
);

-- 16. preprocessing 테이블
CREATE TABLE preprocessing (
    productid VARCHAR(50) PRIMARY KEY,
    brand_checked BOOLEAN DEFAULT FALSE,
    banned BOOLEAN DEFAULT FALSE,
    name_translated BOOLEAN DEFAULT FALSE,
    image_translated BOOLEAN DEFAULT FALSE,
    attribute_translated BOOLEAN DEFAULT FALSE,
    keyword_generated BOOLEAN DEFAULT FALSE,
    nukki_created BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (productid) REFERENCES products_detail(productid)
);

-- 17. error_log 테이블
CREATE TABLE IF NOT EXISTS error_log (
    productid VARCHAR(50) PRIMARY KEY,
    error_in_name_translated BOOLEAN DEFAULT FALSE,
    error_in_image_translated BOOLEAN DEFAULT FALSE,
    error_in_attribute_translated BOOLEAN DEFAULT FALSE,
    error_in_keyword_generated BOOLEAN DEFAULT FALSE,
    error_in_nukki_created BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (productid) REFERENCES products_detail(productid)
);

-- 18. status 테이블,메인 상태관리 테이블
CREATE TABLE status (
    productid VARCHAR(50) PRIMARY KEY,
    sourcing_completed BOOLEAN DEFAULT FALSE,
    preprocessing_completed BOOLEAN DEFAULT FALSE,
    brand_banned BOOLEAN DEFAULT FALSE,
    shop_banned BOOLEAN DEFAULT FALSE,
    seller_banned BOOLEAN DEFAULT FALSE,
    discarded BOOLEAN DEFAULT FALSE,
    category_mapping_required BOOLEAN DEFAULT FALSE,
    is_registrable BOOLEAN DEFAULT FALSE,
    registered BOOLEAN DEFAULT FALSE,
    coopang_registered BOOLEAN DEFAULT FALSE,
    naver_registered BOOLEAN DEFAULT FALSE,
    naver_register_failed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    testcode INT ,
    FOREIGN KEY (productid) REFERENCES products_detail(productid)
);


-- 19. pre_register 테이블, 스테이징 처리 전 데이터 저장용
CREATE TABLE pre_register (
    product_id VARCHAR(50) PRIMARY KEY COMMENT 'Productid' ,
    product_group_code VARCHAR(50) NOT NULL COMMENT '상품군 단위 코드',
    product_group_memo TEXT COMMENT '상품군 메모',
    registration_ready_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    json_data JSON COMMENT 'Json데이터',
    processing_error BOOLEAN DEFAULT FALSE COMMENT '가공오류여부',
    category_mapping_required BOOLEAN DEFAULT FALSE COMMENT "카테고리 매핑 필요여부",
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 20-1. coopang_register_management 테이블
CREATE TABLE coopang_register_management (
    productid VARCHAR(50) PRIMARY KEY,
    market_number INT,
    profit_margin INT,
    minimum_profit_margin INT,
    registration_attempt_time INT,
    delivery_fee DECIMAL(10,2),
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status_code INT CHECK(status_code BETWEEN 0 AND 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (productid) REFERENCES products_detail(productid),
    FOREIGN KEY (market_number) REFERENCES account_info(coopang_market_number)
);

-- 20-2. naver_register_management 테이블
CREATE TABLE naver_register_management (
    productid VARCHAR(50) PRIMARY KEY,
    market_number INT,
    profit_margin INT,
    minimum_profit_margin INT,
    registration_attempt_time INT,
    delivery_fee DECIMAL(10,2),
    status_code INT CHECK(status_code BETWEEN 0 AND 100),
    current_margin INT,
    originProductNo VARCHAR(50) UNIQUE,
    smartstoreChannelProductNo VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (productid) REFERENCES products_detail(productid),
    FOREIGN KEY (market_number) REFERENCES account_info(naver_market_number)
);


-- 21. account_info 테이블
create table account_info (
  shopid VARCHAR(50) PRIMARY KEY,
  coopang_market_number INT UNIQUE,
  naver_market_number INT UNIQUE,
  coopang_market_memo TEXT,
  naver_market_memo TEXT,
  coopang_maximun_sku_count INT,
  naver_maximun_sku_count INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
