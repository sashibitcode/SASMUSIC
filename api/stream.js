/**
 * High-Speed Google Drive Audio Streaming Edge Proxy
 * Solves Cross-Origin Resource Policy (CORP: same-site) blocks,
 * enables Range (HTTP 206) byte seeking, and caches on Vercel Global Edge CDN.
 */

export const config = {
  runtime: 'edge'
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type',
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
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  if (range) {
    fetchHeaders['Range'] = range;
  }

  try {
    let driveRes = await fetch(targetUrl, {
      headers: fetchHeaders,
      redirect: 'follow'
    });

    // If drive.usercontent throws error, fallback to docs.google.com open endpoint
    if (!driveRes.ok && driveRes.status !== 206) {
      const fallbackUrl = `https://docs.google.com/uc?export=open&id=${encodeURIComponent(id)}`;
      driveRes = await fetch(fallbackUrl, {
        headers: fetchHeaders,
        redirect: 'follow'
      });
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', driveRes.headers.get('content-type') || 'audio/mpeg');
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
    responseHeaders.set('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');

    if (driveRes.headers.has('content-length')) {
      responseHeaders.set('Content-Length', driveRes.headers.get('content-length'));
    }
    if (driveRes.headers.has('content-range')) {
      responseHeaders.set('Content-Range', driveRes.headers.get('content-range'));
    }

    return new Response(driveRes.body, {
      status: driveRes.status === 206 ? 206 : 200,
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
