export default {
  async fetch(request, env, ctx) {
    const headers = { 'Content-Type': 'application/json' };

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'POST method required' }), {
        status: 405, headers
      });
    }

    const authKey = request.headers.get('X-Auth-Key');
    if (!authKey || authKey !== env.AUTH_KEY_SECRET) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401, headers
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/') {
        return await handleImageDownload(request, env, headers);
      } else if (path === '/jpg') {
        return await handleJpgUpload(request, env, headers);
      } else {
        return new Response(JSON.stringify({ error: 'Path not found' }), {
          status: 404, headers
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500, headers
      });
    }
  }
};

async function uploadImageToR2(env, buffer, contentType) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const datePath = `raw_image/${year}-${month}/${day}`;
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  const extensionMap = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
  };
  const extension = extensionMap[contentType] || 'jpg';
  const fileName = `${datePath}/image_${timestamp}_${random}.${extension}`;

  await env.R2_BUCKET.put(fileName, buffer, {
    httpMetadata: {
      contentType: contentType,
      cacheControl: 'public, max-age=31536000',
    }
  });

  const hostedUrl = `${env.R2_PUBLIC_URL}/${fileName}`;

  return {
    success: true,
    hostedUrl: hostedUrl,
    fileName: fileName
  };
}

async function handleImageDownload(request, env, headers) {
  const { url } = await request.json();
  
  if (!url) {
    return new Response(JSON.stringify({ error: 'URL required' }), {
      status: 400, headers
    });
  }

  let targetUrl;
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }
    targetUrl = url + '_.webp';
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid URL' }), {
      status: 400, headers
    });
  }

  const fetchHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    'Referer': 'https://detail.tmall.com/',
    'Accept': 'image/webp,image/jpeg,image/png,image/bmp,image/*,*/*;q=0.8'
  };

  let response;
  let finalUrl = targetUrl;
  
  try {
    response = await fetch(targetUrl, { headers: fetchHeaders });
    
    if (!response.ok) {
      response = await fetch(url, { headers: fetchHeaders });
      finalUrl = url;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    }
  } catch (error) {
    throw new Error('Download failed');
  }

  const contentType = response.headers.get('content-type') || '';
  
  if (!contentType.startsWith('image/')) {
    return new Response(JSON.stringify({ error: 'Not an image' }), {
      status: 400, headers
    });
  }

  if (contentType === 'image/jpeg' || contentType === 'image/png') {
    const buffer = await response.arrayBuffer();
    const uploadResult = await uploadImageToR2(env, buffer, contentType);
    return new Response(JSON.stringify(uploadResult), {
      status: 200, headers
    });
  }

  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: 'File too large' }), {
      status: 400, headers
    });
  }

  return new Response(response.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'X-Original-URL': url,
      'X-Final-URL': finalUrl
    }
  });
}

async function handleJpgUpload(request, env, headers) {
  const contentType = request.headers.get('content-type');
  
  if (!contentType || !contentType.startsWith('image/jpeg')) {
    return new Response(JSON.stringify({ error: 'image/jpeg data required' }), {
      status: 400, headers
    });
  }

  const buffer = await request.arrayBuffer();
  
  if (buffer.byteLength === 0) {
    return new Response(JSON.stringify({ error: 'Empty data' }), {
      status: 400, headers
    });
  }

  const uploadResult = await uploadImageToR2(env, buffer, 'image/jpeg');

  return new Response(JSON.stringify(uploadResult), {
    status: 200, headers
  });
} 