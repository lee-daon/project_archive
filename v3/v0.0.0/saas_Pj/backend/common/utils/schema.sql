CREATE DATABASE IF NOT EXISTS saas;
USE saas;


-- 개인소유권------------------------------------------
-- 1. 기본 상품 목록 테이블 ( 가장먼져 소싱한 상품 목록 )
CREATE TABLE IF NOT EXISTS productlist (
  userid INT NOT NULL,
  productid BIGINT NOT NULL,
  url VARCHAR(2083) NOT NULL,
  product_name VARCHAR(255),
  price DECIMAL(10,2),
  image_url VARCHAR(2083),
  sales_count INT,
  banwords VARCHAR(255) DEFAULT ' ',
  ban BOOLEAN DEFAULT false,
  INNERID INT NOT NULL AUTO_INCREMENT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (userid, productid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

-- 2. categorymapping 테이블
CREATE TABLE IF NOT EXISTS categorymapping (
  userid INT NOT NULL,
  catid BIGINT NOT NULL,
  catname VARCHAR(40),
  coopang_cat_id INT,
  naver_cat_id INT,
  elevenstore_cat_id INT,
  esm_cat_id VARCHAR(40),
  gmarket_cat_id VARCHAR(40),
  auction_cat_id VARCHAR(40),
  naver_cat_name VARCHAR(255),
  coopang_cat_name VARCHAR(255),
  elevenstore_cat_name VARCHAR(255),
  esm_cat_name VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (userid,catid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

-- 3. products_detail 테이블 ( api요청을 통해 상세정보 취득 완료한 상품 정보 )
CREATE TABLE IF NOT EXISTS products_detail (
  userid INT NOT NULL,
  productid BIGINT NOT NULL,
  title_raw VARCHAR(255),
  title_translated VARCHAR(255),
  title_optimized VARCHAR(255),
  catid BIGINT NOT NULL,
  brand_name VARCHAR(255),
  brand_name_translated VARCHAR(255),
  detail_url VARCHAR(2083),
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  sellerid BIGINT,
  shopid BIGINT,
  video VARCHAR(255),
  video_thumbnail VARCHAR(255),
  keywords TEXT,
  INNERID INT NOT NULL AUTO_INCREMENT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (userid, productid),
  FOREIGN KEY (userid, catid) REFERENCES categorymapping(userid, catid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

-- 4. ban_seller 테이블 ( 개인별 금지 판매자 정보 )
CREATE TABLE IF NOT EXISTS ban_seller (
  userid INT NOT NULL,
  sellerid BIGINT NOT NULL,
  ban BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (userid, sellerid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

-- 5. ban_shop 테이블 ( 개인별 금지 쇼핑몰 정보 )
CREATE TABLE IF NOT EXISTS ban_shop (
  userid INT NOT NULL,
  shopid BIGINT NOT NULL,
  ban BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (userid, shopid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

-- 개인 소유 이미지------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS private_main_image (
  userid INT NOT NULL,
  productid BIGINT NOT NULL,
  imageurl VARCHAR(2083),
  imageorder INT,
  INNERID INT NOT NULL AUTO_INCREMENT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (userid, productid, imageorder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

CREATE TABLE IF NOT EXISTS private_description_image (
  userid INT NOT NULL,
  productid BIGINT NOT NULL,
  imageurl VARCHAR(2083),
  imageorder INT,
  INNERID INT NOT NULL AUTO_INCREMENT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (userid, productid, imageorder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

CREATE TABLE IF NOT EXISTS private_nukki_image (
  userid INT NOT NULL,
  productid BIGINT NOT NULL,
  image_url VARCHAR(2083),
  image_order INT,
  INNERID INT NOT NULL AUTO_INCREMENT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (userid, productid, image_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

CREATE TABLE IF NOT EXISTS private_properties (
  userid INT NOT NULL,
  productid BIGINT NOT NULL,
  property_name VARCHAR(255),
  property_value TEXT,
  property_order INT NOT NULL DEFAULT 0 comment '속성 순서, 번역후 순서 맞추기 위해 사용' ,
  INNERID INT NOT NULL AUTO_INCREMENT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (userid, productid, property_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

CREATE TABLE IF NOT EXISTS private_options (
  userid INT NOT NULL,
  productid BIGINT NOT NULL,
  prop_path VARCHAR(255),
  private_optionname VARCHAR(255),
  private_optionvalue VARCHAR(255),
  private_imageurl VARCHAR(2083),
  INNERID INT NOT NULL AUTO_INCREMENT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (userid, productid, prop_path)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 




-- 여기서부터는 공용 데이터 테이블--------------------------------

-- 6. item_images_raw 테이블 ( 원본 이미지 정보 )
CREATE TABLE IF NOT EXISTS item_images_raw (
  productid BIGINT NOT NULL,
  imageurl VARCHAR(2083),
  imageorder INT,
  INNERID INT NOT NULL AUTO_INCREMENT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (productid, imageorder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

-- 7. item_images_des_raw 테이블
CREATE TABLE IF NOT EXISTS item_images_des_raw (
  productid BIGINT NOT NULL,
  imageurl VARCHAR(2083),
  imageorder INT,
  INNERID INT NOT NULL AUTO_INCREMENT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (productid, imageorder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

-- 8. itme_image_translated 테이블
CREATE TABLE IF NOT EXISTS item_image_translated (
  productid BIGINT NOT NULL,
  imageurl VARCHAR(2083),
  imageorder INT,
  INNERID INT NOT NULL AUTO_INCREMENT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (productid, imageorder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

-- 9. itme_image_des_translated 테이블
CREATE TABLE IF NOT EXISTS item_image_des_translated (
  productid BIGINT NOT NULL,
  imageurl VARCHAR(2083),
  imageorder INT,
  INNERID INT NOT NULL AUTO_INCREMENT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (productid, imageorder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

-- 10. nukki_image 테이블
CREATE TABLE IF NOT EXISTS nukki_image (
    productid BIGINT NOT NULL,
    image_url VARCHAR(2083),
    image_order INT,
    INNERID INT NOT NULL AUTO_INCREMENT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (productid, image_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

-- 11. propreties 테이블
CREATE TABLE IF NOT EXISTS properties (
  productid BIGINT NOT NULL,
  name_raw VARCHAR(255),
  value_raw VARCHAR(255),
  name_translated VARCHAR(255),
  value_translated TEXT,
  prop_order INT NOT NULL DEFAULT 0 comment '속성 순서, 번역후 순서 맞추기 위해 사용' ,
  INNERID INT NOT NULL AUTO_INCREMENT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (productid, prop_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

-- 12. skus 테이블
CREATE TABLE IF NOT EXISTS skus (
  productid BIGINT NOT NULL,
  prop_path VARCHAR(255),
  price DECIMAL(10,2),
  promotionprice DECIMAL(10,2),
  quantity INT,
  skus_order INT,
  INNERID INT NOT NULL AUTO_INCREMENT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (productid, skus_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

-- 13. 통합된 product_options 테이블 (기존 sku_prop_key, sku_prop_value, sku_images 대체)
CREATE TABLE IF NOT EXISTS product_options (
  prop_path VARCHAR(255) NOT NULL,
  optionname VARCHAR(255),
  optionvalue VARCHAR(255),
  imageurl VARCHAR(2083),
  translated_optionname VARCHAR(255),
  translated_optionvalue VARCHAR(255),
  imageurl_translated VARCHAR(2083),
  INNERID INT NOT NULL AUTO_INCREMENT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (prop_path)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 


-- 여기서부터는 상태 관련 테이블--------------------------------

-- 14. sourcing_status 테이블 - 임시,용도 다하면 delete
create table if not exists sourcing_status (
    userid INT NOT NULL,
    productid BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL COMMENT '소싱 상태 (pending: 요청, banshop: 금지상점, banseller: 금지판매자, failsave: 저장실패, failapi: API오류, uncommit: 성공, commit: 승인)',
    commitcode INT COMMENT '그룹번호',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (userid, productid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 


-- 15. 가공 관련 테이블 
CREATE TABLE processing_status (
    userid INT NOT NULL,
    productid BIGINT NOT NULL,
    group_code VARCHAR(50) COMMENT '상품군 단위 코드',
    status VARCHAR(50) NOT NULL COMMENT '가공 상태 (pending: 요청, , brandbanCheck: 브랜드 필터링 승인 대기중 ,notbanned: 브랜드 필터링 통과 , processing: 가공중, success: 성공, fail: 실패 , brandbanned: 브랜드 금지 , commit: 승인 , discard: 삭제 ,ended: 더 이상 사용되지 않음 )',
    brandfilter BOOLEAN DEFAULT FALSE,
    banned BOOLEAN DEFAULT FALSE,
    name_optimized BOOLEAN DEFAULT FALSE,
    main_image_translated BOOLEAN DEFAULT FALSE,
    description_image_translated BOOLEAN DEFAULT FALSE,
    option_image_translated BOOLEAN DEFAULT FALSE,
    attribute_translated BOOLEAN DEFAULT FALSE,
    keyword_generated BOOLEAN DEFAULT FALSE,
    nukki_created BOOLEAN DEFAULT FALSE,
    nukki_image_order tinyint DEFAULT 0,
    option_optimized BOOLEAN DEFAULT FALSE,
    img_tasks_count INT DEFAULT 0,
    option_tasks_count INT DEFAULT 0,
    overall_tasks_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (userid, productid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

-- 16. status 테이블,메인 상태관리 테이블, 등록관련 초점화
CREATE TABLE status (
    userid INT NOT NULL,
    productid BIGINT NOT NULL,
    sourcing_completed BOOLEAN DEFAULT FALSE,
    preprocessing_completed BOOLEAN DEFAULT FALSE,
    baseJson_completed BOOLEAN DEFAULT FALSE,
    shop_banned BOOLEAN DEFAULT FALSE,
    seller_banned BOOLEAN DEFAULT FALSE,
    discarded BOOLEAN DEFAULT FALSE,
    naver_mapping_ready BOOLEAN DEFAULT FALSE,
    coopang_mapping_ready BOOLEAN DEFAULT FALSE,
    elevenstore_mapping_ready BOOLEAN DEFAULT FALSE,
    esm_mapping_ready BOOLEAN DEFAULT FALSE,
    is_registrable BOOLEAN DEFAULT FALSE,
    coopang_registered BOOLEAN DEFAULT FALSE,
    naver_registered BOOLEAN DEFAULT FALSE,
    elevenstore_registered BOOLEAN DEFAULT FALSE,
    esm_registered BOOLEAN DEFAULT FALSE,
    naver_register_failed BOOLEAN DEFAULT FALSE,
    coopang_register_failed BOOLEAN DEFAULT FALSE,
    elevenstore_register_failed BOOLEAN DEFAULT FALSE,
    esm_register_failed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    testcode INT DEFAULT 0,
    PRIMARY KEY (userid, productid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 


-- 17. 스테이징 데이터 관리 
CREATE TABLE pre_register (
    userid INT NOT NULL,
    productid BIGINT NOT NULL,
    product_group_code VARCHAR(50) NOT NULL COMMENT '상품군 단위 코드',
    product_group_memo TEXT COMMENT '상품군 메모',
    json_data JSON COMMENT 'Json데이터',
    api_requested BOOLEAN DEFAULT FALSE COMMENT 'API 요청 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (userid, productid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 사용자정보-------------------------------------

CREATE TABLE coopang_account_info (
  shopid INT NOT NULL AUTO_INCREMENT,
  userid INT NOT NULL,
  coopang_market_number INT,
  coopang_market_memo TEXT,
  coopang_maximun_sku_count INT,
  registered_sku_count INT DEFAULT 0,
  -- config.js 정보
  access_key VARCHAR(255) COMMENT '쿠팡 API 접근 키',
  secret_key VARCHAR(255) COMMENT '쿠팡 API 비밀 키',
  vendor_id VARCHAR(255) COMMENT '쿠팡 벤더 ID',
  -- x.md 반품 관련 정보
  return_charge_name VARCHAR(255) COMMENT '반품지 명',
  return_center_code VARCHAR(255) COMMENT '반품지 코드',
  company_contact_number VARCHAR(20) COMMENT '반품지 연락처',
  return_zip_code VARCHAR(10) COMMENT '반품지 우편번호',
  return_address VARCHAR(500) COMMENT '반품지 주소',
  return_address_detail VARCHAR(500) COMMENT '반품지 주소 상세',
  outbound_shipping_place_code VARCHAR(100) COMMENT '출고지 주소 코드',
  vendor_user_id VARCHAR(100) COMMENT '실사용자 아이디(쿠팡 Wing ID)',
  top_image_1 VARCHAR(500) NULL COMMENT '상단 첫 번째 이미지 URL',
  top_image_2 VARCHAR(500) NULL COMMENT '상단 두 번째 이미지 URL',
  top_image_3 VARCHAR(500) NULL COMMENT '상단 세 번째 이미지 URL',
  bottom_image_1 VARCHAR(500) NULL COMMENT '하단 첫 번째 이미지 URL',
  bottom_image_2 VARCHAR(500) NULL COMMENT '하단 두 번째 이미지 URL',
  bottom_image_3 VARCHAR(500) NULL COMMENT '하단 세 번째 이미지 URL',
  daily_registerable_left_count INT DEFAULT 5000 COMMENT '일일 등록가능 수량',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (shopid),
  UNIQUE (userid, coopang_market_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

CREATE TABLE naver_account_info (
  shopid INT NOT NULL AUTO_INCREMENT,
  userid INT NOT NULL,
  naver_market_number INT,
  naver_market_memo TEXT,
  naver_maximun_sku_count INT,
  naver_client_secret VARCHAR(255),
  naver_client_id VARCHAR(255),
  shippingAddressId INT,
  returnAddressId INT,
  registered_sku_count INT DEFAULT 0,
  top_image_1 VARCHAR(500) NULL COMMENT '상단 첫 번째 이미지 URL',
  top_image_2 VARCHAR(500) NULL COMMENT '상단 두 번째 이미지 URL',
  top_image_3 VARCHAR(500) NULL COMMENT '상단 세 번째 이미지 URL',
  bottom_image_1 VARCHAR(500) NULL COMMENT '하단 첫 번째 이미지 URL',
  bottom_image_2 VARCHAR(500) NULL COMMENT '하단 두 번째 이미지 URL',
  bottom_image_3 VARCHAR(500) NULL COMMENT '하단 세 번째 이미지 URL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (shopid),
  UNIQUE (userid, naver_market_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

-- 23. elevenstore_account_info 테이블 - 11번가 계정 정보, 미완성 
CREATE TABLE elevenstore_account_info (
  shopid INT NOT NULL AUTO_INCREMENT,
  userid INT NOT NULL,
  elevenstore_market_number INT,
  elevenstore_market_memo TEXT,
  elevenstore_maximun_sku_count INT,
  registered_sku_count INT DEFAULT 0,
  api_key VARCHAR(255) COMMENT '11번가 API 키',
  shippingAddressId INT COMMENT '출고지 주소 코드',
  returnAddressId INT COMMENT '반품지 주소 코드',
  prdInfoTmpltNo VARCHAR(50) COMMENT '발송마감 템플릿 번호',
  top_image_1 VARCHAR(500) NULL COMMENT '상단 첫 번째 이미지 URL',
  top_image_2 VARCHAR(500) NULL COMMENT '상단 두 번째 이미지 URL',
  top_image_3 VARCHAR(500) NULL COMMENT '상단 세 번째 이미지 URL',
  bottom_image_1 VARCHAR(500) NULL COMMENT '하단 첫 번째 이미지 URL',
  bottom_image_2 VARCHAR(500) NULL COMMENT '하단 두 번째 이미지 URL',
  bottom_image_3 VARCHAR(500) NULL COMMENT '하단 세 번째 이미지 URL',
  daily_registerable_left_count INT DEFAULT 500 COMMENT '일일 등록가능 수량',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (shopid),
  UNIQUE (userid, elevenstore_market_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 24. esm_account_info 테이블 - ESM 계정 정보
CREATE TABLE esm_account_info (
  shopid INT NOT NULL AUTO_INCREMENT,
  userid INT NOT NULL,
  esm_market_number INT,
  esm_market_memo TEXT,
  esm_maximun_sku_count INT,
  registered_sku_count INT DEFAULT 0,
  auction_id VARCHAR(50),
  gmarket_id VARCHAR(50),
  delivery_template_code BIGINT COMMENT '배송정보 템플릿 코드',
  disclosure_template_code BIGINT COMMENT '고시정보 템플릿 코드',
  top_image_1 VARCHAR(500) NULL COMMENT '상단 첫 번째 이미지 URL',
  top_image_2 VARCHAR(500) NULL COMMENT '상단 두 번째 이미지 URL',
  top_image_3 VARCHAR(500) NULL COMMENT '상단 세 번째 이미지 URL',
  bottom_image_1 VARCHAR(500) NULL COMMENT '하단 첫 번째 이미지 URL',
  bottom_image_2 VARCHAR(500) NULL COMMENT '하단 두 번째 이미지 URL',
  bottom_image_3 VARCHAR(500) NULL COMMENT '하단 세 번째 이미지 URL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (shopid),
  UNIQUE (userid, esm_market_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

create table if not exists not_used_image (
  id INT NOT NULL AUTO_INCREMENT,
  userid INT NOT NULL,
  code VARCHAR(50) NOT NULL COMMENT 'settingchange: 상세페이지 변경, marketdelete: 마켓 삭제',
  image_url VARCHAR(2083) NOT NULL,
  reason TEXT COMMENT '폐기사유',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_info (
  userid INT auto_increment NOT NULL comment '사용자 고유 번호',
  id VARCHAR(50) UNIQUE comment '사용자 아이디 (로컬 로그인용)',
  password VARCHAR(255) comment '사용자 비밀번호 (로컬 로그인용)',
  name VARCHAR(50) comment '사용자 이름',
  email VARCHAR(50) NOT NULL UNIQUE comment '사용자 이메일',
  naver_id VARCHAR(100) UNIQUE comment '네이버 사용자 ID',
  login_type ENUM('naver', 'local', 'both') NOT NULL DEFAULT 'naver' comment '로그인 타입',
  hashed_api_key VARCHAR(255) COMMENT '해시된 API 키',
  api_key_issued_at TIMESTAMP NULL COMMENT 'API 키 발급 시간',
  plan ENUM('free', 'basic', 'enterprise') NOT NULL DEFAULT 'free' comment '플랜',
  maximum_market_count INT NOT NULL DEFAULT 1 comment '최대 사업자 수',
  expired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '구독 만료 시간',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE comment '사용자 활성화 여부',
  PRIMARY KEY (userid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 사용자 통계 테이블
CREATE TABLE user_statistics (
  userid INT NOT NULL COMMENT '사용자 고유 번호',
  -- 일일 가능수량 (남은거)
  daily_sourcing_remaining INT NOT NULL DEFAULT 0 COMMENT '일일 소싱 가능수량(남은거)',
  daily_sourcing_upgrade_time TIMESTAMP NULL COMMENT '일일 소싱 업그레이드 시간',
  daily_image_processing_remaining INT NOT NULL DEFAULT 0 COMMENT '일일 이미지 가공 가능수량(남은거)',

  -- 이미지 가공권 수량
  image_processing_allinone_count INT NOT NULL DEFAULT 0 COMMENT '이미지 가공권 allinone수량',
  image_processing_single_count INT NOT NULL DEFAULT 0 COMMENT '이미지 가공권 낱장 수량',
  deep_brand_filter_count INT NOT NULL DEFAULT 0 COMMENT '딥브랜드 필터링 수량',
  -- 누적 통계
  total_sourced_products INT NOT NULL DEFAULT 0 COMMENT '누적 소싱 상품수(소싱)',
  duplicate_filtered_products INT NOT NULL DEFAULT 0 COMMENT '중복 제외 상품수(중복 필터링 된거)',
  total_filtered_products INT NOT NULL DEFAULT 0 COMMENT '누적 필터링된 상품수(금지 걸린거)',
  total_collected_products INT NOT NULL DEFAULT 0 COMMENT '누적 수집 상품수(productlist수)',
  total_processed_products INT NOT NULL DEFAULT 0 COMMENT '누적 가공 상품수(가공 요청 온거)',
  total_translated_images INT NOT NULL DEFAULT 0 COMMENT '누적 이미지 번역수(이미지 수)',
  total_registered_products INT NOT NULL DEFAULT 0 COMMENT '누적 등록 상품수(등록수)',
  -- 시간 정보
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (userid),
  FOREIGN KEY (userid) REFERENCES user_info(userid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 사용 로그 테이블
CREATE TABLE usage_log (
  id INT NOT NULL AUTO_INCREMENT,
  userid INT NOT NULL,
  usage_type ENUM('sourcing', 'image_processing', 'register', 'deep_brand_filter') NOT NULL COMMENT '사용 유형',
  usage_amount INT NOT NULL COMMENT '사용 수량',
  usage_time TIMESTAMP NOT NULL COMMENT '사용 시간',
  comment TEXT COMMENT '사용 내용',
  PRIMARY KEY (id),
  FOREIGN KEY (userid) REFERENCES user_info(userid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 스테이징을 통해 데이터 fix--------------------------------

-- 24. coopang_register_management 테이블
CREATE TABLE coopang_register_management (
    userid INT NOT NULL,
    productid BIGINT NOT NULL,
    market_number INT,
    status VARCHAR(50) NOT NULL COMMENT '등록 상태 (pending: 요청, success: 성공, fail: 실패, rate_limit: 제한량 걸림 , retry: 재시도 여지 있음 , optionMapRequired: 옵션 매핑 필요, reuse: 재사용 )',
    profit_margin INT,
    minimum_profit_margin INT,
    registration_attempt_time INT,
    delivery_fee DECIMAL(10,2),
    status_code INT CHECK(status_code BETWEEN 0 AND 100),
    current_margin INT,
    final_json JSON,
    mapped_json JSON COMMENT '옵션 매핑 된 jsondata',
    use_mapped_json BOOLEAN DEFAULT FALSE comment '옵션 매핑 된 jsondata 사용 여부',
    discount_rate INT DEFAULT 0,
    registered_product_number BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (userid, productid),
    FOREIGN KEY (userid, market_number) REFERENCES coopang_account_info(userid, coopang_market_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

-- 25. naver_register_management 테이블- 상품등록관리 
CREATE TABLE naver_register_management (
    userid INT NOT NULL,
    productid BIGINT NOT NULL,
    market_number INT , 
    status VARCHAR(50) NOT NULL COMMENT '등록 상태 (pending: 요청, success: 성공, fail: 실패, rate_limit: 제한량 걸림 , retry: 재시도 여지 있음 , optionMapRequired: 옵션 매핑 필요, reuse: 재사용 )',
    profit_margin INT,
    minimum_profit_margin INT,
    registration_attempt_time INT,
    delivery_fee DECIMAL(10,2),
    status_code INT CHECK(status_code BETWEEN 0 AND 100),
    current_margin INT,
    discount_rate DECIMAL(5,2) DEFAULT 0,
    first_stage_json JSON,
    final_main_price INT,
    final_json JSON,
    originProductNo VARCHAR(50) UNIQUE,
    smartstoreChannelProductNo VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (userid, productid),
    FOREIGN KEY (userid, market_number) REFERENCES naver_account_info(userid, naver_market_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

-- 26. elevenstore_register_management 테이블- 11번가 등록 관리 
CREATE TABLE elevenstore_register_management (
    userid INT NOT NULL,
    productid BIGINT NOT NULL,
    market_number INT COMMENT '11번가 상점 번호',
    status VARCHAR(50) NOT NULL COMMENT '등록 상태 (pending: 요청, success: 성공, fail: 실패, rate_limit: 제한량 걸림 , retry: 재시도 여지 있음 , reuse: 재사용 )',
    profit_margin INT,
    minimum_profit_margin INT,
    registration_attempt_time INT,
    delivery_fee DECIMAL(10,2),
    status_code INT CHECK(status_code BETWEEN 0 AND 100),
    current_margin INT,
    discount_rate INT,
    final_main_price INT,
    final_xml MEDIUMTEXT,
    originProductNo VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (userid, productid),
    FOREIGN KEY (userid, market_number) REFERENCES elevenstore_account_info(userid, elevenstore_market_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

-- 27. esm_register_management 테이블- ESM 등록 관리
CREATE TABLE esm_register_management (
    userid INT NOT NULL,
    productid BIGINT NOT NULL,
    market_number INT COMMENT 'ESM 상점 번호',
    status VARCHAR(50) NOT NULL COMMENT '등록 상태 (pending: 요청, success: 성공, fail: 실패, rate_limit: 제한량 걸림, retry: 재시도 여지 있음, reuse: 재사용)',
    profit_margin INT,
    minimum_profit_margin INT,
    registration_attempt_time INT,
    delivery_fee DECIMAL(10,2),
    status_code INT CHECK(status_code BETWEEN 0 AND 100),
    current_margin INT,
    discount_rate INT,
    final_main_price INT,
    final_json JSON,
    originProductNo VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (userid, productid),
    FOREIGN KEY (userid, market_number) REFERENCES esm_account_info(userid, esm_market_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 


-- 18. error_log 테이블
CREATE TABLE IF NOT EXISTS error_log (
    log_id INT NOT NULL AUTO_INCREMENT,
    userid INT NOT NULL,
    productid BIGINT NOT NULL,
    error_message MEDIUMTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (log_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

CREATE TABLE IF NOT EXISTS info_log (
    log_id INT NOT NULL AUTO_INCREMENT,
    info_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (log_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 

create table if not exists temp (
  userid INT NOT NULL,
  type_number int not null,
  data json,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (userid, type_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 트리거 정의 (카테고리 매핑 자동 동기화)--------------------------------

DELIMITER //

-- categorymapping 테이블 INSERT 시 트리거
CREATE TRIGGER IF NOT EXISTS categorymapping_after_insert
AFTER INSERT ON categorymapping
FOR EACH ROW
BEGIN
    UPDATE status s 
    JOIN products_detail pd ON s.userid = pd.userid AND s.productid = pd.productid
    SET s.naver_mapping_ready = CASE WHEN NEW.naver_cat_id IS NOT NULL THEN TRUE ELSE FALSE END,
        s.coopang_mapping_ready = CASE WHEN NEW.coopang_cat_id IS NOT NULL THEN TRUE ELSE FALSE END,
        s.elevenstore_mapping_ready = CASE WHEN NEW.elevenstore_cat_id IS NOT NULL THEN TRUE ELSE FALSE END,
        s.esm_mapping_ready = CASE WHEN NEW.esm_cat_id IS NOT NULL THEN TRUE ELSE FALSE END,
        s.updated_at = NOW()
    WHERE pd.catid = NEW.catid AND s.userid = NEW.userid;
END//

-- categorymapping 테이블 UPDATE 시 트리거
CREATE TRIGGER IF NOT EXISTS categorymapping_after_update
AFTER UPDATE ON categorymapping
FOR EACH ROW
BEGIN
    UPDATE status s 
    JOIN products_detail pd ON s.userid = pd.userid AND s.productid = pd.productid
    SET s.naver_mapping_ready = CASE WHEN NEW.naver_cat_id IS NOT NULL THEN TRUE ELSE FALSE END,
        s.coopang_mapping_ready = CASE WHEN NEW.coopang_cat_id IS NOT NULL THEN TRUE ELSE FALSE END,
        s.elevenstore_mapping_ready = CASE WHEN NEW.elevenstore_cat_id IS NOT NULL THEN TRUE ELSE FALSE END,
        s.esm_mapping_ready = CASE WHEN NEW.esm_cat_id IS NOT NULL THEN TRUE ELSE FALSE END,
        s.updated_at = NOW()
    WHERE pd.catid = NEW.catid AND s.userid = NEW.userid;
END//

-- categorymapping 테이블 DELETE 시 트리거
CREATE TRIGGER IF NOT EXISTS categorymapping_after_delete
AFTER DELETE ON categorymapping
FOR EACH ROW
BEGIN
    UPDATE status s 
    JOIN products_detail pd ON s.userid = pd.userid AND s.productid = pd.productid
    SET s.naver_mapping_ready = FALSE,
        s.coopang_mapping_ready = FALSE,
        s.elevenstore_mapping_ready = FALSE,
        s.esm_mapping_ready = FALSE,
        s.updated_at = NOW()
    WHERE pd.catid = OLD.catid AND s.userid = OLD.userid;
END//

-- user_info 테이블 INSERT 시 user_statistics 자동 생성 트리거
CREATE TRIGGER IF NOT EXISTS user_info_after_insert
AFTER INSERT ON user_info
FOR EACH ROW
BEGIN
    DECLARE sourcing_limit INT;
    DECLARE image_limit INT;

    -- plan에 따른 할당량 설정
    IF NEW.plan = 'free' THEN
        SET sourcing_limit = 0;
        SET image_limit = 0;
    ELSEIF NEW.plan = 'basic' THEN
        SET sourcing_limit = 100;
        SET image_limit = 50;
    ELSEIF NEW.plan = 'enterprise' THEN
        SET sourcing_limit = 5000;
        SET image_limit = 300;
    ELSE -- 혹시 모를 기본값 (free와 동일하게)
        SET sourcing_limit = 0;
        SET image_limit = 0;
    END IF;

    -- user_statistics 테이블에 기본값으로 레코드 생성
    INSERT INTO user_statistics (
        userid, 
        daily_sourcing_remaining, 
        daily_image_processing_remaining
    ) VALUES (
        NEW.userid, 
        sourcing_limit, 
        image_limit
    );
END//

-- user_info 테이블 plan 변경 시 할당량 자동 조정 트리거
CREATE TRIGGER IF NOT EXISTS user_info_plan_update
AFTER UPDATE ON user_info
FOR EACH ROW
BEGIN
    -- plan이 변경되었을 때만 실행
    IF OLD.plan != NEW.plan THEN
        -- plan에 따른 할당량 설정
        IF NEW.plan = 'free' THEN
            UPDATE user_statistics 
            SET daily_sourcing_remaining = 0,
                daily_image_processing_remaining = 0,
                updated_at = NOW()
            WHERE userid = NEW.userid;
        ELSEIF NEW.plan = 'basic' THEN
            UPDATE user_statistics 
            SET daily_sourcing_remaining = 100,
                daily_image_processing_remaining = 50,
                updated_at = NOW()
            WHERE userid = NEW.userid;
        ELSEIF NEW.plan = 'enterprise' THEN
            UPDATE user_statistics 
            SET daily_sourcing_remaining = 5000,
                daily_image_processing_remaining = 300,
                updated_at = NOW()
            WHERE userid = NEW.userid;
        END IF;
    END IF;
END//

DELIMITER ; 

-- 등록 설정 관리 테이블--------------------------------

-- 유저 세팅 테이블 -----------------------------------
-- 19. common_setting 테이블 - 공통 설정
CREATE TABLE common_setting (
    userid INT NOT NULL,
    minimum_margin INT NOT NULL DEFAULT 5000 COMMENT '최소 마진 (정수)',
    basic_minimum_margin_percentage INT NOT NULL DEFAULT 10 COMMENT '기본 최소 마진 퍼센트 (100 이하)',
    basic_margin_percentage INT NOT NULL DEFAULT 20 COMMENT '기본 마진 퍼센트 (1000 이하)',
    buying_fee INT NOT NULL DEFAULT 2 COMMENT '구매 수수료 (100 이하)',
    import_duty INT NOT NULL DEFAULT 8 COMMENT '수입 관세 (100 이하)',
    import_vat INT NOT NULL DEFAULT 10 COMMENT '수입 부가세 (100 이하)',
    china_exchange_rate INT NOT NULL DEFAULT 210 COMMENT '중국 환율 ',
    usa_exchange_rate INT NOT NULL DEFAULT 1400 COMMENT '미국 환율 ',
    min_percentage INT NOT NULL DEFAULT 10 COMMENT '최소 할인 퍼센트',
    max_percentage INT NOT NULL DEFAULT 30 COMMENT '최대 할인 퍼센트',
    basic_delivery_fee INT NOT NULL DEFAULT 8000 COMMENT '기본 배송비',
    -- 상세페이지 설정
    top_image_1 VARCHAR(500) NULL COMMENT '상단 첫 번째 이미지 URL',
    top_image_2 VARCHAR(500) NULL COMMENT '상단 두 번째 이미지 URL',
    top_image_3 VARCHAR(500) NULL COMMENT '상단 세 번째 이미지 URL',
    bottom_image_1 VARCHAR(500) NULL COMMENT '하단 첫 번째 이미지 URL',
    bottom_image_2 VARCHAR(500) NULL COMMENT '하단 두 번째 이미지 URL',
    bottom_image_3 VARCHAR(500) NULL COMMENT '하단 세 번째 이미지 URL',
    include_properties BOOLEAN DEFAULT TRUE COMMENT '속성 포함 여부',
    include_options BOOLEAN DEFAULT TRUE COMMENT '옵션 포함 여부',
    use_az_option BOOLEAN DEFAULT TRUE COMMENT 'A-Z 옵션 사용 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (userid),
    FOREIGN KEY (userid) REFERENCES user_info(userid),
    CHECK (basic_minimum_margin_percentage <= 100),
    CHECK (basic_margin_percentage <= 1000),
    CHECK (buying_fee <= 100),
    CHECK (import_duty <= 100),
    CHECK (import_vat <= 100),
    CHECK (min_percentage <= max_percentage),
    CHECK (min_percentage >= 0 AND max_percentage <= 100),
    CHECK (basic_delivery_fee >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 20. naver_register_config 테이블 - 네이버 등록 기본 설정
CREATE TABLE naver_register_config (
    userid INT NOT NULL,
    delivery_company VARCHAR(50) NOT NULL DEFAULT 'CJGLS' COMMENT '배송업체',
    after_service_telephone VARCHAR(20) NOT NULL DEFAULT '010-0000-0000' COMMENT 'A/S 전화번호',
    after_service_guide_content TEXT COMMENT 'A/S 안내 내용',
    naver_point INT NOT NULL DEFAULT 1000 COMMENT '네이버포인트 할인 적용 금액',
    return_delivery_fee INT NOT NULL DEFAULT 5000 COMMENT '반품 배송비',
    exchange_delivery_fee INT NOT NULL DEFAULT 5000 COMMENT '교환 배송비',
    purchase_point INT NOT NULL DEFAULT 1000 COMMENT '구매 포인트',
    naver_cashback_price INT NOT NULL DEFAULT 1000 COMMENT '네이버 캐시백 가격',
    text_review_point INT NOT NULL DEFAULT 1000 COMMENT '텍스트 리뷰 포인트',
    photo_video_review_point INT NOT NULL DEFAULT 1000 COMMENT '포토/비디오 리뷰 포인트',
    after_use_text_review_point INT NOT NULL DEFAULT 1000 COMMENT '사용 후 텍스트 리뷰 포인트',
    after_use_photo_video_review_point INT NOT NULL DEFAULT 1000 COMMENT '사용 후 포토/비디오 리뷰 포인트',
    store_member_review_point INT NOT NULL DEFAULT 2000 COMMENT '스토어 멤버 리뷰 포인트',
    include_delivery_fee BOOLEAN DEFAULT TRUE COMMENT '배송비 포함 여부',
    include_import_duty BOOLEAN DEFAULT TRUE COMMENT '수입 관세 포함 여부',
    price_setting_logic enum('low_price','ai','many') NOT NULL DEFAULT 'many' COMMENT '가격 설정 로직',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (userid),
    FOREIGN KEY (userid) REFERENCES user_info(userid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 21. coopang_setting 테이블 - 쿠팡 정책 설정
CREATE TABLE coopang_setting (
    userid INT NOT NULL,
    delivery_company_code VARCHAR(50) NOT NULL DEFAULT 'HANJIN' COMMENT '택배사 코드',
    after_service_guide_content TEXT COMMENT 'A/S 안내 내용',
    after_service_telephone VARCHAR(20) COMMENT 'A/S 전화번호',
    free_shipping BOOLEAN DEFAULT TRUE COMMENT '무료배송 여부',
    max_option_count INT DEFAULT 10 COMMENT '최대 옵션 개수',
    return_delivery_fee INT DEFAULT 5000 COMMENT '반품 배송비',
    include_import_duty BOOLEAN DEFAULT TRUE COMMENT '수입 관세 포함 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (userid),
    FOREIGN KEY (userid) REFERENCES user_info(userid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 22. extra_setting 테이블 - 추가 설정
CREATE TABLE extra_setting (
    userid INT NOT NULL,
    user_banned_words TEXT COMMENT '사용자 개별 금지어 목록 (쉼표로 구분)',
    use_deep_ban BOOLEAN DEFAULT FALSE COMMENT '심층 벤 사용여부 (0: 미사용, 1: 사용)',
    allow_keyword_spacing BOOLEAN DEFAULT TRUE COMMENT '키워드 뛰어쓰기 허용여부 (0: 비허용, 1: 허용)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (userid),
    FOREIGN KEY (userid) REFERENCES user_info(userid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 23. elevenstore_setting 테이블 - 11번가 정책 설정
CREATE TABLE elevenstore_setting (
    userid INT NOT NULL,
    overseas_size_chart_display BOOLEAN DEFAULT FALSE COMMENT '해외사이즈 조견표 노출여부',
    include_import_duty BOOLEAN DEFAULT TRUE COMMENT '관부과세 포함 여부',
    include_delivery_fee BOOLEAN DEFAULT TRUE COMMENT '배송비 포함 여부',
    elevenstore_point_amount INT DEFAULT 1000 COMMENT '11번가 포인트 적립 금액',
    option_array_logic ENUM('most_products', 'lowest_price') DEFAULT 'most_products' COMMENT '옵션 배열 로직 (most_products: 가장 많은 상품, lowest_price: 최저가)',
    return_cost INT DEFAULT 5000 COMMENT '반품비용',
    exchange_cost INT DEFAULT 5000 COMMENT '교환비용',
    as_guide TEXT COMMENT 'A/S 안내',
    return_exchange_guide TEXT COMMENT '반품/교환 안내',
    delivery_company_code VARCHAR(10) DEFAULT '00045' COMMENT '발송택배사번호',
    overseas_product_indication BOOLEAN DEFAULT TRUE COMMENT '해외직구 상품 명시 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (userid),
    FOREIGN KEY (userid) REFERENCES user_info(userid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 24. esm_setting 테이블 - ESM 정책 설정
CREATE TABLE esm_setting (
    userid INT NOT NULL,
    include_import_duty BOOLEAN DEFAULT TRUE COMMENT '관부과세 포함 여부',
    include_delivery_fee BOOLEAN DEFAULT TRUE COMMENT '배송비 포함 여부',
    max_option_count INT DEFAULT 1 COMMENT '최대 옵션 개수',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (userid),
    FOREIGN KEY (userid) REFERENCES user_info(userid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 상태별 개수 조회 최적화 인덱스--------------------------------

-- 쿠팡 등록 관리 테이블 성능 최적화 인덱스 (개별 쿼리 방식)
CREATE INDEX idx_coopang_userid_status ON coopang_register_management (userid, status);
CREATE INDEX idx_coopang_market_status ON coopang_register_management (userid, market_number, status);

-- 네이버 등록 관리 테이블 성능 최적화 인덱스 (개별 쿼리 방식)
CREATE INDEX idx_naver_userid_status ON naver_register_management (userid, status);
CREATE INDEX idx_naver_market_status ON naver_register_management (userid, market_number, status);

-- 11번가 등록 관리 테이블 성능 최적화 인덱스 (개별 쿼리 방식)
CREATE INDEX idx_elevenstore_userid_status ON elevenstore_register_management (userid, status);
CREATE INDEX idx_elevenstore_market_status ON elevenstore_register_management (userid, market_number, status);

-- ESM 등록 관리 테이블 성능 최적화 인덱스 (개별 쿼리 방식)
CREATE INDEX idx_esm_userid_status ON esm_register_management (userid, status);
CREATE INDEX idx_esm_market_status ON esm_register_management (userid, market_number, status);

-- products_detail 테이블 상품명 검색 최적화 인덱스
CREATE INDEX idx_products_detail_userid_title_optimized ON products_detail (userid, title_optimized);
CREATE INDEX idx_products_detail_userid_title_translated ON products_detail (userid, title_translated);
CREATE INDEX idx_products_detail_userid_title_raw ON products_detail (userid, title_raw);

-- 데이터 복사 성능 최적화 인덱스
CREATE INDEX idx_products_detail_productid_created_at ON products_detail (productid, created_at);

-- 소싱, 가공, 등록 상태 관리 테이블 그룹 단위 조회 최적화 인덱스
CREATE INDEX idx_sourcing_status_userid_commitcode ON sourcing_status (userid, commitcode);
CREATE INDEX idx_processing_status_userid_group_code ON processing_status (userid, group_code);
CREATE INDEX idx_pre_register_userid_product_group_code ON pre_register (userid, product_group_code);

-- 메인페이지 관련 테이블--------------------------------

-- 공지사항 테이블
CREATE TABLE notices (
  id INT NOT NULL AUTO_INCREMENT,
  type VARCHAR(20) NOT NULL COMMENT '공지사항 타입 (공지, 업데이트, 안내)',
  tag_type ENUM('success', 'warning', 'info', 'error') NOT NULL DEFAULT 'info' COMMENT '태그 타입',
  title VARCHAR(255) NOT NULL COMMENT '공지사항 제목',
  content TEXT COMMENT '공지사항 내용 (HTML 형식)',
  is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 메모장 테이블
CREATE TABLE memos (
  id INT NOT NULL AUTO_INCREMENT COMMENT '메모 고유 ID',
  userid INT NOT NULL COMMENT '사용자 ID',
  title VARCHAR(255) NOT NULL COMMENT '메모 제목',
  content TEXT COMMENT '메모 내용',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (userid) REFERENCES user_info(userid) ON DELETE CASCADE,
  INDEX idx_memos_userid (userid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 공지사항 기본 데이터 삽입
INSERT INTO notices (type, tag_type, title, content) VALUES
('공지', 'success', '신규 기능이 추가되었습니다.', '<p>안녕하세요. 루프톤입니다.</p><p>이번 업데이트를 통해 <strong>새로운 대시보드 기능</strong>이 추가되었습니다. 이제 메인 화면에서 주요 현황을 한 눈에 파악할 수 있습니다.</p><ul><li>KPI 통계 정보</li><li>메모장 기능</li><li>주요 기능 바로가기</li></ul><p>많은 이용 부탁드립니다. 감사합니다.</p>'),
('업데이트', 'warning', '시스템이 개선되었습니다.', '<p>시스템 성능이 개선되었습니다.</p><p>주요 개선 사항:</p><ul><li>응답 속도 향상</li><li>안정성 개선</li><li>UI/UX 개선</li></ul>'),
('안내', 'info', '서버 점검이 예정되어 있습니다.', '<p>정기 서버 점검이 예정되어 있습니다.</p><p><strong>점검 일시:</strong> 2024년 1월 20일 오전 2시 ~ 4시</p><p>점검 중에는 서비스 이용이 제한될 수 있습니다.</p><p>양해 부탁드립니다.</p>');
