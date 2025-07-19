DROP TABLE IF EXISTS product_views;

CREATE TABLE product_views (
    date TEXT,
    userId INTEGER,
    productId INTEGER,
    groupId INTEGER,
    cou_views INTEGER DEFAULT 0,
    nav_views INTEGER DEFAULT 0,
    ele_views INTEGER DEFAULT 0,
    acu_views INTEGER DEFAULT 0,
    gma_views INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    PRIMARY KEY (userId, date, productId)
);

CREATE INDEX idx_user_group_date ON product_views (userId, groupId, date);
CREATE INDEX idx_user_product_date ON product_views (userId, productId, date);
