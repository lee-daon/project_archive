import uploadImages from './src/services/connect_naver/api_assist/images_upload.js';

// 비동기 함수로 래핑
async function main() {
  try {
    // 업로드할 이미지 파일 경로 배열
    const imagePaths = [
        'C:/Users/leeda/programing/item_images/translated/14971809051/raw_1.jpg',
        'C:/Users/leeda/programing/item_images/translated/14971809051/raw_2.jpg',
        'C:/Users/leeda/programing/item_images/translated/14971809051/raw_3.jpg',
        'C:/Users/leeda/programing/item_images/translated/14971809051/raw_4.jpg'
    ];
    
    const result = await uploadImages(imagePaths);
    console.log('업로드 결과:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

main();


let result ={
    "images": [
      {
        "url": "https://shop-phinf.pstatic.net/20250416_220/17447754382289HkU1_JPEG/15193808284042344_671916220.jpg"
      },
      {
        "url": "https://shop-phinf.pstatic.net/20250416_20/1744775438576zxPIu_JPEG/15193808633327242_248789786.jpg"
      },
      {
        "url": "https://shop-phinf.pstatic.net/20250416_162/1744775438953gIlGy_JPEG/15193809008676503_467006051.jpg"
      },
      {
        "url": "https://shop-phinf.pstatic.net/20250416_278/1744775439342RADSQ_JPEG/15193809396557929_699527713.jpg"
      }
    ]
  }
