import { setCorsHeaders, getClientIp, signToken, checkRateLimit, recordFailedAttempt, clearAttempts } from './_utils.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = getClientIp(req);
  const rateStatus = checkRateLimit(clientIp);

  if (!rateStatus.allowed) {
    return res.status(429).json({
      error: `Too many failed attempts. Please wait ${rateStatus.minutesLeft} minute(s) before trying again.`
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // ignore
      }
    }

    const { password } = body || {};
    const expectedPassword = process.env.UPLOAD_PASSWORD;

    if (!expectedPassword) {
      return res.status(500).json({
        error: 'Upload feature is not configured yet on the server. Please set UPLOAD_PASSWORD environment variable.'
      });
    }

    if (!password || password !== expectedPassword) {
      recordFailedAttempt(clientIp);
      return res.status(401).json({ error: 'Wrong password' });
    }

    // Success! Clear failed attempts
    clearAttempts(clientIp);

    const jwtSecret = process.env.JWT_SECRET || 'sas-music-jwt-secret-key-32-chars-long';
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const token = signToken(
      {
        role: 'uploader',
        iat: nowInSeconds,
        exp: nowInSeconds + 3600 // 1 hour expiration
      },
      jwtSecret
    );

    return res.status(200).json({
      success: true,
      token,
      expiresIn: 3600
    });
  } catch (error) {
    console.error('Error in verify-password:', error);
    return res.status(500).json({ error: 'An unexpected server error occurred' });
  }
}

