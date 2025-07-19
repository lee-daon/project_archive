import { Router } from 'itty-router';
import { ProductTracker } from './durable_object.mjs';

const router = Router();

// Base64를 ArrayBuffer로 변환하는 헬퍼 함수
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// 1x1 검은색 PNG의 Base64 데이터
const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==';
const PNG_DATA = base64ToArrayBuffer(PNG_BASE64);

// 트래킹 엔드포인트
router.get('/:market/:userId/:productId/:groupId', async (request, env, ctx) => {
  // URL에서 파라미터 직접 추출
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(part => part !== '');
  
  const market = pathParts[0];
  const userIdStr = pathParts[1];
  const productIdStr = pathParts[2];
  const groupIdStr = pathParts[3];

  // market 유효성 검사
  const validMarkets = ['cou', 'nav', 'ele', 'acu', 'gma'];
  if (!validMarkets.includes(market)) {
    return new Response('Not Found.', { status: 404 });
  }

  // userId, productId, groupId 숫자 검증
  const userId = parseInt(userIdStr, 10);
  const productId = parseInt(productIdStr, 10);
  const groupId = parseInt(groupIdStr, 10);
  
  if (isNaN(userId) || isNaN(productId) || isNaN(groupId) || userId <= 0 || productId <= 0 || groupId <= 0) {
    return new Response('Invalid user, product, or group ID', { status: 400 });
  }

  // 사용자-상품 쌍별로 고유성을 보장하기 위해 userId와 productId의 조합을 DO 이름으로 사용.
  const doId = env.PRODUCT_TRACKER.idFromName(`${userId}-${productId}`);
  const stub = env.PRODUCT_TRACKER.get(doId);

  // 파라미터를 전달하며 Durable Object로 요청을 전달
  const doUrl = new URL('https://worker.internal/track');
  doUrl.searchParams.set('userId', userId.toString());
  doUrl.searchParams.set('productId', productId.toString());
  doUrl.searchParams.set('groupId', groupId.toString());
  doUrl.searchParams.set('market', market);
  
  // DO의 응답이 처리될 때까지 기다릴 필요 없음.
  // 이를 통해 사용자에게 더 빠른 응답을 제공.
  ctx.waitUntil(stub.fetch(doUrl.toString()));

  // 1x1 픽셀 검은색 PNG 반환
  return new Response(PNG_DATA, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
});

// 조회 데이터를 쿼리하기 위한 API 엔드포인트
router.get('/api/views', async (request, env, ctx) => {
  // --- 인증 체크 추가 ---
  const authHeader = request.headers.get('Authorization');
  const expectedToken = `Bearer ${env.API_SECRET}`;

  if (!env.API_SECRET || authHeader !== expectedToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  // --- 여기까지 ---
  
  // URL에서 쿼리 파라미터 추출
  const url = new URL(request.url);
  const userIdStr = url.searchParams.get('userId');
  const productIdStr = url.searchParams.get('productId');
  const groupIdStr = url.searchParams.get('groupId');
  const daysStr = url.searchParams.get('days') || '30';
  const market = url.searchParams.get('market') || 'total';
  const minViewsStr = url.searchParams.get('min_views');
  const maxViewsStr = url.searchParams.get('max_views');
  const sort_order = url.searchParams.get('sort_order') || 'desc';

  // userId 필수 검증
  if (!userIdStr) {
    return new Response(JSON.stringify({ error: 'userId query parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 숫자 파라미터 검증
  const userId = parseInt(userIdStr, 10);
  const days = parseInt(daysStr, 10);
  
  if (isNaN(userId) || userId <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid userId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  if (isNaN(days) || days < 1 || days > 365) {
    return new Response(JSON.stringify({ error: 'Invalid days (1-365)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // productId 선택적 검증
  let productId = null;
  if (productIdStr) {
    productId = parseInt(productIdStr, 10);
    if (isNaN(productId) || productId <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid productId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // groupId 선택적 검증
  let groupId = null;
  if (groupIdStr) {
    groupId = parseInt(groupIdStr, 10);
    if (isNaN(groupId) || groupId <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid groupId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateString = startDate.toISOString().slice(0, 10);

  const marketMap = {
    cou: 'cou_views',
    nav: 'nav_views',
    ele: 'ele_views',
    acu: 'acu_views',
    gma: 'gma_views',
    total: 'total_views'
  };

  const sortColumn = marketMap[market.toLowerCase()] || 'total_views';
  const order = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const whereConditions = ['userId = ?', 'date >= ?'];
  const bindings = [userId, startDateString];

  // productId 조건 추가
  if (productId !== null) {
    whereConditions.push('productId = ?');
    bindings.push(productId);
  }

  // groupId 조건 추가
  if (groupId !== null) {
    whereConditions.push('groupId = ?');
    bindings.push(groupId);
  }

  const havingConditions = [];

  // min_views 검증 및 처리
  if (minViewsStr && minViewsStr !== 'null') {
    const minViews = parseInt(minViewsStr, 10);
    if (!isNaN(minViews) && minViews >= 0) {
      havingConditions.push(`SUM(${sortColumn}) >= ?`);
      bindings.push(minViews);
    }
  }

  // max_views 검증 및 처리
  if (maxViewsStr && maxViewsStr !== 'null') {
    const maxViews = parseInt(maxViewsStr, 10);
    if (!isNaN(maxViews) && maxViews >= 0) {
      havingConditions.push(`SUM(${sortColumn}) <= ?`);
      bindings.push(maxViews);
    }
  }
  
  const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
  const havingClause = havingConditions.length > 0
    ? `HAVING ${havingConditions.join(' AND ')}`
    : '';

  let queryBuilder = `
    SELECT 
      productId,
      SUM(total_views) as total_views,
      SUM(cou_views) as cou_views,
      SUM(nav_views) as nav_views,
      SUM(ele_views) as ele_views,
      SUM(acu_views) as acu_views,
      SUM(gma_views) as gma_views
    FROM product_views 
    ${whereClause}
    GROUP BY productId
    ${havingClause}
    ORDER BY ${sortColumn} ${order}
    LIMIT 1000;
  `;

  try {
    const { results } = await env.DB.prepare(queryBuilder)
      .bind(...bindings)
      .all();
      
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// 날짜별 상세 조회수 API 엔드포인트
router.get('/api/detailviews', async (request, env, ctx) => {
  // 인증 체크
  const authHeader = request.headers.get('Authorization');
  const expectedToken = `Bearer ${env.API_SECRET}`;

  if (!env.API_SECRET || authHeader !== expectedToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // URL에서 쿼리 파라미터 추출
  const url = new URL(request.url);
  const userIdStr = url.searchParams.get('userId');
  const productIdStr = url.searchParams.get('productId');
  const daysStr = url.searchParams.get('days') || '14'; // 기본값 14일

  // userId 필수 검증
  if (!userIdStr) {
    return new Response(JSON.stringify({ error: 'userId query parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // productId 필수 검증
  if (!productIdStr) {
    return new Response(JSON.stringify({ error: 'productId query parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 숫자 파라미터 검증
  const userId = parseInt(userIdStr, 10);
  const productId = parseInt(productIdStr, 10);
  const days = parseInt(daysStr, 10);
  
  if (isNaN(userId) || userId <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid userId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  if (isNaN(productId) || productId <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid productId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  if (isNaN(days) || days < 1 || days > 365) {
    return new Response(JSON.stringify({ error: 'Invalid days (1-365)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateString = startDate.toISOString().slice(0, 10);

  const whereConditions = ['userId = ?', 'productId = ?', 'date >= ?'];
  const bindings = [userId, productId, startDateString];

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

  const queryBuilder = `
    SELECT 
      date,
      total_views,
      cou_views,
      nav_views,
      ele_views,
      acu_views,
      gma_views
    FROM product_views 
    ${whereClause}
    ORDER BY date DESC
    LIMIT 1000;
  `;

  try {
    const { results } = await env.DB.prepare(queryBuilder)
      .bind(...bindings)
      .all();
      
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// 조회수 데이터 삭제 API 엔드포인트
router.delete('/api/views', async (request, env, ctx) => {
  // 인증 체크
  const authHeader = request.headers.get('Authorization');
  const expectedToken = `Bearer ${env.API_SECRET}`;

  if (!env.API_SECRET || authHeader !== expectedToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // URL에서 쿼리 파라미터 추출
  const url = new URL(request.url);
  const userIdStr = url.searchParams.get('userId');
  const productIdStr = url.searchParams.get('productId');

  // userId 필수 검증
  if (!userIdStr) {
    return new Response(JSON.stringify({ error: 'userId query parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // productId 필수 검증
  if (!productIdStr) {
    return new Response(JSON.stringify({ error: 'productId query parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 숫자 파라미터 검증
  const userId = parseInt(userIdStr, 10);
  const productId = parseInt(productIdStr, 10);
  
  if (isNaN(userId) || userId <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid userId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  if (isNaN(productId) || productId <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid productId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 해당 userId와 productId에 해당하는 모든 행 삭제
    const result = await env.DB.prepare(
      'DELETE FROM product_views WHERE userId = ? AND productId = ?'
    ).bind(userId, productId).run();
    
    return new Response(JSON.stringify({ 
      success: true,
      deletedRows: result.changes,
      message: `Deleted ${result.changes} rows for userId ${userId} and productId ${productId}`
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

router.all('*', () => new Response('Not Found.', { status: 404 }));

export default {
  fetch: router.handle,
};

// Durable Object 클래스 내보내기
export { ProductTracker }; 