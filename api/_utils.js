import crypto from 'crypto';

/**
 * CORS helper
 */
export function setCorsHeaders(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Client IP resolver
 */
export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Base64URL encode/decode helpers
 */
function base64UrlEncode(data) {
  const base64 = Buffer.isBuffer(data) ? data.toString('base64') : Buffer.from(data).toString('base64');
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}

/**
 * Signs a HS256 JWT
 */
export function signToken(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', secret)
    .update(`${headerEncoded}.${payloadEncoded}`)
    .digest();
  const signatureEncoded = base64UrlEncode(signature);
  return `${headerEncoded}.${payloadEncoded}.${signatureEncoded}`;
}

/**
 * Verifies a HS256 JWT
 */
export function verifyToken(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerEncoded, payloadEncoded, signatureEncoded] = parts;
  const expectedSignature = base64UrlEncode(
    crypto.createHmac('sha256', secret)
      .update(`${headerEncoded}.${payloadEncoded}`)
      .digest()
  );

  if (signatureEncoded !== expectedSignature) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(payloadEncoded));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * In-memory sliding rate limiter for password attempts
 * Max 5 failed attempts per 15 min per IP
 */
const attemptsMap = new Map();

export function checkRateLimit(ip) {
  const now = Date.now();
  const record = attemptsMap.get(ip);
  if (!record) return { allowed: true };

  // If currently blocked
  if (record.blockedUntil && now < record.blockedUntil) {
    const minutesLeft = Math.ceil((record.blockedUntil - now) / 60000);
    return { allowed: false, minutesLeft };
  }

  // Reset window if 15 minutes have passed since first attempt
  if (now - record.firstAttemptTime > 15 * 60 * 1000) {
    attemptsMap.delete(ip);
    return { allowed: true };
  }

  if (record.attempts >= 5) {
    record.blockedUntil = now + 15 * 60 * 1000;
    return { allowed: false, minutesLeft: 15 };
  }

  return { allowed: true };
}

export function recordFailedAttempt(ip) {
  const now = Date.now();
  const record = attemptsMap.get(ip) || { attempts: 0, firstAttemptTime: now, blockedUntil: 0 };
  record.attempts += 1;
  if (record.attempts >= 5) {
    record.blockedUntil = now + 15 * 60 * 1000;
  }
  attemptsMap.set(ip, record);

  // Periodic map cleanup for entries older than 30 min
  if (attemptsMap.size > 100) {
    for (const [k, v] of attemptsMap.entries()) {
      if (now - v.firstAttemptTime > 30 * 60 * 1000) {
        attemptsMap.delete(k);
      }
    }
  }
}

export function clearAttempts(ip) {
  attemptsMap.delete(ip);
}
