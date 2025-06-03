export function addUrlToProducts(products) {
    products.forEach(product => {
      product.url = `https://item.taobao.com/item.htm?id=${product.productId}`;
    });
    return products;
  }
