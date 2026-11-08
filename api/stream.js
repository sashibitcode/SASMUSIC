/**
 * High-Speed Google Drive Audio Streaming Edge Proxy
 * Solves Cross-Origin Resource Policy (CORP: same-site) blocks,
 * enables Range (HTTP 206) byte seeking without Edge CDN cache collision.
 */

export const config = {
  runtime: 'edge'
};

export default async function handler(req) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type, Accept, Origin',
        'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return new Response(JSON.stringify({ error: 'Valid Google Drive file id required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const range = req.headers.get('range');
  const targetUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download`;

  const fetchHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*'
  };

  if (range) {
    fetchHeaders['Range'] = range;
  }

  try {
    const isHead = req.method === 'HEAD';
    let driveRes = await fetch(targetUrl, {
      method: isHead ? 'HEAD' : 'GET',
      headers: fetchHeaders,
      redirect: 'follow'
    });

    // Fallback if drive.usercontent fails or is unavailable
    if (!driveRes.ok && driveRes.status !== 206) {
      const fallbackUrl = `https://docs.google.com/uc?export=open&id=${encodeURIComponent(id)}`;
      driveRes = await fetch(fallbackUrl, {
        method: isHead ? 'HEAD' : 'GET',
        headers: fetchHeaders,
        redirect: 'follow'
      });
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', driveRes.headers.get('content-type') || 'audio/mpeg');
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Headers', 'Range, Content-Type, Accept, Origin');
    responseHeaders.set('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
    responseHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');

    // Cache full files on Edge/Browser, allow client-side range caching with Vary: Range
    if (range) {
      responseHeaders.set('Cache-Control', 'private, max-age=3600');
      responseHeaders.set('Vary', 'Range');
    } else {
      responseHeaders.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    }

    if (driveRes.headers.has('content-length')) {
      responseHeaders.set('Content-Length', driveRes.headers.get('content-length'));
    }
    if (driveRes.headers.has('content-range')) {
      responseHeaders.set('Content-Range', driveRes.headers.get('content-range'));
    }

    if (isHead) {
      return new Response(null, {
        status: driveRes.status === 206 ? 206 : (driveRes.ok ? 200 : driveRes.status),
        headers: responseHeaders
      });
    }

    return new Response(driveRes.body, {
      status: driveRes.status === 206 ? 206 : (driveRes.ok ? 200 : driveRes.status),
      headers: responseHeaders
    });
  } catch (error) {
    console.error('Streaming proxy error:', error);
    return new Response(JSON.stringify({ error: 'Streaming failed', message: error.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
